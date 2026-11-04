import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = 'outputs/hot-badge';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 4 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
// LoadingScreen 覆盖层：循环点「跳过」直到它消失
for (let i = 0; i < 25; i++) {
  const n = await page.locator('[aria-label*="页面加载中"]').count();
  if (!n) break;
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim().startsWith('跳过'));
    b?.click();
  });
  await page.waitForTimeout(400);
}
await page.waitForTimeout(800);

const probe = async (label) =>
  page.evaluate((lb) => {
    const el = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === 'HOT');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    // 往上找最近的带背景色的祖先，判断压在什么底上
    let p = el.parentElement;
    let bg = 'transparent';
    while (p && bg === 'transparent') {
      const c = getComputedStyle(p).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)') bg = c;
      p = p.parentElement;
    }
    return {
      label: lb,
      color: cs.color,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      bg,
      rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
    };
  }, label);

const shotBadge = async (file) => {
  const el = page.locator('span', { hasText: /^HOT$/ }).first();
  const b = await el.boundingBox();
  await page.screenshot({
    path: `${OUT}/${file}`,
    clip: { x: Math.max(0, b.x - 10), y: Math.max(0, b.y - 10), width: b.width + 20, height: b.height + 20 },
  });
};

console.log('— 选中态（全部热卖，青柠底）—');
console.log(JSON.stringify(await probe('active'), null, 2));
await shotBadge('active.png');

// 侧栏整列 = 「全部热卖」按钮的父容器
const rail = page.locator('button', { hasText: '全部热卖' }).first().locator('xpath=..');
const railOk = (await rail.count()) > 0;
console.log('rail selector found:', railOk);
if (railOk) await rail.screenshot({ path: `${OUT}/rail-active.png` });

// 切到别的分类 → HOT 变未选中态（白底）
const other = page.locator('button', { hasText: '清爽沙拉' }).first();
if (await other.count()) {
  await other.click();
  await page.waitForTimeout(600);
  console.log('\n— 未选中态（白底）—');
  console.log(JSON.stringify(await probe('inactive'), null, 2));
  await shotBadge('inactive.png');
  if (railOk) await rail.screenshot({ path: `${OUT}/rail-inactive.png` });
}

await page.screenshot({ path: `${OUT}/menu.png` });
console.log(`\n截图 → ${OUT}`);
await browser.close();
