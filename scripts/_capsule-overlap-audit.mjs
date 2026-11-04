/**
 * 全局「··· | ⊙」小程序胶囊遮挡审计。
 * 做法：拿到 #mp-capsule 的 rect，遍历壳内所有元素，算矩形相交面积，
 * 只报「有直接文字 / 可交互 / svg」的叶子元素，避免一堆容器误报。
 *
 * 判定口径：相交面积 > 4px² 才算真遮挡（1~2px 是描边/阴影的取整误差）。
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const AREA_MIN = 4;
// 壳宽 = min(视口宽, 410)，用 VW 模拟窄窗（375 / 390）
const VW = Number(process.env.VW || 430);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: VW, height: 932 }, deviceScaleFactor: 2 });
console.log(`\n=== 视口宽 ${VW} ===`);
page.on('pageerror', (e) => console.log('!! pageerror', e.message));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2400);

async function audit(label) {
  const out = await page.evaluate((areaMin) => {
    const cap = document.getElementById('mp-capsule');
    if (!cap) return { error: '#mp-capsule 未找到' };
    const rect = cap.getBoundingClientRect();
    const res = [];
    document.querySelectorAll('*').forEach((el) => {
      if (el === cap || cap.contains(el) || el.contains(cap)) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      if (parseFloat(cs.opacity) === 0) return;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const ix = Math.min(r.right, rect.right) - Math.max(r.left, rect.left);
      const iy = Math.min(r.bottom, rect.bottom) - Math.max(r.top, rect.top);
      if (ix <= 0 || iy <= 0 || ix * iy < areaMin) return;
      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join('')
        .trim();
      const isSvg = el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'path';
      const isInteractive =
        ['BUTTON', 'A', 'INPUT'].includes(el.tagName) || el.hasAttribute('role') || el.hasAttribute('aria-label');
      if (!directText && !isSvg && !isInteractive) return;
      res.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        text: (directText || el.getAttribute('aria-label') || '').slice(0, 18),
        ix: +ix.toFixed(1),
        iy: +iy.toFixed(1),
        area: +(ix * iy).toFixed(0),
        el: `x${r.left.toFixed(0)} y${r.top.toFixed(0)} w${r.width.toFixed(0)} h${r.height.toFixed(0)}`,
      });
    });
    // 面积大的排前面
    res.sort((a, b) => b.area - a.area);
    return {
      capsule: `x${rect.left.toFixed(1)}~${rect.right.toFixed(1)} y${rect.top.toFixed(1)}~${rect.bottom.toFixed(1)} (${rect.width.toFixed(1)}×${rect.height.toFixed(1)})`,
      hits: res,
    };
  }, AREA_MIN);

  if (out.error) {
    console.log(`\n[${label}] ${out.error}`);
    return;
  }
  console.log(`\n[${label}] 胶囊 ${out.capsule}`);
  if (!out.hits.length) {
    console.log('  ✓ 无遮挡');
  } else {
    out.hits.slice(0, 8).forEach((h) => {
      console.log(
        `  ✗ <${h.tag}${h.id ? '#' + h.id : ''}> "${h.text}" 重叠 ${h.ix}×${h.iy}=${h.area}px²  [${h.el}]`
      );
    });
  }
}

// ⚠️ App 默认落在**点餐页**，必须先点首页 tab，否则第一格量到的是 menu
await page.click('#nav-tab-home');
await page.waitForTimeout(1400);
await audit('home');
await page.click('#nav-tab-menu');
await page.waitForTimeout(1200);
await audit('menu');
await page.click('#nav-tab-orders');
await page.waitForTimeout(1200);
await audit('orders');
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);
await audit('me');
await page.click('#nav-tab-gacha');
await page.waitForTimeout(2800);
await audit('gacha');

// 菜品详情
await page.click('#nav-tab-menu');
await page.waitForTimeout(1000);
const thumb = page.locator('[data-dish-thumb="true"]').first();
if (await thumb.count()) {
  await thumb.click();
  await page.waitForTimeout(1400);
  await audit('detail');
  const back = page.locator('[aria-label="返回"]').first();
  if (await back.count()) {
    await back.click();
    await page.waitForTimeout(900);
  }
} else {
  console.log('\n[detail] 没找到 data-dish-thumb，跳过');
}

// 购物车（订单页「再来一单」）
await page.click('#nav-tab-orders');
await page.waitForTimeout(1200);
const reorder = page.getByText('再来一单').first();
if (await reorder.count()) {
  await reorder.click();
  await page.waitForTimeout(1400);
  await audit('cart');
} else {
  console.log('\n[cart] 没找到「再来一单」，跳过');
}

await browser.close();
