import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const rootDir = process.cwd();
const reportDir = path.join(rootDir, 'reports', 'tutorial-visual');
const screenshotDir = path.join(reportDir, 'screenshots');
const baseUrl = 'http://localhost:3000/tutorial-visual.html';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const viewports = [
  { id: 'iphone-se', label: 'iPhone SE', width: 320, height: 568 },
  { id: 'iphone-12', label: 'iPhone 12/13', width: 390, height: 844 },
  { id: 'iphone-15-pro-max', label: 'iPhone 15 Pro Max', width: 430, height: 932 },
  { id: 'pixel-tall', label: 'Android Tall', width: 412, height: 915 },
  { id: 'ipad-mini', label: 'iPad Mini', width: 768, height: 1024 },
  { id: 'desktop-narrow', label: 'Desktop Narrow', width: 480, height: 900 },
];

const steps = [1, 2, 3, 4, 5];

async function run() {
  await fs.rm(reportDir, { recursive: true, force: true });
  await fs.mkdir(screenshotDir, { recursive: true });

  const server = await ensureServer();
  const chrome = await startChrome();
  const client = await connectToPage(chrome.port);
  const results = [];

  try {
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    for (const viewport of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: true,
        screenWidth: viewport.width,
        screenHeight: viewport.height,
      });

      for (const step of steps) {
        const url = `${baseUrl}?step=${step}&visualCheck=${Date.now()}`;
        await navigateAndWait(client, url);
        await delay(350);

        const metrics = await readMetrics(client);
        const screenshot = await client.send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true,
        });
        const fileName = `${viewport.id}-step-${step}.png`;
        const outputPath = path.join(screenshotDir, fileName);
        await fs.writeFile(outputPath, Buffer.from(screenshot.data, 'base64'));
        const png = await readPngInfo(outputPath);
        const file = await fs.stat(outputPath);
        const pass = isResultPass({ viewport, step, png, fileSize: file.size, metrics });

        results.push({
          viewport,
          step,
          fileName,
          png,
          fileSize: file.size,
          metrics,
          pass,
        });
      }
    }

    await writeReport(results);
    const failed = results.filter(result => !result.pass);
    console.log(`Tutorial visual check complete: ${results.length - failed.length}/${results.length} passed.`);
    console.log(`Report: ${path.join(reportDir, 'index.html')}`);
    if (failed.length > 0) {
      for (const result of failed) {
        console.log(`FAILED ${result.viewport.label} step ${result.step}`);
      }
      process.exitCode = 1;
    }
  } finally {
    await client.close().catch(() => undefined);
    chrome.process.kill('SIGINT');
    if (server?.startedByScript) server.process.kill('SIGINT');
  }
}

async function ensureServer() {
  if (await canReachLocalhost()) {
    return { startedByScript: false };
  }

  const child = spawn('npm', ['run', 'dev'], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DISABLE_HMR: 'true' },
  });

  let output = '';
  child.stdout.on('data', chunk => {
    output += chunk.toString();
  });
  child.stderr.on('data', chunk => {
    output += chunk.toString();
  });

  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (await canReachLocalhost()) {
      return { startedByScript: true, process: child };
    }
    await delay(250);
  }

  child.kill('SIGINT');
  throw new Error(`Dev server did not start in time.\n${output}`);
}

async function startChrome() {
  const port = 9222 + Math.floor(Math.random() * 1000);
  const profileDir = path.join(reportDir, 'chrome-profile');
  await fs.mkdir(profileDir, { recursive: true });
  const child = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-dev-shm-usage',
    '--disable-application-cache',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (await canReach(`http://localhost:${port}/json/version`)) {
      return { process: child, port };
    }
    await delay(200);
  }

  child.kill('SIGINT');
  throw new Error('Chrome remote debugging endpoint did not start in time.');
}

async function connectToPage(port) {
  const pages = await fetchJson(`http://localhost:${port}/json/list`);
  const page = pages.find(item => item.type === 'page') ?? pages[0];
  if (!page?.webSocketDebuggerUrl) throw new Error('Chrome page websocket URL not found.');
  return CdpClient.connect(page.webSocketDebuggerUrl);
}

class CdpClient {
  static connect(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      const client = new CdpClient(socket);
      socket.addEventListener('open', () => resolve(client), { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
  }

  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.waitingEvents = new Map();
    socket.addEventListener('message', event => this.handleMessage(JSON.parse(event.data)));
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  waitForEvent(method, timeoutMs = 10_000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const waiters = this.waitingEvents.get(method) ?? [];
      waiters.push(payload => {
        clearTimeout(timeout);
        resolve(payload);
      });
      this.waitingEvents.set(method, waiters);
    });
  }

  handleMessage(message) {
    if ('id' in message) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result ?? {});
      return;
    }

    const waiters = this.waitingEvents.get(message.method);
    if (!waiters?.length) return;
    const waiter = waiters.shift();
    waiter(message.params ?? {});
  }

  close() {
    this.socket.close();
    return Promise.resolve();
  }
}

async function navigateAndWait(client, url) {
  const loaded = client.waitForEvent('Page.loadEventFired', 12_000);
  await client.send('Page.navigate', { url });
  await loaded;
}

async function readMetrics(client) {
  const expression = `JSON.stringify((() => {
    const rectFor = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      };
    };
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      slide: rectFor('[aria-label="튜토리얼 슬라이드 넘기기"]'),
      startButton: rectFor('[aria-label="큐링 시작하기"]'),
      image: rectFor('img[alt^="큐링 사용법 튜토리얼"]'),
    };
  })())`;
  const result = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  return JSON.parse(result.result.value);
}

