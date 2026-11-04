/**
 * 用坐标点击跑完 5 步规格切换，每步之后读底部金额与选中态，确认没误触。
 * 坐标来自「滚到底」状态下的实测：杯型 y=71 / 温度 y=167 / 糖度 y=457 / 加料 y=604。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

const out = [];
const snap = async (tag) => {
  const s = await page.evaluate(() => {
    // 底部按钮金额 + 当前滚动位置
    const buy = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes('加入购物车'));
    const hit = [...document.querySelectorAll('div')].find((d) => {
      const cs = getComputedStyle(d);
      return /auto|scroll/.test(cs.overflowY) && d.scrollHeight > d.clientHeight + 40 && d.clientHeight > 400;
    });
    return {
      buy: buy ? buy.innerText.replace(/\s+/g, ' ').trim() : null,
      scrollTop: hit ? Math.round(hit.scrollTop) : null,
      inDetail: !!buy,
    };
  });
  out.push(`${tag}: ${JSON.stringify(s)}`);
  return s;
};

await page.mouse.click(58, 474);
await page.waitForTimeout(1500);
await page.mouse.click(240, 300);
await page.waitForTimeout(1400);
await page.evaluate(() => {
  const hit = [...document.querySelectorAll('div')].find((d) => {
    const cs = getComputedStyle(d);
    return /auto|scroll/.test(cs.overflowY) && d.scrollHeight > d.clientHeight + 40 && d.clientHeight > 400;
  });
  if (hit) hit.scrollTop = hit.scrollHeight;
});
await page.waitForTimeout(800);
await snap('初始(滚到底)');

const steps = [
  ['超大杯', 287, 71],
  ['热', 287, 167],
  ['微糖', 287, 457],
  ['加料 生椰乳', 103, 604],
  ['大杯', 103, 71],
];
for (const [name, x, y] of steps) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(900);
  await snap(`点 ${name} @${x},${y}`);
}

await page.screenshot({ path: 'outputs/_detail-probe.png' });
await browser.close();
fs.writeFileSync('outputs/_detail-probe.txt', out.join('\n'), 'utf8');
