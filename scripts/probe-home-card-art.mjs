/**
 * 校验 4 张入口卡：插画画布位置 + 按素材留白推算的内容边界，是否越出卡片；
 * 以及副标题右边界是否越过插画内容左边界。
 * 用法：node scripts/probe-home-card-art.mjs
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

// 各素材「非白内容」的四周留白（占画布比例），由抽帧/像素统计实测
const MARGIN = {
  '1b67bdaeb3b2740899ad324d0df7f544.png': { t: 0.171, b: 0.161, l: 0.083, r: 0.097 },
  'edd0acc180bfd09016dd25d86701cc17.png': { t: 0.033, b: 0.057, l: 0.067, r: 0.045 },
  '893.mp4': { t: 0.225, b: 0.260, l: 0.123, r: 0.156 },
  '891.mp4': { t: 0.242, b: 0.181, l: 0.169, r: 0.156 },
};

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);

const data = await page.evaluate(() =>
  [...document.querySelectorAll('[id^="home-"][id$="-card"]')].map((card) => {
    const cr = card.getBoundingClientRect();
    const art = card.lastElementChild.getBoundingClientRect();
    const p = card.querySelector('p');
    const pr = p.getBoundingClientRect();
    const media = card.querySelector('img,video');
    return {
      id: card.id,
      src: (media?.getAttribute('src') || '').split('/').pop(),
      card: { l: cr.left, t: cr.top, r: cr.right, b: cr.bottom },
      art: { l: art.left, t: art.top, r: art.right, b: art.bottom, w: art.width, h: art.height },
      sub: { l: pr.left, r: pr.right, t: pr.top, b: pr.bottom },
    };
  })
);

let bad = 0;
for (const d of data) {
  const m = MARGIN[d.src];
  if (!m) { console.log(`${d.id}: 未知素材 ${d.src}`); continue; }
  // 内容边界（视口坐标）
  const cl = d.art.l + m.l * d.art.w;
  const cr_ = d.art.r - m.r * d.art.w;
  const ct = d.art.t + m.t * d.art.h;
  const cb = d.art.b - m.b * d.art.h;
  const over = [];
  if (cl < d.card.l) over.push(`左越界 ${(d.card.l - cl).toFixed(1)}`);
  if (cr_ > d.card.r) over.push(`右越界 ${(cr_ - d.card.r).toFixed(1)}`);
  if (ct < d.card.t) over.push(`上越界 ${(d.card.t - ct).toFixed(1)}`);
  if (cb > d.card.b) over.push(`下越界 ${(cb - d.card.b).toFixed(1)}`);
  const textOverlap = d.sub.r - cl;
  if (over.length) bad++;
  console.log(
    `${d.id.padEnd(18)} 素材=${d.src.padEnd(38)} 画布=${d.art.w}x${d.art.h}  ` +
      `内容 x ${(cl - d.card.l).toFixed(0)}~${(cr_ - d.card.l).toFixed(0)} / y ${(ct - d.card.t).toFixed(0)}~${(cb - d.card.t).toFixed(0)}  ` +
      `(卡 ${(d.card.r - d.card.l).toFixed(0)}x${(d.card.b - d.card.t).toFixed(0)})  ` +
      `副标题右边界与内容左边界差 ${textOverlap.toFixed(1)}px ` +
      (over.length ? `❌ ${over.join(' / ')}` : '✓ 未越界')
  );
}

await browser.close();
console.log(bad ? `\n${bad} 张越界` : '\n全部未越界');
process.exit(bad ? 1 : 0);
