// 量「胶囊内文字墨迹的上留白 / 下留白」，判断 pill-label 的 -0.075em 在每个胶囊里是否合适
// 4× 元素截图 + 内部参考线（胶囊几何中心），取整偏置自动抵消
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const TARGETS = [
  { tab: 'menu', text: '≤250大卡' },        // py-1 + 行高 normal
  { tab: 'menu', text: '生酮友好' },        // h-[15px] + leading-none
  { tab: 'menu', text: '8.0折' },           // h-[15px] + leading-none
  { tab: 'menu', text: '全部' },            // 分类侧栏
  { tab: 'orders', text: '全部 (2)' },      // h-[26px] 三态 tab
  { tab: 'orders', text: '已完成 (1)' },
  { tab: 'orders', text: '发票' },
  { tab: 'home', text: '查看更多' },
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(1200);

let cur = null;
for (const t of TARGETS) {
  if (cur !== t.tab) {
    await page.click(`#nav-tab-${t.tab}`);
    await page.waitForTimeout(800);
    cur = t.tab;
  }
  const info = await page.evaluate((txt) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    let hit = null;
    for (const el of document.querySelectorAll('span,div,button,a')) {
      if (norm(el.textContent) !== txt) continue;
      let deeper = false;
      for (const d of el.querySelectorAll('span,div,button,a')) if (norm(d.textContent) === txt) { deeper = true; break; }
      if (!deeper) { hit = el; break; }
    }
    if (!hit) return { err: 'text not found' };
    let pill = hit;
    let hops = 0;
    while (pill && pill !== document.body && hops++ < 6) {
      const cs = getComputedStyle(pill);
      const b = pill.getBoundingClientRect();
      const rad = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
      if (rad >= Math.max(5, b.height * 0.38) && b.width < 360) break;
      pill = pill.parentElement;
    }
    if (!pill || pill === document.body) return { err: 'pill not found' };
    pill.id = 'pg-pill';
    pill.style.position = 'relative';
    const line = document.createElement('div');
    line.id = 'pg-line';
    line.style.cssText = 'position:absolute;left:0;right:0;top:50%;height:1px;margin-top:-0.5px;background:#FF0000;pointer-events:none;z-index:9999';
    pill.appendChild(line);
    const pb = pill.getBoundingClientRect();
    const tb = hit.getBoundingClientRect();
    return {
      pill: { w: +pb.width.toFixed(2), h: +pb.height.toFixed(2) },
      text: { x: +(tb.left - pb.left).toFixed(2), y: +(tb.top - pb.top).toFixed(2), w: +tb.width.toFixed(2), h: +tb.height.toFixed(2) },
      fs: getComputedStyle(hit).fontSize,
      lh: getComputedStyle(hit).lineHeight,
      hasLabel: hit.classList.contains('pill-label'),
      textStr: norm(hit.textContent).slice(0, 16),
    };
  }, t.text);

  if (info.err) { console.log(`\n[${t.text}] 跳过：${info.err}`); continue; }
  const path = `scripts/_shots/_pg-${t.tab}-${t.text.replace(/[^\w\u4e00-\u9fa5]/g, '')}.png`;
  await page.locator('#pg-pill').screenshot({ path });
  console.log(JSON.stringify({ file: path, ...info }));
  await page.evaluate(() => {
    document.getElementById('pg-line')?.remove();
    const p = document.getElementById('pg-pill');
    if (p) { p.removeAttribute('id'); p.style.position = ''; }
  });
}

await browser.close();
