/**
 * B 批（P1 对比度）改后实机截图。
 *
 * 关注点不是"有没有报错"，而是"字有没有变得太重"：
 * slate-400 → 500 只是加深一档，但落在 9–10px 的小字上，密度变化会被放大。
 * 所以每个页面截两块：整屏（看整体是否还透气）+ 局部放大（看小字是否糊成一片）。
 *
 * 用法：node scripts/shot-b-batch.mjs [输出目录]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = process.argv[2] ?? 'outputs/b-batch-shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
});

const waitFonts = async () => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(450);
};

/** 底部导航切页。用 #nav-tab-* 的 id，比按文案找稳（文案会变、id 不会）。 */
const goto = async (id) => {
  await page.click(`#nav-tab-${id}`);
  await page.waitForTimeout(700);
};

await page.goto(BASE, { waitUntil: 'commit' });
// ⚠️ 别点「跳过」：点它会让 overlay 卡在 finishing 态不卸载（实测）。
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 });
await waitFonts();

// ── 1. 首页：四宫格入口卡副标题 + 人气菜品卡 ────────────────────
// 注意：应用默认落地页是「点餐」，必须显式切到首页，否则截到的是菜单页。
await goto('home');
await waitFonts();
await page.screenshot({ path: `${OUT}/01-home-full.png` });
const cards = page.locator('#home-takeout-card').first();
if (await cards.count()) {
  const box = await cards.boundingBox();
  if (box) {
    await page.screenshot({
      path: `${OUT}/02-home-entry-cards.png`,
      clip: { x: 0, y: Math.max(0, box.y - 6), width: 430, height: 240 },
    });
  }
}
const popular = page.locator('#home-popular-dishes-section').first();
if (await popular.count()) {
  await popular.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  // 底部导航 fixed 压在裁切区下缘，会盖掉第二排卡片的描述与价格。
  // 只在这一张图里临时隐藏它（截的是内容，不是导航）。
  const navHidden = await page.evaluate(() => {
    const navs = [...document.querySelectorAll('nav')];
    navs.forEach((n) => (n.style.visibility = 'hidden'));
    return navs.length;
  });
  const box = await popular.boundingBox();
  if (box) {
    await page.screenshot({
      path: `${OUT}/03-home-dish-cards.png`,
      clip: { x: 0, y: Math.max(0, box.y), width: 430, height: Math.min(470, box.height) },
    });
  }
  if (navHidden) {
    await page.evaluate(() => {
      document.querySelectorAll('nav').forEach((n) => (n.style.visibility = ''));
    });
  }
}

// ── 2. 点餐页：外卖/自提未选中态、搜索胶囊、菜品卡 ─────────────
await goto('menu');
await waitFonts();
await page.screenshot({ path: `${OUT}/04-menu-full.png` });
await page.screenshot({
  path: `${OUT}/05-menu-top.png`,
  clip: { x: 0, y: 0, width: 430, height: 300 },
});

// ── 3. 订单页：tab 计数 + 时间戳 ────────────────────────────────
await goto('orders');
await waitFonts();
await page.screenshot({ path: `${OUT}/06-orders-full.png` });
await page.screenshot({
  path: `${OUT}/07-orders-cards.png`,
  clip: { x: 0, y: 180, width: 430, height: 460 },
});

// ── 4. 抽卡页：绿底说明文字 ────────────────────────────────────
await goto('gacha');
await waitFonts();
await page.screenshot({ path: `${OUT}/08-gacha-full.png` });

await browser.close();
console.log(`done -> ${OUT}`);
