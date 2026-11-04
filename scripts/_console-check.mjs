import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
await page.goto(BASE, { waitUntil: 'commit', timeout: 30000 });
await page.waitForTimeout(18000);
const state = await page.evaluate(() => ({
  loader: !!document.querySelector('.brand-loader'),
  stage: document.getElementById('app-page-stage') ? getComputedStyle(document.getElementById('app-page-stage')).opacity : 'NO STAGE',
  bodyChildren: document.body.children.length,
  rootHtml: (document.getElementById('root')?.innerHTML || '').slice(0, 120),
})).catch(e => ({ evalError: String(e).slice(0, 150) }));
console.log(JSON.stringify({ errors: errors.slice(0, 8), state }, null, 1));
await page.screenshot({ path: 'scripts/_shots/console-state.png' });
await browser.close();
