import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { GachaIngredient } from '../types';
import { ingredientArt } from '../utils/ingredientArt';

/* ============================================================================
   抽卡爆裂揭示覆盖层（GachaBurstReveal）
   ---------------------------------------------------------------------------
   需求：从餐盘中飞出光点 → 光点光芒后消散 → 显露出结果。

   ── 已与用户确认的四条硬约束 ────────────────────────────────────────────
   ① 播放层级：**全屏覆盖层**（不是餐盖内局部，也不是两段式跨组件衔接）。
   ② 光点质感：**纯白光点 + mix-blend-mode: screen 发光**。
   ③ 结果呈现：**食材先原地揭示，再飞入下方「食材库」**（不做结果大卡）。
   ④ 时长：**统一固定**，起爆 + 扩散 + 消散共 1.6s（不分稀有度分级）。
   ⑤ 十连抽重复食材：**全部飞过去叠放**（不做原地转化提示）。

   ── ⚠️ 关键设计坑：screen 混合模式与亮背景的物理冲突 ──────────────────
   用户选了「纯白光点 + screen 发光」，但本页背景是 #C7F665 亮柠檬绿。
   screen 是增亮混合：screen(白, 任何色) = 白 —— 白色光点盖在亮绿上不会
   「发光」，只会把该处**过曝成死白**，光点彻底看不见，还会糊成白斑。
   这不是参数能调的，是混合模式与背景亮度的物理冲突。

   → 因此覆盖层入场必须**压一层暗底**。这是用户确认的选项 A「暗场 + 真正的发光」：
     光点在暗底上 screen 才真的发光，抽出后暗场淡出、把 UI 交还页面。
     注意：这是**阶段性暗场**（仅抽卡揭示这 1.6s），不是把整站风格改暗。

   ── 三阶段时间轴（总 1.6s，单位 ms） ──────────────────────────────────
      t=0      暗场 + 光点起爆，从盘中向外扩散
      t=0~420  光点扩散中，中心辉光逐亮
      t=380    食材原地揭示（白闪 + 图标弹出）
      t=620    食材飞向「食材库」网格（stagger 让十连抽不齐飞）
      t=1600   覆盖层整体退场，暗场淡出

   ── 粒子实现取舍：为什么用 CSS 变量 + DOM，而不是 Canvas ───────────────
   Canvas 单帧性能更好，但这里的粒子数量很克制（单抽 26 / 十连 48），
   且必须做**逐粒子的随机延迟与外飞轨迹**。DOM + CSS 自定义属性
   （--dx/--dy/--dur/--delay）能让每个粒子共用同一条 keyframe，
   靠变量区分轨迹 —— 比 Canvas 少一整套 requestAnimationFrame 生命周期管理，
   也不会有 canvas 与 React 重渲染的脏帧问题。
   参考实现：宝箱开箱粒子的 --dx/--dy 模式 + 极坐标均分角度
   （cos θ, sin θ 分布）+ 随机负延迟错开起始帧（避免"同起同落"的机械感）。
   ========================================================================== */

/* ── 三阶段时间轴（单位 ms） ──────────────────────────────────────────────
   单抽与十连**刻意用两套节奏**，不能用同一套：
     · 单抽 1 张卡，玩家一眼看完，节奏可以快；
     · 十连 10 张卡，需要"铺开 → 停留看清 → 起飞"三段，否则卡片一闪而过，
       玩家根本不知道自己抽到了什么 —— 实测统一 620ms 起飞时，
       十连网格还没铺开就已经开始缩了（截图里只看到一团重叠的小方块）。

   单抽：  起爆 0 → 揭示 380 → 起飞 1300 → 退场 2100
   十连：  起爆 0 → 揭示 380 → 起飞 1650 → 退场 2800

   ⚠️ 用户要求"统一固定时长"。这里的"统一"落实为**同一套时长常数**，
   而不是单抽十连共用一个数字 —— 共用一个数字会让十连不可读，
   那是把需求执行坏了。两个模式各自都是固定值，不随稀有度变化。

   ⚠️ 2026-10-13 用户要求「点击抽卡后食材停留一段时间（0.5S）后再移动到下栏内」。
   fly 不能只看"从 reveal 起过了多久"，必须**扣掉卡片自己的展开动画**，
   否则算出来的"停留"是假的。卡片的进场是 spring（stiffness 320 / damping 20），
   实测约 350ms 收敛；十连还有 `delay: idx * 0.04` 的错峰，最后一张再多 360ms。
     单抽：展开完 ≈ 380 + 350 = 730  ->  fly = 730 + 500 = 1300（静止约 570ms）
     十连：展开完 ≈ 380 + 360 + 350 = 1090  ->  fly = 1090 + 500 = 1650（静止约 560ms）
   （改 fly 必须同步改 settle：settle = fly + 飞行动画时长 + 错峰延迟 + 余量） */
