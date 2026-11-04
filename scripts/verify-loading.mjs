/**
 * 开场动画的功能回归验证：
 *   ① 覆盖层出现时下层 inert（点击/键盘进不去）
 *   ② 自动播完 → inert 释放 → 底部导航可点
 *   ③ 「跳过」能立刻结束，且释放 inert
 *   ④ 「我的」页「开屏动画」能重播
 *   ⑤ 重播时不会把下层永久锁死
 * 用法：node scripts/verify-loading.mjs
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const results = [];
const check = (name, pass, extra = '') => {
  results.push({ name, pass, extra });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
};

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const inertState = () =>
  page.evaluate(() => {
    const host = document.querySelector('[aria-busy]');
    return {
      present: !!document.querySelector('#app-loading-screen'),
      inert: host ? host.hasAttribute('inert') : null
    };
  });

// ① 首屏
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.locator('#app-loading-screen').waitFor();
let s = await inertState();
check('覆盖层出现且下层 inert', s.present && s.inert === true, JSON.stringify(s));

// 下层不可点：底部导航被 inert 拦住
const blocked = await page.evaluate(() => {
  const nav = document.querySelector('#nav-tab-gacha');
  if (!nav) return 'no-nav';
  return nav.closest('[inert]') ? 'inert' : 'clickable';
});
check('开场期间底部导航被 inert 阻断', blocked === 'inert', blocked);

// ② 自动播完
await page.locator('#app-loading-screen').waitFor({ state: 'detached', timeout: 8000 });
s = await inertState();
check('自动播完后覆盖层移除且 inert 释放', !s.present && s.inert === false, JSON.stringify(s));

// 释放后可正常导航
await page.click('#nav-tab-gacha');
await page.waitForTimeout(900);
check('释放后底部导航可点击', await page.locator('#unified-pantry-big-card').isVisible());

// ③ 跳过
await page.reload({ waitUntil: 'domcontentloaded' });
await page.locator('#app-loading-screen').waitFor();
const t0 = Date.now();
await page.getByRole('button', { name: /跳过/ }).click();
await page.locator('#app-loading-screen').waitFor({ state: 'detached', timeout: 3000 });
check('「跳过」能立刻结束', Date.now() - t0 < 1200, `${Date.now() - t0}ms`);
s = await inertState();
check('跳过后 inert 已释放', s.inert === false, JSON.stringify(s));

// ④ 从「我的」页重播
await page.click('#nav-tab-me');
await page.waitForTimeout(900);
await page.getByText('展开全部').click();
await page.waitForTimeout(400);
await page.getByText('开屏动画').click();
await page.locator('#app-loading-screen').waitFor({ timeout: 3000 });
check('「开屏动画」能重播', true);

// ⑤ 重播也能正常收尾并释放
await page.locator('#app-loading-screen').waitFor({ state: 'detached', timeout: 8000 });
s = await inertState();
check('重播后 inert 已释放', s.inert === false, JSON.stringify(s));
await page.click('#nav-tab-menu');
await page.waitForTimeout(900);
check('重播后导航仍可用', await page.locator('#nav-tab-home').isVisible());

await ctx.close();
await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
