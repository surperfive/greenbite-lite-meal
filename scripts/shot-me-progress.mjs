/** 「我的」页头像区黑胶囊量表（积分进度条）特写 + 白环实测
 *  用法：node scripts/shot-me-progress.mjs [壳宽，默认 390]
 *
 *  ⚠️ 品牌过场（`#app-loading-screen.brand-loader`）踩坑记录：
 *     1. 不能一上来 `waitForSelector('.brand-loader', {state:'detached'})` ——
 *        loader 是挂载后才插入的，那一刻还不存在，detached 会立刻假成功，
 *        后面点 nav 全点在遮罩上，截出来是一片青柠渐变；
 *     2. 也别 `remove()` 摘遮罩 —— 过场期间应用是 inert/隐藏的，摘掉只剩空白；
 *     3. 正解：**用 DOM 直接 click 遮罩根节点**（它自己带 onClick → finish()），
 *        比点「跳过」稳（后者会被 disabled={finishing} 或层叠命中挡住）。 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const W = Number(process.argv[2] || 390);
const OUT = 'outputs/me-progress';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: W, height: 932 }, deviceScaleFactor: 3 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-me', { state: 'visible', timeout: 30000 });
await page.waitForTimeout(1200);

/** 用 className 子串判断（避免给 bg-[#070906] 写 CSS 转义），不走 reload 重试 */
for (let i = 0; i < 8; i++) {
  await page.evaluate(() => document.querySelector('#nav-tab-me')?.click());
  try {
    await page.waitForFunction(
      () => [...document.querySelectorAll('div')].some(
        (d) => typeof d.className === 'string'
          && d.className.includes('h-[10px]') && d.className.includes('070906'),
      ),
      { timeout: 2500 },
    );
    break;
  } catch {
    await page.waitForTimeout(400);
  }
}

/** ⚠️ 遮罩必须在**切完页之后**再按掉：切页时品牌过场会重新播一遍，
 *  在切页前按掉等于白按（上一版就是这么截出一片青柠渐变的）。 */
for (let i = 0; i < 12; i++) {
  if ((await page.locator('#app-loading-screen').count()) === 0) break;
  await page.evaluate(() => document.getElementById('app-loading-screen')?.click());
  await page.waitForTimeout(600);
}
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);


const info = await page.evaluate(() => {
  // 量表 = 头像区那颗 h-10px 的黑胶囊（全站唯一带 ring 的那颗）
  const bar = [...document.querySelectorAll('div')].find(
    (d) => typeof d.className === 'string'
      && d.className.includes('h-[10px]') && d.className.includes('070906'),
  );
  if (!bar) return null;
  const cs = getComputedStyle(bar);
  const r = bar.getBoundingClientRect();
  const inner = bar.firstElementChild.getBoundingClientRect();
  return {
    box: { w: +r.width.toFixed(2), h: +r.height.toFixed(2), x: +r.x.toFixed(2), y: +r.y.toFixed(2) },
    padding: cs.padding,
    boxShadow: cs.boxShadow,
    inner: { w: +inner.width.toFixed(2), h: +inner.height.toFixed(2) },
    innerFill: getComputedStyle(bar.firstElementChild).backgroundColor,
    /** 遮罩是否真的没了 —— 否则截图是假的 */
    loaderLeft: document.querySelectorAll('#app-loading-screen').length,
  };
});
console.log(JSON.stringify(info, null, 1));

const clip = info
  ? { x: Math.max(0, info.box.x - 16), y: Math.max(0, info.box.y - 16), width: Math.min(W, info.box.w + 96), height: info.box.h + 32 }
  : { x: 0, y: 0, width: W, height: 200 };
await page.screenshot({ path: `${OUT}/bar-${W}.png`, clip });
await page.screenshot({ path: `${OUT}/header-${W}.png`, clip: { x: 0, y: 0, width: W, height: 190 } });
await browser.close();
