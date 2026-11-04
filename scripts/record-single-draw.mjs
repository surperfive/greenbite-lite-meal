/**
 * 录制单抽动画，并打印「食材库」在抽卡前后的顺序，用于验证
 * 「新食材插到最前、已有食材整体后移一位」。
 * 用法：node scripts/record-single-draw.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { BASE } from './_base.mjs';

const DIR = 'probe-out/single-draw';
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

/** 读取食材库网格里卡片的顺序与坐标 */
const readPantry = (page) =>
  page.evaluate(() => {
    const cards = [...document.querySelectorAll('#unified-pantry-big-card .grid > [class*="aspect-square"]')];
    return cards.map((el, i) => {
      const r = el.getBoundingClientRect();
      const name = el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 22) ?? '';
      return { i, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), name };
    });
  });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2,
  recordVideo: { dir: DIR, size: { width: 420, height: 900 } }
});
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);

const before = await readPantry(page);
console.log('抽卡前食材库：');
before.forEach((c) => console.log(`  [${c.i}] (${c.x},${c.y}) ${c.name}`));

await page.click('#btn-gacha-single');
await page.waitForTimeout(4200);

const after = await readPantry(page);
console.log('\n抽卡后食材库：');
after.forEach((c) => console.log(`  [${c.i}] (${c.x},${c.y}) ${c.name}`));

const videoPath = await page.video().path();
await ctx.close();
await browser.close();

const raw = path.join(DIR, 'raw.webm');
fs.copyFileSync(videoPath, raw);

const FF = ['C:/Program Files/ffmpeg/bin/ffmpeg.exe', 'C:/ffmpeg/bin/ffmpeg.exe', 'ffmpeg'].find(
  (p) => p === 'ffmpeg' || fs.existsSync(p)
);
const mp4 = path.join(DIR, 'single-draw.mp4');
try {
  execFileSync(FF, ['-y', '-i', raw, '-r', '60', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], {
    stdio: 'ignore'
  });
  console.log('\n输出:', mp4);
} catch {
  console.log('\nffmpeg 转换失败，保留', raw);
}
