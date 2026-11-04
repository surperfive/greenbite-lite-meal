/**
 * 生成两张「体系收敛」证据图（作品集用）：
 *   07 字号阶：49 处不在阶上的字号 → 收敛为 11 级
 *   08 色板：17 个自造的近似浅灰 → 收敛为 1 个令牌
 *
 * 这两张不是截页面，是直接用 HTML 画出来再截图 —— 因为要展示的是「值的分布」，
 * 页面上看不到。数据全部来自 audit-spec.mjs 的真实统计，没有编。
 *
 * 用法：node scripts/make-token-shots.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'outputs/cases';
fs.mkdirSync(OUT, { recursive: true });

const FONT = `-apple-system,'Segoe UI','Microsoft YaHei',system-ui,sans-serif`;
const MONO = `ui-monospace,'SF Mono',Consolas,monospace`;

/* ── 图 1：字号阶 ─────────────────────────────────────────────
 * 只列「确实出现过」的散值，并给出归并目标。
 * ⚠️ 不写每个值的出现次数：历史审计只留了总数（49 处半像素 / 31 处 8·8.5→9），
 *    逐档明细没有留存，编一个「×17 / ×14」的分布表就是不诚实的证据图。 */
const typoData = [
  { v: '8', to: '9', known: '31 处（8 与 8.5 合计）' },
  { v: '8.5', to: '9', known: '' },
  { v: '9.5', to: '10', known: '' },
  { v: '10.5', to: '11', known: '' },
  { v: '11.5', to: '12', known: '' },
  { v: '12.5', to: '13', known: '' },
  { v: '13.5', to: '14', known: '' },
];
const steps = [
  ['9', '角标 / 单位 / 胶囊'],
  ['10', '角标 / 徽章数字'],
  ['11', '副标题 / 筛选胶囊'],
  ['12', '标签 / 列表次要'],
  ['13', '菜品名 / 按钮'],
  ['14', '列表主文案'],
  ['15', '区块标题'],
  ['17', '价格 / 数字'],
  ['21', '结算总额'],
  ['22', '页头昵称'],
  ['26', '详情页价格'],
];

const typoHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{width:1180px;padding:44px 48px;background:#fff;font-family:${FONT};color:#070906}
  .hd{display:flex;align-items:baseline;gap:12px;margin-bottom:6px}
  .hd b{font-size:22px;letter-spacing:-.02em}
  .tag{font-size:11px;font-weight:800;color:#fff;background:#FC5294;padding:3px 9px;border-radius:6px}
  .sub{font-size:12.5px;color:#64748B;margin-bottom:30px}
  .cols{display:grid;grid-template-columns:1fr 70px 1.25fr;gap:24px;align-items:start}
  .col h4{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#94A3B8;margin-bottom:14px;font-weight:800}
  .row{display:flex;align-items:center;gap:10px;margin-bottom:9px;height:24px}
  .bad .v{font-family:${MONO};font-size:12px;font-weight:700;color:#B02B5F;width:44px;text-align:right}
  .bad .bar{height:14px;background:repeating-linear-gradient(135deg,#FDD3EA 0 5px,#FBC4E0 5px 10px);
    border-radius:3px;border:1px solid rgba(252,82,148,.35);width:132px}
  .bad .to{font-size:10.5px;color:#B02B5F;font-weight:700;font-family:${MONO}}
  .bad .k{font-size:10px;color:#94A3B8}
  .arrow{display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:132px}
  .arrow span{font-size:10.5px;color:#94A3B8;font-weight:700;letter-spacing:.06em}
  .arrow i{font-style:normal;font-size:26px;color:#C7F665}
  .good .row{gap:9px}
  .good .v{font-family:${MONO};font-size:11.5px;font-weight:800;color:#26430B;width:26px;text-align:right}
  .good .sw{height:14px;border-radius:3px;background:#C7F665;opacity:.85}
  .good .u{font-size:10.5px;color:#64748B}
  .ft{margin-top:24px;font-size:11px;color:#94A3B8;line-height:1.6}
</style></head><body>
  <div class="hd"><b>字号不该有半像素</b><span class="tag">49 处</span></div>
  <div class="sub">审计扫出 49 处不在阶上的字号 —— 8 / 8.5 这类值浏览器会按 1/64px 细分，字重和行高跟着抖。全部归并到 11 级阶</div>
  <div class="cols">
    <div class="col bad">
      <h4>改前 · 随手值</h4>
      ${typoData
        .map(
          (d) => `<div class="row"><span class="v">${d.v}px</span>
            <span class="bar"></span>
            <span class="to">→ ${d.to}</span>
            ${d.known ? `<span class="k">${d.known}</span>` : ''}</div>`
        )
        .join('')}
    </div>
    <div class="arrow"><span>收敛</span><i>→</i></div>
    <div class="col good">
      <h4>改后 · 11 级阶</h4>
      ${steps
        .map(
          (s) => `<div class="row"><span class="v">${s[0]}</span>
            <span class="sw" style="width:${22 + Number(s[0]) * 4.6}px"></span>
            <span class="u">${s[1]}</span></div>`
        )
        .join('')}
    </div>
  </div>
  <div class="ft">数据来源 · audit-spec.mjs 源码扫描（2026-10-28 / 10-29 两轮归整）· 展示型数字（抽卡 46px 等）按规范登记为豁免，不计入</div>
</body></html>`;

/* ── 图 2：色板收敛 ───────────────────────────────────────────
 * 18 个「同一语义手滑成多值」的浅灰底色（1 个主值 + 17 个变体，数字来自 audit-spec 的 C1 近似色簇）。 */
const grays = [
  ['#F4F6F8', 20, true],
  ['#F8FAFC', 18],
  ['#F1F4F8', 10],
  ['#F3F5F8', 5],
  ['#F1F5F9', 4],
  ['#F7F9FB', 4],
  ['#F4F7FA', 3],
  ['#F8F9FB', 3],
  ['#F0FDF4', 2],
  ['#F0F9FF', 2],
  ['#F6F7F9', 1],
  ['#F4F4F0', 1],
  ['#FAF5FF', 1],
  ['#FDF2F8', 1],
  ['#F5F5F4', 1],
  ['#F2F3F3', 1],
  ['#F1F2F4', 1],
  ['#F7F8FA', 1],
];

const paletteHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{width:1180px;padding:44px 48px;background:#fff;font-family:${FONT};color:#070906}
  .hd{display:flex;align-items:baseline;gap:12px;margin-bottom:6px}
  .hd b{font-size:22px;letter-spacing:-.02em}
  .tag{font-size:11px;font-weight:800;color:#fff;background:#FC5294;padding:3px 9px;border-radius:6px}
  .sub{font-size:12.5px;color:#64748B;margin-bottom:26px}
  .grid{display:grid;grid-template-columns:repeat(9,1fr);gap:10px;margin-bottom:22px}
  .sw{border-radius:10px;overflow:hidden;border:1px solid #E2E8F0}
  .sw .chip{height:52px}
  .sw .cap{padding:6px 7px 7px;background:#fff}
  .sw .hx{font-family:${MONO};font-size:9.5px;font-weight:700;letter-spacing:-.02em}
  .sw .ct{font-size:9px;color:#94A3B8;margin-top:2px}
  .sw.win{border-color:#54801A;box-shadow:0 0 0 2px rgba(199,246,101,.6)}
  .sw.win .hx{color:#26430B}
  .foot{display:flex;align-items:center;gap:14px;padding:16px 20px;background:#F2FCE0;border-radius:12px}
  .foot .k{font-size:11px;font-weight:800;color:#26430B;letter-spacing:.04em}
  .foot .t{font-size:12px;color:#3F4A56;line-height:1.6}
  .foot code{font-family:${MONO};font-size:11.5px;background:#fff;padding:2px 7px;border-radius:5px;font-weight:700}
  .ft{margin-top:22px;font-size:11px;color:#94A3B8}
</style></head><body>
  <div class="hd"><b>同一个「浅灰底」，全站被写出 18 个值</b><span class="tag">收敛为 1</span></div>
  <div class="sub">17 个变体肉眼几乎不可分，却让「改一处底色」变成改十八处；深色主色同样如此（#C7F665 被写成 #BEF264 13 次）</div>
  <div class="grid">
    ${grays
      .map(
        ([hex, n, win]) => `<div class="sw${win ? ' win' : ''}">
          <div class="chip" style="background:${hex}"></div>
          <div class="cap"><div class="hx">${hex}</div><div class="ct">${win ? '保留' : `×${n}`}</div></div>
        </div>`
      )
      .join('')}
  </div>
  <div class="foot"><span class="k">收敛后</span>
    <span class="t">页面底色只用 <code>#F4F6F8</code>；浅灰底纹 / 输入框 / 分割底走令牌 <code>--lime-50</code> 与 <code>slate-100</code>，
    不再手写新 hex。<strong>新增颜色必须先加令牌</strong>，否则 audit-spec 报「未登记色值」。</span></div>
  <div class="ft">数据来源 · audit-spec.mjs 的近似色簇检测（C1）：18 个近似浅灰、4 个近似纯黑、3 个近似青柠</div>
</body></html>`;

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2 });

const shoot = async (html, name) => {
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1180, height: Math.ceil(h) });
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 0, y: 0, width: 1180, height: Math.ceil(h) }, scale: 'device' });
  return h;
};

const h1 = await shoot(typoHtml, '07-typo-scale');
const h2 = await shoot(paletteHtml, '08-palette');

await browser.close();
fs.writeFileSync(`${OUT}/_token.txt`, `07 ${h1}px\n08 ${h2}px`, 'utf8');
