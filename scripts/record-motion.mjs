/**
 * 全动效录制器（2026-10-31）
 *
 * 目标：把小程序里每一处「会动的东西」各录一段，输出 mp4 + 一个总览片。
 *
 * 为什么按场景分文件而不是一镜到底：
 *   一镜到底要么 3 分钟没人看完，要么切点靠猜；分场景录 = 每段可单独复用（做动效说明文档、
 *   给设计看某一处手感），而且某段录坏了只重跑那一段。
 *
 * 时间轴对齐（关键）：
 *   Playwright 的 video 从 **context 创建那一刻** 就开始录，无法中途开。
 *   而每页进来都有一段 1.1s 开屏 + 退场，所以每段视频开头都会有 2.4~2.8s 的加载画面。
 *   这里在场景里记录「动作真正开始」相对 ctx 创建的时刻，写进 manifest，
 *   交给 ffmpeg 用 -ss 精确裁掉前面的空转，不让同一段开屏在 14 个文件里重复 14 次。
 *
 * 用法：
 *   node scripts/record-motion.mjs            # 全部场景
 *   node scripts/record-motion.mjs fly drawer # 只录指定场景（名字匹配）
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAW = 'outputs/motion-raw';
const OUT = 'outputs/motion';

const only = process.argv.slice(2);

/* ⚠️ 不要 rmSync 整个 RAW：增量录制（只重录某一段）时，其它段的 webm 还要留着给转码用。
   每个场景自己的子目录在下面单独清。 */
fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

/* 已存在的 manifest（增量录制时用来合并，避免「只重录一段」把其它 14 条的元数据冲掉） */
const prevManifest = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
  } catch {
    return [];
  }
})();

/* ── 场景定义 ──────────────────────────────────────────────────────
 * setup: 页面就绪后执行的动作序列
 * tail : 动作结束后继续录多久（留白给收尾动效，比如飞球落地、弹窗完全展开）
 * lead : 动作前的短暂停顿（让观众看清初始状态）
 */
