import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

/* 输出：某个 y 范围内的所有文字，带最近 3 层祖先的盒坐标，用来判断"这一行属于哪个容器、容器内边距多少" */
const dumpRange = async (tab, yMin, yMax, tag) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  if (tab !== 'menu') {
    await page.click(`#nav-tab-${tab}`, { force: true });
    await page.waitForTimeout(2400);
  }
  return page.evaluate(
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
        const rg = document.createRange();
        rg.selectNodeContents(el);
        const ink = rg.getBoundingClientRect();
        const anc = [];
        let p = el.parentElement;
        for (let i = 0; i < 3 && p && p !== document.body; i++) {
          const pr = p.getBoundingClientRect();
          const cs = getComputedStyle(p);
          anc.push(`${Math.round(pr.left)}..${Math.round(pr.right)} pL${cs.paddingLeft} pR${cs.paddingRight} g${cs.gap}`);
          p = p.parentElement;
        }
        out.push(`${Math.round(cy)}  ink ${Math.round(ink.left * 10) / 10}..${Math.round(ink.right * 10) / 10}  "${t.slice(0, 16)}"  [${anc.join(' | ')}]`);
      }
      return out.sort();
    },
    { yMin, yMax }
  );
};

const res = {};
res.orders = await dumpRange('orders', 60, 300);
res.home = await dumpRange('home', 570, 640);
res.gacha = await dumpRange('gacha', 615, 660);

fs.writeFileSync('outputs/align2/_probe3.json', JSON.stringify(res, null, 1), 'utf8');
await browser.close();
console.log('ok');
