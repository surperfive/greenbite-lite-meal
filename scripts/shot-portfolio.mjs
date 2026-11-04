import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = pathToFileURL('outputs/作品集-细节优化.html').href;
const b = await chromium.launch({ executablePath: CHROME });
const p = await b.newPage({ viewport: { width: 1120, height: 1400 }, deviceScaleFactor: 1 });
await p.goto(url, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);

const report = await p.evaluate(() => {
  const figs = [...document.querySelectorAll('figure img')];
  return {
    figures: figs.length,
    broken: figs.filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src')),
    overflowing: [...document.querySelectorAll('.case, table')].filter(e => e.scrollWidth > e.clientWidth + 1).length,
  };
});
console.log(JSON.stringify(report));

await p.screenshot({ path: 'outputs/portfolio/_page-full.png', fullPage: true });

await p.locator('figure img').first().click();
await p.waitForTimeout(300);
const lbOpacity = await p.evaluate(() => getComputedStyle(document.getElementById('lb')).backgroundColor);
await p.screenshot({ path: 'outputs/portfolio/_lb-open.png' });
console.log('lb bg =', lbOpacity);

await b.close();
