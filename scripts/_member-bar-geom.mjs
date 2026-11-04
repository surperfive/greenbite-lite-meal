/** 身份条内部几何：进度条右端 vs chevron 左端 vs 卡片内容右边界。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1600);

const r = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const b = bar.getBoundingClientRect();
  const cs = getComputedStyle(bar);
  // 进度条轨道 = 中间列里那个 h-4 的 overflow-hidden
  const track = [...bar.querySelectorAll('span')].find(
    (s) => s.className.includes('overflow-hidden') && s.className.includes('rounded-full')
  );
  const tb = track.getBoundingClientRect();
  const chev = bar.querySelector('svg.lucide-chevron-right');
  const cb = chev.getBoundingClientRect();
  const name = bar.querySelector('.truncate.text-\\[13\\.5px\\]') || null;
  const nb = name?.getBoundingClientRect() || null;
  const pill = bar.querySelector('.bg-\\[\\#070906\\].text-\\[\\#FDCF29\\]');
  const pb = pill?.getBoundingClientRect() || null;
  return {
    card: { l: +b.left.toFixed(2), r: +b.right.toFixed(2), h: +b.height.toFixed(2) },
    padRight: cs.paddingRight,
    track: { l: +tb.left.toFixed(2), r: +tb.right.toFixed(2), w: +tb.width.toFixed(2), h: +tb.height.toFixed(2) },
    chevron: { l: +cb.left.toFixed(2), r: +cb.right.toFixed(2), w: +cb.width.toFixed(2), h: +cb.height.toFixed(2) },
    trackToChevronGap: +(cb.left - tb.right).toFixed(2),
    trackRightVsContentRight: +(tb.right - (b.right - parseFloat(cs.paddingRight))).toFixed(2),
    name: nb ? { h: +nb.height.toFixed(2), fs: getComputedStyle(name).fontSize } : null,
    pill: pb ? { h: +pb.height.toFixed(2), w: +pb.width.toFixed(2) } : null,
    textBlockH: (() => {
      const col = bar.querySelector('.flex.min-w-0.flex-1.flex-col');
      return col ? +col.getBoundingClientRect().height.toFixed(2) : null;
    })(),
  };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
