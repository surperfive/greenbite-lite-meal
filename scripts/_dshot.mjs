import { chromium } from 'playwright';

// 打开指定菜品详情页，截 hero 区。自动处理首次进入的开屏。
const NAME = process.argv[2] ?? '希腊酸奶杯';
const OUT = process.argv[3] ?? 'scripts/_dh.png';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 3 });
await page.goto('http://localhost:5180/', { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

// 开屏：等「跳过」按钮出现再点（canSkip 有门控，早了点不到）
try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  console.log('skip btn found');
  await page.click('.brand-loader__skip');
  console.log('skip clicked');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
  console.log('skip detached');
} catch (e) {
  console.log('skip flow error:', String(e).split('\n')[0]);
}
await page.waitForTimeout(1200);

await page.evaluate((n) => {
  const els = [...document.querySelectorAll('*')].filter(
    (e) => e.children.length === 0 && e.textContent.trim() === n
  );
  els[0]?.closest('.group')?.querySelector('[data-dish-thumb]')?.click();
}, NAME);
// 打开详情页本身会触发一次 620ms 开屏（handleSelectDish → triggerPageLoad），
// 必须等它退场再截，否则截到的是开屏。
try {
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 10000 });
} catch {}
await page.waitForTimeout(900);

const st = await page.evaluate(() => ({
  loader: !!document.querySelector('.brand-loader'),
  hasH1: !!document.querySelector('h1'),
  thumbs: document.querySelectorAll('[data-dish-thumb]').length,
}));
console.log('state:', JSON.stringify(st));
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 430, height: 340 } });
console.log('shot ->', OUT);
await browser.close();
