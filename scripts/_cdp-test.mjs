/** 实验 v3：page.screenshot({clip, scale:'device'}) 的速度与分辨率。 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const jpegSize = (b) => {
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return `${b.readUInt16BE(i + 7)}x${b.readUInt16BE(i + 5)}`;
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return '?';
};

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

const clip = { x: 331, y: 299, width: 48, height: 48 }; // 加号按钮 + pad
const N = 40;
const t0 = Date.now();
let first = null;
for (let i = 0; i < N; i++) {
  const buf = await page.screenshot({ clip, scale: 'device', type: 'jpeg', quality: 92 });
  if (i === 0) first = jpegSize(buf);
}
const dur = Date.now() - t0;

fs.writeFileSync(
  'outputs/_cdp-test/meta3.json',
  JSON.stringify(
    {
      dpr: 3,
      clipCss: clip,
      张数: N,
      总耗时ms: dur,
      单张ms: +(dur / N).toFixed(1),
      可达fps: +(1000 / (dur / N)).toFixed(1),
      输出尺寸: first,
    },
    null,
    2
  ),
  'utf8'
);

await browser.close();
