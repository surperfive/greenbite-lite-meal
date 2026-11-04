/**
 * 「抽卡币图标统一」清单图：把全站出现抽卡币图标的 5 个位置按 4× 裁下来，
 * 逐一确认都是同一枚皇冠（TokenIcon / #ic-crown-*）。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-header-tokens', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);

const rectOf = async (sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, sel);

const pad = 6;
const clipShot = async (sel, name, extra = 0) => {
  const r = await rectOf(sel);
  if (!r) { console.log('缺失', sel); return null; }
  await page.screenshot({
    path: `${OUT}/ti-${name}.png`,
    clip: { x: r.x - pad, y: r.y - pad, width: r.width + pad * 2 + extra, height: r.height + pad * 2 },
  });
  return r;
};

// 1) 页头「N 币」黑胶囊
const a = await clipShot('#btn-header-tokens', 'header-chip');
// 2) 两个抽卡按钮里的「N 抽卡币」胶囊（SVG 内部元素，getBoundingClientRect 可用）
const b = await clipShot('#single-coin-pill', 'single-pill');
const c = await clipShot('#multi-coin-pill', 'multi-pill');
console.log('页头', a, '\n单抽胶囊', b, '\n十连胶囊', c);

// 3) 弹窗里的三处
await page.click('#btn-header-tokens');
await page.waitForTimeout(900);
const d = await clipShot('#tokens-status-pill', 'status-pill');
const e = await clipShot('#task-row-sign', 'row-sign');
const f = await clipShot('#task-row-share', 'row-share');
console.log('状态胶囊', d, '\n签到行', e, '\n助力行', f);
await browser.close();
