import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
await page.goto('http://localhost:5180/mascot-avatar.svg', { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: 'scripts/_shots/_avatar-400.png' });
await browser.close();
console.log('ok');
