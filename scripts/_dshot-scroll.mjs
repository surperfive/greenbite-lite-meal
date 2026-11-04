import { chromium } from 'playwright';

// 打开详情页 → 滚规格列表触发 isScrolled（hero 压缩到 155px）→ 截图，
// 验证滚动压缩态下食物仍压在白卡上。
const NAME = process.argv[2] ?? '希腊酸奶杯';
const OUT = process.argv[3] ?? 'scripts/_dh-scroll.png';
const SCROLL = Number(process.argv[4] ?? '150');
const VH = Number(process.argv[5] ?? '720');

const browser = await chromium.launch({ channel: 'chrome' });
// ⚠️ 视口压到 720：900 高时规格列表可能不溢出，滚不动就触发不了 isScrolled。
const page = await browser.newPage({ viewport: { width: 430, height: VH }, deviceScaleFactor: 3 });
await page.goto('http://localhost:5180/', { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

// ①  App 开屏：等「跳过」出现再点，再等它彻底退场
try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
} catch {}
try {
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 8000 });
} catch {}

// ②  点菜（此时 splash 已退场，点得到）
await page.evaluate((n) => {
  const els = [...document.querySelectorAll('*')].filter(
    (e) => e.children.length === 0 && e.textContent.trim() === n
  );
  els[0]?.closest('.group')?.querySelector('[data-dish-thumb]')?.click();
}, NAME);
// ③  详情页自身有一次 620ms 开屏，等它退场
try {
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 10000 });
} catch {}
await page.waitForTimeout(900);

// ④  滚规格列表（⚠️ 从 h1 定位白卡，别滚到菜单页的同名容器去）
await page.evaluate((y) => {
  const card = document.querySelector('h1')?.closest('.rounded-t-\\[24px\\]')?.parentElement;
  card?.querySelector('.overflow-y-auto')?.scrollBy(0, y);
}, SCROLL);
await page.waitForTimeout(900);

const st = await page.evaluate(() => {
  const card = document.querySelector('h1')?.closest('.rounded-t-\\[24px\\]')?.parentElement;
  const hero = card?.previousElementSibling;
  const sc = card?.querySelector('.overflow-y-auto');
  return {
    hasH1: !!document.querySelector('h1'),
    scrollTop: sc ? Math.round(sc.scrollTop) : null,
    heroH: hero ? Math.round(hero.getBoundingClientRect().height) : null,
    heroCls: hero?.className.match(/h-\[\d+px\]/)?.[0] ?? null,
  };
});
console.log('state:', JSON.stringify(st));
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 430, height: 340 } });
console.log('shot ->', OUT);
await browser.close();
