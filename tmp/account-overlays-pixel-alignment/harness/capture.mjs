import { chromium } from 'playwright';

const captures = [
  ['15', 'tmp/account-overlays-pixel-alignment/15-logout-production.png'],
  ['16', 'tmp/account-overlays-pixel-alignment/16-account-deletion-production.png'],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 1,
});

for (const [screen, path] of captures) {
  await page.goto(`http://127.0.0.1:5178/?screen=${screen}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path, fullPage: false });
}

await browser.close();
