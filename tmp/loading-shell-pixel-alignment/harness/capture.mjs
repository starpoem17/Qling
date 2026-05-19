import { chromium } from 'playwright';

const captures = [
  ['01', 'tmp/loading-shell-pixel-alignment/01-splash-production.png'],
  ['02', 'tmp/loading-shell-pixel-alignment/02-login-production.png'],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 1,
});

for (const [screen, path] of captures) {
  await page.goto(`http://127.0.0.1:5177/?screen=${screen}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path, fullPage: false });
}

await browser.close();
