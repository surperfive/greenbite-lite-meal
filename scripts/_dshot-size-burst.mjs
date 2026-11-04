// 紧连拍 hero（点「大份」后立刻连截 N 帧），帧的真实相位事后用像素相关反推。
// 用法：node scripts/_dshot-size-burst.mjs <菜名> <输出前缀> [张数]
import { chromium } from 'playwright';

const NAME = process.argv[2] ?? '牛油果鸡胸沙拉';
const PREFIX = process.argv[3] ?? 'scripts/sizeburst';
const N = Number(process.argv[4] ?? 10);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:5180/', { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
} catch {}
await page.waitForTimeout(1200);
await page.evaluate((n) => {
  const els = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim() === n);
  els[0]?.closest('.group')?.querySelector('[data-dish-thumb]')?.click();
}, NAME);
try { await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 10000 }); } catch {}
await page.waitForTimeout(900);

const hero = await page.evaluateHandle(() => {
  const card = document.querySelector('h1')?.closest('.rounded-t-\\[24px\\]')?.parentElement;
  return card?.previousElementSibling ?? null;
});

// 点「大份」后立刻连拍（不等 evaluate 返回）
const shot = page.evaluate(() => {
  const btn = [...document.querySelectorAll('button, [role="button"], [role="radio"]')].find((b) => /超大碗|超大杯/.test(b.textContent ?? ''));
  btn?.click();
});
const files = [];
for (let i = 0; i < N; i++) {
  const f = `${PREFIX}-${String(i).padStart(2, '0')}.png`;
  try { await (await hero.asElement()).screenshot({ path: f }); files.push(f); } catch {}
}
await shot;
console.log('连拍完成:', files.length, '张');
await browser.close();
