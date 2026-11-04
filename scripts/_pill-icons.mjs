// 找出「同一个胶囊里既有图标又有 pill-label 文字」的位置（这些地方图标会比文字低 0.075em）
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(1200);

const scan = () => {
  const out = [];
  for (const lab of document.querySelectorAll('.pill-label')) {
    let pill = lab.parentElement;
    let hops = 0;
    while (pill && pill !== document.body && hops++ < 6) {
      const cs = getComputedStyle(pill);
      const b = pill.getBoundingClientRect();
      const rad = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
      if (rad >= Math.max(5, b.height * 0.38) && b.width < 360) break;
      pill = pill.parentElement;
    }
    if (!pill || pill === document.body) continue;
    const svgs = [...pill.querySelectorAll('svg')].filter((s) => {
      const sb = s.getBoundingClientRect();
      const pb = pill.getBoundingClientRect();
      // 只算同一行里的图标
      return sb.height > 4 && sb.width > 4 && sb.top >= pb.top - 2 && sb.bottom <= pb.bottom + 2;
    });
    if (!svgs.length) continue;
    const pb = pill.getBoundingClientRect();
    if (pb.top < 0 || pb.bottom > innerHeight) continue;
    out.push({
      text: lab.textContent.trim().slice(0, 14),
      pillH: +pb.height.toFixed(1),
      fs: getComputedStyle(pill).fontSize,
      icons: svgs.length,
      iconCls: (svgs[0].getAttribute('class') || '').slice(0, 60),
      pillCls: (pill.className || '').toString().slice(0, 90),
    });
  }
  return out;
};

const seen = new Map();
for (const tab of ['home', 'menu', 'orders', 'me']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(800);
  for (const s of [0, 500, 1000, 1500]) {
    await page.evaluate((v) => { const sc = document.querySelector('.overflow-y-auto'); if (sc) sc.scrollTop = v; }, s);
    await page.waitForTimeout(260);
    for (const r of await page.evaluate(scan)) {
      const k = tab + '|' + r.text + '|' + r.iconCls;
      if (!seen.has(k)) seen.set(k, { tab, ...r });
    }
  }
}
for (const v of seen.values()) {
  console.log(`[${v.tab}] «${v.text}»  fs=${v.fs} pillH=${v.pillH} icons=${v.icons}  icon="${v.iconCls}"`);
}
console.log(`\n共 ${seen.size} 处「图标 + pill-label」共存`);
await browser.close();
