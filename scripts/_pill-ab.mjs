/**
 * 同位置 A/B：同一块区域，分别在「当前 pill-label 生效」与「transform:none」下截图，
 * 用来判断补偿到底改善还是恶化。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = process.env.AB_OUT || 'scripts/_shots/ab';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const DPR = 6;

const TARGETS = [
  { tab: 'menu', name: 'switcher', text: '自提', pad: 12 },
  { tab: 'menu', name: 'filters', text: '≤250大卡', pad: 12 },
  { tab: 'menu', name: 'cardtags', text: '生酮友好', pad: 12 },
  { tab: 'orders', name: 'tabs', text: '已完成', pad: 12 },
  { tab: 'home', name: 'entrytag', text: '查看更多', pad: 12 },
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: DPR });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const rectOfText = (txt) => `(() => {
  const norm = (s) => s.replace(/\\s+/g, ' ').trim();
  const cands = [...document.querySelectorAll('span,div,button')];
  let best = null;
  for (const el of cands) {
    if (norm(el.textContent) !== ${JSON.stringify(txt)}) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 8) continue;
    if (r.top < 0 || r.bottom > innerHeight) continue;
    if (!best || r.width * r.height < best.w * best.h) {
      best = { x: r.left, y: r.top, w: r.width, h: r.height, el };
    }
  }
  if (!best) return null;
  // 往上找胶囊容器：圆角 >= 6 且高度 >= 文字高度
  let p = best.el;
  let pill = null;
  while (p && p !== document.body) {
    const cs = getComputedStyle(p);
    const pr = p.getBoundingClientRect();
    const rad = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
    if (rad >= 6 && pr.height >= best.h - 0.5 && pr.height <= 70) { pill = { x: pr.left, y: pr.top, w: pr.width, h: pr.height }; break; }
    p = p.parentElement;
  }
  return { text: { x: best.x, y: best.y, w: best.w, h: best.h }, pill };
})()`;

const manifest = [];
for (const t of TARGETS) {
  await page.click(`#nav-tab-${t.tab}`);
  await page.waitForTimeout(900);
  await page.evaluate((s) => {
    const sc = document.querySelector('.overflow-y-auto') || document.scrollingElement;
    sc.scrollTop = s;
  }, 0);
  await page.waitForTimeout(300);

  const r = await page.evaluate(rectOfText(t.text));
  if (!r) {
    console.log('miss', t.name);
    continue;
  }
  const base = r.pill || r.text;
  const clip = {
    x: Math.max(0, base.x - t.pad),
    y: Math.max(0, base.y - t.pad),
    width: Math.min(base.w + t.pad * 2, 430 - Math.max(0, base.x - t.pad)),
    height: base.h + t.pad * 2,
  };

  // A：当前（补偿生效）
  await page.screenshot({ path: `${OUT}/${t.name}-on.png`, clip });
  // B：关掉补偿
  await page.evaluate((css) => {
    document.getElementById('ab-style')?.remove();
    const st = document.createElement('style');
    st.id = 'ab-style';
    st.textContent = css;
    document.head.appendChild(st);
  }, process.env.OFF_CSS || '.pill-label{transform:none !important}');
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${t.name}-off.png`, clip });
  // 移除该样式
  await page.evaluate(() => document.getElementById('ab-style')?.remove());
  await page.waitForTimeout(200);

  manifest.push({ name: t.name, clip, rect: r });
  console.log(t.name, JSON.stringify(clip));
}

fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1));
await browser.close();
