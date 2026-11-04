import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
const logs = [];
page.on('console', m => logs.push(`${m.type()}: ${m.text().slice(0, 120)}`));
page.on('pageerror', e => logs.push('PAGEERROR: ' + String(e).slice(0, 200)));
page.on('requestfailed', r => logs.push('REQFAIL: ' + r.url().split('/').pop()));
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(12000);
const info = await page.evaluate(() => ({
  body: [...document.body.children].map(c => `${c.tagName}#${c.id||''}.${(c.className||'').toString().slice(0,40)} len=${c.innerHTML.length}`),
  scripts: [...document.scripts].map(s => s.src.split('/').slice(-1)[0] || 'inline').slice(0, 10),
  readyState: document.readyState,
})).catch(e => ({ evalFail: String(e).slice(0, 120) }));
console.log(JSON.stringify({ info, logs: logs.slice(0, 12) }, null, 1));
await browser.close();
