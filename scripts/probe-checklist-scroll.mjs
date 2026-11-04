/**
 * 抽卡页「食材图鉴」弹窗：滚轮滑动验证
 * 用法：node scripts/probe-checklist-scroll.mjs [输出目录]
 *
 * 检查三件事：
 *   ① 列表是否真的溢出（scrollHeight > clientHeight）
 *   ② 指针落在标题 / 底部按钮上时，滚轮是否也能带动列表
 *   ③ 两个高度（932 长屏 / 760 短屏）下滚到底后，最后一行 + 按钮是否完整
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/checklist-scroll';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

// ⚠️ Playwright 默认带 --hide-scrollbars，会把我们特意放出来的 4px 细滚动条也藏掉，
//    量出来 offsetWidth-clientWidth = 0。这里关掉它，才能验证滚动条真的渲染。
const browser = await chromium.launch({
  executablePath: CHROME,
  ignoreDefaultArgs: ['--hide-scrollbars'],
});
const result = {};

for (const [tag, height] of [['932', 932], ['760', 760], ['640', 640]]) {
  const page = await browser.newPage({
    viewport: { width: 430, height },
    deviceScaleFactor: 3,
    locale: 'zh-CN',
  });

  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);

  await page.click('#nav-tab-gacha');
  await page.waitForTimeout(1000);
  await page.click('#btn-header-info');
  await page.waitForTimeout(700);

  await page.screenshot({ path: `${OUT}/h${tag}-01-open.png` });

  const readState = () =>
    page.evaluate(() => {
      const card = document.querySelector('#gacha-dex-modal');
      const list = card?.querySelector('.gb-modal-scroll');
      const cr = card.getBoundingClientRect();
      const firstRow = list?.firstElementChild?.getBoundingClientRect();
      const btns = card ? [...card.querySelectorAll('button')] : [];
      const btn = btns.length ? btns[btns.length - 1].getBoundingClientRect() : null;
      return {
        cardW: +cr.width.toFixed(1),
        cardH: +cr.height.toFixed(1),
        cardTop: +cr.top.toFixed(1),
        rowH: firstRow ? +firstRow.height.toFixed(1) : null,
        listH: list ? +list.clientHeight.toFixed(1) : null,
        scroll: list ? `${list.scrollHeight}>${list.clientHeight} (top=${list.scrollTop})` : null,
        btnBottom: btn ? +btn.bottom.toFixed(1) : null,
        vh: window.innerHeight,
      };
    });

  const opened = await readState();
  const bar = await page.evaluate(() => {
    const el = document.querySelector('.gb-modal-scroll');
    const cs = getComputedStyle(el);
    return {
      scrollbarWidthPx: el.offsetWidth - el.clientWidth,
      mask: (cs.maskImage || cs.webkitMaskImage || '').slice(0, 120),
    };
  });

  // 指针落在列表上滚
  const lb = await page.evaluate(() => {
    const el = document.querySelector('.gb-modal-scroll');
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(lb.x, lb.y);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(500);
  const afterWheelOnList = await readState();
  await page.screenshot({ path: `${OUT}/h${tag}-02-scrolled.png` });

  // 归零后，指针落在标题上滚
  await page.evaluate(() => {
    document.querySelector('.gb-modal-scroll').scrollTop = 0;
  });
  await page.waitForTimeout(200);
  // 标题在卡片内，位置随卡片高度变 —— 必须按卡片实际位置取点，
  // 写死 y=40 会落到遮罩上（卡片缩到 58vh 后卡顶 y≈196）
  const hp = await page.evaluate(() => {
    const r = document.querySelector('#gacha-dex-modal').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height * 0.06 };
  });
  await page.mouse.move(hp.x, hp.y);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(500);
  const afterWheelOnHeader = await readState();

  // 已在底部时继续在标题上滚：列表不能再动，身后的页面也不能被带着滚
  const pageYBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(500);
  const atEnd = await readState();
  const pageYAfter = await page.evaluate(() => window.scrollY);

  result[`h${tag}`] = {
    opened,
    bar,
    afterWheelOnList,
    afterWheelOnHeader,
    pageNotScrolledBehindModal: pageYBefore === pageYAfter,
    atEndScrollTop: atEnd.scroll,
  };
  await page.close();
}

writeFileSync(`${OUT}/info.json`, JSON.stringify(result, null, 2), 'utf8');
await browser.close();