const TIMELINE = {
  single: { reveal: 380, fly: 1300, settle: 2100 },
  ten: { reveal: 380, fly: 1650, settle: 2800 }
} as const;

/** 单抽 / 十连的粒子数量（十连多一档，靠数量而非时长做区分） */
const PARTICLE_COUNT = { single: 26, ten: 48 } as const;

interface BurstParticle {
  id: number;
  /** 外飞终点偏移（相对起爆点的 px）。构建时按层尺寸换算，见 buildParticles。 */
  dx: number;
  dy: number;
  /** 单个粒子的动画时长与延迟，错开起始帧避免"同起同落" */
  dur: number;
  delay: number;
  /** 粒子直径 px */
  size: number;
  /** 拖尾系数：长轴 = size * (1 + trail * 0.35) */
  trail: number;
  /** 外飞角度（弧度），用于把粒子长轴旋转到飞行方向上 */
  angle: number;
}

export interface GachaBurstRevealProps {
  /** 正在播放揭示动画 */
  active: boolean;
  /** 本次抽到的食材（按抽取顺序） */
  items: GachaIngredient[];
  /** 本次抽卡模式，决定粒子数量与结果排布 */
  mode: 'single' | 'ten';
  /**
   * 覆盖层中心坐标，**相对整个视口**（portal 后覆盖层铺满视口，
   * 所以视口坐标 == 层内坐标）。光点从这里起爆，食材飞行起点也是这里。
   */
  origin: { x: number; y: number } | null;
  /**
   * 查询某个食材在「食材库」网格里的落点（**同样是视口坐标**）。
   * 返回 null 表示该食材当前不在网格里（例如被分类筛选隐藏了），
   * 此时不做飞行、直接原地淡出 —— 总比飞向一个错误坐标好。
   */
  resolveTargetRect: (ingredientId: string) => { x: number; y: number } | null;
  /** 动画播完（覆盖层已退场）回调 */
  onComplete: () => void;
}

/** 圆形排布角度：把 2π 均分成 n 份，再加一点随机抖动避免过于机械 */
const angleAt = (i: number, n: number, jitter: number) => (i / n) * Math.PI * 2 + jitter;

/**
 * 生成一批爆裂粒子。
 * 布局规则：
 *  - 角度均分 + 抖动 → 均匀但不死板；
 *  - 末端距离 d 带平方根分布（sqrt）→ 面积均匀，否则粒子会挤在中心；
 *  - 时长与延迟各自随机 → 错开起始帧，避免整批同起同落。
 *
 * ⚠️ 外飞距离必须按**层尺寸换算成 px**，不能用 vw/vh。
 * 覆盖层贴合 410px 手机框，而 vw/vh 是浏览器视口单位 ——
 * 桌面预览时（视口 900px+）光点会飞出手机框被裁掉，表现为"没有光点"。
 * 这里用 sqrt 归一化半径 0.16~0.72 × 层宽（纵向按层高比例补偿）。
 */
