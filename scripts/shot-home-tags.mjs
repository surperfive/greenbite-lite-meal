/**
 * 首页四卡标签：核对「主标签黑底金字 + 次标签白底黑字描边」是否四卡一致，并量尺寸。
 * 用法：node scripts/shot-home-tags.mjs
 * 输出：outputs/home-tags/
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/home-tags-white';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 60000 });
await page.waitForTimeout(700);
if (await page.locator('.brand-loader').count()) {
  await page.locator('.brand-loader__skip').click({ timeout: 5000 }).catch(() => {});
  await page.locator('.brand-loader').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}
await page.click('#nav-tab-home');
await page.waitForSelector('#home-takeout-card', { state: 'visible', timeout: 30000 });
await page.waitForTimeout(1200);

/**
 * 关键：切 tab / HMR 会让 LoadingScreen 再播一次（`.brand-loader` 重新挂载并盖在最上层）。
 * 截图前必须把它清掉，否则拍到的是 loading 页（DX 里 DOM 读取正常、肉眼却看到 logo）。
 */
const waitLoaderGone = async (label) => {
  for (let i = 0; i < 25; i++) {
    if (!(await page.locator('.brand-loader').count())) return;
    await page.locator('.brand-loader__skip').click({ timeout: 1200 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  console.log(`⚠️ ${label}: loading 层 20 次仍未被清掉`);
};

const rows = await page.evaluate(() => {
  const ids = ['home-takeout-card', 'home-pickup-card', 'home-benefit-card', 'home-gacha-card'];
  return ids.map((id) => {
    const card = document.getElementById(id);
    const wrap = card.querySelector('div.absolute.left-3\\.5');
    const spans = wrap ? [...wrap.querySelectorAll('span')] : [];
    return {
      id,
      tags: spans.map((s) => {
        const cs = getComputedStyle(s);
        const r = s.getBoundingClientRect();
        return {
          text: s.textContent.trim(),
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderTopWidth + ' ' + cs.borderTopColor,
          shadow: cs.boxShadow,
          w: +r.width.toFixed(1),
          h: +r.height.toFixed(1),
        };
      }),
    };
  });
});

console.log('=== 四卡标签实测 ===');
for (const r of rows) {
  console.log('\n' + r.id);
  for (const t of r.tags) {
    console.log(
      `  ${t.text.padEnd(6)} bg=${t.bg.padEnd(22)} color=${t.color.padEnd(22)} ${t.w}×${t.h}`
    );
    console.log(`         border=${t.border}  shadow=${t.shadow}`);
  }
}

// 网格特写
const grid = page.locator('#home-takeout-card').locator('xpath=../..');
await grid.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await waitLoaderGone('网格');

const diag = await page.evaluate(() => {
  const el = document.elementFromPoint(210, 300);
  return {
    loader: document.querySelectorAll('.brand-loader').length,
    topEl: el ? el.tagName + '.' + String(el.className || '').slice(0, 50) : null,
    topIsLoader: !!(el && el.closest && el.closest('.brand-loader')),
  };
});
console.log('\n截图前诊断:', JSON.stringify(diag));

const b = await grid.boundingBox();
console.log('grid box:', JSON.stringify(b));
await page.screenshot({
  path: `${OUT}/01-grid.png`,
  clip: { x: Math.max(0, b.x - 6), y: Math.max(0, b.y - 6), width: Math.min(420, b.width + 12), height: b.height + 12 },
});

// 单卡特写（2x 裁两行）
for (const id of ['home-takeout-card', 'home-gacha-card']) {
  const el = page.locator('#' + id);
  await el.scrollIntoViewIfNeeded();
  await waitLoaderGone(id);
  const eb = await el.boundingBox();
  await page.screenshot({
    path: `${OUT}/02-${id}.png`,
    clip: { x: eb.x - 4, y: eb.y - 4, width: eb.width + 8, height: eb.height + 8 },
  });
}

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await waitLoaderGone('整屏');
await page.screenshot({ path: `${OUT}/00-full.png` });
await browser.close();
console.log(`\n截图 → ${OUT}`);
