/**
 * 诊断：订单卡右侧「实付 ¥xx」相对左侧文字块的垂直对齐。
 *
 * 为什么不用肉眼判断：这一行是 `items-center`，价格块和「标题 + 时间戳」两行文字
 * 是**几何居中**关系，但价格数字 19px 且 font-black，墨迹重心天然偏上。
 * 盒子中心对齐 ≠ 视觉重心对齐，差 1–3px 时肉眼只会觉得"怪"，说不出差多少。
 * 所以这里同时量两套：DOM 盒子中心（布局真相）+ 像素墨迹中心（视觉真相）。
 *
 * 用法：node scripts/_diag-price-align.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/diag-price-align';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
});

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
// ⚠️ 不要 `document.querySelector('#app-loading-screen').remove()` ——
//    Loader 是 React 组件，删掉 DOM 节点只会让它在下一次重渲染时重新挂回来，
//    结果是"明明 detached 了，截图还是满屏青柠渐变"。只能等它自己 finish 并卸载。
await page.click('#nav-tab-orders');
await page.waitForTimeout(1200);
const loaderAlive = await page.evaluate(() => !!document.querySelector('#app-loading-screen'));
if (loaderAlive) console.error('!! loader 仍然在场，截图会拍到遮罩');

const data = await page.evaluate(() => {
  // ⚠️ 结构是：div.flex.items-end.translate-y-* > [实付 span, div.text-[#FC259B] > span,span]
  //    querySelector 命中的是内层 div（带颜色类），它的**父级**才是那个带位移的价格容器。
  //    取 parentElement.parentElement 会拿到外层的 62px 缩略图行，位移和高度全错。
  const priceColorDiv = document.querySelector('[class*="FC259B"]');
  if (!priceColorDiv) return { error: 'price not found' };

  const priceBox = priceColorDiv.parentElement;           // div.flex.items-end（含 实付 + 金额）
  const priceRow = priceBox.parentElement;               // div.flex.items-center（含缩略图 + 文字 + 价格）
  const card = priceBox.closest('div[class*="bg-white"]');
  const leftCol = card.querySelector('div.flex-1.min-w-0');
  const title = leftCol?.querySelector('p');
  const meta = leftCol?.querySelectorAll('p')[1];

  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: +b.top.toFixed(2), bottom: +b.bottom.toFixed(2), h: +b.height.toFixed(2), cy: +(b.top + b.height / 2).toFixed(2) };
  };

  const cs = getComputedStyle(priceBox);
  return {
    cardBox: r(card),
    priceRow: r(priceRow),
    priceBox: r(priceBox),
    priceBoxClass: priceBox.className,
    titleBox: r(title),
    metaBox: r(meta),
    leftTextBlock: meta
      ? { top: +title.getBoundingClientRect().top.toFixed(2), bottom: +meta.getBoundingClientRect().bottom.toFixed(2) }
      : null,
    transform: cs.transform,
    translateY: cs.translate,
    priceColor: getComputedStyle(priceColorDiv).color,
    metaColor: meta ? getComputedStyle(meta).color : null,
    metaFontSize: meta ? getComputedStyle(meta).fontSize : null,
  };
});

console.log(JSON.stringify(data, null, 2));

// 截视口（不裁），像素分析在后面用 PIL 做。
// ⚠️ 不要用 getBoundingClientRect 的结果直接喂 clip —— 它是**视口坐标**，
//    clip 要的是**文档坐标**，页面一滚动就错位（第一次就截到了一片青柠渐变）。
await page.screenshot({ path: `${OUT}/viewport.png` });

await browser.close();
