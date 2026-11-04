/**
 * 首页会员条：积分字号改动的前后对照
 * 用法：node scripts/shot-member-points.mjs [输出目录] [输出文件名后缀]
 *
 * 量：积分 span 的 fontSize / 行高、第一行行高、整条高度（确认放大没把栏撑高）
 * 截：整条 + 右端 2× 放大（积分 + 进度条右段）
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/member-points';
const TAG = process.argv[3] || 'now';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
});

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

// ⚠️ 默认落地页是「点餐」，会员条在首页
await page.click('#nav-tab-home');
await page.waitForTimeout(900);

const bar = page.locator('#home-member-bar').first();
await bar.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

const data = await bar.evaluate((el) => {
  const box = (n) => {
    const b = n.getBoundingClientRect();
    return { w: +b.width.toFixed(1), h: +b.height.toFixed(1), top: +b.top.toFixed(1), right: +b.right.toFixed(1) };
  };
  const all = [...el.querySelectorAll('span')];
  // 积分 span：文本以「数字/数字」开头且没有子 span 文本叠加
  const pts = all.find((s) => /^\d+\/\d+$/.test(s.textContent.replace(/\s/g, '')));
  const name = all.find((s) => s.textContent.trim().startsWith('Alex'));
  const cs = pts ? getComputedStyle(pts) : null;
  const line1 = pts?.parentElement;
  return {
    bar: box(el),
    barBg: getComputedStyle(el).backgroundColor,
    pointsText: pts?.textContent.trim() ?? null,
    pointsFontSize: cs?.fontSize ?? null,
    pointsFontWeight: cs?.fontWeight ?? null,
    pointsBox: pts ? box(pts) : null,
    line1Box: line1 ? box(line1) : null,
    nameFontSize: name ? getComputedStyle(name).fontSize : null,
    barOverflow: el.scrollHeight > el.clientHeight + 1 ? `${el.scrollHeight}>${el.clientHeight}` : 'none',
  };
});

const bb = await bar.boundingBox();
const clip = {
  x: Math.max(0, bb.x - 14),
  y: Math.max(0, bb.y - 12),
  width: Math.min(430, bb.width + 28),
  height: bb.height + 24,
};
await page.screenshot({ path: `${OUT}/bar-${TAG}.png`, clip });

// 右端 2× 放大（积分 + 进度条右半）
const zoom = {
  x: Math.max(0, bb.x + bb.width - 150),
  y: Math.max(0, bb.y - 12),
  width: 160,
  height: bb.height + 24,
};
await page.screenshot({ path: `${OUT}/zoom-${TAG}.png`, clip: zoom });

writeFileSync(`${OUT}/measure-${TAG}.json`, JSON.stringify({ ...data, zoom }, null, 2), 'utf8');
await browser.close();
