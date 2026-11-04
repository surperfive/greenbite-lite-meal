/**
 * 弹窗截图：统一抓各个「会弹出窗口」的入口，截图存档
 * 用法：node scripts/shot-modals.mjs [输出目录] [后缀]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/modals';
const TAG = process.argv[3] || 'now';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, locale: 'zh-CN' });

async function boot() {
  await page.goto(BASE, { waitUntil: 'commit' });
  // 先等底部导航出现（loading 屏淡出期间节点还在 DOM 里，只等 detached 会抓到开场动画）
  await page.waitForSelector('#nav-tab-home', { state: 'visible', timeout: 25000 });
  await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

/** 用 DOM 直接点，避开 Playwright 文本选择的编码/遮挡问题 */
const clickText = (t) =>
  page.evaluate((txt) => {
    const cands = [...document.querySelectorAll('button, [role="button"], a')];
    const el = cands.find((n) => (n.textContent || '').includes(txt));
    if (!el) return false;
    el.click();
    return true;
  }, t);

const clickSelector = async (sel) => {
  const ok = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return false;
    el.click();
    return true;
  }, sel);
  return ok;
};

const closeAll = () =>
  page.evaluate(() => {
    const b = document.querySelector('[aria-label="关闭"]');
    b?.click();
  });

const size = async (sel) => {
  const el = await page.$(sel);
  if (!el) return null;
  const b = await el.boundingBox();
  return b ? { w: +b.width.toFixed(1), h: +b.height.toFixed(1), x: +b.x.toFixed(1), y: +b.y.toFixed(1) } : null;
};

const report = {};

/* 1. 健康计划（我的页 → 健康计划） */
await boot();
await clickSelector('#nav-tab-me');
await page.waitForTimeout(500);
await clickText('健康计划');
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/${TAG}-health-plan.png` });
report.healthPlan = await size('[role="dialog"]');

/* 2. 福利中心 */
await boot();
await clickSelector('#nav-tab-home');
await page.waitForTimeout(600);
await clickSelector('#home-benefit-card');
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/${TAG}-benefit.png` });
report.benefit = await size('[role="dialog"]');

/* 3. 邀请好友 */
await boot();
await clickSelector('#nav-tab-home');
await page.waitForTimeout(600);
await clickSelector('#home-invite-card');
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/${TAG}-invite.png` });
report.invite = await size('[role="dialog"]');

/* 4. 食材图鉴（抽卡页 → 页头 ⓘ） */
await boot();
await clickSelector('#nav-tab-gacha');
await page.waitForTimeout(900);
const infoOk = await page.evaluate(() => {
  const icon = document.querySelector('svg.lucide-info');
  const btn = icon?.closest('button');
  if (!btn) return false;
  btn.click();
  return true;
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/${TAG}-dex.png` });
report.dex = await size('#gacha-dex-modal');
report.infoBtn = infoOk;

/* 5. 门店弹窗（点餐页 → 切换） */
await boot();
await clickSelector('#nav-tab-menu');
await page.waitForTimeout(700);
await clickText('切换');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/${TAG}-store.png` });
report.store = await size('[role="dialog"]');

console.log(JSON.stringify(report));
await browser.close();
