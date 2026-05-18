import { chromium } from 'playwright';

const captures = [
  ['10', 'tmp/my-page-pixel-alignment/10-my-page-production.png'],
  ['12', 'tmp/my-page-pixel-alignment/12-edit-interests-production.png'],
  ['13', 'tmp/my-page-pixel-alignment/13-my-answers-production.png'],
  ['14', 'tmp/my-page-pixel-alignment/14-privacy-policy-production.png'],
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
