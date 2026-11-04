/**
 * 量 / 拍详情页的两类浮动小标签（分量卡的金胶囊、主粮基底的黑/青柠胶囊）。
 *
 * 用法：
 *   node scripts/shot-detail-badges.mjs                       # 牛油果鸡胸沙拉
 *   node scripts/shot-detail-badges.mjs "冷萃燕麦拿铁"          # 饮品变体（标签文案更长）
 *
 * ⚠️ 每次运行只走一次「启动 → 点餐 → 详情」的流程。
 *    不要在同一个 page 里 `goto` 第二次 —— LoadingScreen 会重播，且「跳过」按钮点不干净，
 *    结果就是截到启动画面（踩过）。
 * ⚠️ 截图对象是**整个规格区块**（标题 + 卡片网格），不是网格本身：胶囊悬出卡片 10px，
 *    正好落在标题与卡片的 12px 间距里，截网格会把胶囊顶切掉；截区块才能一并看到
 *    「胶囊顶 ↔ 标题」和「胶囊底 ↔ 卡内标题」这两处呼吸是否还在。
 *    也别用 viewport clip —— 详情页是 fixed 覆盖层 + 内部滚动，clip 的 y 会被钳到 0，
 *    截出来是 hero 涂鸦（踩过两次）。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const DISH = process.argv[2] ?? '牛油果鸡胸沙拉';
const isDrink = DISH === '冷萃燕麦拿铁';
const slug = isDrink ? 'drink' : 'food';
const OUT = 'outputs/detail-badges';
mkdirSync(OUT, { recursive: true });

const LABEL = isDrink ? '限量联名杯·用完即止' : '超值大份·能量加倍';
const BASE_LABEL = isDrink ? 'IIAC铂金' : '主厨推荐';
const SIZE_TITLE = isDrink ? '杯型' : '份量规格';
const BASE_TITLE = isDrink ? '咖啡豆' : '主粮基底';

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 4 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

const freezeRaf = async () => {
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
};

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(1000);
await page.click('#nav-tab-menu');
await page.waitForTimeout(900);
await page.locator('div.cursor-pointer', { hasText: DISH }).first().click();
await page.waitForTimeout(1200);
await freezeRaf();

const probe = async (label) => {
  const data = await page.evaluate((label) => {
    const badge = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === label);
    if (!badge) return { text: label, missing: true };
    const card = badge.parentElement;
    const cs = getComputedStyle(badge);
    const b = badge.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const check = [...card.querySelectorAll('*')].find((el) => {
      const s = getComputedStyle(el);
      return s.position === 'absolute' && s.top === '6px' && s.right === '6px';
    });
    const ch = check?.getBoundingClientRect();
    return {
      text: label,
      fontSize: cs.fontSize,
      badgeH: +b.height.toFixed(1),
      badgeW: +b.width.toFixed(1),
      overhang: +(c.top - b.top).toFixed(1),
      cardW: +c.width.toFixed(1),
      rightGapToCardEdge: +(c.right - b.right).toFixed(1),
      checkGap: ch ? +(ch.left - b.right).toFixed(1) : null,
    };
  }, label);
  console.log(data);
  return data;
};

// 区块 = 标题 span → 标题行 div → section div
const sectionOf = (titleText) =>
  page.locator('span', { hasText: titleText }).first().locator('xpath=../..');

/**
 * ⚠️ 用 **clip 裁视口**，不要用 `locator.screenshot()`：详情页的 hero 是覆盖在滚动容器
 *    之上的图层，元素截图在滚动容器里裁出来的画面会错位 —— 拿铁那页会整块截成 hero 涂鸦
 *    （同一个脚本对沙拉却是对的，所以这个坑很隐蔽）。clip 只依赖 boundingBox + 视口像素。
 */
const shotSection = async (titleText, path) => {
  const sec = sectionOf(titleText);
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await sec.boundingBox();
  await page.screenshot({
    path,
    clip: { x: box.x - 2, y: box.y - 2, width: box.width + 4, height: box.height + 4 },
  });
};

console.log(`— ${DISH}：${SIZE_TITLE} —`);
await probe(LABEL);
await shotSection(SIZE_TITLE, `${OUT}/${slug}-01-size.png`);

console.log(`\n— ${DISH}：${BASE_TITLE} —`);
await probe(BASE_LABEL);
await shotSection(BASE_TITLE, `${OUT}/${slug}-02-base.png`);

await browser.close();
console.log(`\n截图 → ${OUT}`);
