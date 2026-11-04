/** 抽卡页「全选」胶囊：未全选 = 白底，全选 = 青柠底 —— 截两种状态对照
 *  ⚠️ 不要用 pill.screenshot()：这颗胶囊所在的卡片有 filter/transform 祖先，
 *     元素级截图会截出错位背景（实测整片青柠）。改用整卡截图 + PIL 裁剪。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = process.argv[2] || 'outputs/select-all-pill';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.click('#nav-tab-gacha');
await page.waitForSelector('#unified-pantry-big-card', { timeout: 20000 });
await page.waitForTimeout(2000);

const card = page.locator('#unified-pantry-big-card');
await card.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

const bg = () => page.evaluate(() => getComputedStyle(document.querySelector('#btn-category-select-all-pill')).backgroundColor);

await card.screenshot({ path: `${OUT}/card-unselected.png` });
console.log('未全选 bg =', await bg());

await page.locator('#btn-category-select-all-pill').click();
await page.mouse.move(5, 5); // 移开鼠标，避免 hover 色干扰
await page.waitForTimeout(500);
await card.screenshot({ path: `${OUT}/card-selected.png` });
console.log('已全选 bg =', await bg(), '| 文案 =', await page.locator('#btn-category-select-all-pill').innerText());

await browser.close();
