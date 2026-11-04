/**
 * 把 8 个规范案例的图片「总结到一起」：生成一张纵向长图，直接可当作品集一页。
 *
 * 为什么用 HTML 排再截图，而不是 ffmpeg 拼：
 *   9 张图的宽高比差异很大（01 是横的 250×180，09 是竖的 1290×1548），
 *   ffmpeg 拼要么拉伸变形、要么每张单独算 pad，还要另做中文标签。
 *   HTML 里 object-fit:contain + 统一容器，一次排版，中文用系统字体渲染，最省事。
 *
 * 用法：node scripts/make-case-sheet.mjs
 * 产物：outputs/cases/00-案例总览.png
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('outputs/cases');
const TMP = path.join(DIR, '_sheet.html');

const CASES = [
  {
    no: '01', title: '视觉 24px 的加号，手指要能点中 44px', sev: 'Critical',
    img: '01-hitarea.png',
    desc: '按钮视觉 24×24，画到 44 会把整排卡片撑坏。用 <code>.gb-hit::after</code> 生成透明命中区，点它等同点按钮，零布局影响。',
    kv: [['过小目标 49', 'bad'], ['→ 3（仅轮播点）', 'ok'], ['命中区 44×44', '']],
  },
  {
    no: '02', title: '键盘用户看不出光标停在哪', sev: 'High',
    img: '02-focus-before.png', img2: '03-focus-after.png',
    desc: '全站只有两处写了 focus 样式，其余靠浏览器默认环 —— 在青柠底和白色圆角卡边缘几乎看不见。统一 <code>:focus-visible</code>：2px 深墨 + 2px 外扩。',
    kv: [['全站统一', 'ok'], ['2px #070906', ''], ['offset 2px', '']],
  },
  {
    no: '03', title: '灰底白字的禁用按钮，读不出来', sev: 'High',
    img: '04-contrast-before.png', img2: '05-contrast-after.png',
    desc: '禁用态 <code>#94A3B8</code> + 白字实测 2.56:1。「不可用」不等于「看不见」，压到 <code>#475569</code> 保持灰色语义，对比拉到 7.58:1。',
    kv: [['2.56:1', 'bad'], ['→ 7.58:1', 'ok'], ['全站 28 → 0', '']],
  },
  {
    no: '04', title: '底部导航压住最后一行内容', sev: 'High',
    img: '10-nav-before.png', img2: '11-nav-after.png', stack: true,
    desc: '导航 <code>absolute bottom-0</code>，滚动内容没留 inset，最后一张卡被切一半 —— 读起来像渲染坏了。滚动容器统一留底部 inset。',
    kv: [['pb-28 起', 'ok'], ['calc 联动导航高度', ''], ['横向溢出 0', '']],
  },
  {
    no: '05', title: '明知不达标却保留：一次写进文档的取舍', sev: 'Decision',
    img: '06-price-tradeoff.png',
    desc: '审计曾把玫红拆成亮面 + 深字两档来过 AA，用户看到深色价格直接问「为什么是暗色」。收敛为单值 <code>#FC5294</code>，把 3.10:1 显式登记为例外。',
    kv: [['3.10:1', 'bad'], ['已登记例外', ''], ['色值全站唯一', 'ok']],
  },
  {
    no: '06', title: '字号不该有半像素', sev: 'Medium',
    img: '07-typo-scale.png',
    desc: '49 处字号不在阶上（8 / 8.5 / 9.5 …），浏览器按 1/64px 细分，字重行高跟着抖。收敛成 11 级阶，展示型数字单独登记豁免。',
    kv: [['49 处半像素', 'bad'], ['→ 0', 'ok'], ['11 级阶', '']],
  },
  {
    no: '07', title: '同一个「浅灰底」，被写出 18 个值', sev: 'Medium',
    img: '08-palette.png',
    desc: '1 个主值 + 17 个变体，肉眼不可分，却让「改一处底色」变成改十八处。颜色全部走令牌，新增色必须先加令牌；未登记 hex 由审计直接报错。',
    kv: [['18 个浅灰', 'bad'], ['→ 1', 'ok'], ['257 个未登记色值', '']],
  },
  {
    no: '08', title: '能滚，但用户看不出能滚', sev: 'High',
    img: '09-scroll.png',
    desc: '弹窗早就写了 <code>overflow-y-auto</code>，用户仍说滑不动：滚动条被全局藏掉、指针不在列表上滚轮无效、最后一行被切一半。补 4px 滚动条 + 渐隐 + 原生 wheel 接管。',
    kv: [['溢出 97px 可见', 'ok'], ['任意位置可滚', ''], ['不穿透身后页面', '']],
  },
];

const rowHtml = CASES.map(
  (c) => `
  <section class="case">
    <div class="fig">
      ${c.img2
        ? c.stack
          ? `<div class="stack"><figure><img src="${c.img}"><figcaption>改前</figcaption></figure>
             <figure><img src="${c.img2}"><figcaption>改后</figcaption></figure></div>`
          : `<div class="pair"><figure><img src="${c.img}"><figcaption>改前</figcaption></figure>
             <figure><img src="${c.img2}"><figcaption>改后</figcaption></figure></div>`
        : `<figure class="single"><img src="${c.img}"></figure>`}
    </div>
    <div class="meta">
      <div class="hd"><span class="no">${c.no}</span><h2>${c.title}</h2><span class="sev ${c.sev === 'Decision' ? 'dec' : ''}">${c.sev}</span></div>
      <p>${c.desc}</p>
      <div class="kv">${c.kv.map(([t, k]) => `<span class="${k}">${t}</span>`).join('')}</div>
    </div>
  </section>`
).join('');

const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1600px;padding:64px 64px 56px;background:#fff;
    font-family:-apple-system,'Segoe UI','Microsoft YaHei',system-ui,sans-serif;color:#070906}
  .top{border-bottom:2px solid #070906;padding-bottom:26px;margin-bottom:8px}
  .kicker{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;
    color:#26430B;background:#C7F665;padding:5px 12px;border-radius:999px;margin-bottom:18px}
  h1{font-size:38px;line-height:1.2;letter-spacing:-.025em;margin-bottom:14px}
  .lede{font-size:15px;line-height:1.7;color:#3F4A56;max-width:46em}
  .stats{display:flex;gap:38px;margin:26px 0 0;flex-wrap:wrap}
  .stat .n{font-size:24px;font-weight:900;letter-spacing:-.02em}
  .stat .n s{color:#94A3B8;font-size:15px;font-weight:700;text-decoration-thickness:2px}
  .stat .n i{font-style:normal;color:#FC5294}
  .stat .k{font-size:11px;color:#64748B;margin-top:3px}

  .case{display:grid;grid-template-columns:470px 1fr;gap:38px;align-items:center;
    padding:30px 0;border-bottom:1px solid #E2E8F0}
  .case:last-child{border-bottom:0}
  .fig{background:#F4F6F8;border-radius:16px;padding:12px;border:1px solid #E6EAF0}
  .fig img{display:block;width:100%;height:auto;border-radius:8px;background:#fff}
  .fig .single img{max-height:270px;object-fit:contain;margin:0 auto}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .pair figure{margin:0}
  .pair img{max-height:210px;object-fit:contain;margin:0 auto}
  .pair figcaption{font-size:10px;color:#94A3B8;text-align:center;margin-top:5px;font-weight:700}
  /* 超宽图（如底部导航 780×200）左右并排会被压成一条，改成上下堆叠 */
  .stack{display:flex;flex-direction:column;gap:9px}
  .stack figure{margin:0}
  .stack img{max-height:112px;object-fit:contain;margin:0 auto}
  .stack figcaption{font-size:10px;color:#94A3B8;text-align:center;margin-top:4px;font-weight:700}

  .hd{display:flex;align-items:center;gap:11px;margin-bottom:12px;flex-wrap:wrap}
  .no{font-size:12px;font-weight:900;color:#fff;background:#FC5294;border-radius:6px;padding:3px 8px;letter-spacing:.04em}
  .hd h2{font-size:21px;letter-spacing:-.02em;line-height:1.3}
  .sev{font-size:10px;font-weight:800;color:#FC5294;border:1px solid rgba(252,82,148,.35);
    background:rgba(252,82,148,.07);padding:2px 8px;border-radius:999px;letter-spacing:.05em}
  .sev.dec{color:#26430B;border-color:rgba(199,246,101,.8);background:#F2FCE0}
  .meta p{font-size:14px;line-height:1.78;color:#3F4A56}
  .meta code{font-family:ui-monospace,Consolas,monospace;font-size:12.5px;background:#F1F5F9;
    padding:1.5px 6px;border-radius:5px;color:#070906}
  .kv{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
  .kv span{font-size:11.5px;font-weight:700;color:#3F4A56;background:#F1F5F9;border:1px solid #E2E8F0;
    padding:4px 10px;border-radius:7px;font-variant-numeric:tabular-nums}
  .kv span.ok{background:#F2FCE0;border-color:rgba(199,246,101,.8);color:#26430B}
  .kv span.bad{background:rgba(252,82,148,.08);border-color:rgba(252,82,148,.32);color:#B02B5F}

  .foot{margin-top:30px;padding-top:18px;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;line-height:1.7}
</style></head><body>
  <div class="top">
    <span class="kicker">Design System · UI Spec Cases</span>
    <h1>GreenBite 轻食小程序 · UI 规范落地 8 例</h1>
    <p class="lede">26 轮视觉微调之后，用 ui-ux-pro-max 的 App 交付清单做了一次缺口体检，
      把「凭感觉」的部分换成能量、能查、能复跑的条目 —— 同时保留品牌资产不被通用规范推翻。</p>
    <div class="stats">
      <div class="stat"><div class="n"><s>28</s> → <i>0</i></div><div class="k">对比度违规</div></div>
      <div class="stat"><div class="n"><s>49</s> → <i>3</i></div><div class="k">过小触摸目标</div></div>
      <div class="stat"><div class="n"><s>49</s> 处</div><div class="k">半像素字号归整</div></div>
      <div class="stat"><div class="n"><s>257</s> → 白名单</div><div class="k">未登记色值</div></div>
      <div class="stat"><div class="n">2 个</div><div class="k">自动审计脚本</div></div>
    </div>
  </div>
  ${rowHtml}
  <div class="foot">证据图均为项目实拍（Playwright 2x 截图 + 页面内标注）· 规范依据 ui-ux-pro-max UX Guidelines 与 App 交付清单 ·
    数据来自 outputs/audit/audit.json 与改造后复测</div>
</body></html>`;

fs.writeFileSync(TMP, html, 'utf8');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
await page.goto('file:///' + TMP.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/'), { waitUntil: 'load' });
await page.waitForTimeout(700);

const h = await page.evaluate(() => document.body.scrollHeight);
const broken = await page.evaluate(() =>
  [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src.split('/').pop())
);

await page.setViewportSize({ width: 1600, height: Math.ceil(h) });
await page.waitForTimeout(350);
await page.screenshot({
  path: path.join(DIR, '00-案例总览.png'),
  clip: { x: 0, y: 0, width: 1600, height: Math.ceil(h) },
  scale: 'device',
});

await browser.close();
fs.rmSync(TMP, { force: true });
fs.writeFileSync(
  path.join(DIR, '_sheet.txt'),
  `高度 ${h}px · 输出 2x ${1600 * 2}×${Math.ceil(h) * 2}\n图片：${broken.length ? '缺失 ' + broken.join(', ') : '全部加载正常'}`,
  'utf8'
);
