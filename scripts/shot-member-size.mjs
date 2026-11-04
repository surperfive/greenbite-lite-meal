/**
 * 首页会员条：量内件尺寸 + 截整条 + 首屏
 * 用法：node scripts/shot-member-size.mjs [输出目录]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/member-size';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
});

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

// ⚠️ 默认落地页是「点餐」，会员条在首页
await page.click('#nav-tab-home').catch(() => {});
await page.waitForTimeout(900);

const bar = page.locator('#home-member-bar').first();
await bar.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

const data = await bar.evaluate((el) => {
  const r = (n) => {
    if (!n) return null;
    const b = n.getBoundingClientRect();
    return { w: +b.width.toFixed(2), h: +b.height.toFixed(2), top: +b.top.toFixed(2) };
  };
  const img = el.querySelector('img');
  const texts = [...el.querySelectorAll('span')].filter((s) => s.childElementCount === 0 && s.textContent.trim());
  const byText = (t) => texts.find((s) => s.textContent.trim().startsWith(t));
  const barBox = el.getBoundingClientRect();
  const prog = [...el.querySelectorAll('span')].find((s) => {
    const st = getComputedStyle(s);
    return st.height === '5px' && st.borderRadius === '9999px';
  });
  const chev = el.querySelector('svg');
  return {
    bar: r(el),
    barRadius: getComputedStyle(el).borderRadius,
    shadow: getComputedStyle(el).boxShadow.split(', ').pop(),
    avatar: r(img),
    name: byText('Alex') ? r(byText('Alex')) : null,
    nameFont: byText('Alex') ? getComputedStyle(byText('Alex')).fontSize : null,
    level: byText('黄金') ? r(byText('黄金')) : null,
    levelFont: byText('黄金') ? getComputedStyle(byText('黄金')).fontSize : null,
    points: byText('680') ? getComputedStyle(byText('680')).fontSize : null,
    progress: r(prog),
    chevron: r(chev),
    // 内容盒是否溢出（scrollerHeight > clientHeight 说明撑爆）
    overflow: el.scrollHeight > el.clientHeight + 1 ? el.scrollHeight + '>' + el.clientHeight : 'none',
    barBottom: +barBox.bottom.toFixed(2),
  };
});

const box = await bar.boundingBox();
await page.screenshot({
  path: `${OUT}/bar.png`,
  clip: { x: Math.max(0, box.x - 16), y: Math.max(0, box.y - 14), width: Math.min(430, box.width + 32), height: box.height + 28 },
});

// 首屏（含四宫格，确认加高后入口卡还完整）
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/home-top.png` });

console.log(JSON.stringify(data, null, 2));
await browser.close();
