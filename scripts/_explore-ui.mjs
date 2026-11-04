/** 一次性侦察：逐 tab dump 所有 button 的 id / aria-label / 文案 / 位置，用于编排录制场景。 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2800);

const out = [];
const dump = async (label) => {
  const items = await page.evaluate(() => {
    const seen = [];
    for (const b of document.querySelectorAll('button,[role="button"],a[href]')) {
      const r = b.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < 0 || r.top > innerHeight) continue;
      seen.push({
        id: b.id || '',
        aria: b.getAttribute('aria-label') || '',
        title: b.getAttribute('title') || '',
        text: (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30),
        cls: (typeof b.className === 'string' ? b.className : '').slice(0, 60),
        x: Math.round(r.x + r.width / 2),
        y: Math.round(r.y + r.height / 2),
      });
    }
    return seen;
  });
  out.push(`\n===== ${label} ===== (${items.length})`);
  for (const it of items) {
    out.push(`  ${it.id ? '#' + it.id : ''} ${it.aria ? '[aria=' + it.aria + ']' : ''} "${it.text}" @${it.x},${it.y}`);
  }
};

await dump('menu(点餐)');
await page.click('#nav-tab-home');
await page.waitForTimeout(2400);
await dump('home(首页)');
await page.click('#nav-tab-gacha');
await page.waitForTimeout(2400);
await dump('gacha(十鲜盲盒)');
await page.click('#nav-tab-orders');
await page.waitForTimeout(2400);
await dump('orders(订单)');
await page.click('#nav-tab-me');
await page.waitForTimeout(2400);
await dump('me(我的)');

await browser.close();
fs.writeFileSync('outputs/_explore.txt', out.join('\n'), 'utf8');
