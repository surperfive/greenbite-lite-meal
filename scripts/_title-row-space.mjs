/**
 * 量标题行的可用宽度：行本身 / 父容器 / 卡片内容区，判断皇冠最大能放到多少
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-header-tokens', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(800);
await page.click('#btn-header-tokens');
await page.waitForTimeout(900);

const info = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
  const row = h3.parentElement;
  const icon = row.querySelector('svg');
  const r = (el) => {
    const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) };
  };
  const chain = [];
  let el = row;
  for (let i = 0; i < 4 && el; i++) {
    const cs = getComputedStyle(el);
    chain.push({
      tag: el.tagName,
      cls: (el.getAttribute('class') || '').slice(0, 70),
      rect: r(el),
      padL: cs.paddingLeft,
      padR: cs.paddingRight,
      bw: cs.borderLeftWidth,
    });
    el = el.parentElement;
  }
  // 标题自身的墨迹宽度（用 Range 量文本节点）
  const range = document.createRange();
  range.selectNodeContents(h3);
  const tb = range.getBoundingClientRect();
  return {
    h3: r(h3),
    icon: r(icon),
    row: r(row),
    textRange: { x: +tb.x.toFixed(2), w: +tb.width.toFixed(2) },
    chain,
  };
});
console.log(JSON.stringify(info, null, 2));

// 试算：在不同图标尺寸下行宽是否会超出父容器
const avail = info.chain[1].rect.w - parseFloat(info.chain[1].padL) - parseFloat(info.chain[1].padR);
const gap = info.row.w - info.h3.w - info.icon.w;
console.log('\n--- 试算 ---');
console.log('父容器内容宽', avail.toFixed(2), 'px；当前行宽', info.row.w.toFixed(2), '；gap', gap.toFixed(2));
for (const s of [34, 38, 40, 42, 44, 46, 48]) {
  const w = info.h3.w + gap + s;
  console.log(`  图标 ${s}px → 行宽 ${w.toFixed(2)}  ${w <= avail ? 'OK' : '溢出 ' + (w - avail).toFixed(2)}`);
}
await browser.close();
