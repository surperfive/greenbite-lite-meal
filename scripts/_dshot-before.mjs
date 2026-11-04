import { chromium } from 'playwright';

// 「改前」对照：用样式表 !important 覆盖内联 filter，不碰源码。
// 第四个参数 / OVERRIDE_FILTER 环境变量指定覆盖成什么，默认 'none'（全关）。
// 例：只保留投影、去掉轮廓光 → OVERRIDE_FILTER='drop-shadow(0 5px 8px rgba(0,0,0,0.20)) drop-shadow(0 14px 26px rgba(0,0,0,0.16))'
const NAME = process.argv[2] ?? '希腊酸奶杯';
const OUT = process.argv[3] ?? 'scripts/_dh-before.png';
const OVERRIDE = process.argv[4] ?? process.env.OVERRIDE_FILTER ?? 'none';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 3 });
await page.goto('http://localhost:5180/', { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
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
try {
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 10000 });
} catch {}
await page.waitForTimeout(900);

// 只中和带内联 filter 的食物图，hero 区其他元素不带 filter
await page.addStyleTag({
  content: `img[style*="filter"] { filter: ${OVERRIDE} !important; }`,
});
await page.waitForTimeout(300);

const st = await page.evaluate(() => ({
  loader: !!document.querySelector('.brand-loader'),
  hasH1: !!document.querySelector('h1'),
  imgFilter: (() => {
    const img = document.querySelector('img[style*="filter"]');
    return img ? getComputedStyle(img).filter : 'none-found';
  })(),
}));
console.log('state:', JSON.stringify(st));
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 430, height: 340 } });
console.log('shot ->', OUT);
await browser.close();
