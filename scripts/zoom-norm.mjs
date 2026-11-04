/**
 * 局部放大对照：指定素材的「原图 vs 归一化」，同一高度并排，用于查腐蚀/膨胀伪影。
 * 用法：node scripts/zoom-norm.mjs entry-pickup entry-gacha [高度=480]
 * 输出：outputs/entry-norm/zoom-<name>.png
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const names = process.argv.slice(2).filter((a) => !/^\d+$/.test(a));
const H = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) || 480);
const OUT = 'outputs/entry-norm';
mkdirSync(OUT, { recursive: true });

const b64 = (p) => `data:image/${p.endsWith('.png') ? 'png' : 'jpeg'};base64,${readFileSync(p).toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome' });

for (const name of names) {
  const page = await browser.newPage({ viewport: { width: 1500, height: H + 90 }, deviceScaleFactor: 1 });
  await page.setContent('<!doctype html><html><body style="margin:0;background:#0b1220"></body></html>');
  await page.evaluate(async ([orig, norm, H, name]) => {
    const host = document.createElement('div');
    host.style.cssText = 'display:flex;gap:14px;padding:10px;align-items:flex-end';
    document.body.appendChild(host);
    for (const [src, label] of [[orig, '原图'], [norm, '归一化']]) {
      const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const w = Math.round(H * img.width / img.height);
      const box = document.createElement('div');
      box.style.cssText = 'color:#e2e8f0;font:14px system-ui';
      box.innerHTML = `<div>${name} · ${label}</div>`;
      const c = document.createElement('canvas');
      c.width = w; c.height = H;
      c.style.cssText = `width:${w}px;height:${H}px;display:block;background:#fff`;
      box.appendChild(c);
      host.appendChild(box);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, H);
    }
  }, [b64(`public/${name}.jpg`), b64(`public/entry-norm/${name}.png`), H, name]);
  await page.waitForTimeout(250);
  const p = `${OUT}/zoom-${name}.png`;
  await page.screenshot({ path: p, fullPage: true });
  console.log(`输出：${p}`);
  await page.close();
}
await browser.close();
