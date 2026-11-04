/**
 * 「获取抽卡币」弹窗状态全检：
 *  ① 未签到态 ② 点「领 1 币」→ 弹窗关闭 + toast ③ 再打开 = 已签到态（按钮变灰）
 *  ④ 点「去分享」→ toast ⑤ 375 窄壳下的排版
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });

const openGacha = async (page) => {
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(600);
  await page.click('#nav-tab-gacha');
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
  await page.waitForSelector('#btn-header-tokens', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(800);
};
const clipCard = async (page) => {
  const b = await page.evaluate(() => {
    const h = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
    const r = h.closest('.rounded-\\[20px\\]').getBoundingClientRect();
    return { x: r.x - 14, y: r.y - 14, width: r.width + 28, height: r.height + 28 };
  });
  return b;
};

// ① 未签到 + ③ 已签到（同一页面内完成，签到状态是组件 state，刷新会丢）
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await openGacha(page);
await page.click('#btn-header-tokens');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/tokens-state-fresh.png`, clip: await clipCard(page) });

// ② 点领币
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '领 1 币')?.click();
});
await page.waitForTimeout(700);
const afterClaim = await page.evaluate(() => ({
  modalOpen: !![...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取')),
  toast: document.querySelector('[class*="z-50"]')?.textContent?.includes('签到成功') ?? false,
  tokens: document.getElementById('btn-header-tokens')?.textContent?.trim(),
}));
console.log('点领币后:', JSON.stringify(afterClaim));

// ③ 再打开 = 已签到态
await page.click('#btn-header-tokens');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/tokens-state-checked.png`, clip: await clipCard(page) });
const checkedLabel = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '已签到');
  return b ? { text: b.textContent.trim(), disabled: b.disabled } : null;
});
console.log('已签到按钮:', JSON.stringify(checkedLabel));
await page.close();

// ⑤ 375 窄壳
const p2 = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 3 });
await openGacha(p2);
await p2.click('#btn-header-tokens');
await p2.waitForTimeout(900);
const narrow = await p2.evaluate(() => {
  const h = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
  const card = h.closest('.rounded-\\[20px\\]');
  const r = card.getBoundingClientRect();
  // 有没有元素横向溢出卡片
  const overflow = [...card.querySelectorAll('*')].filter((e) => {
    const b = e.getBoundingClientRect();
    return b.width > 0 && (b.right > r.right + 0.5 || b.left < r.left - 0.5);
  }).map((e) => ({ tag: e.tagName, cls: (e.className || '').toString().slice(0, 40), right: +e.getBoundingClientRect().right.toFixed(1) }));
  return { card: { x: +r.x.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }, overflow: overflow.slice(0, 6) };
});
console.log('375 窄壳:', JSON.stringify(narrow));
await p2.screenshot({ path: `${OUT}/tokens-state-375.png`, clip: await clipCard(p2) });
await browser.close();
