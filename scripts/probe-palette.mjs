import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(BASE, { waitUntil: 'domcontentloaded' });

// ── 加载屏：直接取 .brand-loader 的 computed background ──
const loader = await p.evaluate(() => {
  const el = document.querySelector('.brand-loader');
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { background: cs.background, backgroundImage: cs.backgroundImage, backgroundColor: cs.backgroundColor };
});
console.log('加载屏 .brand-loader：', JSON.stringify(loader));

// 抓加载屏实际渲染的像素（左上/中/右下）
const shot = await p.screenshot();
await p.waitForTimeout(100);

// ── 主页面：点掉跳过 ──
await p.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent?.trim() === '跳过')?.click());
await p.waitForTimeout(1400);

// 抽卡页
await p.click('#nav-tab-gacha');
await p.waitForTimeout(1400);
const gacha = await p.evaluate(() => {
  const out = [];
  // 找到所有大面积的背景元素
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 200 || r.height < 100) return;
    const bg = cs.backgroundColor;
    const bgi = cs.backgroundImage;
    if ((bg && bg !== 'rgba(0, 0, 0, 0)') || (bgi && bgi !== 'none')) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 90),
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        y: Math.round(r.top),
        bg,
        bgi: bgi === 'none' ? '' : bgi.slice(0, 120)
      });
    }
  });
  return out.slice(0, 14);
});
console.log('\n抽卡页大面积背景元素：');
gacha.forEach((g) => console.log('  ', g.size, 'y=' + g.y, g.bg, g.bgi ? '| ' + g.bgi : '', '\n      ', g.cls));

await b.close();
