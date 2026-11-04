/**
 * 录制十连抽的完整动画（含「食材飞入下栏」那一段），用于排查落点顺序问题。
 * 用法：node scripts/record-ten-draw.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { BASE } from './_base.mjs';

const DIR = 'probe-out/ten-draw';
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2,
  recordVideo: { dir: DIR, size: { width: 420, height: 900 } }
});
const page = await ctx.newPage();

// ⚠️ 不能用 domcontentloaded：本机 Vite dev 的某个模块请求会 hang，
// DOMContentLoaded 永不触发，goto 直接 30s 超时。用 commit + waitForSelector。
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);

await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);

// 记录飞行前的食材库卡片顺序（id + 屏幕位置），用于对照落点
const before = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('#unified-pantry-big-card .grid > [class*="aspect-square"]')];
  return cards.map((el, i) => {
    const r = el.getBoundingClientRect();
    const name = el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 20) ?? '';
    return { i, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), name };
  });
});
console.log('飞行前食材库卡片：');
before.forEach((c) => console.log(`  [${c.i}] (${c.x},${c.y}) ${c.name}`));

await page.click('#btn-gacha-ten');
await page.waitForTimeout(5200);

const videoPath = await page.video().path();
await ctx.close();
await browser.close();

const raw = path.join(DIR, 'raw.webm');
fs.copyFileSync(videoPath, raw);

const FF = ['C:/Program Files/ffmpeg/bin/ffmpeg.exe', 'C:/ffmpeg/bin/ffmpeg.exe', 'ffmpeg'].find(
  (p) => p === 'ffmpeg' || fs.existsSync(p)
);
const mp4 = path.join(DIR, 'ten-draw.mp4');
try {
  execFileSync(FF, ['-y', '-i', raw, '-r', '60', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], {
    stdio: 'ignore'
  });
  console.log('\n输出:', mp4, (fs.statSync(mp4).size / 1024).toFixed(0) + ' KB');
} catch {
  console.log('\nffmpeg 转换失败，保留', raw);
}
