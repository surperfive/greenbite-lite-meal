/**
 * 订单页顶部：看清到底渲染了什么（存疑的 ⓘ 是不是 HeaderBar 里的东西）
 * 用法：node scripts/probe-orders-header.mjs [输出目录]
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/orders-header';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
});

await page.goto(BASE, { waitUntil: 'commit' });
// ⚠️ 只 waitForSelector detached 不够：Loader 退场是淡出动画，DOM 里还留着节点，
//    截到的是半透明的青柠遮罩。等它从 DOM 里彻底消失。
await page.waitForFunction(() => !document.querySelector('#app-loading-screen'), null, { timeout: 30000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

await page.click('#nav-tab-orders');
await page.waitForTimeout(1000);

await page.screenshot({ path: `${OUT}/orders-top.png`, clip: { x: 0, y: 0, width: 430, height: 180 } });
await page.screenshot({ path: `${OUT}/orders-full.png` });

const info = await page.evaluate(() => {
  const bar = document.querySelector('#app-page-stage > div > div');
  // 顶部条 = 含「静安寺旗舰店」文本的最近的 flex 行
  const storeSpan = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === '静安寺旗舰店');
  const row = storeSpan?.closest('div');
  const top = storeSpan ? storeSpan.closest('div[class*="border-b"]') : null;
  const r = (n) => {
    if (!n) return null;
    const b = n.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  };
  return {
    hasStoreText: !!storeSpan,
    headerBox: r(top),
    headerHTMLHead: top ? top.outerHTML.slice(0, 700) : null,
    buttonsInHeader: top ? [...top.querySelectorAll('button')].map((b) => b.textContent.trim().slice(0, 12)) : null,
    svgCount: top ? top.querySelectorAll('svg').length : null,
    rowBox: r(row),
  };
});

writeFileSync(`${OUT}/info.json`, JSON.stringify(info, null, 2), 'utf8');
await browser.close();
