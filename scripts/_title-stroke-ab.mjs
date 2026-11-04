/** 食材图鉴标题「去字体描边」A/B：现状(0.45px 四向 text-shadow) vs 无描边 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
for (const v of [{ id: 'k0', keep: true }, { id: 'k1', keep: false }]) {
  const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 4 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
  await page.waitForTimeout(400);
  await page.click('#nav-tab-gacha');
  await page.waitForTimeout(1200);
  // 打开「食材图鉴」弹窗
  const opened = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => (b.getAttribute('title')||'').includes('食材图鉴'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log(v.id, 'opened=', opened);
  await page.waitForTimeout(1400);
  const info = await page.evaluate(({ keep }) => {
    const card = document.getElementById('gacha-dex-modal');
    if (!card) return null;
    const h3 = card.querySelector('h3');
    if (!h3) return null;
    const before = getComputedStyle(h3).textShadow;
    if (!keep) h3.style.textShadow = 'none';
    const cs = getComputedStyle(h3);
    return { text: h3.textContent, fontSize: cs.fontSize, fontWeight: cs.fontWeight, before, after: cs.textShadow };
  }, v);
  console.log(v.id, JSON.stringify(info));
  const box = await page.evaluate(() => {
    const card = document.getElementById('gacha-dex-modal');
    const h3 = card.querySelector('h3');
    const b = h3.getBoundingClientRect();
    return { x: Math.max(0,b.x-6), y: Math.max(0,b.y-6), width: Math.min(410-b.x+6, b.width+12), height: b.height+12 };
  });
  await page.screenshot({ path: `${OUT}/titlestroke-${v.id}.png`, clip: box });
  await page.close();
}
await browser.close();
