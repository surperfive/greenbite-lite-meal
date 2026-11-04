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
    await page.waitForTimeout(700);
    await page.screenshot({ path: `scripts/_shots/_modal-${name}.png` });
    const m = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      const b = d.getBoundingClientRect();
      return { w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
    });
    console.log(name, JSON.stringify(m));
  } catch (e) { console.log(name, 'FAIL', e.message.slice(0, 80)); }
  // 关闭弹窗
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
  const still = await page.$('[role="dialog"]');
  if (still) {
    const btn = await page.$('[role="dialog"] button[aria-label="关闭"]');
    if (btn) await btn.click();
    await page.waitForTimeout(500);
  }
}

// 1. 门店弹窗（点餐页）
await shoot('store', async () => {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(el => /切换|门店/.test(el.textContent || ''));
    b?.click();
  });
});
// 2. 健康计划 / 3. 营养周报（我的页）
await page.click('#nav-tab-me');
await page.waitForTimeout(800);
await shoot('healthplan', async () => {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(el => /健康计划/.test(el.textContent || ''));
    b?.click();
  });
});
await shoot('nutrition', async () => {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(el => /营养|周报/.test(el.textContent || ''));
    b?.click();
  });
});
// 4. 登录弹窗（未登录态才有；直接找登录入口）
await shoot('login', async () => {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(el => /登录/.test(el.textContent || ''));
    b?.click();
  });
});
// 5. 食材图鉴（抽卡页）
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1200);
await shoot('dex', async () => {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(el => /图鉴|奖池/.test(el.textContent || ''));
    b?.click();
  });
});
await browser.close();
