import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const probe = async (label, tab, fn) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  if (tab !== 'menu') {
    await page.click(`#nav-tab-${tab}`, { force: true });
    await page.waitForTimeout(2400);
  }
  const r = await fn();
  return { label, r };
};

/* 1. gacha 食材卡：R 徽章 / 名称 / kcal / 价格 的左缘与容器
 * 2. me 两个区块头的 trailing 动作右缘
 * 3. menu 菜品卡的评分行（8.0 / 标签 / 月售）
 */
const out = [];

out.push(
  await probe('gacha-card', 'gacha', () =>
    page.evaluate(() => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const cards = [...document.querySelectorAll('div')].filter((d) => {
        const r = d.getBoundingClientRect();
        return Math.round(r.width) > 85 && Math.round(r.width) < 130 && r.height > 90 && r.height < 140 && r.top > 480;
      });
      const res = [];
      for (const c of cards.slice(0, 4)) {
        const cr = c.getBoundingClientRect();
        const inner = [];
        const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
          const t = norm(n.textContent);
          if (!t) continue;
          const el = n.parentElement;
          const rg = document.createRange();
          rg.selectNodeContents(el);
          const ink = rg.getBoundingClientRect();
          const er = el.getBoundingClientRect();
          inner.push({
            t: t.slice(0, 12),
            inkL: Math.round(ink.left * 10) / 10,
            boxL: Math.round(er.left * 10) / 10,
            w: Math.round(er.width),
            pl: getComputedStyle(el).paddingLeft,
            cls: (el.className || '').toString().slice(0, 60),
          });
        }
        res.push({
          card: { x: Math.round(cr.left), y: Math.round(cr.top), w: Math.round(cr.width), h: Math.round(cr.height) },
          pad: getComputedStyle(c).padding,
          inner,
        });
      }
      return res;
    })
  )
);

out.push(
  await probe('me-section', 'me', () =>
    page.evaluate(() => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const res = [];
      for (const kw of ['我的功能', '送礼品卡', '展开全部', '查看全部']) {
        const els = [...document.querySelectorAll('span,button,div')].filter(
          (d) => norm(d.textContent) === kw && d.children.length === 0
        );
        for (const el of els) {
          const er = el.getBoundingClientRect();
          const rg = document.createRange();
          rg.selectNodeContents(el);
          const ink = rg.getBoundingClientRect();
          // 往上找最近的带背景的容器
          let box = el;
          let bgBox = null;
          for (let i = 0; i < 6 && box; i++) {
            const cs = getComputedStyle(box);
            if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && box.getBoundingClientRect().width > 300) {
              bgBox = box;
              break;
            }
            box = box.parentElement;
          }
          const br = bgBox ? bgBox.getBoundingClientRect() : null;
          res.push({
            kw,
            inkL: Math.round(ink.left * 10) / 10,
            inkR: Math.round(ink.right * 10) / 10,
            boxL: Math.round(er.left),
            boxR: Math.round(er.right),
            padR: getComputedStyle(el).paddingRight,
            parentR: bgBox ? Math.round(br.right) : null,
            parentPadR: bgBox ? getComputedStyle(bgBox).paddingRight : null,
          });
        }
      }
      return res;
    })
  )
);

out.push(
  await probe('menu-price-row', 'menu', () =>
    page.evaluate(() => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const res = [];
      for (const kw of ['8.0', '8.3', '1.2万+', '9300+', '1.5万+', '5400+', '2.1万+']) {
        const els = [...document.querySelectorAll('span')].filter((d) => norm(d.textContent) === kw);
        for (const el of els) {
          const er = el.getBoundingClientRect();
          const rg = document.createRange();
          rg.selectNodeContents(el);
          const ink = rg.getBoundingClientRect();
          const par = el.parentElement;
          const pr = par.getBoundingClientRect();
          res.push({
            kw,
            inkL: Math.round(ink.left * 10) / 10,
            inkR: Math.round(ink.right * 10) / 10,
            cls: (el.className || '').toString().slice(0, 70),
            parentR: Math.round(pr.right),
            parentPadR: getComputedStyle(par).paddingRight,
            marginLeft: getComputedStyle(el).marginLeft,
          });
        }
      }
      return res;
    })
  )
);

fs.writeFileSync('outputs/align2/_probe2.json', JSON.stringify(out, null, 1), 'utf8');
await browser.close();
console.log('ok');
