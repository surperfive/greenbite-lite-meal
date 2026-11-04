/**
 * 量点餐页顶部各行的左/右边界，找出「没对齐」的那一行。
 * 用户反馈：「水平对齐，注意整体小程序，都要对齐」——先拿数字，不靠眼估。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const D = 'outputs/align';
fs.mkdirSync(D, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2700);

const rows = await page.evaluate(() => {
  const out = [];
  const push = (label, el) => {
    if (!el) return out.push({ label, missing: true });
    const r = el.getBoundingClientRect();
    out.push({
      label,
      left: Math.round(r.left * 10) / 10,
      right: Math.round(r.right * 10) / 10,
      top: Math.round(r.top),
      h: Math.round(r.height),
    });
  };

  const find = (txt, tag = 'button') =>
    [...document.querySelectorAll(tag)].find((b) => (b.innerText || b.textContent || '').trim().includes(txt));

  // 第一行：外卖 / 自提 分段器（整块，含外层圆角容器）
  const seg = find('外卖');
  push('分段器·外卖', seg);
  push('分段器·自提', find('自提'));

  // 第二行：搜索胶囊（MenuPage 里 cursor-pointer rounded-full）
  const search = [...document.querySelectorAll('div')].find(
    (d) => typeof d.className === 'string' && d.className.includes('cursor-pointer') && d.className.includes('rounded-full')
  );
  push('搜索胶囊', search);

  // 第三行：门店行
  push('门店名', find('距您', 'button'));
  push('切换', find('切换'));

  // 第四行：筛选
  push('筛选·全部', document.getElementById('filter-all-btn'));
  push('筛选·≤250', find('≤250'));

  // 各行的实际 padding（读父级容器）
  const pads = [];
  for (const el of [seg, search, find('切换'), document.getElementById('filter-all-btn')]) {
    if (!el) continue;
    let p = el;
    for (let i = 0; i < 4; i++) {
      p = p.parentElement;
      if (!p) break;
      const cs = getComputedStyle(p);
      if (parseFloat(cs.paddingLeft) > 0) {
        pads.push({ cls: String(p.className).slice(0, 60), pl: cs.paddingLeft, pr: cs.paddingRight, w: Math.round(p.getBoundingClientRect().width) });
        break;
      }
    }
  }

  return { rows: out, pads, docScrollW: document.documentElement.scrollWidth };
});

await page.screenshot({ path: `${D}/menu-top.png`, clip: { x: 0, y: 100, width: 390, height: 160 } });
await browser.close();
fs.writeFileSync(`${D}/menu-top.json`, JSON.stringify(rows, null, 2), 'utf8');
