import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

/* 输出「页面级行」结构：把每个 y 带（±8px）里墨迹左缘最小的若干元素，
   连同它的祖先链（限制 5 层）一起打印，用于判断谁是行首、在什么容器里。 */
const dump = async (label, yMin, yMax) => {
  const d = await page.evaluate(
    ({ yMin, yMax }) => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const t = norm(n.textContent);
        if (!t) continue;
        const el = n.parentElement;
        const r = el.getBoundingClientRect();
        const cy = (r.top + r.bottom) / 2;
        if (cy < yMin || cy > yMax) continue;
        if (r.width < 1 || r.bottom < 0 || r.top > 844) continue;
        const rg = document.createRange();
        rg.selectNodeContents(el);
        const ink = rg.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const chain = [];
        let p = el;
        for (let i = 0; i < 5 && p && p !== document.body; i++) {
          const pr = p.getBoundingClientRect();
          chain.push(
            `${p.tagName.toLowerCase()}(${Math.round(pr.left)},w${Math.round(pr.width)},pl${getComputedStyle(p).paddingLeft},${(p.className || '').toString().slice(0, 46)})`
          );
          p = p.parentElement;
        }
        out.push({
          t: t.slice(0, 18),
          inkL: Math.round(ink.left * 10) / 10,
          inkR: Math.round(ink.right * 10) / 10,
          cy: Math.round(cy),
          boxL: Math.round(r.left),
          fs: cs.fontSize,
          chain,
        });
      }
      return out.sort((a, b) => a.cy - b.cy || a.inkL - b.inkL);
    },
    { yMin, yMax }
  );
  return { label, d };
};

const res = [];
res.push(await dump('menu-top', 50, 220));
fs.writeFileSync('outputs/align2/_dump.json', JSON.stringify(res, null, 1), 'utf8');
await browser.close();
console.log(res[0].d.length);
