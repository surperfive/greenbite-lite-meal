/**
 * 局部 hover / 交互动效录制（2026-10-31，v2：CDP screencast 版）
 *
 * 为什么不用 recordVideo：
 *   Playwright 的 recordVideo 只能按**视口 CSS 尺寸**出片（390×844）。
 *   要「只截有动画的部分」，就得事后 crop 一小块再放大 —— 24px 的加号按钮
 *   放大 6 倍，等于用 52 个像素撑 312px，糊成马赛克。试过，不可用。
 *
 * 改用 CDP 的 Page.startScreencast：
 *   · maxWidth/maxHeight 可以给到视口的 3 倍（1170×2532），局部裁完仍然清晰；
 *   · 实测 155 帧 / 2.58s ≈ 60fps，比 recordVideo 稳；
 *   · 只在「动作即将开始」时才启动，帧序列天然就是「前摇 + 动效」，不用算 trimStart。
 *
 * 用法：node scripts/record-hover.mjs            # 全部
 *       node scripts/record-hover.mjs h2 h4      # 只录指定
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAW = 'outputs/motion-hover-raw';
const OUT = 'outputs/motion-hover';

/* 抓帧方式：deviceScaleFactor 3 + page.screenshot({clip, scale:'device'})
 * —— 截图出来就是「目标区域 × 3」的局部图，不需要后期裁，也不糊。
 * 实测单张 35ms → 28fps，对 hover 这类 200~300ms 的过渡足够（6~8 帧中间态）。 */
const DPR = 3;

const only = process.argv.slice(2);
fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const prev = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
  } catch {
    return [];
  }
})();

const gotoMenu = async (p) => {
  await p.waitForTimeout(2400);
  await p.waitForFunction(
    () => {
      const s = document.getElementById('app-page-stage');
      return s && !s.hasAttribute('inert');
    },
    { timeout: 12000 }
  ).catch(() => {});
};

const hoverCycle = async (p, cx, cy, hold = 1100, gap = 750) => {
  await p.mouse.move(4, 4);
  await p.waitForTimeout(300);
  await p.mouse.move(cx, cy, { steps: 8 });
  await p.waitForTimeout(hold);
  await p.mouse.move(4, 4, { steps: 8 });
  await p.waitForTimeout(gap);
  await p.mouse.move(cx, cy, { steps: 8 });
  await p.waitForTimeout(hold);
};

const toDetail = async (p) => {
  await p.mouse.click(58, 474); // 分类：低卡鲜饮
  await p.waitForTimeout(1500);
  await p.mouse.click(240, 300); // 首屏第一张饮品卡
  await p.waitForTimeout(1400);
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('div,span')].find(
      (d) => d.children.length === 0 && (d.textContent || '').trim() === '杯型'
    );
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  await p.waitForTimeout(1100);
};

