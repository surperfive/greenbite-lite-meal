/** 响应式审计：多宽度下检查横向溢出 / 壳宽 / 关键元素越界 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const WIDTHS = [320, 360, 375, 390, 410, 430, 480, 640, 768, 1024, 1440];
const TABS = ['home', 'menu', 'orders', 'me', 'gacha'];
const browser = await chromium.launch({ channel: 'chrome' });

for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);

  const rows = [];
  for (const tab of TABS) {
    const ok = await page.$(`#nav-tab-${tab}`);
    if (!ok) continue;
    await page.click(`#nav-tab-${tab}`);
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const stage = document.getElementById('app-page-stage');
      const shell = stage?.parentElement;
      const sb = shell?.getBoundingClientRect();
      // 找所有越界（右缘超出壳）的元素
      const over = [];
      if (shell) {
        const shellRight = sb.right, shellLeft = sb.left;
        for (const el of stage.querySelectorAll('*')) {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) continue;
          if (b.right > shellRight + 1.5 || b.left < shellLeft - 1.5) {
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' || cs.overflow === 'hidden') continue;
            over.push({
              tag: el.tagName,
              cls: (el.className || '').toString().slice(0, 70),
              left: +b.left.toFixed(1), right: +b.right.toFixed(1), w: +b.width.toFixed(1),
            });
          }
        }
      }
      return {
        shellW: sb ? +sb.width.toFixed(1) : null,
        docScrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        overflowCount: over.length,
        sample: over.slice(0, 4),
      };
    });
    rows.push({ tab, ...r });
  }
  console.log(`\n=== ${w}px ===`);
  for (const r of rows) {
    console.log(`  ${r.tab.padEnd(7)} shell=${r.shellW} docScrollW=${r.docScrollW} innerW=${r.innerW} overflow=${r.overflowCount}${r.overflowCount ? ' ' + JSON.stringify(r.sample) : ''}`);
  }
  await page.close();
}
await browser.close();
