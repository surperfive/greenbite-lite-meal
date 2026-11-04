/**
 * 生成「5 档位移」候选对照图：对同一批真实胶囊，分别施加 translateY(+2/+1/0/-1/-2)px，
 * 每档画胶囊上下沿（蓝）与中心线（红），供人眼挑选。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_shots/levels';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const DPR = 4;
const SHIFTS = [2, 1, 0, -1, -2];

const TARGETS = [
  { tab: 'menu', name: '到店自取', text: '到店自取' },
  { tab: 'menu', name: '筛选', text: '≤250大卡' },
  { tab: 'menu', name: '菜品标签', text: '生酮友好' },
  { tab: 'orders', name: '订单状态', text: '已完成' },
  { tab: 'orders', name: '操作胶囊', text: '发票' },
  { tab: 'me', name: '等级胶囊', text: '黄金会员 LV.2' },
];

const rectOf = (txt) => `(() => {
  const norm = (s) => s.replace(/\\s+/g, ' ').trim();
  let best = null;
  for (const el of document.querySelectorAll('span,div,button')) {
    if (norm(el.textContent) !== ${JSON.stringify(txt)}) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 8 || r.top < 0 || r.bottom > innerHeight) continue;
    if (!best || r.width * r.height < best.w * best.h) best = { x: r.left, y: r.top, w: r.width, h: r.height, el };
  }
  if (!best) return null;
  let p = best.el, pill = null;
  while (p && p !== document.body) {
    const cs = getComputedStyle(p), pr = p.getBoundingClientRect();
    const rad = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
    if (rad >= 6 && pr.height >= best.h - 0.5 && pr.height <= 70) { pill = { x: pr.left, y: pr.top, w: pr.width, h: pr.height }; break; }
    p = p.parentElement;
  }
  return pill;
})()`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: DPR });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const manifest = [];
for (const t of TARGETS) {
  await page.click(`#nav-tab-${t.tab}`);
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const sc = document.querySelector('.overflow-y-auto');
    if (sc) sc.scrollTop = 0;
  });
  await page.waitForTimeout(400);
  const pill = await page.evaluate(rectOf(t.text));
  if (!pill) {
    console.log('miss', t.name);
    continue;
  }
  const pad = 6;
  const clip = { x: Math.max(0, pill.x - pad), y: Math.max(0, pill.y - pad), width: pill.w + pad * 2, height: pill.h + pad * 2 };
  for (const sh of SHIFTS) {
    await page.evaluate((css) => {
      document.getElementById('lv')?.remove();
      const st = document.createElement('style');
      st.id = 'lv';
      st.textContent = css;
      document.head.appendChild(st);
    }, `.pill-label{transform:translateY(${sh}px) !important}`);
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${OUT}/${t.name}-${sh}.png`, clip });
  }
  await page.evaluate(() => document.getElementById('lv')?.remove());
  manifest.push({ name: t.name, pill, clip, pad });
  console.log(t.name, JSON.stringify(pill));
}
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ dpr: DPR, shifts: SHIFTS, items: manifest }, null, 1));
await browser.close();
