/** 「我的」页顶部 banner 量尺：banner 高度 / 头像 / 昵称 / 会员胶囊 / 立省标签 的绝对 y。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1400);

const m = await page.evaluate(() => {
  const rect = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), l: +b.left.toFixed(1), r: +b.right.toFixed(1), h: +b.height.toFixed(1), w: +b.width.toFixed(1) };
  };
  // banner = 含 img[alt="我的页面头图Banner"] 的那个 relative overflow-hidden 容器
  const img = document.querySelector('img[alt="我的页面头图Banner"]');
  const banner = img ? img.closest('div.relative.overflow-hidden') : null;
  const avatarImg = document.querySelector('img[src="/mascot-avatar-hd.svg"]');
  const avatarBox = avatarImg ? avatarImg.parentElement : null;
  const name = document.querySelector('h1');
  const pill = document.querySelector('h1')?.nextElementSibling?.querySelector('div.inline-flex');
  const saveTag = [...document.querySelectorAll('span')].find((s) => /立省|登录领券/.test(s.textContent || '') && s.className.includes('absolute'));
  const assetCard = [...document.querySelectorAll('div')].find((d) => d.className.includes('rounded-[26px]') && d.className.includes('bg-white'));
  return {
    banner: rect(banner),
    bannerCS: banner ? { pt: getComputedStyle(banner).paddingTop, pb: getComputedStyle(banner).paddingBottom, minH: getComputedStyle(banner).minHeight, align: getComputedStyle(banner).alignItems } : null,
    avatar: rect(avatarBox),
    name: rect(name),
    nameFS: name ? getComputedStyle(name).fontSize : null,
    pill: rect(pill),
    saveTag: rect(saveTag),
    assetCard: rect(assetCard),
    scrollTop: document.querySelector('.overflow-y-auto, [data-scroll-root]')?.scrollTop ?? null,
  };
});
console.log(JSON.stringify(m, null, 2));
await page.screenshot({ path: `${OUT}/me-header-before.png`, clip: { x: 10, y: 0, width: 410, height: 260 } });
await browser.close();
