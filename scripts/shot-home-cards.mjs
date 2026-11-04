/** 首页「人气当季轻食」卡片区截图 + 关键尺寸，用来排查卡片错乱
 *  用法：node scripts/shot-home-cards.mjs [壳宽，默认 430] */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const W = Number(process.argv[2] || 430);
const OUT = 'outputs/home-cards';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: W, height: 932 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { state: 'visible', timeout: 25000 });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

/** 扛 HMR 重载 / 品牌过场：反复等「人气当季」那块挂上去 */
async function gotoSearchedSection() {
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => document.querySelector('#nav-tab-home')?.click());
    await page.waitForTimeout(700);
    const ok = await page.evaluate(() => !!document.querySelector('#home-popular-dishes-section'));
    if (ok) return true;
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1500);
  }
  return false;
}
const found = await gotoSearchedSection();
if (!found) {
  console.log('section not found after retries');
  await page.screenshot({ path: `${OUT}/debug.png` });
  await browser.close();
  process.exit(1);
}

const sec = await page.$('#home-popular-dishes-section');
await page.evaluate(() => {
  const s = document.querySelector('#home-popular-dishes-section');
  s.scrollIntoView({ block: 'start' });
});
await page.waitForTimeout(600);
const grid = await page.$('#home-popular-dishes-section .grid');
await grid.screenshot({ path: `${OUT}/cards-${W}.png` });
if (W === 430) await grid.screenshot({ path: `${OUT}/cards.png` });
await sec.screenshot({ path: `${OUT}/section-${W}.png` }).catch(() => {});

const info = await page.evaluate(() => {
  const sec = document.querySelector('#home-popular-dishes-section');
  const grid = sec.querySelector('.grid');
  const cards = [...grid.children];
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  return cards.slice(0, 2).map((c) => {
    const img = c.querySelector('.aspect-square');
    const hot = c.querySelector('span.absolute.left-0.top-0');
    const kcal = c.querySelector('div.absolute.bottom-2.left-2');
    const plus = c.querySelector('button.gb-hit');
    const price = [...c.querySelectorAll('span')].find((s) => s.textContent?.startsWith('¥'));
    return {
      card: box(c),
      img: img && box(img),
      hot: hot && box(hot),
      kcal: kcal && box(kcal),
      plus: plus && box(plus),
      price: price && box(price),
      cardRect: c.getBoundingClientRect().toJSON(),
    };
  });
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
