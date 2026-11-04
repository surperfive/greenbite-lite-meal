/**
 * 用 CDP screencast 逐帧录下详情页 hero 的「下坠切换」，输出 scripts/_drop/frame-XX.png。
 * 静态截图看不出动画方向，只有拿到真实帧才能确认是"从上往下掉"还是别的。
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_drop';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

const clearSplash = async () => {
  for (let i = 0; i < 10; i++) {
    const visible = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
      if (!b) return false;
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(b).visibility !== 'hidden';
    });
    if (!visible) return true;
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
      b?.click();
    });
    await page.waitForTimeout(300);
  }
  return false;
};

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(3200);
await clearSplash();
await page.waitForTimeout(500);

await page.locator('div.cursor-pointer', { hasText: '金枪鱼三明治' }).first().click({ timeout: 20000 });
await page.waitForTimeout(1400);
await clearSplash();
await page.waitForTimeout(600);

const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  frames.push({ ts: Date.now(), data: f.data, meta: f.metadata });
  try {
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId });
  } catch {}
});

await cdp.send('Page.startScreencast', {
  format: 'png',
  maxWidth: 420,
  maxHeight: 900,
  everyNthFrame: 1,
});

await page.waitForTimeout(250);
const t0 = Date.now();
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /超大(碗|杯)/.test(x.textContent || ''));
  b?.click();
});
await page.waitForTimeout(1100);
await cdp.send('Page.stopScreencast').catch(() => {});

const picked = frames.filter((f) => f.ts >= t0 - 40);
picked.forEach((f, i) => {
  writeFileSync(`${OUT}/frame-${String(i).padStart(2, '0')}.png`, Buffer.from(f.data, 'base64'));
});
writeFileSync(`${OUT}/times.json`, JSON.stringify(picked.map((f) => f.ts - t0)));
console.log('frames', picked.length, 'offsets', picked.map((f) => f.ts - t0).join(','));

await browser.close();
