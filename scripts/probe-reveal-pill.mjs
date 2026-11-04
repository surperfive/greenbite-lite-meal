/**
 * 抽卡揭示卡：顶部「✨ 抽到 N 款食材」提示胶囊 与 卡片稀有度徽章 的重叠校验。
 *
 * 背景（2026-10-13）：用户报「抽到食材提示挡住卡片的稀有度了」。
 * 怀疑根因是**参考系不一致**：
 *   · 结果卡用 revealAnchor（= 手机壳可视区中心，从可滚动祖先量出来的）
 *   · 提示胶囊用 `top: calc(50% - Npx)` —— 50% 是**视口**高度的一半
 * 手机壳顶部对齐且高度固定（宽视口 844px），视口比它高时两者就是两个点。
 *
 * 用法：node scripts/probe-reveal-pill.mjs
 * 输出：每档视口下 卡片顶 / 徽章顶 / 胶囊底 的间距，以及是否相交。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/reveal-pill';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
let failed = false;

const measure = async (page, mode) =>
  page.evaluate((m) => {
    // ⚠️ 卡片选择器必须按模式取：单抽是 data-reveal-card="single"，
    //    十连是 data-reveal-card="ten"（10 张）。写死 "single" 会让十连永远测到 null。
    const cards = [...document.querySelectorAll(`[data-reveal-card="${m}"]`)];
    const pillSpan = [...document.querySelectorAll('span')].find(
      (s) => s.textContent?.includes('抽到') && s.textContent.includes('款食材')
    );
    const pill = pillSpan?.parentElement;
    if (cards.length === 0 || !pill) return null;

    // 每张卡的稀有度徽章都是它的第一个子元素
    const badges = cards
      .map((c) => c.firstElementChild?.getBoundingClientRect())
      .filter((r) => r && r.height > 0);
    const pr = pill.getBoundingClientRect();

    // 取**最容易被压到**的那枚徽章：垂直方向离胶囊最近（重叠最严重）的那枚
    let worst = null;
    for (const b of badges) {
      const oy = Math.max(0, Math.min(pr.bottom, b.bottom) - Math.max(pr.top, b.top));
      const ox = Math.max(0, Math.min(pr.right, b.right) - Math.max(pr.left, b.left));
      const collide = oy > 0 && ox > 0;
      const score = collide ? oy * ox : -Math.abs(b.top - pr.bottom);
      if (!worst || score > worst.score) worst = { b, oy, ox, collide, score };
    }
    if (!worst) return null;

    const cr = cards[0].getBoundingClientRect();
    const cardTop = Math.min(...cards.map((c) => c.getBoundingClientRect().top));

    return {
      viewportH: window.innerHeight,
      cardCount: cards.length,
      cardTop: +cardTop.toFixed(1),
      cardCenterY: +(cr.top + cr.height / 2).toFixed(1),
      badgeTop: +worst.b.top.toFixed(1),
      badgeBottom: +worst.b.bottom.toFixed(1),
      pillTop: +pr.top.toFixed(1),
      pillBottom: +pr.bottom.toFixed(1),
      pillH: +pr.height.toFixed(1),
      gapPillToBadge: +(worst.b.top - pr.bottom).toFixed(1),
      overlapX: +worst.ox.toFixed(1),
      overlapY: +worst.oy.toFixed(1),
      collide: worst.collide,
    };
  }, mode);

const draw = async (page, mode) => {
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('#nav-tab-gacha', { timeout: 60000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
    b?.click();
  });
  await page.waitForTimeout(900);
  await page.click('#nav-tab-gacha');
  await page.waitForTimeout(1600);

  // 诊断：十连按钮是否可点
  const diag = await page.evaluate((m) => {
    const btn = document.querySelector(m === 'ten' ? '#btn-gacha-ten' : '#btn-gacha-single');
    return btn ? { exists: true, disabled: btn.hasAttribute('disabled') } : { exists: false };
  }, mode);

  await page.locator(mode === 'ten' ? '#btn-gacha-ten' : '#btn-gacha-single').click();

  // 轮询等揭示卡出现（单抽约 2.4s、十连同）
  let appeared = false;
  let overlaySeen = false;
  for (let i = 0; i < 200; i++) {
    const s = await page.evaluate(() => ({
      card: !!document.querySelector('[data-reveal-card]'),
      overlay: !!document.querySelector('#gacha-burst-overlay'),
    }));
    if (s.overlay) overlaySeen = true;
    if (s.card) { appeared = true; break; }
    await page.waitForTimeout(40);
  }
  if (!appeared) {
    console.log(`      诊断 ${mode}: 按钮=${JSON.stringify(diag)} 覆盖层出现过=${overlaySeen}`);
    return null;
  }

  /* ⚠️ 必须等入场 spring 收敛再冻结。
     卡片 initial scale 0.2 → spring(stiffness 320, damping 20)，
     实测中途冻结量到的卡高只有 208px（收敛后 228px）—— 用缩放中的矩形算重叠会算错。
     单抽 揭示→起飞 有 920ms 窗口，等 550ms 安全。 */
  await page.waitForTimeout(550);
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  await page.waitForTimeout(120);
  return measure(page, mode);
};

const report = (vh, mode, m) => {
  const label = mode === 'single' ? '单抽' : '十连';
  if (!m) {
    console.log(`vh=${vh} ${label} FAIL 揭示卡没出现（或提示胶囊没渲染）`);
    failed = true;
    return;
  }
  const tag = m.collide ? 'FAIL 重叠' : 'ok';
  if (m.collide) failed = true;
  console.log(
    `vh=${vh} ${label} ${tag}  卡数=${m.cardCount} 卡顶=${m.cardTop} 卡心=${m.cardCenterY}` +
      `  最险徽章=${m.badgeTop}~${m.badgeBottom}  胶囊=${m.pillTop}~${m.pillBottom}(高${m.pillH})` +
      `  胶囊底→徽章顶=${m.gapPillToBadge}px  重叠 ${m.overlapX}x${m.overlapY}px`
  );
};

for (const vh of [700, 844, 900, 1200]) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: vh }, deviceScaleFactor: 2 });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();

  report(vh, 'single', await draw(page, 'single'));
  report(vh, 'ten', await draw(page, 'ten'));

  await ctx.close();
}

await browser.close();
console.log(failed ? '\n结果：存在重叠' : '\n结果：全部无重叠');
process.exit(failed ? 1 : 0);
