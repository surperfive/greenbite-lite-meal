/**
 * 首页「限时超值福利」区块头截图 + 几何实测（裸排版改造后核对面距/行高/命中区）。
 *   用法：node scripts/shot-home-welfare.mjs [壳宽，默认 390]
 * 产物：outputs/home-welfare/header-{W}.png  区块头 + 上下各 28px 上下文
 *      outputs/home-welfare/bar-{W}.png     仅区块头那一行
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const W = Number(process.argv[2] || 390);
const OUT = 'outputs/home-welfare';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: W, height: 932 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { state: 'visible', timeout: 25000 });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

/** 品牌过场 + HMR 重载双保险：反复确认 #home-welfare-section 挂上了 */
let ok = false;
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => document.querySelector('#nav-tab-home')?.click());
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('#home-welfare-section'))) { ok = true; break; }
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
}
if (!ok) {
  console.log('welfare section not found');
  await page.screenshot({ path: `${OUT}/debug.png` });
  await browser.close();
  process.exit(1);
}

await page.evaluate(() => document.querySelector('#home-welfare-section').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(500);

const box = await page.evaluate(() => {
  const sec = document.querySelector('#home-welfare-section');
  const row = sec.firstElementChild;
  const icon = row.querySelector('div');
  const title = row.querySelector('span');
  const btn = row.querySelector('button');
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const cs = getComputedStyle(row);
  const cardBelow = sec.nextElementSibling?.getBoundingClientRect();
  const cardAbove = sec.previousElementSibling?.getBoundingClientRect();
  return {
    row: r(row),
    icon: r(icon),
    title: { ...r(title), font: getComputedStyle(title).fontSize, weight: getComputedStyle(title).fontWeight, color: getComputedStyle(title).color },
    btn: { ...r(btn), font: getComputedStyle(btn).fontSize, color: getComputedStyle(btn).color, hitH: r(btn).h },
    rowBg: cs.backgroundColor,
    rowBorder: `${cs.borderTopWidth} ${cs.borderTopColor}`,
    rowShadow: cs.boxShadow,
    gapAbove: cardAbove ? +(row.getBoundingClientRect().top - cardAbove.bottom).toFixed(1) : null,
    gapBelow: cardBelow ? +(cardBelow.top - row.getBoundingClientRect().bottom).toFixed(1) : null,
  };
});
console.log(JSON.stringify(box, null, 1));

const sec = await page.$('#home-welfare-section');
await sec.screenshot({ path: `${OUT}/bar-${W}.png` });
await page.screenshot({
  path: `${OUT}/header-${W}.png`,
  clip: {
    x: 0,
    y: Math.max(0, box.row.y - 28),
    width: W,
    height: box.row.h + 90,
  },
});
await browser.close();
