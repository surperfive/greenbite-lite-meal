/**
 * 「小红点 + 价格」正红 #E60012 的像素级校验。
 *
 * ⚠️ 不要按「文字内容像不像价格」去选元素 —— 会抓到划线原价（text-slate-400）、
 *    也会漏掉 ¥ 与数字分属两个 span 的情况（详情页）。
 *    正确做法：直接扫**所有 class 里带 E60012 的元素**，校验它渲染出来的颜色。
 *    这样既覆盖全，也能反过来发现「class 写了但被别的规则覆盖」的情况。
 *
 * 用法：node scripts/verify-red.mjs   （任何一处不符就 exit 1）
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const RED = 'rgb(230, 0, 18)'; // #E60012
const browser = await chromium.launch({ channel: 'chrome' });
let failed = false;
let total = 0;

const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

/** 扫当前 DOM 里所有带 E60012 的元素 */
const scan = (label) =>
  page.evaluate((lbl) => {
    const els = [...document.querySelectorAll('[class*="E60012"]')].filter(
      (el) => el.getBoundingClientRect().width > 0
    );
    return els.map((el) => {
      const cls = el.getAttribute('class') || '';
      const isBg = /bg-\[#E60012\]/.test(cls);
      const cs = getComputedStyle(el);
      return {
        page: lbl,
        kind: isBg ? 'bg' : 'text',
        actual: isBg ? cs.backgroundColor : cs.color,
        text: (el.textContent || '').trim().slice(0, 14),
      };
    });
  }, label);

const report = (rows) => {
  for (const r of rows) {
    total++;
    const ok = r.actual === RED;
    if (!ok) failed = true;
    console.log(
      `${ok ? 'ok  ' : 'FAIL'}  ${r.page}  [${r.kind}]  "${r.text}"  →  ${r.actual}${ok ? '' : `  期望 ${RED}`}`
    );
  }
};

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(900);

// 逐页扫描（页面切换靠 App 状态，非当前 tab 的 DOM 不存在，所以必须每页都进一次）
for (const [tab, label] of [
  ['menu', '点餐页'],
  ['home', '首页'],
  ['orders', '订单页'],
  ['me', '我的页'],
]) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(900);
  report(await scan(label));
}

// 抽卡页（食材卡价格 + 悬浮购物车红点）
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);
report(await scan('抽卡页'));

// 详情页（价格 / 首杯价 / 优惠行）
await page.click('#nav-tab-menu');
await page.waitForTimeout(600);
await page.locator('div.cursor-pointer', { hasText: '牛油果鸡胸沙拉' }).first().click();
await page.waitForTimeout(1000);
report(await scan('详情页'));

// 搜索弹窗
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.includes('返回'));
  b?.click();
});
await page.waitForTimeout(900);
await page.evaluate(() => {
  const inp = [...document.querySelectorAll('input')].find((i) => i.placeholder?.includes('搜索'));
  inp?.focus();
  inp?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(900);
report(await scan('搜索弹窗'));

await browser.close();
console.log(`\n共校验 ${total} 处`);
console.log(failed ? '结果：存在未改到的红' : '结果：全部为正红 #E60012');
process.exit(failed ? 1 : 0);