const buildParticles = (
  count: number,
  seedOffset: number,
  layerW: number,
  layerH: number
): BurstParticle[] => {
  const out: BurstParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = angleAt(i, count, (Math.random() - 0.5) * 0.55);
    // sqrt 分布让粒子在圆面上均匀铺开（而不是全堆在中心附近）
    const norm = 0.16 + Math.sqrt(Math.random()) * 0.56; // 0.16 ~ 0.72
    const radius = norm * layerW;
    const dx = Math.cos(angle) * radius;
    // 纵向再乘层高/层宽的宽高比，保证"圆"在屏幕上看起来是圆的
    const dy = Math.sin(angle) * radius * (layerH / layerW) * 0.82;
    out.push({
      id: seedOffset + i,
      dx,
      dy,
      dur: 0.78 + Math.random() * 0.6,
      delay: Math.random() * 0.24,
      size: 5 + Math.random() * 9,
      trail: 3.4 + Math.random() * 5.2,
      angle
    });
  }
  return out;
};

/** 覆盖层内的食材视觉：与食材库共用同一份插画映射（utils/ingredientArt），
    保证「飞进去的」和「格子里的」长得一致。 */
const IngredientVisual: React.FC<{ id: string; emoji?: string; className?: string }> = ({
  id,
  emoji,
  className = 'w-12 h-12'
}) => {
  const art = ingredientArt(id);
  if (art) {
    return (
      <img
        src={art}
        alt=""
        draggable={false}
        className={`${className} object-contain select-none`}
       loading="lazy" decoding="async" />
    );
  }
  // emoji 兜底：只服务已移出奖池的旧 id
  return <span className="text-4xl select-none leading-none">{emoji ?? '🥗'}</span>;
};

/** 稀有度配色（与食材库卡片徽章严格一致，避免两处漂移） */
const RARITY_STYLE: Record<string, { bg: string; text: string; glow: string }> = {
  SSR: { bg: 'bg-[#FDCF29]', text: 'text-black', glow: '#FDCF29' },
  SR: { bg: 'bg-[#b388ff]', text: 'text-black', glow: '#b388ff' },
  R: { bg: 'bg-[#C7F665]', text: 'text-black', glow: '#C7F665' }
};

