// 实测「份量切换的下坠动画」：打开详情页 → 等 dropEnabled(520ms) 过 → 点「大份」→ 连拍 5 帧。
// 验证点：① 任一瞬间画面里只有一张食物图（不能两张同屏）；② 新图从 hero 上沿外坠入。
// 用法：node scripts/_dshot-size.mjs <菜名> <输出前缀>
import { chromium } from 'playwright';

const NAME = process.argv[2] ?? '牛油果鸡胸沙拉';
const PREFIX = process.argv[3] ?? 'scripts/sizedrop';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 3 });
await page.goto('http://localhost:5180/', { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
} catch {}
await page.waitForTimeout(1200);

await page.evaluate((n) => {
  const els = [...document.querySelectorAll('*')].filter(
    (e) => e.children.length === 0 && e.textContent.trim() === n
  );
  els[0]?.closest('.group')?.querySelector('[data-dish-thumb]')?.click();
}, NAME);
try {
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 10000 });
} catch {}
// 等 dropEnabled 的 520ms 过了再切，否则内层 initial=false 不播动画
await page.waitForTimeout(900);

// 点「大份」：分量规格里文案含「超大碗」或「超大杯」的那一行
const clicked = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button, [role="button"], [role="radio"]')].find((b) =>
    /超大碗|超大杯/.test(b.textContent ?? '')
  );
  if (!btn) return false;
  btn.click();
  return true;
});
console.log('clicked large:', clicked);

// 连拍：0 / 60 / 120 / 200 / 400ms（下坠约 190ms 落定）
for (const t of [0, 60, 120, 200, 400]) {
  if (t > 0) await page.waitForTimeout(t === 60 ? 60 : t - (t === 120 ? 60 : t === 200 ? 120 : 200));
  await page.screenshot({ path: `${PREFIX}-${t}ms.png`, clip: { x: 0, y: 0, width: 430, height: 340 } });
  // 同时数一下 hero 里有几张食物图（必须恒为 1：不能两张同屏；背景图不算）
  const n = await page.evaluate(() => {
    const hero = document.querySelector('h1')
      ?.closest('.rounded-t-\\[24px\\]')
      ?.parentElement?.previousElementSibling;
    return hero ? [...hero.querySelectorAll('img')].filter((i) => /\/dishes\//.test(i.src)).length : -1;
  });
  console.log(`t=${t}ms  hero 实拍图张数: ${n}`);
}
await browser.close();