function isResultPass({ viewport, step, png, fileSize, metrics }) {
  const tolerance = 1.25;
  const viewportMatches = metrics.innerWidth === viewport.width
    && metrics.innerHeight === viewport.height
    && png.width === viewport.width
    && png.height === viewport.height;
  const slideVisible = rectWithin(metrics.slide, viewport, tolerance);
  const imageVisible = rectWithin(metrics.image, viewport, tolerance);
  const startButtonOk = step !== 5 || rectWithin(metrics.startButton, viewport, tolerance);

  return viewportMatches
    && fileSize > 25_000
    && slideVisible
    && imageVisible
    && startButtonOk;
}

function rectWithin(rect, viewport, tolerance) {
  if (!rect) return false;
  return rect.left >= -tolerance
    && rect.top >= -tolerance
    && rect.right <= viewport.width + tolerance
    && rect.bottom <= viewport.height + tolerance
    && rect.width > 0
    && rect.height > 0;
}

function canReachLocalhost() {
  return canReach('http://localhost:3000/');
}

function canReach(url) {
  return new Promise(resolve => {
    const request = http.get(url, response => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.on('error', () => resolve(false));
    request.setTimeout(500, () => {
      request.destroy();
      resolve(false);
    });
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('error', reject);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function readPngInfo(filePath) {
  const buffer = await fs.readFile(filePath);
  if (buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`Not a PNG: ${filePath}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function writeReport(results) {
  const passed = results.filter(result => result.pass).length;
  const total = results.length;
  const generatedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const viewportSummaries = viewports.map(viewport => {
    const viewportResults = results.filter(result => result.viewport.id === viewport.id);
    const metrics = viewportResults[0].metrics;
    return `
      <tr>
        <td>${escapeHtml(viewport.label)}</td>
        <td>${viewport.width} x ${viewport.height}</td>
        <td>${metrics.innerWidth} x ${metrics.innerHeight}</td>
        <td>${Math.round(metrics.slide.width)} x ${Math.round(metrics.slide.height)}</td>
        <td>${viewportResults.every(result => rectWithin(result.metrics.slide, viewport, 1.25)) ? '통과' : '실패'}</td>
        <td>${viewportResults.every(result => result.pass) ? '통과' : '확인 필요'}</td>
      </tr>
    `;
  }).join('');

  const cards = results.map(result => `
    <article class="card ${result.pass ? 'pass' : 'fail'}">
      <h3>${escapeHtml(result.viewport.label)} · ${result.viewport.width}x${result.viewport.height} · Step ${result.step}</h3>
      <img src="screenshots/${result.fileName}" alt="${escapeHtml(result.viewport.label)} ${result.step}번 튜토리얼 스크린샷">
      <dl>
        <dt>결과</dt><dd>${result.pass ? '통과' : '확인 필요'}</dd>
        <dt>CSS 뷰포트</dt><dd>${result.metrics.innerWidth} x ${result.metrics.innerHeight}</dd>
        <dt>스크린샷</dt><dd>${result.png.width} x ${result.png.height} / ${formatBytes(result.fileSize)}</dd>
        <dt>슬라이드</dt><dd>left ${Math.round(result.metrics.slide.left)}, top ${Math.round(result.metrics.slide.top)}, ${Math.round(result.metrics.slide.width)} x ${Math.round(result.metrics.slide.height)}</dd>
        ${result.step === 5 ? `<dt>시작 버튼</dt><dd>left ${Math.round(result.metrics.startButton.left)}, top ${Math.round(result.metrics.startButton.top)}, ${Math.round(result.metrics.startButton.width)} x ${Math.round(result.metrics.startButton.height)}</dd>` : ''}
      </dl>
    </article>
  `).join('');

  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>튜토리얼 시각 테스트 리포트</title>
  <style>
    body { margin: 0; background: #f6f1ea; color: #24211e; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 56px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .summary { margin: 0 0 24px; color: #5f554b; }
    .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 6px 12px; font-weight: 800; background: ${passed === total ? '#dff6e7' : '#ffe3dc'}; color: ${passed === total ? '#176d37' : '#a8381f'}; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0 28px; background: white; border-radius: 8px; overflow: hidden; }
    th, td { padding: 11px 12px; border-bottom: 1px solid #eee3d8; text-align: left; font-size: 14px; }
    th { background: #fff1d1; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    .card { background: white; border: 1px solid #eaded2; border-radius: 8px; padding: 12px; box-shadow: 0 3px 12px rgba(0,0,0,.06); }
    .card.fail { border-color: #e46f55; }
    .card h3 { margin: 0 0 10px; font-size: 15px; }
    .card img { display: block; width: 100%; max-height: 560px; object-fit: contain; background: #5f2f17; border-radius: 6px; }
    dl { display: grid; grid-template-columns: 86px 1fr; gap: 5px 8px; margin: 12px 0 0; font-size: 13px; }
    dt { color: #7a6f64; }
    dd { margin: 0; }
  </style>
</head>
<body>
  <main>
    <h1>튜토리얼 시각 테스트 리포트</h1>
    <p class="summary">생성 시각: ${escapeHtml(generatedAt)} · 대상: 6개 화면 크기 x 5개 튜토리얼 화면</p>
    <p><span class="badge">${passed} / ${total} 통과</span></p>
    <table>
      <thead>
        <tr><th>뷰포트</th><th>요청 크기</th><th>CSS 뷰포트</th><th>슬라이드 크기</th><th>잘림 여부</th><th>전체 결과</th></tr>
      </thead>
      <tbody>${viewportSummaries}</tbody>
    </table>
    <section class="grid">${cards}</section>
  </main>
</body>
</html>`;

  await fs.writeFile(path.join(reportDir, 'index.html'), html);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
