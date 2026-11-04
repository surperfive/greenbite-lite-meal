/**
 * 全站扫「内容轨道」偏差：量五个页面里所有贴边元素，看左/右缘是否落在 12 / 378。
 * 用户要求「水平对齐，注意整体小程序，都要对齐」——先找出所有越界的，再统一。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const D = 'outputs/align';
fs.mkdirSync(D, { recursive: true });

const TARGET_L = 12;
const TARGET_R = 378;
const TOL = 1.5;

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const scan = async (tag) => {
  const res = await page.evaluate(
    ({ TARGET_L, TARGET_R, TOL }) => {
      const bad = [];
      const seen = new Set();
      for (const el of document.querySelectorAll('button, a[href], div, span, p, h3, h4, img')) {
        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 12) continue;
        if (r.top < 0 || r.top > 844) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) continue;
        // 只关心「贴边」的元素：左缘接近 12 或右缘接近 378
        const nearL = Math.abs(r.left - TARGET_L) < 24;
        const nearR = Math.abs(r.right - TARGET_R) < 24;
        if (!nearL && !nearR) continue;
        const dL = Math.round((r.left - TARGET_L) * 10) / 10;
        const dR = Math.round((r.right - TARGET_R) * 10) / 10;
        const offL = nearL && Math.abs(dL) > TOL;
        const offR = nearR && Math.abs(dR) > TOL;
        if (!offL && !offR) continue;

        const txt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18);
        const cls = typeof el.className === 'string' ? el.className.slice(0, 70) : '';
        const key = `${Math.round(r.left)}|${Math.round(r.right)}|${txt}`;
        if (seen.has(key)) continue;
        seen.add(key);
        bad.push({ tag: el.tagName.toLowerCase(), txt, cls, left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10, dL, dR });
      }
      return bad;
    },
    { TARGET_L, TARGET_R, TOL }
  );
  return { page: tag, count: res.length, items: res };
};

const out = [];
const go = async (tab) => {
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  if (tab) {
    await page.click(`#nav-tab-${tab}`, { force: true });
    await page.waitForTimeout(2400);
  }
  const s = await scan(tab || 'menu');
  // 每页再量一次「内容轨道的实际左右缘」——取页面里最靠左 / 最靠右的卡片容器
  s.track = await page.evaluate(() => {
    const cands = [...document.querySelectorAll('main div')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 300 && r.width < 390 && r.height > 40 && r.top > 60 && r.top < 800);
    if (!cands.length) return null;
    const lefts = cands.map((c) => Math.round(c.r.left));
    const rights = cands.map((c) => Math.round(c.r.right));
    lefts.sort((a, b) => a - b);
    rights.sort((a, b) => a - b);
    // 取众数（出现最多的那个值）
    const mode = (arr) => {
      const m = new Map();
      arr.forEach((v) => m.set(v, (m.get(v) || 0) + 1));
      return [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    };
    return { left: mode(lefts), right: mode(rights), samples: cands.length };
  });
  out.push(s);
  await page.screenshot({ path: `${D}/${tab || 'menu'}-after.png` });
};

for (const t of ['home', 'menu', 'gacha', 'orders', 'me']) await go(t);

await browser.close();
fs.writeFileSync(`${D}/scan.json`, JSON.stringify(out, null, 2), 'utf8');
fs.writeFileSync(
  `${D}/scan.txt`,
  out
    .map((p) => `===== ${p.page} (${p.count}) =====\n` + p.items.map((i) => `  L${i.left}/R${i.right} (ΔL${i.dL} ΔR${i.dR}) <${i.tag}> "${i.txt}"  ${i.cls}`).join('\n'))
    .join('\n\n'),
  'utf8'
);
