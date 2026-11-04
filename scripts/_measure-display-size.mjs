/**
 * 实测每张静态资源在页面里的「最大渲染尺寸」。
 *
 * 为什么要实测：压缩目标必须按真实显示尺寸定，凭目录名猜（比如「dishes 就是卡片小图」）
 * 会压糊详情页大图。这里把每个 tab 都滚一遍，顺带打开菜品详情页，
 * 记录每张 img 的 naturalWidth 与 clientWidth × devicePixelRatio。
 *
 * 输出 JSON 到 scripts/_asset-display-size.json，供 compress 脚本消费。
 *
 * 用法：node scripts/_measure-display-size.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_asset-display-size.json';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 430, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 });
await page.waitForFunction(
  () => {
    const el = document.querySelector('#app-page-stage');
    return el && getComputedStyle(el).opacity === '1';
  },
  { timeout: 30000 }
);

// 轮播 4.5s 会跳走，冻结定时器，避免截图/测量漂移
await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused !important}' });

const dpr = await page.evaluate(() => window.devicePixelRatio);

/** 把当前页滚到底，触发懒加载，然后收集所有 img + CSS 背景图 */
async function collect() {
  // 分步滚动触发 loading="lazy"
  await page.evaluate(async () => {
    const scroller =
      document.querySelector('#app-page-stage')?.parentElement?.querySelector('.overflow-y-auto') ??
      document.scrollingElement;
    const step = 400;
    for (let y = 0; y < 6000; y += step) {
      window.scrollTo(0, y);
      if (scroller) scroller.scrollTop = y;
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    if (scroller) scroller.scrollTop = 0;
  });
  await page.waitForTimeout(300);

  return page.evaluate((dpr) => {
    const rows = [];
    const push = (url, w, h, nw, nh, tag) => {
      if (!url) return;
      if (url.startsWith('data:')) return;
      const path = url.replace(location.origin, '').split('?')[0];
      if (!path.startsWith('/')) return;
      rows.push({ path, cssW: w, cssH: h, naturalW: nw, naturalH: nh, pxW: Math.round(w * dpr), pxH: Math.round(h * dpr), tag });
    };
    for (const img of document.querySelectorAll('img')) {
      const r = img.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      push(img.currentSrc || img.src, r.width, r.height, img.naturalWidth, img.naturalHeight, 'img');
    }
    for (const el of document.querySelectorAll('*')) {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none' || !bg.includes('url(')) continue;
      const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (!m) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      push(m[1], r.width, r.height, 0, 0, 'bg');
    }
    return rows;
  }, dpr);
}

const all = [];

// --- 各 tab ---
const tabIds = await page.$$eval('[id^="nav-tab-"]', (els) => els.map((e) => e.id));
console.log('发现 tab：', tabIds.join(', '));

for (const id of tabIds) {
  try {
    await page.click(`#${id}`, { timeout: 5000 });
    await page.waitForTimeout(700);
    const rows = await collect();
    all.push(...rows.map((r) => ({ ...r, where: id })));
    console.log(`  ${id}: ${rows.length} 条`);
  } catch (e) {
    console.log(`  ${id}: 跳过（${e.message.slice(0, 40)}）`);
  }
}

// --- 菜品详情页（大图在这里） ---
try {
  await page.click('#nav-tab-menu', { timeout: 5000 });
  await page.waitForTimeout(700);
  // 菜品卡没有固定 id，且抠图外层常带 pointer-events-none，
  // Playwright 的 actionability 检查会判「不可点」→ 直接用 DOM click 让事件冒泡到卡片的 onClick
  await page.locator('img[src*="/dishes/cutout/"]').first().evaluate((n) => n.click());
  await page.waitForTimeout(900);
  const rows = await collect();
  all.push(...rows.map((r) => ({ ...r, where: 'detail' })));
  console.log(`  detail: ${rows.length} 条`);
  // 关掉详情
  const back = page.locator('[aria-label="返回"]').first();
  if (await back.count()) await back.click().catch(() => {});
  await page.waitForTimeout(500);
} catch (e) {
  console.log('  detail: 跳过（' + e.message.slice(0, 60) + '）');
}

await browser.close();

// --- 聚合：同一资源取最大渲染尺寸 ---
const byPath = new Map();
for (const r of all) {
  const cur = byPath.get(r.path);
  if (!cur) {
    byPath.set(r.path, { path: r.path, pxW: r.pxW, pxH: r.pxH, naturalW: r.naturalW, naturalH: r.naturalH, wheres: [r.where] });
  } else {
    cur.pxW = Math.max(cur.pxW, r.pxW);
    cur.pxH = Math.max(cur.pxH, r.pxH);
    if (r.naturalW > cur.naturalW) { cur.naturalW = r.naturalW; cur.naturalH = r.naturalH; }
    if (!cur.wheres.includes(r.where)) cur.wheres.push(r.where);
  }
}

const result = [...byPath.values()].sort((a, b) => b.pxW - a.pxW);
writeFileSync(OUT, JSON.stringify({ dpr, assets: result }, null, 2), 'utf8');

console.log(`\n共 ${result.length} 个资源被页面实际渲染（dpr=${dpr}），已写入 ${OUT}\n`);
console.log('  ' + 'CSS最大宽'.padStart(8) + '  需要像素  原图尺寸      path');
for (const a of result.slice(0, 45)) {
  console.log(
    `  ${String(a.pxW).padStart(8)}  ${String(a.pxW).padStart(6)}px  ${a.naturalW}x${a.naturalH}`.padEnd(46) +
      `  ${a.path}  [${a.wheres.join(',')}]`
  );
}
