import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.SHEET_URL || 'http://127.0.0.1:5173/icon-sheet.html';
const out = path.resolve('outputs', 'greenbite-icon-sheet.png');

fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1200 },
  deviceScaleFactor: 2,
});

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(
    [...document.images].map((img) =>
      img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; })
    )
  );
});
await page.waitForTimeout(500);

const box = await page.evaluate(() => {
  const el = document.querySelector('.sheet');
  const r = el.getBoundingClientRect();
  return { width: Math.ceil(r.width), height: Math.ceil(r.height) };
});

await page.screenshot({ path: out, fullPage: true });

const stat = fs.statSync(out);
fs.writeFileSync(
  'outputs/icon-sheet-report.txt',
  [
    `url: ${url}`,
    `sheet css size: ${box.width} x ${box.height}`,
    `image: ${out}`,
    `image bytes: ${stat.size}`,
    `scale: 2x -> ${box.width * 2} x ${box.height * 2}`,
    `console errors: ${errors.length ? errors.join(' | ') : 'none'}`,
  ].join('\n'),
  'utf8'
);

await browser.close();
console.log('done', out, box);
