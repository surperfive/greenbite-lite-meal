/**
 * 通用 HTML 截图校验（用于检查报告类页面的排版）。
 *
 * 用法：node scripts/_shot-html.mjs <html 相对路径> <输出目录> [文件名前缀]
 * 例：  node scripts/_shot-html.mjs outputs/audit-a11y-b/changes.html outputs/audit-a11y-b preview
 *
 * 会输出两张：`<prefix>-top.png`（首屏，看标题与首屏密度）、
 *            `<prefix>-full.png`（整页，看有没有溢出或断层）。
 * 用 file:// 打开，所以文档里的相对路径图片能正常加载。
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , htmlPath, outDir = 'outputs/_html-shot', prefix = 'shot'] = process.argv;
if (!htmlPath) {
  console.error('usage: node scripts/_shot-html.mjs <html> [outDir] [prefix]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(htmlPath)).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

await page.screenshot({ path: `${outDir}/${prefix}-top.png` });

const box = await page.evaluate(() => ({
  h: document.body.scrollHeight,
  w: document.body.scrollWidth,
}));
console.log(`scrollHeight=${box.h} scrollWidth=${box.w}`);

await page.screenshot({ path: `${outDir}/${prefix}-full.png`, fullPage: true });
await browser.close();
console.log(`done -> ${outDir}/${prefix}-*.png`);
