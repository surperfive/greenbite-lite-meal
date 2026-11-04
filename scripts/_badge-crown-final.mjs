/**
 * 9折限时徽章：真页面最终确认
 * 1) 皇冠条内不得有深色像素（改白后 dark 必须为 0）
 * 2) 输出 4× 放大成品图给用户看
 * 3) dump 最终 computed style，确认没被别的规则盖掉
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-gacha');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1800);

// 关掉徽章的呼吸浮动动画，避免截到运动中的帧
await page.addStyleTag({ content: '#badge-discount{animation:none!important;transform:none!important}' });
await page.waitForTimeout(300);

const g = await page.evaluate(() => {
  const r = (id) => {
    const b = document.getElementById(id).getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  };
  const p = document.querySelector('#badge-crown path');
  return {
    bubble: r('badge-bubble'), crown: r('badge-crown'), text: r('txt-discount'),
    style: {
      fill: getComputedStyle(p).fill, stroke: getComputedStyle(p).stroke,
      textFill: getComputedStyle(document.getElementById('txt-discount')).fill,
      transform: document.getElementById('badge-crown').getAttribute('transform'),
    },
  };
});
console.log('STYLE', JSON.stringify(g.style));
console.log('BOXES', JSON.stringify({ bubble: g.bubble, crown: g.crown, text: g.text }));

// 皇冠条：夹紧在气泡内部（上下各让 22%，避开白胶囊/圆角）
const top = g.bubble.y + g.bubble.h * 0.22;
const hgt = g.bubble.h * 0.56;
await page.screenshot({ path: 'scripts/_shots/final-crown.png', clip: { x: g.crown.x + 1, y: top, width: g.crown.w - 2, height: hgt } });

// 成品图：气泡 + 白胶囊整枚，4×
await page.screenshot({
  path: 'scripts/_shots/final-badge.png',
  clip: { x: g.bubble.x - 22, y: g.bubble.y - 16, width: g.bubble.w + 44, height: g.bubble.h + 40 },
});

// 更大范围：徽章 + 十连抽按钮，看整体关系
await page.screenshot({ path: 'scripts/_shots/final-context.png', clip: { x: g.bubble.x - 40, y: g.bubble.y - 40, width: 300, height: 200 } });

await browser.close();
console.log('shots ok');
