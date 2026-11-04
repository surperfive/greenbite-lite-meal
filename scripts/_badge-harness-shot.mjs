/**
 * 徽章黑描边：隔离台架截图（不依赖 dev server，直接 file:// 打开）
 * 输出 scripts/_shots/badge-outline.png + 黑边厚度逐点测量
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const file = 'file:///' + path.resolve('scripts/_badge-harness.html').replace(/\\/g, '/');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 460, height: 320 }, deviceScaleFactor: 4 });
await page.goto(file, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/badge-outline.png` });
console.log('尺寸', JSON.stringify(await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }))));
await browser.close();
