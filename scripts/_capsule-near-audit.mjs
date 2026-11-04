/** 找「贴着胶囊但没重叠」的元素：在胶囊 x 范围内、顶边落在胶囊底边下方 0~20px 的元素。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const VW = Number(process.env.VW || 430);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: VW, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2200);

async function near(label) {
  const r = await page.evaluate(() => {
    const capEl = document.getElementById('mp-capsule');
    const cap = capEl.getBoundingClientRect();
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      if (el === capEl || capEl.contains(el) || el.contains(capEl)) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return;
      const b = el.getBoundingClientRect();
      if (b.width < 6 || b.height < 6) return;
      // x 与胶囊有交集
      if (b.right <= cap.left + 2 || b.left >= cap.right - 2) return;
      const gap = b.top - cap.bottom;
      if (gap < -2 || gap > 20) return;
      const directText = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('').trim();
      const interactive = ['BUTTON', 'A', 'INPUT'].includes(el.tagName) || el.hasAttribute('aria-label');
      if (!directText && !interactive) return;
      out.push({ tag: el.tagName.toLowerCase(), text: (directText || el.getAttribute('aria-label') || '').slice(0, 14), gap: +gap.toFixed(1), top: +b.top.toFixed(1) });
    });
    out.sort((a, b) => a.gap - b.gap);
    return out.slice(0, 4);
  });
  console.log(`[${label}]`, r.length ? JSON.stringify(r) : '✓ 无贴脸元素');
}

await page.click('#nav-tab-home'); await page.waitForTimeout(1400); await near('home');
await page.click('#nav-tab-menu'); await page.waitForTimeout(1200); await near('menu');
await page.click('#nav-tab-orders'); await page.waitForTimeout(1200); await near('orders');
await page.click('#nav-tab-me'); await page.waitForTimeout(1200); await near('me');
await page.click('#nav-tab-gacha'); await page.waitForTimeout(2800); await near('gacha');
await page.click('#nav-tab-menu'); await page.waitForTimeout(1000);
const th = page.locator('[data-dish-thumb="true"]').first();
if (await th.count()) { await th.click(); await page.waitForTimeout(1400); await near('detail'); }
await browser.close();