const SCENES = [
  {
    key: 'h1-dishcard',
    title: '菜品卡悬停',
    note: '投影加深、封面图放大 1.03 倍、菜名转深绿',
    pad: 10,
    pick: (p) => p.evaluateHandle(() => {
      const card = [...document.querySelectorAll('div')].find(
        (d) => typeof d.className === 'string' && d.className.includes('hover:shadow-md')
      );
      if (card) card.scrollIntoView({ block: 'center' });
      return card || null;
    }),
    act: async (p, b) => hoverCycle(p, b.x + b.w * 0.3, b.y + b.h * 0.62, 1200, 800),
  },
  {
    key: 'h2-addbtn',
    title: '加号按钮悬停与按下',
    note: '底色由青柠转深一档，按下缩到 95%',
    pad: 12,
    pick: (p) => p.evaluateHandle(() => {
      const b = document.querySelector('[aria-label="增加一份"]');
      if (b) b.scrollIntoView({ block: 'center' });
      return b || null;
    }),
    act: async (p, b) => {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      await p.mouse.move(4, 4);
      await p.waitForTimeout(400);
      await p.mouse.move(cx, cy, { steps: 8 });
      await p.waitForTimeout(900);
      await p.mouse.down();
      await p.waitForTimeout(220);
      await p.mouse.up();
      await p.waitForTimeout(900);
      await p.mouse.move(4, 4, { steps: 6 });
      await p.waitForTimeout(500);
      await p.mouse.move(cx, cy, { steps: 6 });
      await p.waitForTimeout(700);
    },
  },
  {
    key: 'h3-fav',
    title: '收藏心形悬停与点亮',
    note: '未收藏时灰、悬停加深，点击变玫红实心',
    pad: 14,
    pick: (p) => p.evaluateHandle(() => {
      const b = document.querySelector('[aria-label="加入收藏"]') || document.querySelector('[aria-label="取消收藏"]');
      if (b) b.scrollIntoView({ block: 'center' });
      return b || null;
    }),
    act: async (p, b) => {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      await p.mouse.move(4, 4);
      await p.waitForTimeout(350);
      await p.mouse.move(cx, cy, { steps: 8 });
      await p.waitForTimeout(900);
      await p.mouse.down();
      await p.waitForTimeout(140);
      await p.mouse.up();
      await p.waitForTimeout(1000);
      await p.mouse.move(4, 4, { steps: 6 });
      await p.waitForTimeout(600);
      await p.mouse.move(cx, cy, { steps: 6 });
      await p.waitForTimeout(500);
      await p.mouse.down();
      await p.waitForTimeout(140);
      await p.mouse.up();
      await p.waitForTimeout(800);
    },
  },
  {
    key: 'h4-specicon',
    title: '规格卡图标悬停',
    note: '图标放大 1.15、旋转 6°、上移 1.5px',
    pad: 10,
    prepare: toDetail,
    pick: (p) => p.evaluateHandle(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes('超大杯 +¥3'));
      return btn || null;
    }),
    act: async (p, b) => hoverCycle(p, b.x + 34, b.y + b.h / 2, 1000, 700),
  },
  {
    key: 'h5-specrow',
    title: '规格卡整卡悬停',
    note: '未选中卡描边由浅灰转深一档',
    pad: 12,
    prepare: toDetail,
    pick: (p) => p.evaluateHandle(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes('约450ml'));
      return btn || null;
    }),
    act: async (p, b) => hoverCycle(p, b.x + b.w / 2, b.y + b.h / 2, 1100, 750),
  },
  {
    key: 'h6-navtab',
    title: '底部导航悬停',
    note: '未选中图标变深、放大 1.05，文案同步加深',
    pad: 6,
    pick: (p) => p.evaluateHandle(() => document.getElementById('main-bottom-navigation-bar')),
    act: async (p, b) => {
      const y = b.y + 22;
      await p.mouse.move(4, 4);
      await p.waitForTimeout(350);
      await p.mouse.move(b.x + b.w * 0.66, y, { steps: 10 });
      await p.waitForTimeout(1000);
      await p.mouse.move(b.x + b.w * 0.18, y, { steps: 10 });
      await p.waitForTimeout(1000);
      await p.mouse.move(b.x + b.w * 0.86, y, { steps: 10 });
      await p.waitForTimeout(1000);
    },
  },
  {
    key: 'h7-more',
    title: '区块入口悬停',
    note: '「查看更多 ›」整行透明度降、箭头由浅灰转深',
    pad: 12,
    prepare: async (p) => {
      await p.click('#nav-tab-home', { force: true });
      await p.waitForTimeout(2400);
    },
    pick: (p) => p.evaluateHandle(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes('查看更多'));
      if (btn) btn.scrollIntoView({ block: 'center' });
      return btn || null;
    }),
    act: async (p, b) => hoverCycle(p, b.x + b.w / 2, b.y + b.h / 2, 1100, 750),
  },
  {
    key: 'h8-chip',
    title: '筛选胶囊悬停与按下',
    note: '底色加深、按下缩到 95%',
    pad: 12,
    pick: (p) => p.evaluateHandle(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes('≤250大卡'));
      if (btn) btn.scrollIntoView({ block: 'center' });
      return btn || null;
    }),
    act: async (p, b) => {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      await p.mouse.move(4, 4);
      await p.waitForTimeout(350);
      await p.mouse.move(cx, cy, { steps: 8 });
      await p.waitForTimeout(950);
      await p.mouse.down();
      await p.waitForTimeout(200);
      await p.mouse.up();
      await p.waitForTimeout(900);
      await p.mouse.move(4, 4, { steps: 6 });
      await p.waitForTimeout(600);
      await p.mouse.move(cx, cy, { steps: 6 });
      await p.waitForTimeout(700);
    },
  },
];

