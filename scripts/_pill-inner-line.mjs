/** 在胶囊内部 50% 处画一条绝对定位的红线，然后对元素截图。
 *  红线与墨迹同图，参考系自洽，不受元素截图取整偏置影响。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = process.env.IL_OUT || 'scripts/_shots/inner';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const DPR = 4;

const TARGETS = [
  { tab: 'menu', name: '全部', text: '全部' },
  { tab: 'menu', name: '热量', text: '≤250大卡' },
  { tab: 'menu', name: '菜品标签', text: '生酮友好' },
  { tab: 'menu', name: '折扣', text: '8.0折' },
  { tab: 'orders', name: '订单tab', text: '已完成' },
  { tab: 'orders', name: '操作', text: '再来一单' },
  { tab: 'me', name: '等级', text: '黄金会员 LV.2' },
  { tab: 'menu', name: '到店自取', text: '到店自取' },
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: DPR });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const EXTRA = process.env.EXTRA_CSS;
if (EXTRA) await page.addStyleTag({ content: EXTRA });

const out = [];
for (const t of TARGETS) {
  await page.click(`#nav-tab-${t.tab}`);
  await page.waitForTimeout(850);
  await page.evaluate(() => { const sc = document.querySelector('.overflow-y-auto'); if (sc) sc.scrollTop = 0; });
  await page.waitForTimeout(320);
  const info = await page.evaluate((txt) => {
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
    if (getComputedStyle(pill).position === 'static') pill.style.position = 'relative';
    const line = document.createElement('div');
    line.className = 'probe-line';
    line.style.cssText = 'position:absolute;left:0;right:0;top:calc(50% - 0.5px);height:1px;background:#ff0000;z-index:999;pointer-events:none';
    pill.appendChild(line);
    pill.setAttribute('data-il', '1');
    const pr = pill.getBoundingClientRect();
    return { h: +pr.height.toFixed(2), w: +pr.width.toFixed(2), fs: +parseFloat(getComputedStyle(best.el).fontSize).toFixed(2) };
  }, t.text);
  if (!info) { console.log('miss', t.name); continue; }
  const file = `${t.name}.png`;
  await page.locator('[data-il="1"]').screenshot({ path: `${OUT}/${file}` });
  await page.evaluate(() => {
    document.querySelectorAll('[data-il]').forEach((e) => { e.removeAttribute('data-il'); e.querySelectorAll('.probe-line').forEach((l) => l.remove()); });
  });
  out.push({ ...t, ...info, file });
  console.log(t.name, JSON.stringify(info));
}
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ dpr: DPR, items: out }, null, 1));
await browser.close();
