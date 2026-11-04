import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs'; import path from 'node:path';

const DIR = 'probe-out/video';
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  recordVideo: { dir: DIR, size: { width: 390, height: 844 } },
});
const p = await ctx.newPage();
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.locator('#nav-tab-gacha').click();
await p.waitForTimeout(2000);

// 关键：录制的最后 2.5s 就是「点击 → 掀盖 → 光溢出」这一段，
// 于是可以用 ffmpeg 的 -sseof 直接从尾部截取，不必知道视频里的绝对时间轴。
await p.locator('#btn-gacha-single').click();
await p.waitForTimeout(2500);

const videoPath = await p.video().path();
await ctx.close();
await b.close();

const dest = path.join(DIR, 'raw.webm');
fs.copyFileSync(videoPath, dest);
console.log('原始录制:', dest, (fs.statSync(dest).size / 1024).toFixed(0) + ' KB');