const picked = only.length
  ? SCENES.filter((s) => only.some((o) => s.key.includes(o) || s.title.includes(o)))
  : SCENES;

const browser = await chromium.launch({ executablePath: CHROME });
const done = [];

for (const sc of picked) {
  const dir = path.join(RAW, sc.key);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  /* 抓帧方式：CDP screencast 录整屏（390×844，实测 55~60fps），
     事后按 boundingBox 裁切。
     ⚠️ 试过更清晰的两条路，都不通，别再走：
        ① screencast 的 maxWidth/maxHeight → 被忽略，帧永远是视口尺寸；
        ② DPR 3 + page.screenshot({clip}) → 单张 35ms、分辨率确实是 3 倍，
           但截图与 mouse 操作在一条 CDP 连接上互相排队，8 段跑 27 分钟还没完（已强杀）。
     代价是局部放大 4 倍后略软，换来的是 60fps 的连续感。 */
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const cdp = await page.context().newCDPSession(page);

  let capturing = false;
  const frames = [];
  const stamps = [];
  cdp.on('Page.screencastFrame', async (ev) => {
    if (capturing) {
      frames.push(ev.data);
      stamps.push(ev.metadata?.timestamp || 0);
    }
    try {
      await cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId });
    } catch {
      /* 停止后再 ack 会报错，忽略 */
    }
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await gotoMenu(page);

  let box = null;
  let err = null;
  try {
    if (sc.prepare) await sc.prepare(page);
    const handle = await sc.pick(page);
    const el = handle.asElement();
    if (!el) throw new Error('目标元素未找到');
    await page.waitForTimeout(600);

    /* ⚠️ boundingBox() 返回 {x, y, width, height}。直接当 {x,y,w,h} 用会得到 NaN，
       mouse.move 就报 "Invalid parameters"。统一规范成 w/h。 */
    const raw = await el.boundingBox();
    if (!raw) throw new Error('boundingBox 为空（元素不可见？）');
    box = { x: Math.round(raw.x), y: Math.round(raw.y), w: Math.round(raw.width), h: Math.round(raw.height) };

    // 先空转 350ms 当前摇，再执行动作
    capturing = true;
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
    await page.waitForTimeout(350);
    await sc.act(page, box);
    await page.waitForTimeout(250);
    await cdp.send('Page.stopScreencast');
    capturing = false;
    await page.waitForTimeout(150);
  } catch (e) {
    err = String(e.message || e).split('\n')[0];
    try {
      await cdp.send('Page.stopScreencast');
    } catch {}
    capturing = false;
  }

  await page.close();

  let fps = 60;
  if (frames.length > 1) {
    const span = (stamps[stamps.length - 1] - stamps[0]) || 0;
    if (span > 0.2) fps = Math.min(60, Math.max(24, (frames.length - 1) / span));
  }
  frames.forEach((d, i) => {
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(d, 'base64'));
  });

  done.push({
    key: sc.key,
    title: sc.title,
    note: sc.note,
    dir,
    box,
    pad: sc.pad || 10,
    frames: frames.length,
    fps: Number(fps.toFixed(2)),
    error: err,
  });
}

await browser.close();

const order = new Map(SCENES.map((s, i) => [s.key, i]));
const merged = new Map(prev.map((m) => [m.key, m]));
for (const d of done) merged.set(d.key, d);
fs.writeFileSync(
  path.join(OUT, 'manifest.json'),
  JSON.stringify([...merged.values()].sort((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99)), null, 2),
  'utf8'
);
