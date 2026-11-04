import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

async function skip() {
  for (let i = 0; i < 26; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
    } else {
      await page.waitForTimeout(160);
    }
  }
}

await skip();
await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1800);
await skip();
const card = page.locator('text=牛油果鸡胸沙拉').first();
await card.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click().catch(() => {});
await page.waitForSelector('h1', { timeout: 8000 });
await page.waitForTimeout(1500);
await skip();
await page.waitForTimeout(900);

const probe = async (tag) => {
  const d = await page.evaluate(() => {
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), h: +b.height.toFixed(1) }; };
    const h1 = document.querySelector('h1');
    const food = [...document.querySelectorAll('img')].find(i => i.src.includes('/dishes/standard/') || i.src.includes('/dishes/large/'));
    let node = food, depth = 0, hero = null;
    while (node && depth < 7) {
      if (node.className && typeof node.className === 'string' && (node.className.includes('h-[220px]') || node.className.includes('h-[155px]'))) { hero = node; break; }
      node = node.parentElement; depth++;
    }
    const sheet = h1 ? h1.closest('div[class*="rounded-t-[24px]"]') : null;
    const sub = h1 && h1.parentElement ? h1.parentElement.querySelector('p') : null;
    return {
      hero: r(hero), food: r(food), h1: r(h1), sub: r(sub), sheet: r(sheet),
      scrolled: hero ? hero.className.includes('h-[155px]') : null,
      foodImg: food ? food.src.split('/').slice(-2).join('/') : null,
    };
  });
  console.log(tag, JSON.stringify(d));
};

await page.screenshot({ path: 'scripts/_scroll-top.png', clip: { x: 0, y: 0, width: 390, height: 300 } });
await probe('TOP     ');

await page.mouse.move(195, 640);
await page.mouse.wheel(0, 260);
await page.waitForTimeout(200);
await page.mouse.wheel(0, 180);
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/_scroll-down.png', clip: { x: 0, y: 0, width: 390, height: 300 } });
await probe('SCROLLED');

await browser.close();
