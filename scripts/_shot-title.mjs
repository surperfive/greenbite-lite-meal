/** 截图验证「食材图鉴」标题放大效果。 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const D = 'outputs/title-zoom';
fs.mkdirSync(D, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2800);
await page.click('#nav-tab-gacha', { force: true });
await page.waitForTimeout(2600);
await page.click('#btn-header-info', { force: true });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const card = document.getElementById('gacha-dex-modal');
  if (!card) return { found: false };
  const h3 = card.querySelector('h3');
  const cs = h3 ? getComputedStyle(h3) : null;
  const cr = card.getBoundingClientRect();
  const hr = h3 ? h3.getBoundingClientRect() : null;
  const body = card.querySelector('.gb-modal-scroll');
  return {
    found: true,
    card: { w: Math.round(cr.width), h: Math.round(cr.height), top: Math.round(cr.top) },
    title: { text: h3?.textContent, fontSize: cs?.fontSize, w: Math.round(hr.width), h: Math.round(hr.height) },
    scale: getComputedStyle(card.parentElement).transform,
    bodyOverflow: body ? body.scrollHeight - body.clientHeight : null,
  };
});

await page.screenshot({ path: `${D}/full.png` });
const card = await page.$('#gacha-dex-modal');
if (card) {
  const b = await card.boundingBox();
  await page.screenshot({
    path: `${D}/card.png`,
    clip: { x: b.x, y: b.y, width: b.width, height: Math.min(b.height, 320) },
  });
}

await browser.close();
fs.writeFileSync(`${D}/info.json`, JSON.stringify(info, null, 2), 'utf8');
