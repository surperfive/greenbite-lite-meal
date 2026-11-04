/**
 * 「邀请好友」banner 三种青柠版本并排：用户手改色 / 归一化到 #caf55d / （参考）我的订单卡。
 * 用法：node scripts/compare-invite-color.mjs <用户版png> <归一版png> <参考卡jpg>
 * 输出：outputs/recolor/invite-color.png（按 382 宽渲染，2×）
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const [A, B, C] = process.argv.slice(2);
const OUT = 'outputs/recolor';
mkdirSync(OUT, { recursive: true });
const W = 382 * 2;

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

const res = await page.evaluate(async ([files, W]) => {
  const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; });
  const imgs = await Promise.all(files.map(load));
  const scaled = imgs.map((i) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = Math.round((i.height / i.width) * W);
    c.getContext('2d').drawImage(i, 0, 0, W, c.height);
    return c;
  });
  const labels = ['用户手改色  #C4F53A', '归一化到 #caf55d', '参考：我的订单卡（已归一化）'];
  const PAD = 16, GAP = 14, LAB = 30;
  const cw = Math.max(...scaled.map((s) => s.width));
  const ch = Math.max(...scaled.map((s) => s.height));
  const c = document.createElement('canvas');
  c.width = cw * 3 + PAD * 2 + GAP * 2;
  c.height = ch + LAB + PAD * 2;
  const g = c.getContext('2d');
  g.fillStyle = '#0f172a';
  g.fillRect(0, 0, c.width, c.height);
  g.font = '600 14px system-ui, sans-serif';
  scaled.forEach((s, k) => {
    const x = PAD + k * (cw + GAP);
    g.fillStyle = k === 1 ? '#a3e635' : '#94a3b8';
    g.fillText(labels[k], x, PAD + 18);
    g.drawImage(s, x, PAD + LAB, cw, ch);
  });
  return c.toDataURL('image/png');
}, [[b64(A), b64(B), b64(C)], W]);

const buf = Buffer.from(res.split(',')[1], 'base64');
writeFileSync(`${OUT}/invite-color.png`, buf);
console.log(`输出 ${OUT}/invite-color.png  ${(buf.length / 1024).toFixed(0)}KB`);
await browser.close();
