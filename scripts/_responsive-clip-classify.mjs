/** 区分「有意省略号」和「真溢出（无 ellipsis，字被切掉）」 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const WIDTHS = [320, 360, 375, 390, 410];
const TABS = ['home','menu','orders','me','gacha'];
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(400);
  const out = [];
  for (const t of TABS) {
    if (!(await page.$(`#nav-tab-${t}`))) continue;
    await page.click(`#nav-tab-${t}`);
    await page.waitForTimeout(650);
    const r = await page.evaluate(() => {
      const stage = document.getElementById('app-page-stage');
      const hard = [], ell = [];
      for (const el of stage.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue;
        if (!(el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && el.children.length === 0)) continue;
        const item = { t: (el.textContent||'').slice(0,16), sw: el.scrollWidth, cw: el.clientWidth };
        // 有 ellipsis（自身或裁剪祖先）= 有意省略
        let hasEll = cs.textOverflow === 'ellipsis';
        if (!hasEll) {
          let p = el.parentElement;
          for (let i=0;i<3&&p;i++){ if (getComputedStyle(p).textOverflow==='ellipsis'){hasEll=true;break;} p=p.parentElement; }
        }
        (hasEll ? ell : hard).push(item);
      }
      return { hard, ellCount: ell.length };
    });
    out.push({ t, ...r });
  }
  console.log(`\n=== ${w}px ===`);
  for (const r of out) {
    console.log(`  ${r.t.padEnd(7)} 有意省略=${r.ellCount}  真溢出=${r.hard.length}${r.hard.length?' '+JSON.stringify(r.hard.slice(0,3)):''}`);
  }
  await page.close();
}
await browser.close();
