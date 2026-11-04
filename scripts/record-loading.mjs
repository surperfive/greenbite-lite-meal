/**
 * 录制启动加载屏（LoadingScreen）的完整动效，输出 mp4 供设计评审。
 *
 * 加载屏在首屏渲染时立即出现，所以这里从 goto 开始录，
 * 录到加载屏退场后 0.5s 收尾（默认 duration=2400ms）。
 *
 * 用法：node scripts/record-loading.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { BASE } from './_base.mjs';

const DIR = 'probe-out/loading-video';
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

// 本机未安装 playwright 自带 chromium，直接用系统 Chrome
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2,
  recordVideo: { dir: DIR, size: { width: 420, height: 900 } }
});

const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });

// 等加载屏走完（1800ms 品牌开场 + 140ms 收笔 + 280ms 退场 + 余量）
await page.waitForTimeout(3400);

const videoPath = await page.video().path();
await ctx.close();
await browser.close();

const raw = path.join(DIR, 'raw.webm');
fs.copyFileSync(videoPath, raw);
console.log('原始录制:', raw, (fs.statSync(raw).size / 1024).toFixed(0) + ' KB');

// 用 ffmpeg 裁掉开头等首屏加载的空档，并转 mp4。
// -ss 的偏移量：录屏从 newContext 就开始，而页面加载完才会出现加载屏。
// 实测这段空档约 0.85s；偏移量可以用场景切换检测校准：
//   ffmpeg -i raw.webm -vf "select='gt(scene,0.02)',showinfo" -f null -
// 第一条 pts_time 就是加载屏出现的时刻。改设备/网络后需重新校准。
const TRIM_START = process.env.TRIM_START ?? '1.1';
const TRIM_DURATION = process.env.TRIM_DURATION ?? '2.6';
// ffmpeg 不在 PATH 里，按常见安装位置探测
const FFMPEG_CANDIDATES = [
  process.env.FFMPEG_PATH,
  'C:/Program Files/ffmpeg/bin/ffmpeg.exe',
  'C:/ffmpeg/bin/ffmpeg.exe',
  'ffmpeg'
].filter(Boolean);
const ffmpeg = FFMPEG_CANDIDATES.find((p) => p === 'ffmpeg' || fs.existsSync(p));

const mp4 = path.join(DIR, 'loading.mp4');
try {
  execFileSync(
    ffmpeg,
    [
      '-y',
      '-ss', TRIM_START,
      '-i', raw,
      '-t', TRIM_DURATION,
      '-r', '60',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      mp4
    ],
    { stdio: 'inherit' }
  );
  console.log('输出 mp4:', mp4, (fs.statSync(mp4).size / 1024).toFixed(0) + ' KB');
} catch (e) {
  console.warn('ffmpeg 不可用或转换失败，保留 webm：', raw);
}