const SCENES = [
  {
    key: '01-loading',
    title: '开屏动画',
    note: '品牌 Logo 入场 + 皇冠弹跳 + 海浪进度条推进 + 背景光斑流动',
    tail: 700,
    setup: async () => {}, // 什么都不做，从 goto 开始的整段就是开屏
    keepLead: true, // 这段不裁开头：开屏本身就是主角
  },
  {
    key: '02-pagetransition',
    title: '切页过场',
    note: '底部 Tab 切换时的加载过场（680ms）与内容揭幕',
    lead: 400,
    tail: 900,
    setup: async (p) => {
      await p.click('#nav-tab-home', { force: true });
      await p.waitForTimeout(120);
      await p.click('#nav-tab-menu', { force: true });
    },
  },
  {
    key: '03-flyorb',
    title: '加购飞球',
    note: '点加号 → 菜品缩略图沿抛物线飞向购物袋 → 袋子接住回弹（慢放 2 倍）',
    lead: 500,
    tail: 1800,
    /* 这段必须慢放：飞行只有 540ms，原速播放就是一闪。
       clipLen 把片子截到「点击 → 落地 + 0.4s」，慢 2 倍后刚好 2.4s，既紧凑又看得清轨迹。 */
    slowFactor: 2,
    clipLen: 1.25,
    setup: async (p) => {
      await p.locator('[aria-label="增加一份"]').first().click({ force: true });
    },
  },
  {
    key: '04-cartdrawer',
    title: '购物车抽屉',
    note: '悬浮购物车展开 / 收起，条目逐条上滑进场',
    lead: 400,
    tail: 1600,
    setup: async (p) => {
      await p.locator('[aria-label="增加一份"]').first().click({ force: true });
      await p.waitForTimeout(1500);
      const bar = p.locator('#cart-fly-orb-stage, div').filter({ hasText: /^\d+\s*件|合计|¥/ }).first();
      await bar.click({ force: true }).catch(() => {});
    },
  },
  {
    key: '05-detail',
    title: '菜品详情开合',
    note: '整页 spring：下层缩到 0.93 变暗，详情从 0.86 弹出并铺满；返回时反向收回',
    lead: 500,
    tail: 1000,
    setup: async (p) => {
      await p.getByText('牛油果鸡胸沙拉').first().click({ force: true });
      await p.waitForTimeout(1500);
      const back = p.locator('button').filter({ has: p.locator('svg.lucide-chevron-left') }).first();
      if (await back.count()) await back.click({ force: true });
      else await p.locator('button[aria-label*="返回"]').first().click({ force: true }).catch(() => {});
    },
  },
  {
    key: '06-gacha-single',
    title: '盲盒·单抽',
    note: '按钮 3D 下压 → 掀盖 → 光溢出 → 食材卡翻出 → 稀有度爆闪',
    lead: 500,
    tail: 4200,
    preDelay: 2300,
    setup: async (p) => {
      /* 必须先切到盲盒页：默认落地是「点餐」，直接点 #btn-gacha-single 会等 30s 超时
         （第一次试录就是这么挂的）。
         preDelay 让转码时把这段切页跳过 —— 否则一段 6s 的片子里有 2.3s 在切 tab。 */
      await p.click('#nav-tab-gacha', { force: true });
      await p.waitForTimeout(2300);
      await p.click('#btn-gacha-single', { force: true });
    },
  },
  {
    key: '07-gacha-ten',
    title: '盲盒·十连抽',
    note: '十连的连锁揭晓：卡片依次翻转、结果队列横向滑动',
    lead: 500,
    tail: 5200,
    preDelay: 2300,
    setup: async (p) => {
      await p.click('#nav-tab-gacha', { force: true });
      await p.waitForTimeout(2300);
      await p.click('#btn-gacha-ten', { force: true });
    },
  },
  {
    key: '08-tokens',
    title: '抽卡币面板',
    note: '顶部货币入口弹出的面板展开',
    lead: 400,
    tail: 1400,
    preDelay: 2300,
    setup: async (p) => {
      await p.click('#nav-tab-gacha', { force: true });
      await p.waitForTimeout(2300);
      await p.click('#btn-header-tokens', { force: true });
    },
  },
  {
    key: '09-banner',
    title: '首页轮播',
    note: 'Banner 手动切换的横向位移与淡入',
    lead: 400,
    tail: 900,
    preDelay: 2500,
    setup: async (p) => {
      await p.click('#nav-tab-home', { force: true });
      await p.waitForTimeout(2500);
      await p.locator('[aria-label="切换到第 3 张轮播图"]').click({ force: true });
    },
  },
  {
    key: '10-homeentry',
    title: '首页四宫格入口',
    note: '点入口卡的按压反馈 + 切页过场',
    lead: 400,
    tail: 1500,
    preDelay: 2500,
    setup: async (p) => {
      await p.click('#nav-tab-home', { force: true });
      await p.waitForTimeout(2500);
      await p.click('#home-gacha-card', { force: true });
    },
  },
  {
    key: '11-store',
    title: '门店选择弹窗',
    note: '贴纸风弹窗：遮罩模糊 + 卡片弹入 + 门店列表换选',
    lead: 400,
    tail: 1600,
    setup: async (p) => {
      await p.getByText('切换', { exact: true }).first().click({ force: true });
    },
  },
  {
    key: '12-search',
    title: '搜索弹窗',
    note: '搜索面板展开 + 打字时的结果重排',
    lead: 400,
    tail: 1500,
    preDelay: 2400,
    setup: async (p) => {
      await p.click('#nav-tab-orders', { force: true });
      await p.waitForTimeout(2400);
      await p.getByText('搜索', { exact: true }).first().click({ force: true });
      await p.waitForTimeout(600);
      await p.keyboard.type('沙拉', { delay: 90 });
    },
  },
  {
    key: '13-healthplan',
    title: '健康计划弹窗',
    note: '我的页入口 → 弹窗弹入（含数值条动画）',
    lead: 400,
    tail: 1600,
    preDelay: 2400,
    setup: async (p) => {
      await p.click('#nav-tab-me', { force: true });
      await p.waitForTimeout(2400);
      await p.getByText('健康计划', { exact: true }).first().click({ force: true });
    },
  },
  {
    key: '15-search-dish',
    title: '菜品搜索弹窗',
    note: '点餐页搜索框 → 全屏搜索面板展开 → 输入时结果实时重排',
    lead: 400,
    tail: 1800,
    setup: async (p) => {
      /* ⚠️ 点餐页搜索入口是 `div onClick`（MenuPage.tsx:359），既不是 button 也不是 input。
         第一版按 `input[placeholder*="搜索轻食"]` 点，点到了输入框本身但事件挂在父 div 上，
         结果片段里从头到尾都是点餐页 —— 弹窗根本没挂载。
         这里用 evaluate 精确找到带 cursor-pointer 且含占位文案的那一层。 */
      const opened = await p.evaluate(() => {
        const el = [...document.querySelectorAll('div')].find(
          (d) =>
            typeof d.className === 'string' &&
            d.className.includes('cursor-pointer') &&
            d.className.includes('rounded-full') &&
            (d.textContent || '').includes('搜索轻食名称')
        );
        if (!el) return false;
        el.click();
        return true;
      });
      if (!opened) throw new Error('搜索入口未找到（MenuPage 的搜索胶囊选择器失效）');
      await p.waitForTimeout(900);
      await p.keyboard.type('沙拉', { delay: 110 });
    },
  },
  {
    key: '14-tab',
    title: '底部导航切换',
    note: '五个 Tab 的选中态迁移（图标描边渐显 + 缩放）',
    lead: 300,
    tail: 800,
    setup: async (p) => {
      for (const t of ['#nav-tab-home', '#nav-tab-gacha', '#nav-tab-orders', '#nav-tab-menu']) {
        await p.click(t, { force: true });
        await p.waitForTimeout(760);
      }
    },
  },
  {
    key: '16-portion',
    title: '分量切换',
    note: '只切杯型：图标弹跳、青柠环迁移，容量 约450ml→约596ml、金额 ¥17.6→¥20.6 同步变（来回各一次）',
    lead: 400,
    tail: 1600,
    setup: async (p) => {
      /* 用户 2026-10-31：「仅演示分量的变化」—— 只留杯型这一组，
         温度 / 糖度 / 加料全部去掉（那三组另存为 17-spec-all，没有删）。
         点击仍然用 evaluate 派发，不用 locator.click：
         见 17-spec-all 的注释，locator.click 会自动滚动，连点几下会误触底部加购。 */
      const clickBtn = (text) =>
        p.evaluate((t) => {
          const btn = [...document.querySelectorAll('button')].find((b) =>
            (b.innerText || '').replace(/\s+/g, ' ').includes(t)
          );
          if (!btn) throw new Error('未找到按钮: ' + t);
          btn.click();
        }, text);

      const scrollTo = (text) =>
        p.evaluate((t) => {
          const el = [...document.querySelectorAll('div,span')].find(
            (d) => d.children.length === 0 && (d.textContent || '').trim() === t
          );
          if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, text);

      // ① 切「低卡鲜饮」分类，让饮品进首屏；点卡图进详情
      await p.mouse.click(58, 474);
      await p.waitForTimeout(1500);
      await p.mouse.click(240, 300);
      await p.waitForTimeout(1400);

      // ② 滚到杯型区，停一下让观众看清「大杯 约450ml」的初始态
      await scrollTo('杯型');
      await p.waitForTimeout(1300);

      // ③ 大杯 → 超大杯：图标弹跳、环右移、容量 450→596、金额 17.6→20.6
      await clickBtn('超大杯 +¥3');
      await p.waitForTimeout(1500);

      // ④ 超大杯 → 大杯：看反向动画与金额回落
      await clickBtn('大杯');
      await p.waitForTimeout(1400);

      // ⑤ 再切回超大杯，收在「分量加大」的状态上
      await clickBtn('超大杯 +¥3');
      await p.waitForTimeout(1300);
    },
  },
];

const picked = only.length ? SCENES.filter((s) => only.some((o) => s.key.includes(o) || s.title.includes(o))) : SCENES;

const browser = await chromium.launch({ executablePath: CHROME });
const manifest = [];

for (const scene of picked) {
  const dir = path.join(RAW, scene.key);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const t0 = Date.now();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    /* ⚠️ recordVideo.size 必须**等于 viewport 的 CSS 尺寸**，不能写成物理像素。
       第一版写成 780×1688（想拿 2 倍高清），实测结果是：页面内容按 CSS px 1:1
       贴在 780×1688 画布的**左上角**，只占 1/4，右下角一片灰底 —— 因为 Playwright
       把 size 当"画布"，内容不再跟着缩放。
       正解：size 给 390×844，铺满；后期用 ffmpeg 的 scale 做 2 倍放大（见 motion-to-mp4.mjs）。
       deviceScaleFactor 只影响渲染精度，不改视频尺寸。 */
    recordVideo: { dir, size: { width: 390, height: 844 } },
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // 等开屏退场：加载遮罩是 z-[70] 的 absolute inset-0，消失后正文才可点
  await page.waitForTimeout(2400);
  await page.waitForFunction(
    () => {
      const stage = document.getElementById('app-page-stage');
      return stage && !stage.hasAttribute('inert');
    },
    { timeout: 12000 }
  ).catch(() => {});

  const leadStart = Date.now();
  if (!scene.keepLead) await page.waitForTimeout(scene.lead);

  const actionAt = Date.now();
  let errMsg = null;
  try {
    await scene.setup(page);
  } catch (e) {
    // 不中断整体流程，也不 push 两条：这条场景照样转 mp4（前面那段过场有参考价值），
    // 只是 manifest 里标红，方便单独重跑（node scripts/record-motion.mjs <key>）。
    errMsg = String(e.message || e).split('\n')[0];
  }
  await page.waitForTimeout(scene.tail);

  const videoPath = await page.video().path();
  await ctx.close();

  const raw = path.join(RAW, `${scene.key}.webm`);
  fs.copyFileSync(videoPath, raw);

  manifest.push({
    key: scene.key,
    title: scene.title,
    note: scene.note,
    raw,
    /* 裁头公式：动作开始时刻 − 0.35s 前摇 + 场景自己声明的 preDelay。
       preDelay 是「setup 里先切 tab / 等页面就绪」的那一段，不算动效，剪掉。
       keepLead 的场景（开屏）不裁。 */
    trimStart: scene.keepLead
      ? 0
      : Math.max(0, (actionAt - t0) / 1000 + (scene.preDelay || 0) / 1000 - 0.35),
    /* 慢放 / 截取长度（可选）：转码时生效。slowFactor=2 表示时间轴拉长 2 倍。 */
    slowFactor: scene.slowFactor || 1,
    clipLen: scene.clipLen || null,
    bytes: fs.statSync(raw).size,
    error: errMsg,
  });
}

await browser.close();

/* 合并：同 key 用新录的覆盖，其它保留；最后按 SCENES 的声明顺序排。 */
const order = new Map(SCENES.map((s, i) => [s.key, i]));
const merged = new Map(prevManifest.map((m) => [m.key, m]));
for (const m of manifest) merged.set(m.key, m);
const finalManifest = [...merged.values()].sort((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99));

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(finalManifest, null, 2), 'utf8');
