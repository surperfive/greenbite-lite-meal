import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173/';
const OUT = 'outputs/align2';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const log = [];

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2700);

// —— 菜单页顶部三行 ——
const top = await page.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const pick = (kw, nth = 0) => {
    const els = [...document.querySelectorAll('span,button,div')].filter((d) => norm(d.textContent) === kw);
    const el = els[nth];
    if (!el) return null;
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const ink = rg.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { kw, inkL: +ink.left.toFixed(1), inkR: +ink.right.toFixed(1), boxL: +r.left.toFixed(1), boxR: +r.right.toFixed(1), pl: cs.paddingLeft };
  };
  return {
    rows: ['外卖', '静安寺旗舰店', '全部'].map((k) => pick(k)),
    chips: [...document.querySelectorAll('#filter-all-btn')].map((b) => {
      const r = b.getBoundingClientRect();
      return { id: b.id, boxL: +r.left.toFixed(1), boxR: +r.right.toFixed(1) };
    }),
  };
});
log.push('== 菜单顶部三行 ==');
top.rows.forEach((r) => r && log.push(`  ${r.kw}: ink L${r.inkL}  R${r.inkR}   box ${r.boxL}..${r.boxR}  pl${r.pl}`));
log.push(`  筛选胶囊: ${JSON.stringify(top.chips)}`);
log.push(`  左缘离散度: ${Math.max(...top.rows.map((r) => r.inkL)) - Math.min(...top.rows.map((r) => r.inkL))}px`);

// 整行胶囊右缘
const chipRow = await page.evaluate(() => {
  const bar = [...document.querySelectorAll('div')].find((d) => d.className.includes('overflow-x-auto') && d.className.includes('no-scrollbar'));
  if (!bar) return null;
  const kids = [...bar.children].map((c) => {
    const r = c.getBoundingClientRect();
    return { t: (c.textContent || '').trim().slice(0, 8), l: +r.left.toFixed(1), r: +r.right.toFixed(1) };
  });
  const br = bar.getBoundingClientRect();
  return { barR: +br.right.toFixed(1), scrollW: bar.scrollWidth, clientW: bar.clientWidth, kids };
});
log.push('== 筛选行 ==');
log.push(`  行盒右缘 ${chipRow.barR}  scrollW ${chipRow.scrollW} / clientW ${chipRow.clientW}`);
chipRow.kids.forEach((k) => log.push(`    ${k.l}..${k.r}  "${k.t}"`));

// —— 菜品卡：月售是否溢出 / 标签行 ——
const cards = await page.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const out = [];
  for (const el of document.querySelectorAll('span')) {
    const t = norm(el.textContent);
    if (!/^(1\.2万\+|9300\+|1\.5万\+|5400\+|2\.1万\+)$/.test(t)) continue;
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const ink = rg.getBoundingClientRect();
    const par = el.parentElement.getBoundingClientRect();
    out.push({ t, inkL: +ink.left.toFixed(1), inkR: +ink.right.toFixed(1), rowR: +par.right.toFixed(1), overflow: +(ink.right - par.right).toFixed(1) });
  }
  return out;
});
log.push('== 月售右缘 / 溢出 ==');
cards.forEach((c) => log.push(`  "${c.t}" ink ${c.inkL}..${c.inkR}  行右缘 ${c.rowR}  溢出 ${c.overflow}`));
const rights = [...new Set(cards.map((c) => c.inkR))];
log.push(`  右缘离散度: ${Math.max(...rights) - Math.min(...rights)}px  (值 ${rights.join(', ')})`);

await page.screenshot({ path: `${OUT}/after-menu.png` });
await page.screenshot({ path: `${OUT}/after-menu-top.png`, clip: { x: 0, y: 0, width: 390, height: 230 } });
await page.screenshot({ path: `${OUT}/after-menu-card.png`, clip: { x: 236, y: 230, width: 150, height: 250 } });

// —— 盲盒食材卡 ——
await page.click('#nav-tab-gacha', { force: true });
await page.waitForTimeout(2600);
const gh = await page.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const names = ['多汁圣女果', '羽衣甘蓝', '安格斯牛排'];
  const out = [];
  for (const n of names) {
    const el = [...document.querySelectorAll('h4')].find((d) => norm(d.textContent) === n);
    if (!el) continue;
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const ink = rg.getBoundingClientRect();
    const par = el.parentElement.getBoundingClientRect();
    out.push({ n, inkL: +ink.left.toFixed(1), boxL: +par.left.toFixed(1) });
  }
  return out;
});
log.push('== 盲盒菜名左缘 ==');
gh.forEach((g) => log.push(`  ${g.n}: ink ${g.inkL}  (槽 ${g.boxL})`));
log.push(`  离散度: ${Math.max(...gh.map((g) => g.inkL)) - Math.min(...gh.map((g) => g.inkL))}px`);

await page.screenshot({ path: `${OUT}/after-gacha.png` });
await page.screenshot({ path: `${OUT}/after-gacha-cards.png`, clip: { x: 20, y: 540, width: 350, height: 130 } });

fs.writeFileSync(`${OUT}/verify.txt`, log.join('\n'), 'utf8');
await browser.close();
console.log('done');
