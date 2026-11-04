import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const tabHeights = async () => page.evaluate(() => {
  const out = [];
  for (const b of document.querySelectorAll('button')) {
    const t = b.textContent.replace(/\s+/g, '');
    if (['全部', '进行中', '已完成'].some((k) => t.startsWith(k)) && b.getBoundingClientRect().height < 40) {
      const r = b.getBoundingClientRect();
      // 去掉 scale 的影响：读 offsetHeight（布局高度，不含 transform）
      out.push({ t: t.slice(0, 8), layoutH: b.offsetHeight, rectH: +r.height.toFixed(2) });
    }
  }
  return out;
});

await page.click('#nav-tab-orders');
await page.waitForTimeout(1000);
console.log('订单页 tab：', JSON.stringify(await tabHeights(), null, 0));

await page.click('#nav-tab-menu');
await page.waitForTimeout(1000);
const tags = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('span')) {
    const t = el.textContent.trim();
    if (!/^\d\.\d折$/.test(t) && !['生酮友好', '0卡糖', '高膳食纤维', '鲜制轻食'].includes(t)) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 8 || r.height > 30) continue;
    out.push({ t, layoutH: el.offsetHeight, rectH: +r.height.toFixed(2) });
    if (out.length >= 6) break;
  }
  return out;
});
console.log('菜品标签行：', JSON.stringify(tags, null, 0));
await browser.close();
