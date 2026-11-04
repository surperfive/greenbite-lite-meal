import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 932 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await page.waitForTimeout(3000);
const dump = await page.evaluate(() => {
  const hit = [...document.querySelectorAll('button')].filter((b) => b.textContent?.trim() === '跳过');
  return hit.map((b) => ({
    cls: b.className,
    parentCls: b.parentElement?.className,
    grandCls: b.parentElement?.parentElement?.className,
    id: b.parentElement?.parentElement?.id,
    rect: b.getBoundingClientRect().toJSON(),
  }));
});
console.log('SKIP BUTTONS', JSON.stringify(dump, null, 1));
console.log('LOADERS', await page.locator('.brand-loader').count());
console.log('LOADING SCREEN', await page.locator('#app-loading-screen').count());
await page.locator('.brand-loader__skip').click({ timeout: 3000 }).catch((e) => console.log('CLICK ERR', e.message.slice(0, 80)));
await page.waitForTimeout(1200);
console.log('AFTER CLICK loader=', await page.locator('.brand-loader').count(), 'skip=', await page.getByText('跳过', { exact: true }).count());
await page.screenshot({ path: 'scripts/_shots/dbg-loader.png' });
await browser.close();
