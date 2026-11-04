/** 量 StickerBadge 徽章与内部图标的中心偏差（dx/dy 应为 0） */
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { state: 'visible', timeout: 25000 });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.waitForTimeout(800);

const measure = async (label) => {
  const r = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    if (!dlg) return { err: 'no dialog' };
    const badge = dlg.querySelector('div[style*="linear-gradient(148deg"]');
    if (!badge) return { err: 'no badge' };
    const svg = badge.querySelector('svg');
    const b = badge.getBoundingClientRect();
    const s = svg?.getBoundingClientRect();
    return {
      badge: { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) },
      svg: s ? { x: +s.x.toFixed(1), y: +s.y.toFixed(1), w: +s.width.toFixed(1), h: +s.height.toFixed(1) } : null,
      dx: s ? +(s.x + s.width / 2 - (b.x + b.width / 2)).toFixed(2) : null,
      dy: s ? +(s.y + s.height / 2 - (b.y + b.height / 2)).toFixed(2) : null,
    };
  });
  console.log(label, JSON.stringify(r));
};

// 福利中心
await page.evaluate(() => document.querySelector('#nav-tab-home')?.click());
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('#home-benefit-card')?.click());
await page.waitForTimeout(700);
await measure('benefit');
await page.evaluate(() => document.querySelector('[aria-label="关闭"]')?.click());
await page.waitForTimeout(500);

// 邀请好友
await page.evaluate(() => document.querySelector('#home-invite-card')?.click());
await page.waitForTimeout(700);
await measure('invite');
await page.evaluate(() => document.querySelector('[aria-label="关闭"]')?.click());
await page.waitForTimeout(400);

// 食材图鉴
await page.evaluate(() => document.querySelector('#nav-tab-gacha')?.click());
await page.waitForTimeout(900);
await page.evaluate(() => document.querySelector('svg.lucide-info')?.closest('button')?.click());
await page.waitForTimeout(700);
await measure('dex');

await browser.close();
