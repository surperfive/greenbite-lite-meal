/** 验证 2026-10-30 三处改动是否真的落地：安全区类、FloatingCart 的 calc 定位、MotionConfig。 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2600); // 等开屏遮罩退场

const out = [];
const log = (s) => out.push(s);

// 1) 底部导航
const nav = await page.evaluate(() => {
  const el = document.getElementById('main-bottom-navigation-bar');
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    pb: cs.paddingBottom,
    h: Math.round(r.height),
    bottom: Math.round(innerHeight - r.bottom),
    cls: el.className.includes('safe-pb-tight'),
  };
});
log(`nav: ${JSON.stringify(nav)}`);

// 2) badge 语义（初始 1 单进行中 → 应为 1）
const badge = await page.evaluate(() => {
  const b = document.querySelector('#nav-tab-orders .rounded-full');
  return b ? b.textContent : null;
});
log(`orders badge: ${badge}`);

// 3) FloatingCart 定位（menu 页默认 tab，应存在）
const cart = await page.evaluate(() => {
  const all = [...document.querySelectorAll('div.absolute.bottom-\\[calc\\(92px\\+env\\(safe-area-inset-bottom\\,0px\\)\\)\\]')];
  const shell = document.querySelector('#cart-fly-orb-stage');
  const lime = [...document.querySelectorAll('div')].find((d) =>
    d.className && typeof d.className === 'string' && d.className.includes('bg-[#C7F665]') && d.className.includes('rounded-[22px]')
  );
  const r = lime ? lime.getBoundingClientRect() : null;
  return {
    matched: all.length,
    limeTop: r ? Math.round(r.top) : null,
    limeBottom: r ? Math.round(innerHeight - r.bottom) : null,
    computedBottom: lime ? getComputedStyle(lime.parentElement.parentElement).bottom : null,
  };
});
log(`floatingCart: ${JSON.stringify(cart)}`);

// 4) MotionConfig 是否生效：检查 motion 注入的 style（reducedMotion=never 时不该有）
const mc = await page.evaluate(() => document.documentElement.outerHTML.includes('data-motion'));
log(`motion attrs: ${mc}`);

// 5) 截图
await page.screenshot({ path: 'outputs/verify-nav/menu.png' });
await page.click('#nav-tab-home');
await page.waitForTimeout(2200);
await page.screenshot({ path: 'outputs/verify-nav/home.png' });

await browser.close();
fs.mkdirSync('outputs/verify-nav', { recursive: true });
fs.writeFileSync('outputs/verify-nav/report.txt', out.join('\n'), 'utf8');
