/** 直接对胶囊元素截图（坐标严格等于元素盒），4x DPR，供 8x 放大目视。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots/exact2';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const TARGETS = [
  { tab: 'menu', name: '筛选-全部', text: '全部' },
  { tab: 'menu', name: '筛选-热量', text: '≤250大卡' },
  { tab: 'menu', name: '菜品标签', text: '生酮友好' },
  { tab: 'menu', name: '折扣', text: '8.0折' },
  { tab: 'orders', name: '订单tab', text: '已完成' },
  { tab: 'orders', name: '操作', text: '再来一单' },
  { tab: 'me', name: '等级', text: '黄金会员 LV.2' },
  { tab: 'home', name: '入口标签', text: '查看更多' },
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const out = [];
for (const t of TARGETS) {
  await page.click(`#nav-tab-${t.tab}`);
  await page.waitForTimeout(900);
  await page.evaluate(() => { const sc = document.querySelector('.overflow-y-auto'); if (sc) sc.scrollTop = 0; });
  await page.waitForTimeout(350);
  const ok = await page.evaluate((txt) => {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    let best = null;
    for (const el of document.querySelectorAll('span,div,button')) {
      if (norm(el.textContent) !== txt) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 10 || r.height < 8 || r.top < 0 || r.bottom > innerHeight) continue;
      if (!best || r.width * r.height < best.w * best.h) best = { el, w: r.width, h: r.height };
    }
    if (!best) return null;
    let p = best.el, pill = null;
    while (p && p !== document.body) {
      const cs = getComputedStyle(p), pr = p.getBoundingClientRect();
      const rad = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
      if (rad >= 6 && pr.height >= best.h - 0.5 && pr.height <= 70) { pill = p; break; }
      p = p.parentElement;
    }
    if (!pill) return null;
    pill.setAttribute('data-x2', '1');
    return { h: pill.getBoundingClientRect().height, w: pill.getBoundingClientRect().width };
  }, t.text);
  if (!ok) { console.log('miss', t.name); continue; }
  await page.locator('[data-x2="1"]').screenshot({ path: `${OUT}/${t.name}.png` });
  await page.evaluate(() => document.querySelectorAll('[data-x2]').forEach((e) => e.removeAttribute('data-x2')));
  out.push({ ...t, ...ok });
  console.log(t.name, JSON.stringify(ok));
}
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify(out, null, 1));
await browser.close();
