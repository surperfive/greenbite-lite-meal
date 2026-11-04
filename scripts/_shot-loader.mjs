// 截加载页背景（验证颜色流动）：暂停所有动画，把动画时间分别拨到 0ms / 9500ms
// （光斑 A 周期 19s 的半程），截两张 → 并排即见颜色流动。
// 用法：node scripts/_shot-loader.mjs <outA.png> <outB.png>
import { chromium } from 'playwright';

const OUT_A = process.argv[2] ?? 'scripts/_loader-a.png';
const OUT_B = process.argv[3] ?? 'scripts/_loader-b.png';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 430, height: 900 },
  deviceScaleFactor: 2,
});
await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
await page.route('**://fonts.gstatic.com/**', (r) => r.abort());

await page.goto('http://localhost:5180/', { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { timeout: 20000 });
await page.waitForTimeout(350); // 只等入场动画稳一下（加载页 3.6s 安全退场，必须快）

const setTime = async (t) => {
  await page.evaluate((ms) => {
    document.getAnimations().forEach((a) => {
      // 只拨背景光斑（brand-aurora-*），Logo/进度条动画保持自然状态，
      // 否则全冻在 t=0 会把 opacity 入场的 Logo 藏起来、海浪进度条甩出胶囊。
      const name = a.animationName ?? '';
      if (!name.startsWith('brand-aurora')) return;
      a.pause();
      a.currentTime = ms;
    });
  }, t);
  await page.waitForTimeout(120);
};

const shot = async (out) => {
  const el = await page.$('.brand-loader');
  if (!el) throw new Error('brand-loader 已退场，截不到');
  await el.screenshot({ path: out });
  console.log(out);
};

await setTime(0);
await shot(OUT_A);
await setTime(620);
await shot(OUT_B);

await browser.close();
