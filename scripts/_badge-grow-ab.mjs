import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);
await page.click('#btn-header-info');
await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
await page.waitForTimeout(900);

// 四档：贴纸尺寸 / 圆角 / 高光内缩 / 图标尺寸
const cases = [
  { k: 'A', w: 60, h: 52, r: 19, icon: 26, label: '60x52 · icon26 (当前)' },
  { k: 'B', w: 60, h: 52, r: 19, icon: 30, label: '60x52 · icon30' },
  { k: 'C', w: 66, h: 57, r: 21, icon: 30, label: '66x57 · icon30' },
  { k: 'D', w: 70, h: 60, r: 22, icon: 32, label: '70x60 · icon32' },
];
for (const c of cases) {
  const box = await page.evaluate((c) => {
    const badge = document.querySelector('[role="dialog"] .z-20.pointer-events-none.absolute');
    badge.style.width = c.w + 'px';
    badge.style.height = c.h + 'px';
    badge.style.borderRadius = c.r + 'px';
    const hl = badge.querySelector('span[aria-hidden="true"]');
    hl.style.inset = '3.4px';
    hl.style.borderRadius = (c.r - 4) + 'px';
    const svg = badge.querySelector('svg');
    svg.style.width = c.icon + 'px';
    svg.style.height = c.icon + 'px';
    const r = badge.getBoundingClientRect();
    // 带上卡片左上角，看与卡片的关系
    return { x: r.x - 10, y: r.y - 10, width: r.width + 150, height: r.height + 40 };
  }, c);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `scripts/_shots/grow-${c.k}.png`, clip: box });
  console.log(c.k, c.label);
}
await browser.close();
