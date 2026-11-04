// 用 CDP screencast 抓「份量切换下坠动画」的真实帧（Playwright 截图有延迟，会错过前段）。
// 用法：node scripts/_dshot-size-frames.mjs <菜名> <输出前缀>
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const NAME = process.argv[2] ?? '牛油果鸡胸沙拉';
const PREFIX = process.argv[3] ?? 'scripts/sizeframe';

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

const cdp = await page.context().newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
  frames.push({ t: Date.now(), buf: Buffer.from(data, 'base64') });
  try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, everyNthFrame: 1 });

// 点「大份」，evaluate 返回的那一刻≈点击生效时刻（React 在事件任务内刷新，
// 动画从下一帧开始；evaluate 回传延迟 ~10ms，误差 ±15ms，对 500ms 的动画够用）
const found = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button, [role="button"], [role="radio"]')].find((b) => /超大碗|超大杯/.test(b.textContent ?? ''));
  if (!btn) return false;
  btn.click();
  return true;
});
const tClick = Date.now() - 10;
console.log('按钮命中:', found);
await page.waitForTimeout(750);
await cdp.send('Page.stopScreencast');

// 挑 5 帧：点击后 ~40/120/220/330/650ms
const want = [40, 120, 220, 330, 650];
let picked = 0;
for (const f of frames) {
  const dt = f.t - tClick;
  if (dt < 0 || dt > 700) continue;
  const target = want[picked];
  if (target === undefined) break;
  if (dt >= target - 12) {
    writeFileSync(`${PREFIX}-${target}ms.jpg`, f.buf);
    console.log(`帧 t≈${Math.round(dt)}ms -> ${PREFIX}-${target}ms.jpg`);
    picked++;
  }
}
console.log('总帧数:', frames.length, '已存:', picked);
await browser.close();
