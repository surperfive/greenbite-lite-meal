import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());

async function skip() {
  for (let i = 0; i < 26; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(200); }
    else await page.waitForTimeout(160);
  }
}

async function measure(tag) {
  const m = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const img = [...document.querySelectorAll('img')].find(i => i.src.includes('/dishes/standard/'));
    const hero = img ? img.closest('div.relative.w-full.flex-shrink-0') : null;
    const sheet = h1 ? h1.closest('div.flex-1.min-h-0.bg-white') : null;
    const sc = [...document.querySelectorAll('div')].find(d => d.className.includes('overflow-y-auto') && d.className.includes('overscroll-contain'));
    return {
      heroTop: hero ? +hero.getBoundingClientRect().top.toFixed(1) : null,
      heroBottom: hero ? +hero.getBoundingClientRect().bottom.toFixed(1) : null,
      heroH: hero ? +hero.getBoundingClientRect().height.toFixed(1) : null,
      imgTop: img ? +img.getBoundingClientRect().top.toFixed(1) : null,
      imgBottom: img ? +img.getBoundingClientRect().bottom.toFixed(1) : null,
      sheetTop: sheet ? +sheet.getBoundingClientRect().top.toFixed(1) : null,
      h1Top: h1 ? +h1.getBoundingClientRect().top.toFixed(1) : null,
      scrollTop: sc ? +sc.scrollTop.toFixed(1) : null,
    };
  });
  console.log(tag, JSON.stringify(m));
  return m;
}

const CASES = [
  ['yogurt', '希腊酸奶杯'],
  ['smoothie', '羽衣甘蓝酸奶昔'],
  ['sandwich', '金枪鱼三明治'],
];

for (const [slug, name] of CASES) {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await skip();
  await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1800);
  await skip();
  const card = page.locator(`text=${name}`).first();
  await card.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
  await page.waitForTimeout(400);
  await card.click().catch(() => {});
  await page.waitForSelector('h1', { timeout: 8000 });
  await page.waitForTimeout(1400);
  await skip();
  await page.waitForTimeout(700);

  await page.screenshot({ path: `scripts/_scrollfix/${slug}-0.png` });
  await measure(`${slug} top=0`);

  for (const y of [120, 260]) {
    await page.evaluate((dy) => {
      const sc = [...document.querySelectorAll('div')].find(d => d.className.includes('overflow-y-auto') && d.className.includes('overscroll-contain'));
      sc.scrollTop = dy;
    }, y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `scripts/_scrollfix/${slug}-${y}.png` });
    await measure(`${slug} top=${y}`);
  }
}

await browser.close();