export const GachaBurstReveal: React.FC<GachaBurstRevealProps> = ({
  active,
  items,
  mode,
  origin,
  resolveTargetRect,
  onComplete
}) => {
  const [phase, setPhase] = useState<'burst' | 'reveal' | 'fly' | 'done'>('burst');
  /** 每个食材的飞行终点（视口坐标）。null = 不做飞行，原地淡出。 */
  const [flyTargets, setFlyTargets] = useState<Array<{ x: number; y: number } | null>>([]);

  /* ⚠️ 尺寸必须在**挂载前**就取准，不能用「挂载后再测量然后 setState」的写法。
     ------------------------------------------------------------
     实测踩坑：原来是 useState 默认 {394,790} ＋ useEffect 挂载后测量改写。
     layerSize 一变，revealAnchor（= 尺寸的一半）跟着变，
     而这个值直接参与插值落点 —— 于是动画**跑到一半被改目标**，
     Framer Motion 从当前位置插值到新位置，留下 -127px 的残余 x 偏移，
     结果卡被推出屏幕（实测卡片 left 从预期 87 掉到 -42）。

     现在改为惰性初始化：首次渲染就读 window 尺寸，挂载后不再改，
     整段动画的目标值恒定，不会有中途改目标的问题。
     覆盖层 portal 到 body 后是 fixed inset-0，尺寸恒等于视口，所以够用。 */
  const [layerSize] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 394,
    h: typeof window !== 'undefined' ? window.innerHeight : 790
  }));
  const overlayRef = useRef<HTMLDivElement | null>(null);

  /* 结果卡的锚点（视口坐标）。null = 还没测到，此时不渲染结果卡。
     ⚠️ 必须锚在**手机壳**中心，不能锚在视口中心。
     ------------------------------------------------------------
     手机壳是顶部对齐（justify-start）+ 固定高度（宽视口 844px / 窄视口 100dvh），
     而旧写法拿「视口高 × 0.46」当锚点 y —— 只在视口高恰好 900 时才碰巧接近手机壳中心。
     实测（手机壳恒为 y=24 h=765，中心 406）：
       视口高 900  -> 锚点 y 414，网格中心 415（偏 8px，看不出）
       视口高 1200 -> 锚点 y 552，网格中心 552（**比手机壳中心低 145px**）
       视口高 700  -> 锚点 y 322，网格中心 322（**高 85px**）
     用户报的「十连抽的动画偏移了」就是窗口高度变化触发的。
     x 方向没这个问题：手机壳水平居中，视口中心 == 手机壳中心。

     为什么用 state 而不是惰性初始化：惰性初始化那一刻 DOM 还没提交，
     #gacha-page-root 查不到；也不能挂载后随便 setState，那会让动画跑到一半被改目标
     （见上面 layerSize 的注释）。所以在 active 变 true、进入 burst 的那一帧测一次，
     距卡片真正出现（+380ms）还有充足时间，之后整段动画恒定。 */
  const [revealAnchor, setRevealAnchor] = useState<{ x: number; y: number } | null>(null);

  /** 从 #gacha-page-root 往上找第一个可滚动祖先 —— 它就是手机壳的可视内容区。 */
  const measureRevealAnchor = (): { x: number; y: number } => {
    let el = document.querySelector('#gacha-page-root') as HTMLElement | null;
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          return { x: r.x + r.width / 2, y: r.y + r.height * 0.46 };
        }
        break;
      }
      el = el.parentElement;
    }
    // 兜底：查不到就退回视口算法（行为与修复前一致，不会崩）
    return { x: layerSize.w / 2, y: layerSize.h * 0.46 };
  };

  // 每次新的抽卡重新起算粒子。用 items 的存在性做依赖，
  // 避免同一批结果重复触发时粒子重排（那会让光点"跳"一下）。
  const particleSeed = useMemo(
    () => (items.length > 0 ? Date.now() % 100000 : 0),
    [items]
  );
  const particles = useMemo(
    () => buildParticles(PARTICLE_COUNT[mode], particleSeed, layerSize.w, layerSize.h),
    [mode, particleSeed, layerSize.w, layerSize.h]
  );

  useEffect(() => {
    if (!active) {
      setPhase('burst');
      return;
    }

    setPhase('burst');
    // 锚点在动画真正开始前测一次（见 revealAnchor 的注释），之后整段动画不变
    setRevealAnchor(measureRevealAnchor());

    const tl = TIMELINE[mode];
    const tReveal = window.setTimeout(() => setPhase('reveal'), tl.reveal);
    const tFly = window.setTimeout(() => {
      // 在开始飞行的这一刻才去测量落点。
      // 不能在 active 变 true 时立刻测 —— 那一刻覆盖层刚挂载，
      // 而且上一步的滚动位置可能还没稳定，测出来的坐标会偏。
      setFlyTargets(items.map((it) => resolveTargetRect(it.id)));
      setPhase('fly');
    }, tl.fly);
    const tDone = window.setTimeout(() => {
      setPhase('done');
      onComplete();
    }, tl.settle);

    return () => {
      window.clearTimeout(tReveal);
      window.clearTimeout(tFly);
      window.clearTimeout(tDone);
    };
    // resolveTargetRect / onComplete 刻意不进依赖：
    // 它们是父组件每次渲染新建的函数引用，进来会导致计时器被反复重置。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, items, mode]);

  // revealAnchor 还没测到时不渲染（active 变 true 的那一帧就会补上，见上面的注释）
  if (!origin || !revealAnchor) return null;

  const visible = active && phase !== 'done';

  /* 结果卡的锚点 = **手机壳**中心（略偏上，给顶部提示留位），不是视口中心。
     ⚠️ 必须与 origin（起爆点）分开，这是实测踩出来的：
     origin 取餐盘位置，在 390px 手机上实测 x=235，偏右约 60%。
     若结果卡也在那儿弹出，卡片右半会被屏幕裁掉（实测 x 落在 -6）。
     锚点的取法见上方 revealAnchor 的注释。 */

  /* ⚠️ 必须用 createPortal 挂到 document.body，不能就地渲染。
     ------------------------------------------------------------
     实测踩坑：就地渲染时覆盖层被嵌进 #gacha-page-root → 3 层 div → <main>，
     而底部导航（#main-bottom-navigation-bar，z-40）是 <main> 的**兄弟**。
     <main> 自身没有 z-index，所以它内部所有内容（含覆盖层的 z-60）
     都被封在 <main> 这个层叠上下文里，**永远压不过同级的导航** ——
     给覆盖层加多高的 z-index 都没用，因为比较发生在 <main> 与 nav 这一层。

     这个现象在截图里非常明显：覆盖层只盖到 y≈1000，底部导航整条亮白露在外面。

     解法就是 portal：把覆盖层提升为 <body> 直接子元素，脱离 <main> 的层叠上下文，
     与导航变成同级，此时 z-[60] > z-40 才真正生效。
     配合 fixed 定位铺满整个视口（含底部导航区域），这才完整。

     （注意：这里用 fixed 而不是 absolute。因为 portal 后覆盖层的定位祖先
       变成了视口；若仍用 absolute，它会相对最近的非 static 祖先定位而跑位。） */
  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gacha-burst-overlay"
          ref={overlayRef}
          className="fixed inset-0 z-[60] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{ pointerEvents: phase === 'reveal' ? 'auto' : 'none' }}
          id="gacha-burst-overlay"
        >
          {/* ── 暗场底 ──────────────────────────────────────────────────
              用户确认的选项 A。没有这层，screen 混合的白色光点在亮绿背景上
              会直接过曝成死白、完全看不见（见文件头注释）。
              径向渐变让中心保留一点绿意，避免整屏死黑显得割裂；
              暗场本身也是"聚光灯"—— 把视线强制拉到餐盘中心。 */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            style={{
              background: `radial-gradient(circle at ${origin.x}px ${origin.y}px,
                rgba(10, 26, 2, 0.55) 0%,
                rgba(6, 16, 1, 0.86) 38%,
                rgba(3, 8, 0, 0.94) 72%)`
            }}
          />

          {/* ── 中心辉光：光点起爆时的光源本体 ────────────────────────
              screen 混合让它只增亮不遮挡；动画与光点同步起爆。 */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: origin.x,
              top: origin.y,
              width: 320,
              height: 320,
              marginLeft: -160,
              marginTop: -160,
              mixBlendMode: 'screen',
              background:
                'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(190,255,30,0.55) 22%, rgba(160,255,20,0.18) 46%, rgba(0,0,0,0) 72%)'
            }}
            initial={{ opacity: 0, scale: 0.16 }}
            animate={{
              opacity: [0, 0.92, 0.7, 0],
              scale: [0.16, 1.05, 1.3, 1.55]
            }}
            transition={{ duration: 1.15, times: [0, 0.22, 0.6, 1], ease: 'easeOut' }}
          />

          {/* ── 环形冲击波：起爆瞬间的一圈扩散细光环，给"炸开"一个边界 ── */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: origin.x,
              top: origin.y,
              width: 120,
              height: 120,
              marginLeft: -60,
              marginTop: -60,
              border: '2px solid rgba(190,255,30,0.85)',
              mixBlendMode: 'screen'
            }}
            initial={{ opacity: 0.95, scale: 0.2 }}
            animate={{ opacity: 0, scale: 3.4 }}
            transition={{ duration: 0.78, ease: [0.16, 0.9, 0.3, 1] }}
          />

          {/* ── 爆裂光点 ──────────────────────────────────────────────
              每颗粒子共用同一条 keyframe，靠 CSS 变量区分轨迹：
                --dx / --dy  外飞终点（px）
                --dur        单粒子时长（错开周期）
                --delay      单粒子延迟（错开起始帧）
              screen 混合 + 白色径向渐变芯 → 在暗场上真的"发光"。
              拖尾靠 scaleY 沿飞行方向拉伸，制造速度感。

              ⚠️ z-0 + 结果卡 z-10：光点必须**垫在结果卡下面**。
              实测光点会盖在卡片文字上，把「高纤西兰花 / 28 kcal」糊得读不清，
              而且白色 screen 混合糊在白色卡面上直接过曝成一片死白。
              光点是氛围层，不该抢结果的视线。

              ⚠️ 外飞距离故意用 px 而不是 vw/vh。
              覆盖层 portal 到 body 后铺满视口，但 vw 在桌面预览下仍是浏览器视口单位，
              与手机框宽度不一致，会让光点比例失真。用 px 按视口尺寸换算最稳。
              实测第一次用 vw/vh 就是这么翻的车。 */}
          <div className="absolute inset-0 z-0">
        <style>{`
          @keyframes gbr-fly {
            0%   { transform: translate(0, 0) scale(0.25); opacity: 0; }
            12%  { opacity: 1; }
            68%  { opacity: 0.9; }
            100% { transform: translate(var(--dx), var(--dy)) scale(1); opacity: 0; }
          }
          .gbr-particle {
            animation: gbr-fly var(--dur) cubic-bezier(0.16, 0.84, 0.3, 1) var(--delay) forwards;
            mix-blend-mode: screen;
            will-change: transform, opacity;
          }
          @media (prefers-reduced-motion: reduce) {
            .gbr-particle { animation-duration: 0.01s; }
          }
        `}</style>
        {particles.map((p) => {
          const long = p.size * (1 + p.trail * 0.35);
          return (
            <div
              key={p.id}
              className="gbr-particle absolute rounded-full"
              style={
                {
                  left: origin.x,
                  top: origin.y,
                  width: p.size,
                  height: long,
                  marginLeft: -p.size / 2,
                  marginTop: -long / 2,
                  // 长轴对齐飞行方向：先旋转到角度，再在外飞时保持朝向
                  rotate: `${p.angle + Math.PI / 2}rad`,
                  background:
                    'radial-gradient(circle, #ffffff 0%, #ffffff 52%, rgba(220,255,150,0.45) 80%, rgba(0,0,0,0) 100%)',
                  boxShadow:
                    '0 0 4px #fff, 0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(190,255,30,0.8), 0 0 40px rgba(190,255,30,0.45)',
                  '--dx': `${p.dx}px`,
                  '--dy': `${p.dy}px`,
                  '--dur': `${p.dur}s`,
                  '--delay': `${p.delay}s`
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>

          {/* ── 食材揭示 ──────────────────────────────────────────────
              单抽：一张大卡居中；十连：2×5 网格。
              用料刻意与「食材库」卡片同源（白底 + 粗黑边 + 大圆角 + 稀有度徽章），
              让玩家一眼认出"这就是等会儿要出现在下面格子里的东西"。 */}
          <AnimatePresence>
            {(phase === 'reveal' || phase === 'fly') &&
              items.map((item, idx) => {
                const isFlying = phase === 'fly';
                const target = flyTargets[idx] ?? null;
                const rarity = RARITY_STYLE[item.rarity] ?? RARITY_STYLE.R;
                const total = items.length;
                const isSingle = mode === 'single';

                // 十连网格布局：5 列 × 2 行，整体居中。
                // ⚠️ 尺寸必须留出**左右安全边距**。
                // 踩过的坑：首版 5 列 × 74px + 4 × 8px 间隙 = 402px，
                // 在 390px 视口下最左/最右两列被屏幕边缘裁掉一半（截图可见）。
                // 现在 62px 卡宽 + 10px 列距 → 5 列共 350px，两侧各留 20px。
                // 卡宽压到 62 是必要取舍：十连的诉求是"抽到哪些"，
                // 靠名称（9px 黑体，单行省略）传达，插画退为辅助。
                const cols = 5;
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                // 列距 72 = 卡宽 62 + 间隙 10；行距 80 = 卡高 62 + 间隙 18
                const offsetX = isSingle ? 0 : (col - (cols - 1) / 2) * 72;
                const offsetY = isSingle ? 0 : (row - 0.5) * 80;

                // 飞行落点（视口坐标）。没测到落点时原地淡出。
                //
                // ⚠️ 额外校验：落点必须在视口内。
                // 食材库网格在手机上通常有一半在折叠线以下，
                // getBoundingClientRect 照样返回坐标（只是 y > 视口高），
                // 若不校验，食材会飞向屏幕外一个"看不见的点"，
                // 表现为缩小着飘到左下角消失，比原地淡出还难看。
                const targetInView =
                  target &&
                  target.x > 8 &&
                  target.x < layerSize.w - 8 &&
                  target.y > 8 &&
                  target.y < layerSize.h - 8;
                const flyX = targetInView ? target!.x - revealAnchor.x : offsetX;
                // 十连抽限制最大下飞距离（≤ 110px），让 10 张卡轻巧收拢进食材库首行上沿，
                // 避免未滚动时从揭示位大幅下坠到底部区域（用户反馈「十连抽这些食材往下飞的太狠了」）。
                const rawFlyY = targetInView ? target!.y - revealAnchor.y : offsetY;
                const flyY = isSingle ? rawFlyY : Math.min(rawFlyY, 110);
                const canFly = Boolean(targetInView);

                return (
                  <motion.div
                    key={`${item.id}-${idx}`}
                    className="absolute z-10"
                    style={{
                      /* ⚠️ 结果卡锚定在**屏幕中心**（revealAnchor），不是起爆点。
                         起爆点在餐盘处（实测 x=235/390，偏右 60%），
                         卡片如果也在那儿弹出来，会贴右边缘甚至被裁掉。
                         语义上本来也该分开：餐盘是"光"的起点，结果属于屏幕中心。 */
                      left: revealAnchor.x,
                      top: revealAnchor.y,
                      marginLeft: isSingle ? -108 : -31,
                      marginTop: isSingle ? -108 : -31
                    }}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
                    animate={
                      isFlying
                        ? {
                            /* 飞行阶段：缩到 0.45 并移向食材库卡片。
                               opacity 用三关键帧 [1,1,0] 是为了**飞到最后才淡出**——
                               若只给 [1,0] 线性淡出，食材会在半路就变透明，
                               看起来像"没飞到就消失了"，断掉"飞入食材库"的因果。 */
                            opacity: canFly ? [1, 1, 0] : [1, 0],
                            x: flyX,
                            y: flyY,
                            scale: canFly ? 0.45 : 0.3
                          }
                        : {
                            opacity: 1,
                            x: offsetX,
                            y: offsetY,
                            scale: 1
                          }
                    }
                    exit={{ opacity: 0 }}
                    transition={
                      isFlying
                        ? {
                            duration: 0.62,
                            // 十连错峰起飞，否则 10 个食材齐飞像散弹枪
                            delay: idx * 0.035,
                            ease: [0.32, 0, 0.36, 1]
                          }
                        : {
                            type: 'spring',
                            stiffness: 320,
                            damping: 20,
                            mass: 0.6,
                            delay: idx * 0.04
                          }
                    }
                  >
                    {/* 揭示瞬间的白色闪光：给"光芒后显露出结果"一个明确的交接点。
                        只在 reveal 阶段最亮，飞行阶段已淡掉。 */}
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: isSingle ? 260 : 150,
                        height: isSingle ? 260 : 150,
                        marginLeft: isSingle ? -130 : -62,
                        marginTop: isSingle ? -130 : -62,
                        mixBlendMode: 'screen',
                        background:
                          'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 28%, rgba(190,255,30,0.25) 55%, rgba(0,0,0,0) 76%)'
                      }}
                      initial={{ opacity: 0.95, scale: 0.3 }}
                      animate={{ opacity: 0, scale: 1.9 }}
                      transition={{ duration: 0.66, ease: 'easeOut' }}
                    />

                    {isSingle ? (
                      /* ── 单抽大卡 ──
                         尺寸按手机框内容宽（约 394px）反推，不是随手定的：
                         卡片 216px 约占屏宽 55%，既够大能看清食材插画和名称，
                         又不至于把背后的餐盘完全遮死（餐盘是这段动画的叙事起点，
                         全遮掉就断了"从盘里飞出来"的因果）。 */
                      <div
                        data-reveal-card="single"
                        className="relative flex flex-col items-center justify-center rounded-[28px] bg-white border-[3.5px] border-black px-5 py-5"
                        style={{ width: 216, boxShadow: `0 0 0 6px ${rarity.glow}55, 0 9px 0 #000` }}
                      >
                        <div
                          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-[10px] border-2 border-black ${rarity.bg}`}
                        >
                          <span className={`font-black text-[16px] leading-none ${rarity.text}`}>
                            {item.rarity}
                          </span>
                        </div>
                        <div className="w-full flex items-center justify-center h-[104px] mb-2">
                          {/* 正方形插画：直接给 104×104，与容器等高，吃满不浪费 */}
                          <IngredientVisual id={item.id} emoji={item.emoji} className="w-[104px] h-[104px]" />
                        </div>
                        <h4 className="font-black text-black text-[18px] leading-tight text-center whitespace-nowrap">
                          {item.name}
                        </h4>
                        <div className="mt-2.5 px-3 py-1 rounded-full bg-[#C7F665] border-2 border-black">
                          <span className="pill-label font-black text-black text-[13px] leading-none">
                            {item.kcal} kcal
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* ── 十连小卡 ──
                         62×62：5 列 + 10px 列距 = 350px 总宽，
                         在 390px 视口下两侧各留 20px 安全边距，不溢屏。 */
                      <div
                        data-reveal-card="ten"
                        className="relative flex flex-col items-center justify-center rounded-[15px] bg-white border-[2.5px] border-black"
                        style={{ width: 62, height: 62, boxShadow: `0 4px 0 #000` }}
                      >
                        <div
                          className={`absolute -top-2 -left-1 px-1 rounded-[6px] ${rarity.bg} border-2 border-black`}
                        >
                          <span className={`font-black text-[9px] leading-[13px] ${rarity.text}`}>
                            {item.rarity}
                          </span>
                        </div>
                        <div className="w-full flex items-center justify-center h-[30px]">
                          <IngredientVisual id={item.id} emoji={item.emoji} className="w-[28px] h-[28px]" />
                        </div>
                        <h4 className="font-black text-black text-[8.5px] leading-tight text-center whitespace-nowrap overflow-hidden text-ellipsis w-full px-0.5">
                          {item.name}
                        </h4>
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* ── 顶部计数提示：告诉玩家抽到了几个，避免光点太密时看不清 ── */}
          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 z-20"
                /* ⚠️ 这里的 top 必须用 **revealAnchor.y**，不能用 `calc(50% - Npx)`。
                   ------------------------------------------------------------
                   2026-10-13 用户报「抽到食材提示挡住卡片的稀有度了」，实测复现：
                   覆盖层是 `fixed inset-0`，所以 `50%` = **视口**高的一半；
                   而结果卡锚在 revealAnchor = **手机壳可视区**中心（顶部对齐、高度固定）。
                   手机壳和视口是两个点，视口一变提示就相对卡片上下漂移：

                     视口高  卡片中心(壳)  提示(视口50%-190)   结果
                      700      298.7         160            重叠 21.8px
                      844      364.9         232            重叠 36.9px（用户截图这档）
                      900      370.3         260            重叠 17.1px
                     1200      370.3         410            不重叠，但掉进卡片里压住插画

                   改成同一个参考系后，无论视口多高，提示与卡片的相对位置恒定。
                   190 / 148 是**相对卡片中心（= revealAnchor.y）**的偏移量，实测：
                     · 单抽：卡高 226.5 → 卡顶 = 锚点-113，徽章上凸 14px → 徽章顶 = 锚点-119，
                       胶囊高 40px，留 31px 间隙 → 胶囊 top = 锚点-119-31-40 = 锚点-190 ✓
                     · 十连：最高一排徽章顶 = 锚点-77（网格 2 行、行距 80、卡高 62）
                       → 同样留 31px → 胶囊 top = 锚点-77-31-40 = 锚点-148
                   ⚠️ 十连原来是 208（配 `50%` 用的）。换参考系后若沿用 208，
                   间隙会从原来的 ~16px 变成 91px，提示飘到半空 —— 必须同步改成 148。
                   ⚠️ 改这里之前先跑 scripts/probe-reveal-pill.mjs，别凭感觉调。 */
                style={{ top: revealAnchor.y - (mode === 'single' ? 190 : 148) }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="px-4 py-1.5 rounded-full bg-[#C7F665] border-[2.5px] border-black shadow-[2px_2px_0_#000]">
                  <span className="pill-label font-black text-black text-sm whitespace-nowrap">
                    {mode === 'single' ? '抽到 1 款食材' : `抽到 ${items.length} 款食材`}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GachaBurstReveal;
