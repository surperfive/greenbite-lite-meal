// 量「胶囊内图标墨迹中心 vs 文字墨迹中心 vs 胶囊几何中心」
// 方法：胶囊内部插一条绝对定位参考线（不参与布局）→ 4× 截该元素 → 三个 y 同图对比，取整偏置自动抵消
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const TARGETS = [
  { tab: 'menu', text: '≤250大卡', out: '_icon-align-filter' },
  { tab: 'menu', text: '搜索轻食名称、热量数值...', out: '_icon-align-search' },
  { tab: 'menu', text: '外卖', out: '_icon-align-mode' },
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

for (const t of TARGETS) {
  await page.click(`#nav-tab-${t.tab}`);
  await page.waitForTimeout(700);
  const info = await page.evaluate((txt) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    let hit = null;
    for (const el of document.querySelectorAll('span,div,button,a')) {
      if (norm(el.textContent) !== txt) continue;
      // 取最深的那一层：内部不能还有同样文本的元素（否则量到的是整颗胶囊）
      let deeper = false;
      for (const d of el.querySelectorAll('span,div,button,a')) {
        if (norm(d.textContent) === txt) { deeper = true; break; }
      }
      if (!deeper) { hit = el; break; }
    }
    if (!hit) return { err: 'text not found' };
    // 向上找最近的胶囊容器（圆角 >= 高度*0.38）
    let pill = hit;
    while (pill && pill !== document.body) {
      const cs = getComputedStyle(pill);
      const b = pill.getBoundingClientRect();
      const rad = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
      if (rad >= Math.max(5, b.height * 0.38) && b.width < 340) break;
      pill = pill.parentElement;
    }
    if (!pill || pill === document.body) return { err: 'pill not found' };
    pill.id = 'ia-pill';
    pill.style.position = 'relative';
    // 参考线：胶囊几何中心
    const line = document.createElement('div');
    line.id = 'ia-line';
    line.style.cssText = 'position:absolute;left:0;right:0;top:50%;height:1px;margin-top:-0.5px;background:#FF0000;pointer-events:none;z-index:9999';
    pill.appendChild(line);

    const pb = pill.getBoundingClientRect();
    const rel = (r) => ({ x: +(r.left - pb.left).toFixed(2), y: +(r.top - pb.top).toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
    // 图标 = 胶囊里第一个 svg
    const svg = pill.querySelector('svg');
    // 文字 = 最深匹配到的叶子
    const textEl = hit;
    return {
      pill: { w: +pb.width.toFixed(2), h: +pb.height.toFixed(2) },
      icon: svg ? rel(svg.getBoundingClientRect()) : null,
      text: rel(textEl.getBoundingClientRect()),
      textStr: norm(textEl.textContent).slice(0, 20),
    };
  }, t.text);

  if (info.err) { console.log(`\n[${t.text}] 跳过：${info.err}`); continue; }
  console.log(`\n[${t.text}] pill ${info.pill.w}×${info.pill.h}  icon=${JSON.stringify(info.icon)}  text=${JSON.stringify(info.text)}`);

  const path = `scripts/_shots/${t.out}.png`;
  await page.locator('#ia-pill').screenshot({ path });
  await page.evaluate(() => {
    document.getElementById('ia-line')?.remove();
    const p = document.getElementById('ia-pill');
    if (p) { p.removeAttribute('id'); p.style.position = ''; }
  });
  console.log(JSON.stringify({ file: path, ...info }));
}

await browser.close();
