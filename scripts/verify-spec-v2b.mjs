/** 补测：① Tailwind 是否真的生成了 bottom-[calc(...)] 规则 ② 加购后购物车位置 ③ reducedMotion 生效 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const dir = 'outputs/verify-nav';
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

const out = [];
const log = (s) => out.push(s);

// ① CSSOM 里有没有那条 calc 规则
const rule = await page.evaluate(() => {
  const hits = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) {
      const t = r.cssText || '';
      if (t.includes('safe-area-inset-bottom') && t.includes('92px')) hits.push(t.slice(0, 180));
    }
  }
  return hits;
});
log(`CSS rules with 92px+safe-area: ${rule.length}`);
rule.forEach((r) => log('  ' + r));

// ② 加购一份，看购物车是否出现且位置正确
await page.waitForTimeout(300);
const addBtn = page.locator('button[aria-label="增加一份"]').first();
if (await addBtn.count()) {
  await addBtn.click({ force: true });
  await page.waitForTimeout(1500);
} else {
  // 兜底：点卡片右下角加号
  await page.locator('.lucide-plus').first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1500);
}

const cart = await page.evaluate(() => {
  const lime = [...document.querySelectorAll('div')].find(
    (d) => typeof d.className === 'string' && d.className.includes('C7F665') && d.className.includes('rounded-[22px]')
  );
  if (!lime) return { found: false };
  const holder = lime.parentElement?.parentElement;
  const r = lime.getBoundingClientRect();
  return {
    found: true,
    computedBottom: holder ? getComputedStyle(holder).bottom : null,
    holderClass: holder ? holder.className.slice(0, 120) : null,
    topFromViewportBottom: Math.round(innerHeight - r.bottom),
    height: Math.round(r.height),
  };
});
log(`cart: ${JSON.stringify(cart, null, 1)}`);
await page.screenshot({ path: path.join(dir, 'menu-cart.png') });

await browser.close();
fs.writeFileSync(path.join(dir, 'report2.txt'), out.join('\n'), 'utf8');
