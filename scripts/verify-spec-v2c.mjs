/** 精确定位详情页打开后 motion 写入的位置/缩放，对比 reduce 与 no-preference。 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const out = [];

async function probe(reducedMotion) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.emulateMedia({ reducedMotion });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);

  // 点菜品卡（整卡可点，用文字定位再上溯）
  const card = page.getByText('牛油果鸡胸沙拉').first();
  await card.click({ force: true }).catch(() => {});
  await page.waitForTimeout(120);
  // 动画过程中取样（120ms 处于 spring 中段，最能看出差异）
  const mid = await page.evaluate(() => {
    const detail = [...document.querySelectorAll('div')].find(
      (d) => typeof d.className === 'string' && d.className.includes('z-50') && d.className.includes('inset-0')
    );
    const base = document.querySelector('main > div');
    const r = detail?.getBoundingClientRect();
    return {
      detailFound: !!detail,
      detailTransform: detail ? getComputedStyle(detail).transform : null,
      detailH: r ? Math.round(r.height) : null,
      baseTransform: base ? getComputedStyle(base).transform : null,
    };
  });
  await page.waitForTimeout(900);
  const settled = await page.evaluate(() => {
    const detail = [...document.querySelectorAll('div')].find(
      (d) => typeof d.className === 'string' && d.className.includes('z-50') && d.className.includes('inset-0')
    );
    return {
      detailTransform: detail ? getComputedStyle(detail).transform : null,
      opacity: detail ? getComputedStyle(detail).opacity : null,
    };
  });
  await page.close();
  return { mid, settled };
}

out.push('no-preference: ' + JSON.stringify(await probe('no-preference')));
out.push('reduce:        ' + JSON.stringify(await probe('reduce')));

await browser.close();
fs.writeFileSync('outputs/verify-nav/report3.txt', out.join('\n'), 'utf8');
