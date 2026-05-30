import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const port = 9223;
const outputPng = '/home/hwajoong/projects/Qling/tmp/ranking-pixel-alignment/production.png';
const outputJson = '/home/hwajoong/projects/Qling/tmp/ranking-pixel-alignment/measurements.json';
const outputMd = '/home/hwajoong/projects/Qling/tmp/ranking-pixel-alignment/measurements.md';
const url = 'http://127.0.0.1:3000/tmp/ranking-pixel-alignment/harness.html';

const chrome = spawn('google-chrome', [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=/tmp/qling-ranking-chrome-profile',
  'about:blank',
], { stdio: 'ignore' });

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw new Error('Chrome debugging endpoint did not become available.');
}

async function createPage() {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error(`Failed to create page: ${response.status}`);
  return response.json();
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();

  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          id += 1;
          ws.send(JSON.stringify({ id, method, params }));
          return new Promise((innerResolve, innerReject) => {
            pending.set(id, { resolve: innerResolve, reject: innerReject });
          });
        },
        close() {
          ws.close();
        },
      });
    });
    ws.addEventListener('error', reject);
  });
}

function markdown(rows) {
  const header = '| element | target x/y/w/h | actual x/y/w/h | delta x/y/w/h |\n|---|---:|---:|---:|';
  const body = rows.map(row => {
    const t = row.target;
    const a = row.actual;
    const d = row.delta;
    const fmt = value => Number.isFinite(value) ? value.toFixed(3) : 'NaN';
    return `| ${row.id} | ${fmt(t.x)}, ${fmt(t.y)}, ${fmt(t.w)}, ${fmt(t.h)} | ${fmt(a.x)}, ${fmt(a.y)}, ${fmt(a.w)}, ${fmt(a.h)} | ${fmt(d.x)}, ${fmt(d.y)}, ${fmt(d.w)}, ${fmt(d.h)} |`;
  }).join('\n');
  return `${header}\n${body}\n`;
}

try {
  await waitForEndpoint();
  const page = await createPage();
  const cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 393,
    height: 852,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send('Page.navigate', { url });
  await new Promise(resolve => setTimeout(resolve, 3000));

  const measureResult = await cdp.send('Runtime.evaluate', {
    returnByValue: true,
    expression: 'JSON.parse(document.body.dataset.measurements || "[]")',
  });
  const rows = measureResult.result.value;

  const screenshot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  await writeFile(outputPng, Buffer.from(screenshot.data, 'base64'));
  await writeFile(outputJson, `${JSON.stringify(rows, null, 2)}\n`);
  await writeFile(outputMd, markdown(rows));

  cdp.close();
} finally {
  chrome.kill('SIGTERM');
}
