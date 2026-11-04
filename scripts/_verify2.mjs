import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173/';
const OUT = 'outputs/align2';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const log = [];

const go = async (tab) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2700);
  if (tab !== 'menu') {
    await page.click(`#nav-tab-${tab}`, { force: true });
    await page.waitForTimeout(2500);
  }
};

/* 首页四宫格：四个卡的盒子 */
await go('home');
const grid = await page.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const names = ['外卖配送', '到店自取', '福利中心', '十鲜盲盒'];
  const out = [];
  for (const n of names) {
    const sp = [...document.querySelectorAll('span')].find((d) => norm(d.textContent) === n);
    if (!sp) continue;
    let p = sp;
    for (let i = 0; i < 6 && p; i++) {
      const r = p.getBoundingClientRect();
      if (r.width > 150 && r.width < 200 && r.height > 80) {
        out.push({ n, x: +r.left.toFixed(1), w: +r.width.toFixed(1), r: +r.right.toFixed(1) });
        break;
      }
      p = p.parentElement;
    }
  }
  return out;
});
log.push('== 首页四宫格卡片 ==');
grid.forEach((g) => log.push(`  ${g.n}: ${g.x}..${g.r}  w=${g.w}`));
if (grid.length === 4) {
  log.push(`  左列宽 ${grid[0].w} / 右列宽 ${grid[1].w}  差 ${Math.abs(grid[0].w - grid[1].w).toFixed(1)}px`);
  log.push(`  左缘 12 轨偏差: ${grid[0].x} / ${grid[2].x}`);
}

/* 我的页：区块标题与右侧动作 */
await go('me');
const meRows = await page.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const out = [];
  for (const n of ['我的功能', '送礼品卡', '展开全部', '查看全部']) {
    const el = [...document.querySelectorAll('h3,span,button')].find((d) => norm(d.textContent) === n);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const ink = rg.getBoundingClientRect();
    // 动作组（含箭头）的右缘
    let grp = el;
    for (let i = 0; i < 3 && grp && grp.parentElement; i++) grp = grp.parentElement;
    const gr = grp.getBoundingClientRect();
    out.push({ n, inkL: +ink.left.toFixed(1), inkR: +ink.right.toFixed(1), boxL: +r.left.toFixed(1), boxR: +r.right.toFixed(1), grpR: +gr.right.toFixed(1) });
  }
  return out;
});
log.push('== 我的页区块头 ==');
meRows.forEach((m) => log.push(`  ${m.n}: ink ${m.inkL}..${m.inkR}  box ${m.boxL}..${m.boxR}`));

/* 订单页卡片：店名 / 状态 / 菜名 三行左缘 */
await go('orders');
const od = await page.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const out = [];
  for (const n of ['静安寺旗舰店', '骑手配送中 (预计12:45送达)', '牛油果鸡胸沙拉 ×1 + 金枪鱼三明治 ×1', '实付']) {
    const el = [...document.querySelectorAll('span')].find((d) => norm(d.textContent) === n);
    if (!el) continue;
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const r = el.getBoundingClientRect();
    const ink = rg.getBoundingClientRect();
    out.push({ n: n.slice(0, 8), inkL: +ink.left.toFixed(1), boxL: +r.left.toFixed(1) });
  }
  return out;
});
log.push('== 订单卡内左缘 ==');
od.forEach((o) => log.push(`  "${o.n}": ink ${o.inkL}  box ${o.boxL}`));

/* 每页横向溢出检查 */
const overflow = {};
for (const t of ['home', 'menu', 'gacha', 'orders', 'me']) {
  await go(t);
  overflow[t] = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth }));
}
log.push('== 横向溢出 ==');
Object.entries(overflow).forEach(([k, v]) => log.push(`  ${k}: doc ${v.docW} / body ${v.bodyW}`));

fs.writeFileSync(`${OUT}/verify2.txt`, log.join('\n'), 'utf8');
await browser.close();
console.log('done');
