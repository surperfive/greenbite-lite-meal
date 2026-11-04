/** 量「获取抽卡币」弹窗：fixed 容器 vs 视口 vs 手机壳，确认是否居中 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-header-tokens', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(800);
await page.click('#btn-header-tokens');
await page.waitForTimeout(900);
const geo = await page.evaluate(() => {
  const h = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
  const card = h.closest('.rounded-\\[20px\\]');
  // 向上找 fixed 容器
  let el = card, fixedEl = null;
  while (el) {
    if (getComputedStyle(el).position === 'fixed') { fixedEl = el; break; }
    el = el.parentElement;
  }
  const fr = fixedEl?.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  // 视口 / 壳
  const stage = document.getElementById('app-page-stage');
  const shell = stage?.parentElement?.getBoundingClientRect();
  return {
    viewport: { w: innerWidth, h: innerHeight },
    shell: shell ? { y: +shell.y.toFixed(1), h: +shell.height.toFixed(1) } : null,
    fixedBox: fr ? { y: +fr.y.toFixed(1), h: +fr.height.toFixed(1), cls: fixedEl.className.slice(0, 60) } : null,
    card: { y: +cr.y.toFixed(1), h: +cr.height.toFixed(1) },
    gapTop: fr ? +(cr.y - fr.y).toFixed(1) : null,
    gapBottom: fr ? +(fr.bottom - cr.bottom).toFixed(1) : null,
    // 祖先里有没有 transform（会让 fixed 相对它定位）
    transformedAncestors: (() => {
      const out = [];
      let p = fixedEl?.parentElement;
      while (p && p !== document.body) {
        const cs = getComputedStyle(p);
        if (cs.transform !== 'none' || cs.filter !== 'none' || cs.willChange.includes('transform')) {
          out.push({ tag: p.tagName, id: p.id, cls: (p.className || '').toString().slice(0, 50), transform: cs.transform });
        }
        p = p.parentElement;
      }
      return out;
    })(),
  };
});
console.log(JSON.stringify(geo, null, 1));
await browser.close();
