import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);

async function shoot(name, openFn) {
  try {
    await openFn();
    await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `scripts/_shots/_modal-${name}.png` });
    const m = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      const b = d.getBoundingClientRect();
      return { t: b.top, l: b.left, w: b.width, h: b.height };
    });
    console.log(name, JSON.stringify(m));
  } catch (e) { console.log(name, 'FAIL', e.message.slice(0, 60)); }
  const btn = await page.$('[role="dialog"] button[aria-label="关闭"]');
  if (btn) { await btn.click(); await page.waitForTimeout(500); }
}

// 福利中心：先回首页，点福利条入口
await page.click('#nav-tab-home');
await page.waitForTimeout(900);
await shoot('benefit', async () => {
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('button, div[role="button"], div')];
    const b = els.find(el => el.children.length && /福利|礼包|专享/.test(el.textContent || '') && (el.textContent || '').length < 60);
    (b || els.find(el => /福利/.test(el.textContent || '')))?.click();
  });
});
await shoot('invite', async () => {
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('button, div[role="button"], div')];
    const b = els.find(el => /邀请|邀新/.test(el.textContent || '') && (el.textContent || '').length < 60);
    b?.click();
  });
});
await shoot('redpacket', async () => {
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('button, div[role="button"], div')];
    const b = els.find(el => /红包/.test(el.textContent || '') && (el.textContent || '').length < 60);
    b?.click();
  });
});
await browser.close();
