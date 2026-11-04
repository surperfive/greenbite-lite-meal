import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 920, height: 400 }, deviceScaleFactor: 8 });
await p.setContent(`<!doctype html><html><body style="margin:0;background:#fff">
<svg viewBox="650 58 82 34" width="880" height="365">
  <path fill="#FC5294" fill-opacity="0.16" stroke="#111" stroke-width="0.3"
        d="M650.5,22 H770.5 A16,16 0 0 1 786.5,38 V53 A16,16 0 0 1 770.5,69 H690
           C681,69 672,74.5 660,81
           C663,76.5 674,69 668,69
           H650.5 A16,16 0 0 1 634.5,53 V38 A16,16 0 0 1 650.5,22 Z"/>
</svg></body></html>`);
await p.waitForTimeout(300);
await p.screenshot({ path: 'scripts/_shots/bubble-diag.png' });
await b.close(); console.log('ok');
