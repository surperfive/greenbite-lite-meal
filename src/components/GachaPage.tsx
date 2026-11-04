import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GACHA_INGREDIENTS } from '../data/mockData';
import { GachaIngredient, Coupon, Dish } from '../types';
import { FoodCloche3D } from './FoodCloche3D';
import { GachaBurstReveal } from './GachaBurstReveal';
// 暂未接入：背景目前是内联 img + SVG 波浪层。见文件末尾「未接入的常量」说明。
import { CloudSkyBackground } from './CloudSkyBackground';
import { CheckBadge, CheckIcon } from './CheckBadge';
import TokenIcon from './TokenIcon';
import { StickerModal, StickerButton } from './StickerModal';
import { OPTION_CARD_SELECTED, OPTION_CARD_UNSELECTED } from '../tokens';
import { resumeAudio, warmUpAudio } from '../utils/audioContext';
import { ingredientArt } from '../utils/ingredientArt';
import {
  X,
  Check,
  Plus,
  RefreshCw,
  Award,
  Info,
  Truck,
  ArrowRight
} from 'lucide-react';

interface GachaPageProps {
  onClaimCoupon?: (coupon: Coupon) => void;
  onAddToCart?: (dish: Dish, qty?: number) => void;
  onNavigate: (tab: string) => void;
  onShowToast: (msg: string) => void;
}

const MIN_DELIVERY_ITEMS = 10;

/* 「9折限时」气泡路径（2026-10-30 用户「修改的更像气泡框一点，参考优秀案例」）
   一个 `d` 同时给白底和粉气泡用：白底 = 同路径 + stroke 12（6 外扩）+ 圆角 join，
   粉气泡 = 同路径只填色盖在上面。**为什么不能再用「整体平移 6」的双路径**：尾巴是斜的，
   固定 (∓6,±6) 平移会让尾巴两侧白边厚薄不均（外侧厚、内侧薄）；描边法沿法线外扩，天然均匀。

   几何（viewBox 0 0 810 241 用户单位）：
   · 主体 x 634.5~786.5 / y 22~69，**rx 16**（不是 h/2 —— 全圆胶囊没有直边，读起来是标签不是气泡）
   · 尾巴底边 666~692、尖端 (662,87)：深 18（≈主体高 47 的 38%），左偏 17 ⇒ 指向左下的十连抽按钮
   · 右缘贝塞尔 `C683,69 675,78 662,87`：以**水平切线**离开底边 ⇒ 与底边平滑相接
   · 左缘 `L666,69`：从尖端近垂直上升（dx4/dy-18），与底边夹角 ≈103° ⇒ 干净的内凹缺口，不会拉成尖刺
     ⚠️ 别把左缘也做成「切向回归」：那要求控制点落在 y=69 且 x>666，会先向右冲再折回，形成鸟嘴状卷曲
   · 尖端会被 stroke 的圆角 join 兜成 r6 的白帽；尾巴深度必须 ≥17 才让这个白帽占比正常
     （深 12 时白帽占一半，看着像圆疙瘩 —— 这是 `_bubble-white-ab.html` 扫 14/17/20/23 得出的）
   · 尖端 (662,87) 落在十连抽按钮面上；右侧黑箭头圆 x 677~755、顶 y=94，尾巴离它 15 单位，
     不会被白色圆帽蹭到（原来放在 672~698 时只差 1 单位，视觉上快贴上了） */
const DISCOUNT_BUBBLE_D =
  'M650.5,22 H770.5 A16,16 0 0 1 786.5,38 V53 A16,16 0 0 1 770.5,69 H692 ' +
  'C683,69 675,78 662,87 L666,69 H650.5 A16,16 0 0 1 634.5,53 V38 A16,16 0 0 1 650.5,22 Z';

// Daily Tasks for getting more Gacha coins
const DAILY_TASKS = [
  { id: 'sign', title: '每日签到', reward: '+1 抽卡币', icon: 'calendar', done: false, actionText: '领 1 币' },
  { id: 'browse', title: '浏览特惠', reward: '+1 抽卡币', icon: 'flame', done: false, actionText: '去完成' },
  { id: 'order', title: '完成点单', reward: '+5 抽卡币', icon: 'utensils', done: false, actionText: '去点餐' },
  { id: 'share', title: '好友助力', reward: '+1 抽卡币', icon: 'share', done: false, actionText: '去邀请' },
];

// Drop Rate Specifications
// ⚠️ 2026-10-15 配色统一：这里原先写的是 Tailwind 的 amber-400/yellow-500 和
//    purple-500/indigo-500，与实际渲染的稀有度徽章（SSR #ffb400 / SR #b388ff / R #C7F665，
//    见 GachaBurstReveal.tsx 的 RARITY_STYLE）**不是同一套色**。
//    本表页面未渲染（见文件末尾说明），但留着会误导后人，已改成与徽章同一套 hex。
const DROP_RATES = [
  { rarity: 'SSR', title: '深海优质蛋白/牛排', rate: '15%', color: 'from-[#FDCF29] to-[#FDCF29]', border: 'border-[#FDCF29]', bg: 'bg-[#FDCF29]/15', text: 'text-black' },
  { rarity: 'SR', title: '牛油果/藜麦/海虾', rate: '35%', color: 'from-[#b388ff] to-[#b388ff]', border: 'border-[#b388ff]', bg: 'bg-[#b388ff]/15', text: 'text-black' },
  { rarity: 'R', title: '鲜蔬配料/低卡主基底', rate: '50%', color: 'from-[#C7F665] to-[#C7F665]', border: 'border-[#C7F665]', bg: 'bg-[#F2FCE0]', text: 'text-[#26430B]' },
];

export const GachaPage: React.FC<GachaPageProps> = ({
  onAddToCart,
  onNavigate,
  onShowToast
}) => {
  // Skip animation toggle
  const [skipAnimation, setSkipAnimation] = useState(false);

  // User Gacha Token balance
  const [tokens, setTokens] = useState(12);

  // Daily check-in status (only 1 coin per day)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [isClocheOpen, setIsClocheOpen] = useState(false);
  const [drawRarity, setDrawRarity] = useState<'SSR' | 'SR' | 'R' | null>(null);
  const [drawnIngredients, setDrawnIngredients] = useState<GachaIngredient[]>([]);
  const [lastDrawMode, setLastDrawMode] = useState<'single' | 'ten'>('single');
  // 「9折限时」徽章是否已停止促销动效（用户至少抽过一次十连抽后就不再打扰）。
  // ⚠️ 不能复用 lastDrawMode 判据：它初始值就是 'single'，
  // 拿它当"是否抽过十连抽"会在进页面时误判为已用过。
  const [hasUsedTenDraw, setHasUsedTenDraw] = useState(false);
  // 食材横向滑动队列的当前页索引（分页圆点指示用）。
  // 每次开弹窗重置到 0 —— 否则上次滑到第 5 个，重新打开会停在那儿。

  // Modals
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showGetTokensModal, setShowGetTokensModal] = useState(false);
  const [showDeliverySuccessModal, setShowDeliverySuccessModal] = useState(false);

  /* ==========================================================================
     「食材图鉴」弹窗滚动
     --------------------------------------------------------------------------
     2026-10-27 用户「这个介绍太长了，可以做滚轮滑动」。
     旧实现已经写了 overflow-y-auto，但有三个原因让它**看起来根本不能滚**：
       ① 全局 `*::-webkit-scrollbar { display: none }`（index.css 450 行）把
          滚动条藏了，屏幕上没有任何"下面还有"的提示；
       ② 只有指针正好落在列表上滚轮才生效，落在标题或底部按钮上完全没反应；
       ③ 最后一行被拦腰切一半，读起来像渲染坏了，不像"还能往下滑"。
     现在 = 整张卡片任意位置滚轮都转给列表 + 细滚动条 + 上下渐隐遮罩。
     ========================================================================== */
  const dexListRef = useRef<HTMLDivElement | null>(null);
  const dexCardRef = useRef<HTMLDivElement | null>(null);
  const [dexScroll, setDexScroll] = useState({ top: true, bottom: true });

  const syncDexScroll = useCallback(() => {
    const el = dexListRef.current;
    if (!el) return;
    const atTop = el.scrollTop <= 2;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    setDexScroll((prev) =>
      prev.top === atTop && prev.bottom === atBottom ? prev : { top: atTop, bottom: atBottom },
    );
  }, []);

  // 打开弹窗后量一次：内容不溢出时不能留遮罩，否则底部一条白雾永远糊在最后一行上
  useEffect(() => {
    if (!showChecklistModal) return;
    const id = requestAnimationFrame(syncDexScroll);
    return () => cancelAnimationFrame(id);
  }, [showChecklistModal, syncDexScroll]);

  /* 滚轮：指针落在标题 / 底部按钮上也带动列表
     --------------------------------------------------------------------------
     只用 React 的 onWheel 不够：它挂在 root 上是 **passive** 的，
     既 preventDefault 不掉（滚到尽头时光标在标题上会把身后的页面滚走），
     也不该在那里调 preventDefault。所以用原生监听 + passive:false，
     在弹窗卡片范围内统一把滚轮接管给列表。 */
  useEffect(() => {
    const card = dexCardRef.current;
    const list = dexListRef.current;
    if (!showChecklistModal || !card || !list) return;

    const onWheel = (e: WheelEvent) => {
      if (list.contains(e.target as Node)) return; // 列表自己就能滚，交给浏览器
      if (e.deltaY === 0) return;
      e.preventDefault();
      list.scrollTop += e.deltaY; // scrollTop 自带上下限钳制
    };

    card.addEventListener('wheel', onWheel, { passive: false });
    return () => card.removeEventListener('wheel', onWheel);
  }, [showChecklistModal]);

  /* 上下渐隐遮罩（代替被全局隐藏的滚动条）
     --------------------------------------------------------------------------
     用 mask 而不是"绝对定位的白色渐变条"：渐变条会盖住最后一行的一条边，
     而 mask 是直接让内容在边缘渐隐，滚到底时对应一侧的渐隐长度归零。
     ⚠️ mask 必须直接写在**滚动容器本身**上；写在它的父级会把滚动条一起裁掉，
        写在子元素上则会随内容一起滚走。
     ⚠️ 长度别超过行高的一半：行高 46px，26px 的渐隐会吃掉大半个行，
        看起来像"被裁掉了"而不是"还有内容"。22px 刚好留住一行的上半截文字。 */
  const dexMask = `linear-gradient(to bottom, transparent 0, #000 ${
    dexScroll.top ? '0px' : '18px'
  }, #000 calc(100% - ${dexScroll.bottom ? '0px' : '22px'}), transparent 100%)`;

  /* ==========================================================================
     抽卡爆裂揭示覆盖层（GachaBurstReveal）状态
     --------------------------------------------------------------------------
     旧流程：抽卡 → 餐盖掀开 → 1350ms 后只弹一个 toast，**没有任何结果展示**。
     新流程：抽卡 → 餐盖掀开 → 光点从餐盘爆裂飞出 → 消散 → 食材原地揭示
             → 飞入下方「食材库」网格。

     ⚠️ revealOrigin 用 useState 而非 ref：覆盖层需要这个坐标做定位，
     而 ref 变化不会触发重渲染 —— 首次抽卡时覆盖层会拿到 null 而直接不渲染。
     ========================================================================== */
  const [revealActive, setRevealActive] = useState(false);
  const [revealItems, setRevealItems] = useState<GachaIngredient[]>([]);
  const [revealMode, setRevealMode] = useState<'single' | 'ten'>('single');
  const [revealOrigin, setRevealOrigin] = useState<{ x: number; y: number } | null>(null);

  // 食材库网格卡片的 DOM 引用：飞行落点靠它反查屏幕坐标。
  // key = 食材 id（含分类筛选时未渲染的卡片，所以查不到时要能优雅降级）。
  const pantryCardRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  /* resolvePantryTarget 的函数引用必须恒定（见 GachaBurstReveal 里
     「resolveTargetRect / onComplete 刻意不进依赖」那段注释），
     所以 pantry / revealItems 用 ref 透传最新值，不写进 useCallback 依赖。
     pantryRef 在 pantry 状态声明之后才赋值（见下方）。 */
  const revealItemsRef = useRef<GachaIngredient[]>([]);
  revealItemsRef.current = revealItems;

  /**
   * 求某个食材在食材库网格里的落点（**视口坐标**）。
   *
   * ⚠️ 入库顺序是「**新食材插到最前面，已有食材整体后移**」（见 mergePantry），
   * 所以未来顺序 = [...本次新抽到的, ...已有]，而新食材在动画播完前**还没入库**，
   * DOM 里查不到它的卡片 —— 必须按未来索引去反查/外推，否则新食材会拿不到落点、
   * 只能原地淡出（这正是「单抽飞不进第一格」的原因）。
   *
   * 返回 null 的情况（调用方需原地淡出，不能飞向错误坐标）：
   *   ① 分类筛选把卡片藏了，或卡片未渲染完成；
   *   ② 未来索引超出已有卡片范围且几何不可靠（无法安全外推）。
   */
  const resolvePantryTarget = useCallback(
    (ingredientId: string): { x: number; y: number } | null => {
      const existingIds = pantryRef.current.map((p) => p.id);

      // 收集已渲染卡片的矩形（DOM 顺序 = pantry 顺序）
      const rects: DOMRect[] = [];
      for (const id of existingIds) {
        const el = pantryCardRefs.current.get(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) rects.push(r);
      }
      if (rects.length === 0) return null;
      // 渲染不全（分类筛选生效）时，索引与几何都对不上，只服务已有食材
      const geometryReliable = rects.length === existingIds.length;

      // 本次新抽到、且尚未入库的食材（保持抽到的顺序，去重）
      const owned = new Set(existingIds);
      const freshIds: string[] = [];
      const seen = new Set<string>();
      for (const it of revealItemsRef.current) {
        if (owned.has(it.id) || seen.has(it.id)) continue;
        seen.add(it.id);
        freshIds.push(it.id);
      }

      const futureIdx = [...freshIds, ...existingIds].indexOf(ingredientId);
      if (futureIdx < 0) return null;

      // 统一飞向食材库「第一行」对应列（col = futureIdx % cols）的偏上入口处：
      // 之前按 row = Math.floor(futureIdx / cols) 往下外推到第 2~4 行（+120~+360px），
      // 导致十连抽的后 7 张卡一路向下穿出食材卡、压过「满 10 款起送」甚至飞进底部导航栏。
      let cols = 1;
      const first = rects[0];
      for (let i = 1; i < rects.length; i++) {
        if (Math.abs(rects[i].top - first.top) < 2) cols++;
        else break;
      }
      const col = futureIdx % Math.max(1, cols);
      const targetCard = rects[col] ?? first;
      return {
        x: targetCard.left + targetCard.width / 2,
        y: targetCard.top + targetCard.height * 0.22
      };
    },
    []
  );

  /**
   * 入库合并：**新食材插到最前面**（保持抽到的顺序），已有食材整体后移一位。
   * 已拥有的食材不重复插入，但用最新数据覆盖（价格/描述可能变过）。
   */
  const mergePantry = useCallback(
    (prev: GachaIngredient[], incoming: GachaIngredient[]): GachaIngredient[] => {
      const owned = new Set(prev.map((p) => p.id));
      const fresh: GachaIngredient[] = [];
      const seen = new Set<string>();
      for (const it of incoming) {
        if (owned.has(it.id) || seen.has(it.id)) continue;
        seen.add(it.id);
        fresh.push(it);
      }
      const byId = new Map(incoming.map((i) => [i.id, i]));
      return [...fresh, ...prev.map((p) => byId.get(p.id) ?? p)];
    },
    []
  );

  /**
   * 把「食材库」滚进视野，让飞行落点落在屏幕中部，而不是贴着底部导航。
   *
   * 为什么要滚：食材库在长页面的下半部分，网格第一行本来就在 y≈550，
   * 第二行 y≈840 几乎压着底部导航，第 3 行往下完全在折叠线以下 ——
   * 十连的落点算得再准，也落在看不见或很难看的位置。
   *
   * 时机：**覆盖层亮起时**（t=2000ms）调用。此时暗底已经铺上，滚动不刺眼；
   * 而飞行落点要到 +1250ms（十连）/ +620ms（单抽）才测量，滚动有充足时间稳定。
   * 滚完的目标位置：网格第一行落在滚动容器可视区顶部往下 120px 处。
   */
  const scrollPantryIntoView = useCallback(() => {
    const grid = document.querySelector('#unified-pantry-big-card .grid') as HTMLElement | null;
    const firstCard = grid?.firstElementChild as HTMLElement | null;
    if (!firstCard) return;

    // 往上找最近的可滚动祖先（应用整个页面渲染在 DeviceFrameWrapper 的手机壳内，
    // 滚动的不是 window 而是壳里的内容容器）
    let scroller: HTMLElement | null = firstCard.parentElement;
    while (scroller && scroller !== document.body) {
      const oy = getComputedStyle(scroller).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && scroller.scrollHeight > scroller.clientHeight) break;
      scroller = scroller.parentElement;
    }
    if (!scroller || scroller === document.body) return;

    const delta = firstCard.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 120;
    if (Math.abs(delta) < 8) return;
    scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: 'smooth' });
  }, []);

  /**
   * 抽卡时把餐盘位置换算成覆盖层起爆点（**视口坐标**）。
   * 优先用 3D 餐盖容器；它不在 DOM 里时退到抽卡按钮组，
   * 最后兜底到视口中心偏上 —— 保证覆盖层永远有坐标可用。
   */
  const measureRevealOrigin = useCallback((): { x: number; y: number } => {
    const candidates = ['#gacha-food-cloche-container', '#gacha-action-buttons-group'];
    for (const sel of candidates) {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      // 起爆点取餐盘中心稍偏下 —— 光点是"从盘子里飞出来"，
      // 取正中心会让光点看起来从餐盖顶上冒出，语义不对。
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.62 };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
  }, []);

  // Press-down tactile click animation state for draw buttons
  const [pressedButton, setPressedButton] = useState<'single' | 'ten' | null>(null);

  // 空闲预热共享音频上下文（幂等）。本页有按压音、餐盖有水晶音，都要用同一个上下文。
  useEffect(() => {
    warmUpAudio();
  }, []);

  // Tactile audio & haptic feedback for press down animation
  const playPressSound = (type: 'single' | 'ten') => {
    try {
      /* 复用全局单例，不再自己 new。
         原来这里每次按下都 new AudioContext()：首次构造会阻塞主线程约 230ms
         （正好砸在掀盖动画起跑那一帧），而且从不 close() → 抽几次就把
         Chrome 每页约 6 个的上限用满，之后音效直接失效。
         详见 src/utils/audioContext.ts 的踩坑记录。 */
      const ctx = resumeAudio();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === 'single' ? 'triangle' : 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(type === 'single' ? 360 : 280, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
      if ('vibrate' in navigator) {
        navigator.vibrate?.(type === 'ten' ? [15, 20, 15] : 12);
      }
    } catch {
      // Soft audio fallback if blocked by browser policy
    }
  };



  // User's accumulated pantry of ingredients from Gacha.
  // 初始 3 款直接引用 GACHA_INGREDIENTS 里的条目，不手写副本。
  // 旧实现手写了一份同 id 的数据，和奖池定义已经漂移（番茄 price 3 vs 2、
  // protein 1.1 vs 1、carbs 4.8 vs 4.5），玩家抽到番茄后 map.set 会用奖池版本
  // 覆盖，表现为卡片价格从 ¥3 悄悄跳成 ¥2。
  //
  // ⚠️ 这三个 id 必须都存在于奖池中。奖池曾精简为 10 款（SSR1/SR3/R6），
  // 原本的 ing_salmon（三文鱼）已被移出奖池，若这里继续引用，
  // .find() 会返回 undefined 被 .filter 掉 —— 初始只剩 2 款，且不会报错。
  // 现改为 ing_steak（保留的唯一 SSR），三个 id 都在奖池内。
  const [pantry, setPantry] = useState<GachaIngredient[]>(() =>
    (['ing_tomato', 'ing_kale', 'ing_steak'] as const)
      .map((id) => GACHA_INGREDIENTS.find((g) => g.id === id))
      .filter((g): g is GachaIngredient => Boolean(g))
  );

  /* 食材库当前顺序的 ref 镜像 —— 给 resolvePantryTarget 用（函数引用必须恒定，
     所以不能把 pantry 写进它的 useCallback 依赖，见该函数上方的注释）。 */
  const pantryRef = useRef<GachaIngredient[]>(pantry);
  pantryRef.current = pantry;

  // Selected ingredients inside user's active customized meal bowl (starts empty: 0 selected)
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<Set<string>>(
    new Set<string>()
  );

  // Category filter for pantry list in the long page
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'protein' | 'base' | 'topping' | 'sauce'>('all');

  /* 只在「抽卡入库重排」的那一瞬间打开 layout 动画。
     ⚠️ 不能常开 —— 分类切换时卡片进出场是纯 opacity 交叉淡化，
     叠上 layout 会让移动中的卡片横穿正在淡出的卡片，实测重叠+拉伸变形很严重
     （见 scripts/probe-category-switch.mjs 抓到的 mid.png）。 */
  const [reorderAnim, setReorderAnim] = useState(false);

  // Check how many of the 10 target ingredients are collected
  const collectedCount = pantry.length;
  const isDeliveryGoalMet = collectedCount >= MIN_DELIVERY_ITEMS;

  // Render Ingredient Visual in progress slots
  const renderIngredientVisual = (id: string, name: string, iconClass?: string) => {
    // 默认尺寸给「食材图鉴」弹窗里 w-9 h-9 的方框用；正方形插画可以吃满。
    const cls = iconClass || "w-8 h-8";
    // 奖池 10 款现在都有插画（public/ingredients/*.png），映射统一收在
    // utils/ingredientArt —— 这里不再各写一份 switch，否则「飞进去的」
    // 和「格子里的」会漂移。
    const art = ingredientArt(id);
    if (art) {
      return (
        <img
          src={art}
          alt={name}
          draggable={false}
          className={`${cls} object-contain select-none`}
         loading="lazy" decoding="async" />
      );
    }
    // emoji 兜底：只服务已移出奖池的旧 id（旧 localStorage 里可能还留着）。
    // 优先从 pantry 取（已入库），其次从奖池取，最后才用通用沙拉 emoji。
    // ⚠️ 不能只查 pantry —— 刚抽到、尚未写入 pantry 的那一帧会掉到 🥗，
    // 导致食材图标闪一下再变回来。
    return (
      <span className="text-lg select-none leading-none">
        {pantry.find((i) => i.id === id)?.emoji ??
          GACHA_INGREDIENTS.find((g) => g.id === id)?.emoji ??
          '🥗'}
      </span>
    );
  };

  /**
   * 按稀有度权重抽单种食材。
   * 权重与 DROP_RATES 展示的 15% / 35% / 50% 严格一致（改这里必须同步改 DROP_RATES）。
   * 同稀有度内优先给未收集的，避免玩家卡在同一种上——但不改变稀有度分布。
   */
  const drawSingle = (): GachaIngredient => {
    const rand = Math.random();
    let rarity: 'SSR' | 'SR' | 'R' = 'R';
    if (rand < 0.15) rarity = 'SSR';
    else if (rand < 0.5) rarity = 'SR';

    const pool = GACHA_INGREDIENTS.filter((i) => i.rarity === rarity);
    const uncollected = pool.filter((i) => !pantry.some((p) => p.id === i.id));
    const from = uncollected.length > 0 ? uncollected : pool;
    return from[Math.floor(Math.random() * from.length)];
  };

  /**
   * 抽卡结果提示文案。区分「新获得」与「重复」——
   * 十连抽在未收集不足 10 种时会用已拥有的补齐，这时不该谎报「获得 10 种」。
   */
  const buildGainText = (items: GachaIngredient[]) => {
    const fresh = items.filter((i) => !pantry.some((p) => p.id === i.id)).length;
    const dup = items.length - fresh;
    if (dup === 0) return `获得 ${fresh} 种新鲜食材！`;
    if (fresh === 0) return `抽到 ${dup} 种已收集食材（已自动转化）！`;
    return `新获 ${fresh} 种，${dup} 种重复已转化！`;
  };

  // Handle Single / Ten Pull
  const handleSummon = (mode: 'single' | 'ten') => {
    if (isDrawing) return;

    const cost = mode === 'single' ? 1 : 9;
    if (tokens < cost) {
      setShowGetTokensModal(true);
      onShowToast('抽卡币不足，每日签到可领 1 币');
      return;
    }

    setTokens((prev) => prev - cost);
    setLastDrawMode(mode);
    // 首次十连抽成功后停掉「9折限时」徽章的促销动效 —— 优惠既已到手，
    // 没必要继续在界面上反复推销。只在首次时 set（已是 true 时 React 会跳过重渲染）。
    if (mode === 'ten') setHasUsedTenDraw(true);

    let newItems: GachaIngredient[] = [];
    if (mode === 'single') {
      // 稀有度完全交给 drawSingle 决定。
      // 旧实现在这里有 75% 概率直接从未收集池随机取，完全绕过稀有度判定，
      // 导致界面展示的掉率严重失真（SSR 实际远高于 15%）。「优先未收集」的诉求
      // 已下沉到 drawSingle 内部（同稀有度内优先），不再需要这里的旁路。
      newItems = [drawSingle()];
    } else {
      /**
       * 十连抽：不重复地给 10 种食材。
       * 旧实现用 Map<id> 去重后取前 10 个，池子顺序是 [...uncollected, ...CATALOG]，
       * 一旦未收集不足 10 种，后面就会塞入已拥有的食材——玩家花 9 币看到 3 张新卡
       * 剩下全是重复，且凑不满 10 种，直接卡住「满 10 款起送」。
       * 现在：先洗牌未收集池，不足 10 种时用已拥有的补齐并允许重复（游戏惯例：重复会转化）。
       */
      const uncollected = GACHA_INGREDIENTS.filter((g) => !pantry.some((p) => p.id === g.id));
      const owned = GACHA_INGREDIENTS.filter((g) => pantry.some((p) => p.id === g.id));

      // Fisher-Yates 洗牌，让十连抽真的是随机的（原来直接取数组前 10 个，等于固定顺序）
      const shuffle = <T,>(arr: T[]): T[] => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      const picked = shuffle(uncollected).slice(0, 10);
      // 不足 10 种时用已拥有的补齐（允许重复），保证结果永远是 10 项
      if (picked.length < 10) {
        const need = 10 - picked.length;
        picked.push(...shuffle(owned).slice(0, need));
        // 极端兜底：catalog 为空时不可能走到这里，但避免 picked 少于 10 导致 UI 显示异常
        while (picked.length < 10) picked.push(drawSingle());
      }
      newItems = picked;
    }

    /* 结果顺序：**新食材优先，重复（已拥有）的排后面**。
       ⚠️ 必须在 setRevealItems 之前排好 —— 覆盖层里 10 张结果卡的排列和
       「飞向食材库」的落点是同一个数组按 idx 一一对应的（GachaBurstReveal
       里 `flyTargets[idx]`），两处必须同源，不能只排其中一处。
       用稳定排序（ES2019 起 Array#sort 保证稳定），同档内保留抽到的随机顺序。
       这里比较的 pantry 是**抽卡前**的快照 —— 新食材要等动画播完才入库，
       所以此刻 pantry 里有的就是"重复"。 */
    const isOwned = (it: GachaIngredient) => (pantry.some((p) => p.id === it.id) ? 1 : 0);
    newItems = [...newItems].sort((a, b) => isOwned(a) - isOwned(b));

    const highestRarity = newItems.some((i) => i.rarity === 'SSR')
      ? 'SSR'
      : newItems.some((i) => i.rarity === 'SR')
      ? 'SR'
      : 'R';
    setDrawRarity(highestRarity);
    setIsDrawing(true);
    setIsClocheOpen(true);

    if (skipAnimation) {
      setTimeout(() => {
        setPantry((prev) => mergePantry(prev, newItems));

        setSelectedIngredientIds((prev) => {
          const next = new Set(prev);
          newItems.forEach((item) => next.add(item.id));
          return next;
        });

        setIsDrawing(false);
        setIsClocheOpen(false); // 抽完把餐盖盖回去（跳过动画分支）
        setDrawnIngredients(newItems);
        onShowToast(
          `揭开餐盖！${buildGainText(newItems)}已入库并加入清单`
        );
      }, 650);
      return;
    }

    setTimeout(() => {
      setIsDrawing(false);
      setDrawnIngredients(newItems);

      /* 覆盖层接管结果展示 —— 入库与勾选**推迟到动画播完**再做。
         为什么不能像旧实现那样在这里就入库：
         飞行落点靠 getBoundingClientRect 反查卡片位置，而入库会立刻往网格里
         插入新卡片，网格重排 → 后测到的坐标全部偏移，食材会飞到隔壁格子上。
         顺序必须是：测量 → 飞行 → 入库（见 handleRevealComplete）。 */
      if (skipAnimation) return;

      setRevealItems(newItems);
      setRevealMode(mode);
      setRevealOrigin(measureRevealOrigin());
      setRevealActive(true);
      // 暗底铺上后立刻把食材库滚进视野，让飞行的落点落在屏幕中部
      scrollPantryIntoView();
      /* ⚠️ 这个延迟必须 ≥ 餐盖动画的总时长，否则扑腾到一半就被覆盖层盖住。
         餐盖现在是三段式：扑腾蓄势 0.52s + 掀开 0.88s = 1.4s（见 FoodCloche3D 的 duration）。
         这里给 2.0s，留约 0.6s 让玩家看清掀开后的状态。
         改餐盖时长时**必须同步改这里**。 */
    }, 2000);
  };

  /**
   * 覆盖层动画播完（食材已飞入网格）→ 正式入库 + 勾选。
   * ⚠️ 必须在覆盖层退场后调用，否则入库引起的网格重排会让飞行落点错位。
   */
  const handleRevealComplete = useCallback(() => {
    setRevealActive(false);
    /* 覆盖层退场的同一帧把餐盖盖回去。
       为什么放在这里而不是 setIsDrawing(false) 那一步（1350ms）：
       餐盖在 0–1350ms 是「已掀开、盘内光可见」的展示窗口，那段时间必须保持掀开；
       覆盖层退场才是整段演出的终点。 */
    setIsClocheOpen(false);
    // 入库重排：打开 layout 动画让已有食材"整体后移一位"是滑动而不是硬跳
    setReorderAnim(true);
    setPantry((prev) => mergePantry(prev, revealItems));
    setSelectedIngredientIds((prev) => {
      const next = new Set(prev);
      revealItems.forEach((item) => next.add(item.id));
      return next;
    });
    onShowToast(buildGainText(revealItems) + '已飞入食材库');
    window.setTimeout(() => setReorderAnim(false), 520);
  }, [revealItems, mergePantry, onShowToast]);

  // Toggle ingredient in custom meal bowl (allows selecting or deselecting freely with 0 minimum restriction)
  const handleToggleIngredient = (id: string) => {
    if (selectedIngredientIds.has(id)) {
      setSelectedIngredientIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setSelectedIngredientIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }
  };

  // Quick actions: clear all or select all
  const handleClearAllSelections = () => {
    setSelectedIngredientIds(new Set());
    onShowToast('已清空已选食材');
  };

  const handleSelectAllPantry = () => {
    setSelectedIngredientIds(new Set(pantry.map((p) => p.id)));
    onShowToast(`已全选食材 (${pantry.length}款)`);
  };

  // Nutrition calculations for custom bowl
  const selectedIngredients = pantry.filter((i) => selectedIngredientIds.has(i.id));
  /**
   * 「全选」胶囊的态。⚠️ 必须带 `pantry.length > 0`：
   * 空数组时 `0 === 0` 会被判成"已全选"，胶囊一进来就是「取消全选 + 打勾」。
   */
  const isAllPantrySelected = pantry.length > 0 && selectedIngredients.length === pantry.length;
  const totalKcal = selectedIngredients.reduce((sum, item) => sum + item.kcal, 0);
  const totalProtein = selectedIngredients.reduce((sum, item) => sum + item.protein, 0);
  const totalFat = selectedIngredients.reduce((sum, item) => sum + item.fat, 0);
  const totalCarbs = selectedIngredients.reduce((sum, item) => sum + item.carbs, 0);
  const totalPrice = selectedIngredients.length === 0 ? 0 : Math.max(28, selectedIngredients.reduce((sum, item) => sum + item.price, 0));
  const totalOriginalPrice = selectedIngredients.length === 0 ? 0 : Math.max(48, selectedIngredients.reduce((sum, item) => sum + item.originalPrice, 0));

  // Dimensional balance linking for custom bowl customization
  const baseSelected = selectedIngredients.filter((i) => i.category === 'base');
  const proteinSelected = selectedIngredients.filter((i) => i.category === 'protein');
  const toppingSelected = selectedIngredients.filter((i) => i.category === 'topping');
  const sauceSelected = selectedIngredients.filter((i) => i.category === 'sauce');

  const dimensionStatus = [
    { key: 'base' as const, label: '主粮基底', icon: '🌾', count: baseSelected.length, items: baseSelected },
    { key: 'protein' as const, label: '优质蛋白', icon: '🥩', count: proteinSelected.length, items: proteinSelected },
    { key: 'topping' as const, label: '鲜蔬配料', icon: '🥗', count: toppingSelected.length, items: toppingSelected },
    { key: 'sauce' as const, label: '低卡酱汁', icon: '🥣', count: sauceSelected.length, items: sauceSelected },
  ];

  const completedDimensionCount = dimensionStatus.filter((d) => d.count > 0).length;
  // 10-Item minimum delivery threshold state
  const selectedCount = selectedIngredients.length;
  const isDeliveryThresholdMet = selectedCount >= 10;
  // Progress percentage (0 to 100%) linked directly to user's 10-item delivery target
  const deliveryProgressPercent = Math.min(100, Math.round((selectedCount / 10) * 100));

  // Dynamic recommendation text: concise and single-line
  const getDynamicRecommendation = () => {
    if (selectedCount === 0) {
      return '点击卡片勾选食材，集满 10 款即可起送';
    }
    if (selectedCount < 10) {
      return `已选 ${selectedCount}/10 款，抽卡可快速获取更多食材`;
    }
    return `已达标 10 款起送，可直接加入购物车`;
  };

  // Add custom bowl to cart (requires 10 items to deliver)
  const handleAddCustomMealToCart = () => {
    if (selectedIngredients.length < 10) {
      onShowToast(`满 10 款起送，还差 ${10 - selectedIngredients.length} 款食材`);
      return;
    }

    const customDish: Dish = {
      id: 999000 + Math.floor(Math.random() * 999),
      name: `🥗 盲盒定制 · 十鲜能量碗 (${selectedIngredients.length}款拼配)`,
      subtitle: `${selectedIngredients.map((i) => i.name).slice(0, 3).join('、')}等${selectedIngredients.length}款食材`,
      description: `【盲盒专属定制】包含：${selectedIngredients.map((i) => i.name).join('、')}。总热量 ${totalKcal} kcal，高蛋白 ${totalProtein.toFixed(1)}g。`,
      kcal: totalKcal,
      protein: Math.round(totalProtein),
      fat: Math.round(totalFat),
      carbs: Math.round(totalCarbs),
      price: totalPrice,
      dealPrice: totalPrice,
      originalPrice: totalOriginalPrice,
      sold: '100% 独一无二',
      category: 'bowl',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      bg: 'bg-[#F2FCE0]',
      color: 'text-[#54801A]',
      tags: selectedIngredients.map((i) => i.name),
      icon: 'bowl'
    };

    onAddToCart?.(customDish, 1);
    onShowToast(`已成功将专属定制十鲜能量碗加入购物车！`);
  };

  // Claim free delivery when threshold reached
  const handleClaimFreeDelivery = () => {
    if (pantry.length < MIN_DELIVERY_ITEMS) {
      onShowToast(`还差 ${MIN_DELIVERY_ITEMS - pantry.length} 款即可达成 10 款免单配送！`);
      return;
    }
    setShowDeliverySuccessModal(true);
  };

  return (
    <div className="relative bg-[#C7F665] overflow-clip" id="gacha-page-root">
      {/* 2026-11-03 22:46 用户「这个详情放到币旁边」：i 按钮从右上角搬到「币」胶囊右侧，
          页头右侧自此完全空出 —— 所以 header 恢复 `px-4`，**不再需要 pr-[92px] 让位**
          （给胶囊让位是因为原来右侧有 i 按钮；现在右侧没有任何元素，胶囊浮在留白上）。
          ⚠️ 如果以后又往右侧放东西，得把 `pr-[92px]` 加回来：
             92 = 胶囊 73.4 + 右留白 12 + 呼吸 6。 */}
      <header className="sticky top-0 z-40 bg-white/50 backdrop-blur-md border-b border-white/60 px-4 py-2">
        {/* 页头文字组（「十鲜盲盒」+「10款起送」+ 副标题）2026-11-03 22:28 按用户圈选整块删除。
            现在页头是 [币][i] …… 右侧留白。名字仍由下方头图「十鲜能量盲盒」承担，
            h1 保留为视觉隐藏，别把页面标题一起删掉（SEO/读屏要用）。 */}
        <h1 className="sr-only">十鲜盲盒</h1>
        <div className="max-w-xl md:max-w-2xl mx-auto flex items-center justify-between">
          {/* 2026-11-03 21:59 用户「去掉这一块，把币放到左侧」：
              ① 删掉原来左上角那个 28×28 的黑底青柠 `Sparkles` 图标块；
              ② 把右上角的「币」胶囊整颗搬到它原来的位置。 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGetTokensModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black text-white font-extrabold text-xs shadow-xs hover:bg-slate-800 transition-colors duration-200 ease-out cursor-pointer active:scale-95 shrink-0"
              id="btn-header-tokens"
            >
              {/* 「抽卡币」= 金币：2026-10-23 由青柠改为品牌金，黑底金字是货币的通用表达；
                  青柠留给「全部/全选」这类操作态，两者不再抢同一块黑胶囊。
                  ⚠️ 2026-10-26 用户「规范一下抽卡币的图标，统一用一种形状」：
                  这里原来是 lucide `Crown`，和弹窗里 `Sparkles` 混用 → 统一到 `<TokenIcon />`
                  （唯一形状来源见 `src/components/TokenIcon.tsx`）。 */}
              <TokenIcon className="h-3 w-3 text-[#FDCF29]" />
              <span className="text-[#FDCF29]">{tokens}</span>
              <span className="text-[10px] text-white/80 font-normal">币</span>
              <Plus className="w-2.5 h-2.5 text-[#FDCF29] ml-0.5" />
            </button>

            {/* 食材图鉴/掉率入口。原来在 header 最右（justify-between 的另一端），
                2026-11-03 22:46 搬到币右侧 —— 白底圆钮紧跟黑胶囊，形成「[币] (i)」一个左簇。 */}
            <button
              onClick={() => setShowChecklistModal(true)}
              className="gb-hit w-7 h-7 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 transition-colors duration-200 ease-out cursor-pointer shadow-2xs active:scale-95 shrink-0"
              id="btn-header-info"
              title="食材图鉴与掉率"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="max-w-xl md:max-w-2xl mx-auto px-4 pt-1 space-y-3 relative z-10">
        {/* Unified Top & Pantry Interactive Zone with Background extending exactly to the bottom line */}
        <div className="relative -mx-3 -mx-4 px-4 pt-0 pb-12 overflow-hidden">
          {/* Lime backdrop that covers all the way down to below the status panel */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Top sky & graphic background */}
            <div className="absolute inset-x-0 top-0 h-[480px]">
              <img
                src="/online_9f52938bdc.jpg"
                alt=""
                className="w-full h-full object-cover object-top opacity-90"
                draggable={false}
               loading="lazy" decoding="async" />
            </div>
            {/* Continuous lime wash gradient filling behind buttons, cards and status box */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C7F665]/50 to-[#C7F665]" />

            {/* Bottom Wave Transition & Right Smiley Face - Positioned right at the user's blue line */}
            <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none overflow-hidden">
              {/* Layer 1: Soft Translucent Lime Background Wave */}
              <svg
                viewBox="0 0 400 80"
                className="absolute inset-x-0 bottom-0 w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 52 C 50 35, 110 38, 170 54 C 230 68, 300 48, 360 22 C 380 12, 395 6, 400 3 L 400 80 L 0 80 Z"
                  fill="#C7F665"
                  opacity="0.55"
                />
              </svg>

              {/* Layer 2: Main Vibrant Lime Wave */}
              <svg
                viewBox="0 0 400 80"
                className="absolute inset-x-0 bottom-0 w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 16 C 5 28, 25 58, 65 52 C 105 46, 140 60, 205 60 C 265 60, 315 56, 350 32 C 375 14, 390 4, 400 0 L 400 80 L 0 80 Z"
                  fill="#C7F665"
                />
              </svg>

              {/* Layer 3: Black Smiley Face on the right side slope */}
              <div className="absolute right-6 bottom-4 pointer-events-none select-none z-10 rotate-[8deg]">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="w-7 h-7"
                >
                  <ellipse
                    cx="9"
                    cy="10"
                    rx="2.6"
                    ry="3.6"
                    fill="#000"
                    transform="rotate(6 9 10)"
                  />
                  <ellipse
                    cx="21"
                    cy="8.5"
                    rx="2.6"
                    ry="3.6"
                    fill="#000"
                    transform="rotate(10 21 8.5)"
                  />
                  <path
                    d="M 6.5 17.5 C 9.5 24.5, 20.5 24.5, 24.5 16.5"
                    stroke="#000"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 23 15 C 24.8 16.2, 26 18, 26.5 19.5"
                    stroke="#000"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 1. GACHA MAIN STAGE HERO BANNER (今日抽卡头图) */}
          <section
            className="relative w-full flex flex-col items-center justify-center pt-1 pb-0 z-10"
            id="gacha-main-stage-card"
          >
            <div
              className="w-full relative flex items-center justify-center pb-0"
              id="gacha-hero-banner-container"
            >
              {/* 头图浮动：幅度 6 → 2.5px、周期 3.6 → 5.2s。
                  原幅度偏大 —— 餐盖是 absolute 定位叠在头图上的，头图一晃，
                  餐盖与背景的相对位置就会肉眼可见地「漂」，显得贴不稳。
                  2.5px 在 520~600px 高的图上约 0.5%，只留一点呼吸感。 */}
              <motion.img
                src="/Gemini_Generated_Image_mspigdmspigdmspi.png"
                alt="十鲜盲盒头图"
                animate={{ y: [0, -2.5, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 5.2,
                  ease: 'easeInOut'
                }}
                className="w-full h-auto max-h-[600px] object-contain select-none drop-shadow-lg scale-[1.10] transform-gpu mt-5 transition-all will-change-transform"
                draggable={false}
              />

              {/* 3D 矢量餐盖：主舞台核心交互组件（点击或抽卡均会优雅掀开餐盖） */}
              <div
                className="absolute right-[3%] bottom-[-6%] w-[70%] max-w-[520px] z-20"
              >
                <FoodCloche3D
                  isDrawing={isDrawing}
                  isOpen={isClocheOpen}
                  onTap={() => {
                    if (isDrawing) return;
                    if (isClocheOpen) {
                      setIsClocheOpen(false);
                    } else {
                      handleSummon('single');
                    }
                  }}
                  drawRarity={drawRarity}
                  drawMode={lastDrawMode}
                  className="w-full h-auto scale-[1.30] origin-center cursor-pointer pointer-events-auto"
                />
              </div>
            </div>
          </section>

          {/* 2. CIRCLED AREA: 抽卡操作区与食材库配送定制 - 精确对齐用户在截图画线处（餐盖下方舒适间距） */}
          <section
            className="relative px-0 z-30 mt-3.5"
            id="unified-pantry-collection-section"
          >
          {/* ACTION BUTTONS: Single Summon & Ten Summon (Complete Native SVG Replicas from User Specification) */}
          <div
            className="w-full relative z-20 py-1 px-0.5 overflow-visible select-none"
            id="gacha-action-buttons-group"
          >
            {/* Native SVG Banner 1:1 Pixel-Perfect from Specification */}
            <svg
              id="draw-buttons-banner"
              className="w-full h-auto block overflow-visible select-none"
              viewBox="0 0 810 241"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-labelledby="db-title db-desc"
              style={{
                opacity: isDrawing ? 0.6 : 1,
                transition: 'opacity 0.2s ease-in-out'
              }}
            >
              <title id="db-title">单抽 / 十连抽 按钮组</title>
              <desc id="db-desc">并排两个抽卡按钮：左侧亮柠檬绿「单抽 / 1 抽卡币」，黑色描边加黑色投影，右端一个黑圆内嵌柠檬绿右箭头；右侧蓝绿渐变填充「十连抽 / 9 抽卡币」（黑边），右下沿随按钮透视略向下倾斜，右端一个黑圆内嵌蓝绿右箭头；十连抽按钮右上方一枚粉色「9 折限时」气泡徽章。背景纯白。</desc>

              <defs>
                <style>{`
                  .t { font-family: "PingFang SC","HarmonyOS Sans SC","Noto Sans SC","Source Han Sans SC","Microsoft YaHei","Heiti SC","WenQuanYi Micro Hei",system-ui,sans-serif; fill: #000; }
                  .t-h { font-weight: 900; }
                  .t-w { fill: #FFFFFF; }
                  .t-c { text-anchor: middle; }
                  .ic { fill: none; stroke: #000; stroke-linecap: round; stroke-linejoin: round; }

                  /* ---------- 按钮组：呼吸感浮动（v4 重做，取代 v2/v3 的正弦晃动） ----------

                     ⚠️ v2/v3 为什么只是"机械平移"而不是"呼吸"：
                     那三个 keyframes（x / y / r）全是 0% → 50% → 100% 的对称正弦
                     配 ease-in-out —— 等价于三个完美谐波，任何时刻的位移都可预测，
                     所以眼睛读到的是"在平移"，而不是"在呼吸"。

                     真实呼吸有三个特征，v2/v3 一个都没做到：
                       ① **非对称节奏** —— 吸得快、呼得慢，顶/底各有一小段停顿。
                          对称正弦做不到，这是机械感的主要来源。
                       ② **尺度胀缩** —— 胸腔起伏伴随 size 变化。v2/v3 完全没有 scale，
                          所以只有"平移"没有"呼吸"。
                       ③ **多谐波不规则** —— 真实运动没有单一周期。

                     本版做法：
                       - 关键帧从 3 点改为 5 点，用百分比显式控制"吸/顶停/呼/底停"占比：
                           0% 底 -> 30% 顶(吸,30%) -> 42% 顶(停) -> 84% 底(呼,42%) -> 100% 底
                         吸 30% / 呼 42%，一快一慢，才有生命感。
                       - 新增 scale 呼吸：这是"胀缩"，单靠位移给不了。
                       - 纵向与 scale 同周期同相位（必须同步，否则"涨大时上浮"会错位，
                         看起来像在抖而不是在呼吸）。
                       - cubic-bezier(0.32, 0.02, 0.4, 1) 手工塑形：吸气段加速、呼气段
                         减速更柔，形成"先 brisk 后 relaxation"的曲线，而非匀速。

                     ------------------------------------------------------------
                     v5 改动（用户反馈"动画明显一点"）：**提速为主，幅度为辅**。

                     根因是周期太慢，不是幅度太小：
                       v4 的 6.5s 周期 = **9.2 次/分**，而成人静息呼吸是
                       **12~16 次/分（3.75~5 秒/周期）** —— 原值比静息还慢近三成，
                       所以盯着看只觉得"微微在动"，说不上呼吸。
                       提到 4.4s = 13.6 次/分，正落在静息区间中部。

                     ⚠️ 关键：提速是**唯一无约束**的增强手段。
                       幅度受点击热区硬约束（顶出热区就点空），且过大会显得
                       "漂""不稳"；周期则完全自由，且提速同时让吸/呼两段各自
                       缩短，节奏感更清晰 —— 效果放大而风险为零。

                     幅度只做适度配合（占用 4.23 -> 5.78 单位，热区余量仍有 3.62）。

                     三层周期 4.4 / 5.9 / 7.9s 两两非整数倍。
                     小数周期在数学上**永不重合**（不像整数周期会有最小公倍数），
                     叠加后极长时间内不产生可察觉的循环节律。

                     ⚠️ 为什么加 scale 是安全的（已核算）：
                     CSS 规范把 transform 拆为 translate → rotate → scale → transform
                     四个独立属性按序应用。本元素上只有 translate/rotate/rotate，
                     静态缩放在**子元素 #btn-scale 的 SVG transform 属性**上，
                     两者作用在不同元素、互不干扰。
                     （scale 挂不到 #btn-scale 上 —— 那是静态 SVG 属性，无法做 CSS 动画。）

                     ⚠️ 幅度依然克制：位移总幅度控制在 ~4 单位内
                     （360px 屏宽下约 1.6px），远小于热区余量，不影响点击命中。

                     ⚠️ 挂在 #btn-sway 上（整组一起呼吸），不挂单个按钮 ——
                     若两个按钮各自胀缩，间距会跟着变，看起来像在挤压变形。

                     ⚠️ 注意：本段位于 style 的模板字符串内，注释中【不可用反引号】，
                     否则会提前终止模板字符串、导致编译报 TS1005。
                     ⚠️ rotate 必须显式给 transform-origin 绕组中心，
                     否则默认绕 SVG 原点 (0,0) 旋转，整组会被甩出画面。 */

                  /* 纵向：非对称呼吸。吸 30%(快) -> 顶停 12% -> 呼 42%(慢) -> 底停 16% */
                  @keyframes gb-sway-y {
                    0%   { translate: 0 0px; }
                    30%  { translate: 0 -3.6px; }
                    42%  { translate: 0 -3.6px; }
                    84%  { translate: 0 0px; }
                    100% { translate: 0 0px; }
                  }
                  /* 尺度：与纵向同相呼吸（涨到顶时缩放最大），1.5% 幅度 */
                  @keyframes gb-breath {
                    0%   { scale: 1; }
                    30%  { scale: 1.015; }
                    42%  { scale: 1.015; }
                    84%  { scale: 1; }
                    100% { scale: 1; }
                  }
                  /* 横向：保留轻微漂移作"生命感"底噪，周期与纵向错开 */
                  @keyframes gb-sway-x {
                    0%,100% { translate: -0.85px 0; }
                    50%      { translate: 0.85px 0; }
                  }
                  /* 微旋转：同样非对称，幅度压小避免"摇晃"感 */
                  @keyframes gb-sway-r {
                    0%   { rotate: 0deg; }
                    30%  { rotate: -0.13deg; }
                    42%  { rotate: -0.13deg; }
                    84%  { rotate: 0deg; }
                    100% { rotate: 0deg; }
                  }
                  #btn-sway {
                    transform-origin: 405px 120.5px;
                    animation:
                      /* 纵向与 scale 同周期同相位 —— 两者必须同步，否则"涨大时上浮"
                         会错位，看起来像在抖而不是在呼吸。
                         4.4s = 13.6 次/分，落在成人静息呼吸 12~16 次/分区间中部；
                         v4 的 6.5s 只有 9.2 次/分，比静息慢近三成，所以不够明显。 */
                      gb-sway-y 4.4s cubic-bezier(0.32, 0.02, 0.4, 1) infinite,
                      gb-breath 4.4s cubic-bezier(0.32, 0.02, 0.4, 1) infinite,
                      gb-sway-x 5.9s ease-in-out infinite,
                      gb-sway-r 7.9s cubic-bezier(0.4, 0.05, 0.3, 1) infinite;
                  }

                  /* ---------- 「9折限时」徽章：促销呼吸脉动（v5 新增） ----------
                     目标：让静止的徽章变成视觉焦点，但只做"配角级"的克制动效。

                     为什么之前没有动效也能被看到：粉色 #EC4899 在蓝绿按钮上
                     色相跨度极大，对比强烈。问题不在"不够显眼"，而在
                     **静止的东西不会吸引视线** —— 人的视觉系统对运动敏感，
                     对静态高对比只会"看到"而不会"注意到"。

                     三条设计约束（与按钮组呼吸严格区分开）：
                       ① **独立周期 3.7s** —— 按钮组是 4.4s，这里用 3.7s 错开。
                          若同步，促销信息会与整体节奏绑死，失去"跳出来"的特质。
                       ② **幅度更小**（1.8px vs 按钮组 3.6px）—— 徽章是配角，
                          不该和主按钮抢视觉权重。
                       ③ **scale 幅度更大**（3.5% vs 按钮组 1.5%）—— 徽章本体小，
                          相对幅度小就看不出在胀缩；放大比例才能在克制位移下
                          仍可感知。这与"幅度更小"看似矛盾，实则各管一件事：
                          translate 管"它会不会乱晃"，scale 管"它有没有在呼吸"。

                     ⚠️ 实现关键：脉动必须用 CSS **独立属性** translate/scale，
                     不能用 transform 属性 ——
                     #badge-discount 的内联 style.transform 已被按下反馈
                     （translateY(11.5px) scale(0.96)）独占。若两者都用 transform，
                     会互相覆盖，按下时呼吸就断了。
                     规范应用顺序 translate → rotate → scale → transform，
                     独立属性与 transform 是**叠加**关系，两者可共存。
                     transformOrigin 已有 710px 45.5px（为下压设的），脉动复用。

                     ⚠️ 非对称节奏：吸 34% / 停 14% / 呼 40% / 停 12%，
                     与按钮组同一套方法（正弦会读成"在平移"而非"在呼吸"）。 */
                  @keyframes gb-badge-float {
                    0%   { translate: 0 0px; }
                    34%  { translate: 0 -1.8px; }
                    48%  { translate: 0 -1.8px; }
                    88%  { translate: 0 0px; }
                    100% { translate: 0 0px; }
                  }
                  @keyframes gb-badge-pulse {
                    0%   { scale: 1; }
                    34%  { scale: 1.035; }
                    48%  { scale: 1.035; }
                    88%  { scale: 1; }
                    100% { scale: 1; }
                  }
                  /* hasUsedTenDraw 为 true 时（用户已用过十连抽）停止促销动效。
                     徽章本体保留（优惠信息仍有价值），只是不再动 —— 不打扰。 */
                  #badge-discount.gb-badge-live {
                    animation:
                      gb-badge-float 3.7s cubic-bezier(0.32, 0.02, 0.4, 1) infinite,
                      gb-badge-pulse 3.7s cubic-bezier(0.32, 0.02, 0.4, 1) infinite;
                  }

                  /* ---------- 十连抽：色彩流动 + 呼吸 + 扫光 ----------
                     全部用 CSS 实现（非 SMIL），好处：
                     1) 可被 prefers-reduced-motion 统一关闭；
                     2) 不与按钮自身的 transform 过渡冲突；
                     3) stop-color / stop-offset 都是标准可动画的 CSS 属性。 */

                  /* ============================================================
                     十连抽 · 鲜亮流动系统（3 层 + 扫光）
                     --------------------------------------------------------
                     配色依据：用户指定参考 draw-buttons-banner.html
                     参考版实测：#22D3EE / #2DD4BF / #5EEAD4
                       H 170.6~187.9（跨度 17.4°） L 50.4~64.3  S 66~86
                     特征是 **Tailwind 400 档的高明度青蓝绿**，鲜亮通透。

                     ⚠️ 中间踩过的坑（别再压深）：
                     曾把明度压到 30~53%（#0891B2/#0D9488/#059669 等 600 档）想
                     "压出深度"，结果整体发闷、不鲜亮，用户明确否决。
                     **这个按钮的基调就是鲜亮，深度只能靠高光和扫光去做，不能压暗。**

                     ------------------------------------------------------------
                     v3 改动（用户反馈"变化不够明显"）：把幅度和速度都提上来。
                     根因不是层数不够，而是**跳变幅度太小**：
                       旧版每个色标只在【相邻两色】之间摆动（色相跳 15~18°），
                       stop-offset 位移仅 0.18~0.30 —— 整条色带几乎原地呼吸，
                       所以物理上只能呈现"微微变"。
                     新版三条措施：
                       ① 色标在**色带两端**之间跳（色相跳 41~47°，约 2.5 倍）
                       ② stop-offset 位移 0.18~0.30 → 0.30~0.55（约 2 倍）
                       ③ 周期 9/11/13s → 5.5/7/8.5s，整体提速约 40%
                       另加 ④ 增亮：主色带明度上限 80.4 → 85.1，并加入
                          #99F6E4 / #BBF7D0 / #A5F3FC 三个 200 档高亮色。
                          色相跨度 35.6° → 46.9°。

                     ⚠️⚠️ hue-rotate 方向只能是负方向（青 -> 绿），绝不能转正：
                     蓝色天然暗，往正方向转会让对比度崩塌。实测 #22D3EE
                     转 +35° 后黑字对比度从 10.96 暴跌到 **3.61**（大字阈值边缘）；
                     转 -35° 反而升到 12.93。所以振幅只往 -32° 走。
                     ------------------------------------------------------------

                     v4 改动（用户反馈"更鲜艳一点"）：只提饱和度，**明度一点不动**。
                     ⚠️ 「鲜艳」和「鲜亮」是两个不同维度，别混：
                       鲜亮 = 明度高（v3 做的）；鲜艳 = 彩度高（本版做的）。
                     诊断：v3 配色饱和度已有 71.6~93.5（并不低），但明度 53.3~85.1
                     偏高 —— 这是 Tailwind 200/300 档的固有特征，**pastel 化、
                     柔和但发闷、不艳**。所以提彩度是唯一正确的方向。
                     ⚠️ 绝不能靠压明度来提艳（曾这么干过，用户否决）：
                       压暗 = 闷，压亮 = 淡，只有加彩度才既艳又通透。
                     做法：保持每个色标的 H 与 L 完全不变，只把 S 抬到 >= 92
                     （底层 >= 96）。实测 S 均值 81.8 → 92.3，
                     而 L 均值 71.6 一位未动 —— 鲜艳度提升来自彩度而非亮度。
                     反直觉的是**对比度反而变好**：全相位最坏 10.96 → **11.49**，
                     因为青绿高饱和本身就比 pastel 更亮。鲜艳与可读性不冲突。
                     ============================================================ */

                  /* ---------- 底层：饱和度涌流（提亮 + 高彩度，不压暗） ---------- */
                  @keyframes gb-flow-deep-1 {
                    0%,100% { stop-color: #16DCFA; stop-offset: 0; }
                    50%     { stop-color: #59FCBB; stop-offset: 0.34; }
                  }
                  @keyframes gb-flow-deep-2 {
                    0%,100% { stop-color: #59FCBB; stop-offset: 0.42; }
                    50%     { stop-color: #A4F4FD; stop-offset: 0.58; }
                  }
                  @keyframes gb-flow-deep-3 {
                    0%,100% { stop-color: #A4F4FD; stop-offset: 0.78; }
                    50%     { stop-color: #16DCFA; stop-offset: 1; }
                  }
                  #g-multi-deep stop:nth-of-type(1) { animation: gb-flow-deep-1 5.5s ease-in-out infinite; }
                  #g-multi-deep stop:nth-of-type(2) { animation: gb-flow-deep-2 7s   ease-in-out infinite; }
                  #g-multi-deep stop:nth-of-type(3) { animation: gb-flow-deep-3 8.5s ease-in-out infinite; }

                  /* ---------- 中层：主色带（6 色标，H 跨 46.9°，L 53~85，S>=92） ----------
                     关键：每个色标都跨越【整条色带】往复（两端互跳），
                     而不是像旧版只在相邻色之间小步挪 —— 这是"变化明显"的来源。
                     周期 5.5 / 7 / 8.5s 互质，提速 40% 后仍不产生可察觉的循环节律。 */
                  @keyframes gb-drift-1 {
                    0%,100% { stop-color: #1BD8F5; stop-offset: 0; }
                    33%     { stop-color: #B6FCCF; stop-offset: 0.22; }
                    66%     { stop-color: #50F8DD; stop-offset: 0.06; }
                  }
                  @keyframes gb-drift-2 {
                    0%,100% { stop-color: #50F8DD; stop-offset: 0.26; }
                    33%     { stop-color: #A5F3FC; stop-offset: 0.50; }
                    66%     { stop-color: #5DF8BB; stop-offset: 0.18; }
                  }
                  @keyframes gb-drift-3 {
                    0%,100% { stop-color: #5DF8BB; stop-offset: 0.52; }
                    33%     { stop-color: #1BD8F5; stop-offset: 0.30; }
                    66%     { stop-color: #94FBE7; stop-offset: 0.62; }
                  }
                  @keyframes gb-drift-4 {
                    0%,100% { stop-color: #94FBE7; stop-offset: 0.74; }
                    33%     { stop-color: #50F8DD; stop-offset: 0.50; }
                    66%     { stop-color: #B6FCCF; stop-offset: 0.88; }
                  }
                  @keyframes gb-drift-5 {
                    0%,100% { stop-color: #B6FCCF; stop-offset: 0.92; }
                    33%     { stop-color: #A5F3FC; stop-opacity: 0.9; stop-offset: 0.74; }
                    66%     { stop-color: #5DF8BB; stop-opacity: 1;  stop-offset: 0.98; }
                  }
                  @keyframes gb-drift-6 {
                    0%,100% { stop-color: #A5F3FC; stop-offset: 1; }
                    33%     { stop-color: #B6FCCF; stop-opacity: 0.94; stop-offset: 0.84; }
                    66%     { stop-color: #94FBE7; stop-opacity: 1;    stop-offset: 1; }
                  }
                  #g-multi-ring stop:nth-of-type(1) { animation: gb-drift-1 5.5s ease-in-out infinite; }
                  #g-multi-ring stop:nth-of-type(2) { animation: gb-drift-2 7s   ease-in-out infinite; }
                  #g-multi-ring stop:nth-of-type(3) { animation: gb-drift-3 8.5s ease-in-out infinite; }
                  #g-multi-ring stop:nth-of-type(4) { animation: gb-drift-4 5.5s ease-in-out infinite; }
                  #g-multi-ring stop:nth-of-type(5) { animation: gb-drift-5 7s   ease-in-out infinite; }
                  #g-multi-ring stop:nth-of-type(6) { animation: gb-drift-6 8.5s ease-in-out infinite; }

                  /* ---------- 表层：色相环流（整条色带旋转 hue） ----------
                     振幅从 -18° 加到 -32°，周期 15s → 9s，「不断渐变」的观感最直接。
                     ⚠️ 只允许负方向：转正（青->蓝）会因蓝色天然暗而使对比度崩塌。
                     v4：saturate 峰值 1.2 → 1.12。配色本身已 S>=92，再乘 1.2 会
                     大量撞上 S=100 上限被截断，该层等于失效；1.12 能保住"彩度
                     呼吸"的可感知度，又不会把颜色推成荧光。 */
                  @keyframes gb-hue-cycle {
                    0%   { filter: hue-rotate(0deg)   saturate(1); }
                    50%  { filter: hue-rotate(-32deg) saturate(1.12); }
                    100% { filter: hue-rotate(0deg)   saturate(1); }
                  }
                  #btn-multi .gb-breathe-target { animation: gb-hue-cycle 9s ease-in-out infinite; }

                  /* ---------- 高光：扫光带（周期性掠过表面） ----------
                     4.6s → 3.2s，随整体提速同步加快。 */
                  @keyframes gb-sheen-sweep {
                    0%   { transform: translateX(-150px); opacity: 0; }
                    12%  { opacity: 1; }
                    55%  { transform: translateX(220px); opacity: 1; }
                    68%  { opacity: 0; }
                    100% { transform: translateX(220px); opacity: 0; }
                  }
                  .gb-sheen-sweep { animation: gb-sheen-sweep 3.2s cubic-bezier(0.42, 0, 0.5, 1) infinite; }

                  /* ============================================================
                     单抽 · 黄绿流动系统（与十连同构，2026-10-18 用户要求）
                     ------------------------------------------------------------
                     结构照搬十连抽的三层 + 扫光 + 色相环流，只换配色体系：
                       底层 g-single-deep  饱和涌流（3 色标）
                       中层 g-single-ring  主色带（6 色标，黄 ↔ 绿往复）
                       顶层 g-single-lite  近白黄绿高光
                     色相锚在品牌青柠 #C7F665（H≈82°）两侧：
                       黄侧 #F2FB6A / #E4FA8E（H≈66~72°）
                       绿侧 #8FE01F / #8BE015（H≈85~88°）
                     全部保持高明度（L 50~78）+ 高彩度（S 84~96）：
                     黄绿本身明度高，黑字对比度最坏仍 > 9（AA 阈值 4.5），
                     所以这里**不需要**像十连那样限制 hue 只能往负方向 ——
                     黄↔绿双向都安全，振幅可用 -10° ~ +14° 做「黄绿呼吸」。
                     ⚠️ 三层顺序不可换：deep 垫彩度 → ring 主体 → lite 高光。
                     ⚠️ 中层不加 opacity（底层本身鲜亮，加透明度会泛白冲淡）。
                     ============================================================ */
                  @keyframes gs-flow-deep-1 {
                    0%,100% { stop-color: #A6F01C; stop-offset: 0; }
                    50%     { stop-color: #D4FA3C; stop-offset: 0.34; }
                  }
                  @keyframes gs-flow-deep-2 {
                    0%,100% { stop-color: #D4FA3C; stop-offset: 0.42; }
                    50%     { stop-color: #8BE015; stop-offset: 0.58; }
                  }
                  @keyframes gs-flow-deep-3 {
                    0%,100% { stop-color: #8BE015; stop-offset: 0.78; }
                    50%     { stop-color: #A6F01C; stop-offset: 1; }
                  }
                  #g-single-deep stop:nth-of-type(1) { animation: gs-flow-deep-1 5.5s ease-in-out infinite; }
                  #g-single-deep stop:nth-of-type(2) { animation: gs-flow-deep-2 7s   ease-in-out infinite; }
                  #g-single-deep stop:nth-of-type(3) { animation: gs-flow-deep-3 8.5s ease-in-out infinite; }

                  @keyframes gs-drift-1 {
                    0%,100% { stop-color: #B7F03A; stop-offset: 0; }
                    33%     { stop-color: #F2FB6A; stop-offset: 0.22; }
                    66%     { stop-color: #A9EE45; stop-offset: 0.06; }
                  }
                  @keyframes gs-drift-2 {
                    0%,100% { stop-color: #A9EE45; stop-offset: 0.26; }
                    33%     { stop-color: #E4FA8E; stop-offset: 0.50; }
                    66%     { stop-color: #8FE01F; stop-offset: 0.18; }
                  }
                  @keyframes gs-drift-3 {
                    0%,100% { stop-color: #8FE01F; stop-offset: 0.52; }
                    33%     { stop-color: #B7F03A; stop-offset: 0.30; }
                    66%     { stop-color: #C7F665; stop-offset: 0.62; }
                  }
                  @keyframes gs-drift-4 {
                    0%,100% { stop-color: #C7F665; stop-offset: 0.74; }
                    33%     { stop-color: #A9EE45; stop-offset: 0.50; }
                    66%     { stop-color: #F2FB6A; stop-offset: 0.88; }
                  }
                  @keyframes gs-drift-5 {
                    0%,100% { stop-color: #F2FB6A; stop-offset: 0.92; }
                    33%     { stop-color: #E4FA8E; stop-opacity: 0.9; stop-offset: 0.74; }
                    66%     { stop-color: #8FE01F; stop-opacity: 1;  stop-offset: 0.98; }
                  }
                  @keyframes gs-drift-6 {
                    0%,100% { stop-color: #E4FA8E; stop-offset: 1; }
                    33%     { stop-color: #F2FB6A; stop-opacity: 0.94; stop-offset: 0.84; }
                    66%     { stop-color: #C7F665; stop-opacity: 1;    stop-offset: 1; }
                  }
                  #g-single-ring stop:nth-of-type(1) { animation: gs-drift-1 5.5s ease-in-out infinite; }
                  #g-single-ring stop:nth-of-type(2) { animation: gs-drift-2 7s   ease-in-out infinite; }
                  #g-single-ring stop:nth-of-type(3) { animation: gs-drift-3 8.5s ease-in-out infinite; }
                  #g-single-ring stop:nth-of-type(4) { animation: gs-drift-4 5.5s ease-in-out infinite; }
                  #g-single-ring stop:nth-of-type(5) { animation: gs-drift-5 7s   ease-in-out infinite; }
                  #g-single-ring stop:nth-of-type(6) { animation: gs-drift-6 8.5s ease-in-out infinite; }

                  /* 黄绿之间的色相环流：负向偏黄、正向偏绿，双向都安全 */
                  @keyframes gs-hue-cycle {
                    0%   { filter: hue-rotate(-10deg) saturate(1); }
                    50%  { filter: hue-rotate(14deg)  saturate(1.1); }
                    100% { filter: hue-rotate(-10deg) saturate(1); }
                  }
                  #btn-single .gs-breathe { animation: gs-hue-cycle 9s ease-in-out infinite; }

                  @media (prefers-reduced-motion: reduce) {
                    #g-multi-deep stop,
                    #g-multi-ring stop,
                    #g-single-deep stop,
                    #g-single-ring stop,
                    #btn-multi .gb-breathe-target,
                    #btn-single .gs-breathe,
                    .gb-sheen-sweep,
                    #btn-sway,
                    #badge-discount.gb-badge-live { animation: none; }
                  }
                `}</style>
                {/* 9折限时徽章：2026-10-23 由粉色 (251,32,155) 改为品牌金；
                    2026-10-29 深夜改红：WeUI #FA5151 → #FC259B → 最终定 **#FC5294**
                    （HOT 块/首页价格的玫红），且用户明确「0.73× 压暗这个不要」→
                    两个 stop 同色 = **纯色填充、无渐变**。
                    2026-10-29 深夜用户「内部黑色字体改成白色」→ 文字 #FFFFFF
                    （#FC5294 上白字 3.10:1，装饰性促销徽章按用户要求执行；
                    黑皇冠未动——皇冠是图标不是字体，要一起变白说一声）。 */}
                <linearGradient id="g-gold" x1="0" y1="0" x2="0.25" y2="1">
                  <stop offset="0" stopColor="#FC5294" />
                  <stop offset="1" stopColor="#FC5294" />
                </linearGradient>
                {/* 1 抽卡币皇冠：偏浅的柠檬绿 */}
                <linearGradient id="g-crown-pale" x1="0" y1="0" x2="0.4" y2="1">
                  <stop offset="0" stopColor="#E4F8BC" />
                  <stop offset="0.5" stopColor="#C7F665" />
                  <stop offset="1" stopColor="#C7F665" />
                </linearGradient>
                {/* 十连抽按钮填充 · 中层主色带（6 色标，H 跨 46.9°，L 53.3~85.1）
                     以参考 draw-buttons-banner.html 的 #22D3EE/#2DD4BF/#5EEAD4 为基调，
                     去掉偏暗的 #2DD4BF，改用同明度但更亮的 #99F6E4 承接，
                     尾部再接 #BBF7D0 浅薄荷与 #A5F3FC 亮天青 —— 全部 200~400 档。
                     6 个色标（而非 5 个）是为了让色带更细分，流动时颗粒感更细密。

                     ⚠️ v4 提彩：色相与明度【完全不变】，只把饱和度抬到 >= 92
                       （Tailwind 200/300 档高饱和版）。明度一位未动是刻意的 ——
                       压暗会闷、压亮会淡，加彩度才既艳又通透。
                     黑字对比度最坏 11.49（AA 阈值 4.5），比提彩前 10.96 更好。
                     动画由上方 <style> 的 CSS keyframes 驱动 stop-color / stop-offset，
                     可被 prefers-reduced-motion 统一关闭。 */}
                <linearGradient id="g-multi-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0"    stopColor="#1BD8F5" />
                  <stop offset="0.2"  stopColor="#50F8DD" />
                  <stop offset="0.4"  stopColor="#5DF8BB" />
                  <stop offset="0.62" stopColor="#94FBE7" />
                  <stop offset="0.82" stopColor="#B6FCCF" />
                  <stop offset="1"    stopColor="#A5F3FC" />
                </linearGradient>
                {/* 十连抽按钮填充 · 底层饱和涌流（与主色带同色系，错峰流动制造纵深）。
                     底层彩度更高（S>=96），压在最下面不直接可读，只负责垫出浓度。 */}
                <linearGradient id="g-multi-deep" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0"    stopColor="#16DCFA" />
                  <stop offset="0.45" stopColor="#59FCBB" />
                  <stop offset="1"    stopColor="#A4F4FD" />
                </linearGradient>
                {/* 十连抽按钮填充 · 顶部高光（近白青，琉璃通透感）。
                     峰值不透明度 0.9 → 0.95、峰值色再提亮到 #D9FCFF，
                     配合提速后的扫光，上缘的"玻璃反光"更亮更锐。
                     高光刻意保持低彩度（近白）：高光一艳就像塑料发光，不像玻璃。 */}
                <linearGradient id="g-multi-lite" x1="0" y1="0" x2="0.6" y2="1">
                  <stop offset="0"    stopColor="#D9FCFF" stopOpacity="0.95" />
                  <stop offset="0.45" stopColor="#B6FCCF" stopOpacity="0.38" />
                  <stop offset="1"    stopColor="#E4F8BC" stopOpacity="0" />
                </linearGradient>
                {/* 表面高光带：一道柔和白色斜光横向扫过按钮，制造"液体/琉璃"质感。
                     峰值不透明度 0.34 → 0.5，提速后光带更亮更锐，与鲜亮配色同调。
                     裁剪由调用处的 clipPath（clip-multi-face，复用面路径）负责，
                     保证光不溢出到黑边外。扫光位移由 CSS .gb-sheen-sweep 驱动。 */}
                <linearGradient id="g-multi-sheen" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0"    stopColor="#FFFFFF" stopOpacity="0" />
                  <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.5" />
                  <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0.5" />
                  <stop offset="1"    stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
                {/* 面路径裁剪，供高光层使用（与 btn-multi-face 完全同一条 d） */}
                <clipPath id="clip-multi-face">
                  <path d="M493,56 H731 A55,55 0 0 1 786,111 V150.1 A65,54.5 0 0 1 721,204.6 L499,195.7 A70,58.5 0 0 1 429,137.2 V120 A64,64 0 0 1 493,56 Z" />
                </clipPath>

                {/* ---------- 单抽 · 黄绿流动三层（2026-10-18，与十连同构） ----------
                     中层主色带 6 色标：黄侧 #F2FB6A / #E4FA8E，绿侧 #8FE01F / #8BE015，
                     锚点仍是品牌青柠 #C7F665。明度 50~78、彩度 84~96 —— 黑字对比度
                     最坏 > 9，安全。动画由 <style> 的 gs-drift-* 驱动。 */}
                <linearGradient id="g-single-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0"    stopColor="#B7F03A" />
                  <stop offset="0.2"  stopColor="#A9EE45" />
                  <stop offset="0.4"  stopColor="#8FE01F" />
                  <stop offset="0.62" stopColor="#C7F665" />
                  <stop offset="0.82" stopColor="#F2FB6A" />
                  <stop offset="1"    stopColor="#E4FA8E" />
                </linearGradient>
                {/* 底层饱和涌流：彩度更高，压在最下面垫出浓度（不直接可读） */}
                <linearGradient id="g-single-deep" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0"    stopColor="#A6F01C" />
                  <stop offset="0.45" stopColor="#D4FA3C" />
                  <stop offset="1"    stopColor="#8BE015" />
                </linearGradient>
                {/* 顶部高光：近白黄绿，玻璃反光感（高光保持低彩度，艳了像塑料） */}
                <linearGradient id="g-single-lite" x1="0" y1="0" x2="0.6" y2="1">
                  <stop offset="0"    stopColor="#FBFFCF" stopOpacity="0.95" />
                  <stop offset="0.45" stopColor="#E4FA8E" stopOpacity="0.36" />
                  <stop offset="1"    stopColor="#C7F665" stopOpacity="0" />
                </linearGradient>
                {/* 单抽面裁剪：给扫光用（矩形面，直接复用 rect 参数） */}
                <clipPath id="clip-single-face">
                  <rect x="25.5" y="58" width="381" height="150.5" rx="62" />
                </clipPath>
                {/* 按钮右下投影 */}
                <filter id="f-btn-shadow" x="-14%" y="-14%" width="128%" height="136%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.18" />
                </filter>
                {/* 胶囊皇冠（细高，实测 23×21）
                    ⚠️ 这条 d 是**抽卡币皇冠的唯一形状**：HTML 侧的 `<TokenIcon />`
                    （src/components/TokenIcon.tsx）用的是逐字相同的 path，两边必须同步改。 */}
                <g id="ic-crown-lime">
                  <path d="M-12,11 L-12,-6 L-6,0 L0,-11 L6,0 L12,-6 L12,11 Z" fill="#C7F665" />
                </g>
                {/* 1 抽卡币 皇冠：偏浅的柠檬绿 */}
                <g id="ic-crown-pale">
                  <path d="M-12,11 L-12,-6 L-6,0 L0,-11 L6,0 L12,-6 L12,11 Z" fill="url(#g-crown-pale)" />
                </g>
                {/* 9折限时徽章上的皇冠：黄色描边 */}
                <g id="ic-crown-yellow">
                  <path d="M-16,10 L-16,-6 L-9,0 L0,-12 L9,0 L16,-6 L16,10 Z" fill="#0D1F2D" stroke="#0D1F2D" strokeWidth="2" strokeLinejoin="round" />
                </g>
              </defs>

              {/* ---- 外层：晃动感（CSS 独立变换属性）----
                   与内层缩放【必须分属两个元素】。原因：CSS 的 transform-origin
                   会同时作用于同一元素上的 translate / rotate / scale 和
                   transform 属性。若把晃动和缩放放同一元素，为了让 rotate 绕组中心
                   而设 transform-origin，会连带把缩放中心推到 viewBox 的某个角上，
                   整组歪掉。分层后两者彻底隔离。 */}
              <g id="btn-sway">
              {/* 内层：整组放大 1.05，固定绕 viewBox 中心 (405,120.5)，
                   因此放大后仍然中心对齐，不会向左上角偏移。

                   对配平的影响已核算：单抽内容净缩放 0.92×1.087=1.0，×1.05 后 1.05；
                   十连抽同步变 1.05 —— 两者同比放大，「标题严格等大」的关系不变，
                   黑边厚度 5.1/6.4/16.1 → 5.35/6.72/16.91（更敦实，与放大自洽）。

                   最后那个 -124.8 是修正【垂直偏心】（不是 120.5）：
                   原始视觉主体 y 19.0..230.6，中心 124.8，比 viewBox 中心 120.5
                   低 4.3 —— 这是原始设计就有的隐性偏心（上间隙 19.0 / 下间隙 10.4）。
                   放大 1.05 后偏心放大为 13.9 / 4.9，下边缘余量只剩 4.9，
                   叠上纵向晃动后最坏情况仅剩 2.1 单位余量。
                   改用 -124.8 后上下间隙对称（8.7 / 10.2，差 1.5），
                   余量 5.9 单位、宽 2.8 倍，纵向晃动才敢放到 ±2.8。
                   SVG 是 h-auto 自适应高度，页面上看不出位移。

                   ⚠️ 这里第二个 translate 的 Y 值必须填【内容自身中心 124.8】，
                   不能填 viewBox 中心 120.5 —— 展开后
                   y_final = 120.5 + 1.05*(y - 该值)，填 120.5 会残余 0.7 偏心。
                   水平方向不受此值影响（x_final = 405 + 1.05*(x - 405)）。 */}
              <g id="btn-scale" transform="translate(405 120.5) scale(1.05) translate(-405 -124.8)">
                {/* ==========================================================
                     02 左按钮（亮柠檬绿）
                     实测：底座 20..412 × 51..226（倾斜 -4.2°，圆角 r≈68）
                           黑描边左右上约 6px、下方约 17px（厚底）

                     视觉配平：原尺寸 392 宽 + -4.2° 旋转，斜置后包围盒涨到 403.8，
                     比右侧十连抽（370 宽、无旋转）明显更重。

                     做法：外层 scale 0.92 收窄底座；内层 cap 反向 scale 1/0.92≈1.087
                     抵消缩小，让标题、箭头、胶囊回到原始视觉尺寸——否则 58px 标题
                     会缩到 53.4px，比十连抽小 4.6px 看起来不协调。

                     ⚠️ translateX 由 +6.4 改为 -11.76：原来那个 +6.4 是"右移补间隙"，
                     它把整组推得偏右（实测包围盒中心 417.6，viewBox 理想中心 405，
                     偏右 12.6px，左内边距 35.2 / 右 10.0）。
                     现按视觉主体（两按钮 + 徽章，不含 shadow）重新解算居中量：
                     x 17.0..793.0，中心 405.0，左右内边距各 17.0，**差 0.00**。
                     shadow 右缘仍会超出 viewBox 约 7px，属正常（柔和投影，视觉不突兀）。
                     ========================================================== */}
                <g
                  id="btn-single"
                  transform="rotate(-4.2 196.5 137)"
                  style={{
                    transform: pressedButton === 'single'
                      ? 'translateX(-11.76px) rotate(-4.2deg) translateY(2.5px) scale(0.911)'
                      : 'translateX(-11.76px) rotate(-4.2deg) translateY(0px) scale(0.92)',
                    transformOrigin: '196.5px 137px',
                    transition: pressedButton === 'single' ? 'transform 0.06s ease-out' : 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  <g filter="url(#f-btn-shadow)">
                    <rect
                      id="btn-single-base"
                      x="20"
                      y="51"
                      width="392"
                      height="175"
                      rx="68"
                      fill="#000"
                      style={{
                        opacity: pressedButton === 'single' ? 0.95 : 1,
                        transition: 'opacity 0.08s ease-out'
                      }}
                    />
                  </g>

                  {/* Button Cap: Face, Text, Arrow & Pill physically presses DOWN into the dark base
                       scale(1.087) 抵消外层 0.92，保持文字与图标原始视觉尺寸。
                       注意：绿色「面」必须留在 cap 外层跟随底座一起缩放，否则面宽 381
                       会超过缩后底座 360.6，黑边被吃掉。 */}
                  <g
                    id="btn-single-cap"
                    style={{
                      transform: pressedButton === 'single' ? 'translate(0px, 9.5px)' : 'translate(0px, 0px)',
                      transition: pressedButton === 'single' ? 'transform 0.06s cubic-bezier(0.1, 0.9, 0.2, 1)' : 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    {/* 面：比底座内缩 6px（下方 17px）。
                        2026-10-18 由纯平色 #C7F665 改为**黄绿流动三层 + 扫光**，
                        与十连抽完全同构（deep 垫彩度 → ring 主体 → lite 高光）。
                        三层用同一个 rect 叠放，顺序不可换。
                        ⚠️ 外层 #btn-single-face 必须保留：index.css 的 hover 提亮
                        （filter: brightness(1.04)）挂在它上面。hue 呼吸放在内层
                        #btn-single-face-flow，两层 filter 分离才不会互相覆盖。 */}
                    <g id="btn-single-face">
                      <g id="btn-single-face-flow" className="gs-breathe">
                        <rect x="25.5" y="58" width="381" height="150.5" rx="62" fill="url(#g-single-deep)" />
                        <rect x="25.5" y="58" width="381" height="150.5" rx="62" fill="url(#g-single-ring)" />
                        <rect x="25.5" y="58" width="381" height="150.5" rx="62" fill="url(#g-single-lite)" />
                      </g>
                      {/* 扫光：白色斜光带循环扫过面，裁剪在圆角矩形内不溢出黑边。
                          放在标题下层，掠过文字底部但不遮字形。 */}
                      <g clipPath="url(#clip-single-face)" pointerEvents="none">
                        <rect
                          id="btn-single-sheen"
                          className="gb-sheen-sweep"
                          x="20"
                          y="48"
                          width="420"
                          height="170"
                          fill="url(#g-multi-sheen)"
                        />
                      </g>
                    </g>

                    {/* 内容层：反向缩放抵消外层 0.92，使标题 / 箭头 / 胶囊维持原始视觉尺寸。
                         原点取 230.7 而非几何中心，是让箭头圆右侧内缩 = 31px，
                         与十连抽的 31px 完全一致（跟随中心缩放时只有 16.3px，箭头会贴边）。 */}
                    <g
                      id="btn-single-content"
                      style={{
                        transform: 'scale(1.087)',
                        transformOrigin: '230.7px 133px'
                      }}
                    >
                      {/* 主标题（左按钮）：基线 y=133，字体设置与右按钮标题完全一致。
                           ⚠️ 字距不要再为了「和十连抽等宽」拉大：原 60 已接近一个字宽（58），
                           「单」「抽」被拉散到判读困难。24 时字距/字宽 ≈ 0.41，收紧且仍透气。

                           x=97 是配合字距 24 重新配平的结果：标题宽由 176 收窄到 140 后，
                           若沿用旧起点 70，会比下方胶囊（70..264，中心 167）窄 54px，
                           左端对齐会让右侧塌一块，视觉上「明显靠左」（左右边距 44.5 / 81）。
                           改为与胶囊中心对齐：70 → 97（+27），标题中心 167 = 胶囊中心 167，
                           左右边距收敛到 71.5 / 54，标题与胶囊构成稳定的居中文本列。
                           两者仍承担不同角色，不要改回左对齐，也不要再向右压。 */}
                      <text id="txt-single" className="t t-h" x="97" y="133" stroke="#000" strokeWidth="1.6" strokeLinejoin="round"
                            fontSize="58" letterSpacing="24">单抽</text>

                      {/* 右侧圆形箭头按钮（实测圆心 332.5,126.5 半径 42） */}
                      <circle id="single-arrow-circle" cx="333" cy="136.5" r="42" fill="#000" />
                      <path id="single-arrow" d="M313,136.5 H351 M335,122.5 L351,136.5 L335,150.5"
                            fill="none" stroke="#C7F665" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

                      {/* 1 抽卡币 胶囊（实测 70..264 × 151..191） */}
                      <rect id="single-coin-pill" x="70" y="151" width="194" height="40" rx="20" fill="#000" />
                      <g id="single-coin-crown" transform="translate(112,169.5)">
                        <use href="#ic-crown-pale" />
                      </g>
                      <text id="txt-single-coin" className="t t-w t-h" x="133.5" y="177"
                            fontSize="24" textLength="98" lengthAdjust="spacingAndGlyphs">1 抽卡币</text>
                    </g>
                  </g>
                </g>

                {/* ==========================================================
                     03 右按钮（蓝绿渐变填充 + 黑边）
                     实测轮廓：上沿 y=50（水平）、左沿 x=423、右沿 x=793、下沿向右下倾斜 2.9°
                     四角半径各不相同：左上 64 / 右上 60 / 右下 72 / 左下 76
                     ========================================================== */}
                <g
                  id="btn-multi"
                  style={{
                    transform: pressedButton === 'ten' ? 'translateY(2.5px) scale(0.99)' : 'translateY(0px) scale(1)',
                    transformOrigin: '610px 137px',
                    transition: pressedButton === 'ten' ? 'transform 0.06s ease-out' : 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  <path id="btn-multi-shadow"
                        d="M494,57 H740 A60,60 0 0 1 800,117 V157.1 A72,72 0 0 1 728,229.1 L506,220.2 A76,76 0 0 1 430,144.2 V121 A64,64 0 0 1 494,57 Z"
                        fill="#000" opacity="0.16" />
                  {/* 底座（黑边）：与单抽同一结构（黑底座 + 彩色面），
                      黑边左右上约 6px、下方约 17.5px（厚底），与单抽对称 */}
                  <path id="btn-multi-base"
                        d="M487,50 H733 A60,60 0 0 1 793,110 V150.1 A72,72 0 0 1 721,222.1 L499,213.2 A76,76 0 0 1 423,137.2 V114 A64,64 0 0 1 487,50 Z"
                        fill="#000" />

                  {/* Button Cap: Dark Face, Title, Arrow & Pill physically presses DOWN into the neon lime base */}
                  <g
                    id="btn-multi-cap"
                    style={{
                      transform: pressedButton === 'ten' ? 'translate(0px, 9.5px)' : 'translate(0px, 0px)',
                      transition: pressedButton === 'ten' ? 'transform 0.06s cubic-bezier(0.1, 0.9, 0.2, 1)' : 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    {/* 面：三层渐变叠加（饱和→主色带→高光），构成鲜亮通透的蓝绿流光。
                        左右上内缩 6px、底部内缩 17.5px，黑底座在下方露出 = 厚底，与单抽对称。
                        底部圆角用椭圆弧 rx/ry 分别控制水平与垂直内缩量。

                        三层用同一条 d 叠放，顺序不可调换：
                          ① g-multi-deep  底层饱和涌流（同色系高彩度，垫出彩度）
                          ② g-multi-ring  中层主色带（5 色标，H 跨 35.6° / L 50~80，主体流动）
                          ③ g-multi-lite  顶部高光（近白青，琉璃通透感）
                        gb-breathe-target 挂在整组上做 hue-rotate 环流。
                        下两层各带独立周期（9/11/13s）错拍流动，叠加后无循环节律。

                        ⚠️ 中层**不加 opacity**。上一版底层是深色，需靠 opacity 0.92 让它
                        透出来，结果整体压暗发闷；现在底层本身就是鲜亮饱和色，
                        中层必须不透明，否则底色泛上来会冲淡鲜亮感。 */}
                    <g id="btn-multi-face" className="gb-breathe-target">
                      <path
                        d="M493,56 H731 A55,55 0 0 1 786,111 V150.1 A65,54.5 0 0 1 721,204.6 L499,195.7 A70,58.5 0 0 1 429,137.2 V120 A64,64 0 0 1 493,56 Z"
                        fill="url(#g-multi-deep)"
                      />
                      <path
                        d="M493,56 H731 A55,55 0 0 1 786,111 V150.1 A65,54.5 0 0 1 721,204.6 L499,195.7 A70,58.5 0 0 1 429,137.2 V120 A64,64 0 0 1 493,56 Z"
                        fill="url(#g-multi-ring)"
                      />
                      <path
                        d="M493,56 H731 A55,55 0 0 1 786,111 V150.1 A65,54.5 0 0 1 721,204.6 L499,195.7 A70,58.5 0 0 1 429,137.2 V120 A64,64 0 0 1 493,56 Z"
                        fill="url(#g-multi-lite)"
                      />
                    </g>

                    {/* 流动高光：白色斜光带循环扫过按钮面，裁剪在面内不溢出黑边。
                        放在标题下层，光带掠过文字底部但不遮挡字形可读性。 */}
                    <g clipPath="url(#clip-multi-face)" pointerEvents="none">
                      <rect
                        id="btn-multi-sheen"
                        className="gb-sheen-sweep"
                        x="400"
                        y="40"
                        width="420"
                        height="180"
                        fill="url(#g-multi-sheen)"
                      />
                    </g>

                    {/* 主标题：十连抽（黑字，蓝绿填充底上可读；字体与单抽完全一致） */}
                    <text id="txt-multi" className="t t-h" x="466" y="133" stroke="#000" strokeWidth="1.6" strokeLinejoin="round"
                          fontSize="58" textLength="175" lengthAdjust="spacingAndGlyphs">十连抽</text>

                    {/* 右侧圆形箭头按钮（黑圆 + 蓝绿箭头，与单抽的黑圆+柠檬绿箭头对称）。
                         箭头色随 v4 主色带同步提彩：#5EEAD4 -> #50F8DD。
                         黑底上更艳反而更清晰（对比度 13.38 -> 14.91）。 */}
                    <circle id="multi-arrow-circle" cx="716" cy="133" r="39" fill="#000" />
                    <path id="multi-arrow" d="M697,133 H735 M718,119 L735,133 L718,147"
                          fill="none" stroke="#50F8DD" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

                    {/* 9 抽卡币 胶囊（实测 466..648 × 147..183） */}
                    <rect id="multi-coin-pill" x="466" y="147" width="183" height="37" rx="18.5" fill="#2E2E2E" />
                    <g id="multi-coin-crown" transform="translate(506,165) scale(0.96)">
                      <use href="#ic-crown-lime" />
                    </g>
                    <text id="txt-multi-coin" className="t t-w t-h" x="526" y="175"
                          fontSize="25" textLength="99" lengthAdjust="spacingAndGlyphs">9 抽卡币</text>
                  </g>
                </g>

                {/* ==========================================================
                     04 9 折限时 粉色气泡徽章
                     整体倾斜 -3.5°（右上高、左下低，与两个按钮同向），随十连抽一同弹性下压
                     ========================================================== */}
                <g
                  id="badge-discount"
                  className={hasUsedTenDraw ? '' : 'gb-badge-live'}
                  style={{
                    transform: pressedButton === 'ten' ? 'translateY(11.5px) scale(0.96)' : 'translateY(0px) scale(1)',
                    transformOrigin: '710px 45.5px',
                    transition: pressedButton === 'ten' ? 'transform 0.06s cubic-bezier(0.1, 0.9, 0.2, 1)' : 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  {/* ⚠️ 内部三件（胶囊 / 皇冠 / 文字）的对齐关系 2026-10-25 重新量过并定稿，
                      改任何一个都要跟着重算（用户：「这个好好对齐」）：
                        · 胶囊主体（不含尾巴）= x 634.5~786.5、y 22~69，中心 (710.5, 45.5)；
                          rx 16 的圆角矩形，**可视内部就是主体本身**（白底是向外扩 6 的描边，
                          不侵占内部；2026-10-29 之前那句「描边 6 向内各占 3」已作废）。
                        · 左右留白必须相等：内容宽 = 皇冠 21.12 + 间距 8.44 + 文字 86.41 = 115.97，
                          主体宽 152 → 各留 18.0 ⇒ 皇冠左 652.5、文字左 682.1。
                          （旧值 644.4 / 674 是左留 6.9、右留 23.1，明显左挤右空。）
                        · 垂直按**文字墨迹**居中：中文 em box 高 1.42em，墨迹中心在 baseline − 0.44em，
                          要落在 45.5 ⇒ baseline = 56.3（旧值 54 让文字整体偏上 2.5）。
                        · 皇冠垂直位置见下方 `#badge-crown` 注释（2026-10-30 改为 translateY 47.4，
                          四档视觉 A/B 定，**不再用质心 44.0**）。
                      ⚠️ 文字宽度是**字体实测**（"9" 半角 + 3 个全角 ≈ 86.4），换字体/换文案要重新量。 */}
                  <g id="badge-body" transform="rotate(-3.5 710 45.5)">
                    {/*
                      ⚠️ 白底沿革（2026-10-29 → 2026-10-30）：
                      ① 原 bubble 自带 stroke="#FFFFFF" 6px → 用户「不要白描边，改成一个大的白胶囊框住」
                         ⇒ 换成 bubble 底下垫一枚大白胶囊 rect。
                      ② 2026-10-30 用户「修改的更像气泡框一点，参考优秀案例」⇒ 胶囊本身是问题：
                         rx=h/2 没有直边、尾巴只有 8 宽像纸角，整体读作标签贴纸而非气泡。
                         现在白底**跟着气泡轮廓走**（同路径描 12 宽白边），四角与尾巴的白边厚度一致；
                         白胶囊的「大块白」观感保留（外扩仍是 6），但不再是几何胶囊。
                    */}
                    <path id="badge-white-pill"
                          d={DISCOUNT_BUBBLE_D}
                          fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="12" strokeLinejoin="round" />
                    <path id="badge-bubble"
                          d={DISCOUNT_BUBBLE_D}
                          fill="url(#g-gold)" strokeLinejoin="round" />
                    {/* 皇冠：2026-10-30 用户「这个王冠改成白的并且和文字水平对齐」
                        · 颜色：原来是 #0D1F2D 黑剪影 → **白 #FFFFFF**（与文字同色）。
                          ⚠️ 必须**内联同一条 path**，不能给 `<use>` 加 fill —— 被引用的
                          `#ic-crown-yellow` 里 path 自带 `fill="#0D1F2D"`，presentation
                          attribute 优先于 use 上的继承，改不动（这是本项目的既有坑）。
                          形状与 `#ic-crown-yellow` 逐字相同，改形状要两处同步。
                        · 垂直对齐 **translateY = 47.4**，是实测 + 四档视觉 A/B 定的，
                          不是理论推的。⚠️ 别再用「墨迹中心 = baseline − 0.44em」那套公式：
                          它假设的是标定字体，而 Windows 上实际落到 **Microsoft YaHei**，
                          实测文字墨迹带是 y 35.75~58.5（中心 47.13，比公式的 45.74 低 1.39u）。
                          实测法（`scripts/_badge-iso.html` + `_iso-measure.py`，无 rotate 隔离台）：
                            皇冠墨迹带 37.88~53.50（中心 45.69，与 TY=46.4 的设计值吻合）
                            文字墨迹带 35.75~58.50（中心 47.13，墨量加权中心 46.79）
                          A/B 四档 44.0 / 45.4 / 46.4 / 47.8（`_crown-ab*.mjs`）：
                          44 明显偏高、45.4 略高、48.2 略沉，**47.0~47.6 最正**，取 47.4。
                        · 与 2026-10-28 第 9 轮「底宽顶尖图标用质心、别用 bbox」的关系：
                          那条针对的是**窄高**火焰（14px、尖端仅 1px）在小胶囊里——质心对齐才对。
                          本枚皇冠是**宽扁实心块**（21×15.8u），A/B 里反而是轮廓居中才齐；
                          47.4 正是「皇冠轮廓中心落在文字墨量中心」的位置。两者不矛盾，看长宽比。
                        · 真机上 1u ≈ 0.497css，47.0 与 47.8 的差只有 0.4css，属亚像素级。 */}
                    <g id="badge-crown" transform="translate(663.1,47.4) scale(0.66)">
                      <path d="M-16,10 L-16,-6 L-9,0 L0,-12 L9,0 L16,-6 L16,10 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
                    </g>
                    <text id="txt-discount" className="t t-w t-h" x="682.1" y="56.3" fontSize="24" letterSpacing="0">9折限时</text>
                  </g>
                </g>
              </g>
              </g>
            </svg>

            {/* 1. Single Summon Interactive HTML Button */}
            <button
              onClick={() => handleSummon('single')}
              onPointerDown={() => {
                if (isDrawing) return;
                setPressedButton('single');
                playPressSound('single');
              }}
              onPointerUp={() => setPressedButton(null)}
              onPointerLeave={() => setPressedButton(null)}
              onPointerCancel={() => setPressedButton(null)}
              disabled={isDrawing}
              aria-label="单抽 1 抽卡币"
              title="单抽 (1 抽卡币)"
              id="btn-gacha-single"
              className="absolute top-0 left-0 w-[49.5%] h-full cursor-pointer bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none select-none z-10 disabled:cursor-not-allowed group"
              style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
            />

            {/* 2. Ten-Fold Summon Interactive HTML Button */}
            <button
              onClick={() => handleSummon('ten')}
              onPointerDown={() => {
                if (isDrawing) return;
                setPressedButton('ten');
                playPressSound('ten');
              }}
              onPointerUp={() => setPressedButton(null)}
              onPointerLeave={() => setPressedButton(null)}
              onPointerCancel={() => setPressedButton(null)}
              disabled={isDrawing}
              aria-label="十连抽 9 抽卡币 9折限时"
              title="十连抽 (9 抽卡币)"
              id="btn-gacha-ten"
              className="absolute top-0 right-0 w-[49.5%] h-full cursor-pointer bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none select-none z-10 disabled:cursor-not-allowed group"
              style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
            />
          </div>

          {/* Bottom Surface with Skip Animation */}
          <div className="py-2 px-2 flex items-center justify-center relative z-10 mb-2">
            <label
              onClick={() => setSkipAnimation(!skipAnimation)}
              className="flex items-center gap-1.5 cursor-pointer text-black hover:opacity-80 select-none text-xs font-black active:scale-95 transition-all duration-200 ease-out"
              id="skip-animation-toggle"
            >
              {/* 勾选框：未选中 = 白底，选中 = 品牌金 #FDCF29（2026-10-24 由青柠 #C7F665 改金）
                  ⚠️ 这里的底色本身就是青柠，选中填充若也用青柠，只剩黑边在区分「选中/未选中」，
                     远看几乎看不出状态。改金后靠**色相差异**就能读出勾选状态。
                  ⚠️ 黑边 + 硬投影必须保留：金色对青柠底的明度差有限，去掉描边会糊成一片。 */}
              <div
                className={`w-4 h-4 rounded-md border-2 border-black transition-all flex items-center justify-center ${
                  skipAnimation
                    ? 'bg-[#FDCF29] text-black shadow-[1px_1px_0_#000]'
                    : 'bg-white'
                }`}
              >
                {skipAnimation && <Check className="w-3 h-3 stroke-[3.5]" />}
              </div>
              <span>跳过动画</span>
            </label>
          </div>

          {/* UNIFIED PANTRY COLLECTION BIG CARD (分类、食材网格与配送定制统一大卡片) */}
          <div
            /* 去掉黑描边：卡片浮在青柠底上，白底本身已有足够分离度，
               再加黑粗边会变成「黑加绿」的廉价观感（用户已多次指出）。 */
            /* ⚠️ 不要 sm: 变体：视口 >640px 时 p-4 会把网格挤窄 8px，
               而手机壳宽度是恒定的 410px，这个断点只会制造「桌面/窄窗两种观感」。 */
            className="w-full bg-white rounded-[24px] p-3 shadow-sm relative z-10 select-none flex flex-col"
            id="unified-pantry-big-card"
          >
            {/* Category Tabs & Select-All Row (Balanced proportion, natural width fitting tabs snugly, right-aligned select-all) */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 select-none">
              {/* Left Capsule Pill Track: 全部 / 蛋白 / 蔬底
                  ⚠️ 2026-10-25 曾按用户要求「去掉这一块，先留白」整条移除过，
                  同日用户又问「这个组件怎么没了」→ 第 54 轮恢复。
                  `activeCategoryFilter` 状态一直保留着（网格 filter 没删），所以恢复只是加回 UI。
                  ⚠️ 容器 `justify-between`：左边 tab、右边全选胶囊，两端对齐；
                  改回 `justify-end` 会让 tab 贴到全选旁边、左侧留一大片空白。 */}
              {/* 2026-11-03 21:40 用户「这个组件改成滑动的动画」：
                  原来选中态是三个按钮各管各的 class 切换（bg-black + 青柠边），
                  切分类时黑胶囊是**原地消失 + 另一处原地出现**，中间没有位移。
                  改成「单一滑块 + layoutId」：黑胶囊作为独立元素，在三个按钮之间
                  用 spring 滑过去（FLIP 由 motion 自动算），视觉上是一颗胶囊在轨道上滑动。

                  ⚠️ 三个按钮必须**都带 `border-[2px]`**（未选中用 border-transparent）：
                     滑块是 `absolute inset-0`，它的尺寸恒等于按钮盒；若只有选中态有边框，
                     选中按钮会比邻居宽/高 4px —— 滑块滑过去时尺寸会跟着抖一下，
                     而且按钮中心会横移 2px，「滑动」看起来像「跳格」。
                  ⚠️ `transition-all` 必须收成 `transition-colors`：all 会把 width/transform
                     也纳入过渡，和 layoutId 的 FLIP 抢同一条通道，滑动会变粘。
                  ⚠️ layoutId 全局唯一，别在别处复用这个字符串。 */}
              <div className="relative inline-flex items-center bg-[#f1f4f8] rounded-full p-1 border border-slate-200/80 gap-0.5 shrink-0">
                {(
                  [
                    { key: 'all', label: '全部' },
                    { key: 'protein', label: '蛋白' },
                    { key: 'base', label: '蔬底' },
                  ] as const
                ).map((cat) => {
                  const isActive = activeCategoryFilter === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategoryFilter(cat.key)}
                      /* ⚠️ 两个方向的**延迟必须不同**，这是滑动动画能不能看的关键：
                         滑块实测 130ms 起步、400ms 落位。若文字随点击立刻变色 ——
                           · 旧标签：深灰字压在还没走开的黑胶囊上 → 那一帧「字凭空消失」；
                           · 新标签：白字提前出现在浅灰轨道上 → 同样看不见。
                         所以：变灰 `delay-[240ms]`（等黑底走开）、变白 `delay-[120ms]`
                         （等黑底快到）。两者都配合滑块窗口，全程没有「字看不见」的帧。
                         ⚠️ 别把两个 delay 统一成一个值，也别去掉 —— 会退回「闪一下」。 */
                      className={`relative px-4 py-1.5 rounded-full text-sm font-black ease-out cursor-pointer whitespace-nowrap leading-none active:scale-95 border-[2px] ${
                        isActive
                          ? 'text-white transition-colors duration-100 delay-[120ms]'
                          : 'text-[#475467] hover:text-black border-transparent transition-colors duration-200 delay-[240ms]'
                      }`}
                    >
                      {/* 滑块本体：黑色胶囊 + 青柠描边 + 顶部高光，整颗跟着 layoutId 移动 */}
                      {isActive && (
                        <motion.span
                          layoutId="pantry-category-pill"
                          /* ⚠️ 是 `-inset-[2px]` 不是 `inset-0`：absolute 子元素的包含块是
                             **padding box**（不含 border），inset-0 会让滑块比按钮小一圈
                             （实测 60×26 vs 按钮 64×30），外面露出一条灰轨道。
                             负 2px 正好抵掉按钮那 2px 透明边框，滑块与按钮严丝合缝。 */
                          className="pointer-events-none absolute -inset-[2px] overflow-hidden rounded-full border-[2px] border-[#C7F665] bg-black shadow-xs"
                          transition={{ type: 'spring', stiffness: 480, damping: 38, mass: 0.9 }}
                        >
                          <span className="absolute left-2 right-2 top-[2px] h-[4px] rounded-full bg-white/35" />
                        </motion.span>
                      )}
                      {/* ⚠️ 必须 `z-10`：滑块是 `absolute` 的 motion 元素，FLIP 期间它带着
                         transform 参与层叠；虽然 DOM 顺序在文字之前，实测仍会把白字盖住
                         （整帧截图里黑胶囊内部一个白像素都没有）。显式抬一层最稳。 */}
                      <span className="relative z-10 pill-label">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Side: Neon Lime Pill with "全选" + Checkmark Icon
                  ⚠️ 勾只在**真正全选**时才画（用户：「未全选时不能打勾」）。
                  未全选态 = 白底黑边空圈 + 灰点，与食材卡的 `CheckBadge` 同一套语言
                  （`CheckBadge` 未选中也是白底灰点），只是尺寸放大到 18px 配胶囊。
                  ⚠️ 2026-10-25 用户「未选中时框内也是白色」：胶囊底色也要跟着状态走 ——
                     未全选 = 白底（只有黑边+黑投影撑形，和上面「跳过动画」勾选框同一套），
                     全选 = 青柠底。之前恒为青柠，未选时整颗胶囊仍像「已激活」，
                     和里面的白圈灰点自相矛盾。 */}
              <div className="relative shrink-0 flex items-center">
                <button
                  onClick={() => {
                    if (isAllPantrySelected) {
                      handleClearAllSelections();
                    } else {
                      handleSelectAllPantry();
                    }
                  }}
                  className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full active:scale-95 transition-all duration-200 ease-out text-black font-black text-sm cursor-pointer border-[2px] border-black shadow-[1px_1px_0_#000] ${
                    isAllPantrySelected ? 'bg-[#C7F665] hover:bg-[#B7EF4B]' : 'bg-white hover:bg-[#F4F7FA]'
                  }`}
                  title={isAllPantrySelected ? '取消全选' : '全选全部食材'}
                  id="btn-category-select-all-pill"
                >
                  <span className="pill-label">{isAllPantrySelected ? '取消全选' : '全选'}</span>
                  {/* Black Circular Checkmark Badge with Gloss Highlight */}
                  <span
                    className={`relative w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                      isAllPantrySelected ? 'bg-black' : 'bg-white border-[1.5px] border-black'
                    }`}
                  >
                    {isAllPantrySelected ? (
                      <>
                        <CheckIcon className="w-3 h-3 text-[#C7F665]" />
                        {/* Gloss accent */}
                        <span className="absolute top-[1.5px] right-[2px] w-1 h-1 rounded-full bg-white/70 pointer-events-none" />
                      </>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* 食材网格：分类切换动画
                ------------------------------------------------------------
                经过 4 轮实测调优，最终方案是**去掉 layout 位移，改纯淡入淡出**。
                这里记录完整排查过程与实测数据，避免后人误改回 layout：

                【最初的问题】三处动画参数冲突
                  ① mode="popLayout" 把退场卡片设 position:absolute，
                     但它仍参与 layout 测量 -> 新旧卡片瞬态重叠。
                  ② exit 的 scale 与 layout 抢同一条 transform 通道。
                  ③ transition 只有 duration，layout 位移与 opacity 共用 0.15s，
                     实测「全部 -> 蔬底」单帧跳变 93.7px（≈620px/s），肉眼是「窜」。

                【修完①②③后仍剩真重叠】—— 这才是决定性的一步
                  实测「蔬底 -> 全部」仍有 4 帧矩形相交，**最深 167px**。
                  输出坐标定位到具体一对：羽衣甘蓝(x39) <-> 多汁圣女果(x39)，
                  随后羽衣甘蓝 x 从 39 跳到 129（3 帧横跨 90px）。

                  根因：**layout 位移的路径会横穿同列其他卡片**。
                  网格筛选本质是「换一批内容」，不是「移动同一批物体」——
                  用位移动画表达这个语义不对，横穿是必然结果，不是 bug。
                  → 去掉 layout，卡片改为「原地淡入 + 微缩放 + 轻微上浮」。
                     零位移 = 零重叠，这是唯一能彻底解决的路子。

                【最终方案：纯渐隐渐出（crossfade）】
                  入场: opacity 0->1，0.22s easeOut，延迟 0.03s
                  退场: opacity 1->0，0.16s easeIn
                  **只驱动 opacity，不带 scale / y**。
                  理由：网格筛选本质是「换一批内容」，任何位移都会让卡片在
                  网格里横穿同列其他卡片（实测最深重叠 167px）；
                  纯透明度过渡的路径恒等于原位，结构上不可能重叠。
                  0.03s 延迟让淡出先走一点、淡入再接力，视觉上不闪烁。

                  注：不用 popLayout —— 既然无位移，退场卡片留在流里
                  自然淡出即可，绝对定位反而会引发布局跳动。

                交互反馈（whileHover 上浮 / whileTap 缩小）不属于切换动画，
                保留原样，缩放与淡入淡出走不同属性互不干扰。

                卡片保留 will-change-transform 提升合成层，减少重绘掉帧。 */}
            {/* ⚠️ 列数不能用 sm: 断点。
                应用恒渲染在 410px 手机壳里，而 sm: 看的是**视口**宽度：
                视口 >640px 时 3 列 -> 卡片只剩 99px，图片却还是 sm 的 86px，
                图高占卡片 87%，把菜名和 kcal/价格行挤变形（桌面浏览器上的实际观感）。
                视口 <640px 时又变 2 列 -> 卡片 176px，一屏只放得下 4 个，太散。
                这里改成固定 3 列：410px 下卡片约 119px，两种窗口宽度观感一致。 */}
            <div className="grid grid-cols-3 gap-2.5 mb-2.5">
              <AnimatePresence initial={false}>
                {pantry
                  .filter((item) => activeCategoryFilter === 'all' || item.category === activeCategoryFilter)
                  .map((item) => {
                    const isSelected = selectedIngredientIds.has(item.id);
                    return (
                      <motion.div
                        /* 入库重排动画：新食材插到最前面，已有食材整体后移一位。
                           没有 layout 的话这一步是硬跳，卡片会"瞬移"；
                           这里让 Framer 用 FLIP 把位移补成滑动。
                           ⚠️ 只在 reorderAnim 期间开启，且用 "position" 只动位移 ——
                           常开 + 全量 layout 会破坏分类切换的交叉淡化（卡片重叠+拉伸）。 */
                        layout={reorderAnim ? 'position' : false}
                        /* 分类切换：纯渐隐渐出（crossfade）
                           只驱动 opacity，刻意不带 scale / y 位移 —— 任何位移都会让
                           卡片在网格里"横穿"同列其他卡片，制造瞬态重叠（实测最深 167px）。
                           纯透明度过渡的路径恒等于原位，结构上不可能重叠。
                           节奏沿用调优值：淡出 0.16s + 淡入延迟 0.03s + 淡入 0.22s。 */
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.22, ease: 'easeOut', delay: 0.03 } }}
                        exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }}
                        /* 交互反馈不属于切换动画，保留缩放/上浮手感 */
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        key={item.id}
                        /* 爆裂揭示的食材飞行落点靠这个 ref 反查屏幕坐标 */
                        ref={(el) => {
                          if (el) pantryCardRefs.current.set(item.id, el as HTMLElement);
                          else pantryCardRefs.current.delete(item.id);
                        }}
                        onClick={() => handleToggleIngredient(item.id)}
                        /* ⚠️ 卡片内部一律不要 sm: 变体。
                           应用恒在 410px 手机壳里，sm: 看的是视口宽度 —— 桌面下
                           padding 8px / badge 20px / 菜名 11px 全部变大，把中间留给
                           插画的高度压到只剩 29px，50px 的图直接被 overflow-hidden 裁掉。
                           统一用移动端尺寸后，中间图槽稳定在 ~54px，插画能完整显示。 */
                        className={`aspect-square w-full rounded-[16px] cursor-pointer relative flex flex-col justify-between p-1.5 select-none border will-change-transform active:scale-[0.98] transition-all duration-200 ease-out ${
                          isSelected
                            /* 选中态：只保留青柠环，不要内层黑边。
                               仍保留 1px 透明边框占位，否则与未选中态之间会跳 1px 版。
                               ⚠️ ring-inset 必须留：外扩的 ring 会让选中卡比同排卡片大一圈，
                                  在紧贴的九宫格里还会盖住相邻卡片的边。 */
                            ? 'bg-white border-transparent shadow-xs ring-2 ring-inset ring-[#C7F665]'
                            : OPTION_CARD_UNSELECTED
                        }`}
                      >
                        {/* Top Row: Rarity Tag (Left) & Selection Checkmark Badge (Right) */}
                        <div className="w-full flex items-center justify-between z-10">
                          {/* Rarity Badge - no border, snug compact outer box matching text with gentle rounded corners */}
                          <div
                            className={`relative px-1.5 py-0.5 min-w-[18px] h-4.5 rounded-[7px] flex items-center justify-center shrink-0 ${
                              item.rarity === 'SSR'
                                ? 'bg-[#ffb400]'
                                : item.rarity === 'SR'
                                ? 'bg-[#b388ff]'
                                : 'bg-[#C7F665]'
                            }`}
                          >
                            {/* 稀有度徽章不加白描边（用户指定：卡片里只有食材名字带描边）。
                                徽章本身已经是青柠/金/紫实色底，黑字对比度足够。 */}
                            <span className="font-black text-black text-[11px] leading-none tracking-tight">
                              {item.rarity}
                            </span>
                          </div>

                          {/* Top-Right Circular Checkmark Badge with thick black outline */}
                          <CheckBadge selected={isSelected} />
                        </div>

                        {/* Center Food Visual: Clean 3D illustration comfortably scaled without overflow */}
                        {/* pb-2（8px）是给菜名让出的「专用下边距」：
                            插画 h-full 量的是**内容盒**高度，所以这 8px 会直接从插画高度里扣掉
                            （46 -> 38px），插画整体上移，与菜名的重叠从 15px 降到 7px。
                            想让遮挡更少就加大这个值，想更少留白就减小 —— 只调这一处。 */}
                        <div className="w-full flex-1 min-h-0 max-h-[50%] relative flex items-center justify-center my-0.5 pb-2 overflow-hidden">
                          {/* 插画是正方形（320×320，内容 300px 居中），object-contain 按短边缩放。
                              尺寸用 h-full w-auto 吃满图槽，不写固定 px ——
                              图槽高度随卡片宽度变（106px 卡片 -> 槽 43px；114px -> 槽 51px），
                              固定值必有一边被裁。
                              max-h-[50%] 把图槽锁在卡片内高的一半：菜名从下面的流里搬进来之后，
                              少了一行的高度会被 flex-1 全吃掉，图会凭空胀大 —— 这里卡住上限。 */}
                          {renderIngredientVisual(item.id, item.name, "h-full w-auto max-w-full object-contain")}

                          {/* 菜名压在插画下缘，不再排在卡片底部。两个原因：
                              ① 白描边只有落在插画这种彩色背景上才看得见，
                                 排回近白卡片底（#f7f9fb）上等于白加；
                              ② 用户明确要求「适当挡住食材」，压在图上才有贴纸感。
                              字号 10px -> 12px，描边同步换 lg 版（2px）。 */}
                          {/* 2026-11-02 对齐：由居中改为左对齐 + pl-1。
                              居中时三张卡的菜名左缘分别是 51.1 / 171.6 / 280.4（名字越长越靠左），
                              而下方的 kcal 胶囊文字在 39 —— 同一张卡里两种对齐方式，网格看起来是散的。
                              改成左对齐后菜名墨迹 = 39，与 kcal 同一条列（卡内容边 35 + 4 内边距）。
                              pl-1 是给白描边留的位置，不加会被图槽的 overflow-hidden 切掉左半边描边。 */}
                          <h4 className="absolute inset-x-0 bottom-0 z-10 pl-1 text-left font-black text-black text-[12px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis tracking-tight text-stroke-white-lg pointer-events-none">
                            {item.name}
                          </h4>
                        </div>

                        {/* Bottom Nutrition & Price Row (Compact pill-shaped containers matching reference) */}
                        <div className="w-full flex items-center justify-between gap-1 z-10">
                          {/* Kcal Pill: Light blue-grey background with soft bold text */}
                          <div className="px-1 py-0.5 rounded-full bg-[#f1f4f8] flex items-center justify-center shrink-0">
                            <span className="font-bold text-[#475467] text-[13px] tracking-tighter whitespace-nowrap leading-none">
                              {item.kcal} kcal
                            </span>
                          </div>

                          {/* Price: 裸数字，无胶囊底。
                              颜色沿革：--lime-700 (#54801A) → text-rose-600 → 正红 #E60012
                              → 玫红 #FC259B（2026-10-27「所有红色改成 #fc259b」）
                              → **#FC5294**（2026-10-28 晚「所有红色改成 #fc5294」）。
                              全项目价格色统一为 #FC5294，与底部导航/悬浮购物车的计数红点同一套。
                              ⚠️ 白卡上永远不要用品牌主色 #C7F665 当文字（对白对比度仅 1.25:1）。
                              ⚠️ 对比度比原来的红**低了一档**：#FC5294 对白 3.10:1、
                              对 #f7f9fb 2.86:1 —— 15px font-black 属大文本，3:1 及格；
                              10~11px 的 ¥ 符号这类小字会偏淡。
                              ⚠️ 2026-10-28 晚起**不再有深色档**（用户看到深玫红问「为什么是暗色」）：
                              小字要更清楚就加字重/字号，别再换深色号。

                              字号 13px -> 15px（用户要求「价格视觉上比卡路里大一点」）。
                              实测依据（scripts/probe-price-size.mjs，410px 手机壳、3 列）：
                              这一行内容宽 100px，最宽的一组「180 kcal」胶囊 52.8px + 「¥15」20.9px，
                              13px 时余量 26.3px；放大到 15px 后价格占 24.1px，余量仍有 23px。
                              ⚠️ 行高由 kcal 胶囊决定（13px 字 + py-0.5 = 17px），价格 15px 的
                              15px 行高仍在 17px 以内 —— 这一行**不会变高**，图槽和插画尺寸不受影响。
                              再往上加到 17px 也放得下（余量 19.8px），只是会盖过菜名 12px 的层级。 */}
                          <div className="shrink-0 flex items-center justify-center">
                            <span className="font-black text-[#FC5294] text-[15px] leading-none tracking-tight whitespace-nowrap">
                              ¥{item.price}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>

            {/* Delivery & Custom Bowl Status Panel: Clean Text/Controls Layout without outer shell */}
            <div className="w-full px-1 py-1.5 select-none flex flex-col justify-center">
              {/* Top Area (between top border and divider line): Left has Title + Subtitle, Right has vertically centered Delivery button */}
              <div className="flex items-center justify-between gap-2">
                {/* Left Column: Title + Status Pill in row 1, Subtitle in row 2 */}
                <div className="flex flex-col min-w-0 justify-center">
                  <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
                    <h3 className="font-black text-black text-[15px] tracking-tight leading-none whitespace-nowrap shrink-0">
                      {selectedCount === 0 ? '未勾选食材' : `已勾选 ${selectedCount} 款食材`}
                    </h3>
                    {/* Status Pill */}
                    <div
                      className="px-2.5 py-0.5 rounded-full flex items-center justify-center bg-[#C7F665] text-black shrink-0 whitespace-nowrap"
                    >
                      <span className="pill-label font-black text-[12px] tracking-tight leading-none whitespace-nowrap">
                        {isDeliveryThresholdMet ? '已满起送' : `差${10 - selectedCount}款`}
                      </span>
                    </div>
                  </div>

                  {/* Subtitle explanation text */}
                  <p className="text-[#64748b] font-medium text-[11px] tracking-tight mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    点击食材，自由搭配定制
                  </p>
                </div>

                {/* Right Side: Delivery Pill Button centered vertically between top and bottom divider */}
                <div className="shrink-0 flex items-center self-center">
                  <button
                    onClick={handleAddCustomMealToCart}
                    disabled={!isDeliveryThresholdMet}
                    className={`px-5 py-2.5 rounded-full flex items-center gap-2 font-black text-[14px] tracking-tight transition-all select-none ${
                      isDeliveryThresholdMet
                        ? 'bg-[#C7F665] hover:bg-[#B7EF4B] text-black cursor-pointer shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 ease-out'
                        /* 禁用态：白字对 #94A3B8 只有 2.56:1（14px 正文要 4.5）。
                           压到 slate-600（#475569）后白字 7.58:1 —— 仍然一眼看出"灰、不可点"，
                           但不至于把文案读丢。 */
                        : 'bg-[#475569] text-white cursor-not-allowed opacity-95 shadow-xs'
                    }`}
                    id="btn-pantry-delivery-threshold"
                  >
                    <svg
                      className="w-4.5 h-4.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <polygon points="16 8 20 8 23 11 23 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span className="pill-label whitespace-nowrap font-black">
                      {isDeliveryThresholdMet ? '立即起送' : '满 10 款起送'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        </div>
      </div>


      {/* OVERLAY: 抽卡爆裂揭示（餐盘飞出光点 → 光芒消散 → 食材飞入食材库） */}
      <GachaBurstReveal
        active={revealActive}
        items={revealItems}
        mode={revealMode}
        origin={revealOrigin}
        resolveTargetRect={resolvePantryTarget}
        onComplete={handleRevealComplete}
      />

      {/* MODAL: 食材图鉴 —— 2026-10-28 外壳换成贴纸风 StickerModal（黑粗描边 + 青柠徽章）。
          列表本身仍是「全部奖池、不做截断」+ 内部滚动，滚动容器由 StickerModal 的 body 承担，
          所以 ref / onScroll / mask 都通过 bodyRef / onBodyScroll / bodyStyle 透传进去。 */}
      <AnimatePresence>
        {showChecklistModal && (
          <StickerModal
            onClose={() => setShowChecklistModal(false)}
            ariaLabel="盲盒食材奖池"
            cardId="gacha-dex-modal"
            cardRef={dexCardRef}
            title="食材图鉴"
            /* 2026-11-02 用户「继续放大标题」：sm(26) → **xl(40)**，实际渲染 40×0.9 = 36px。
               不动 sm 档 —— 那个档还被起送成功 / 健康计划 / 首页三张福利卡 / 门店共用。 */
            titleSize="xl"
            /* 2026-11-02 用户两轮「扩大这个」/「扩大」：徽章整体放大到设计稿比例。
               · 贴纸 60×52 → **68×56**（`badgeSize="lg"`）。依据：原始设计稿 210×172 按 0.325
                 换算正是 68×56（r22/边3），现在这版是被压过的；回到原比例与卡片最协调。
               · 图标 20 → 26 → **30**（内净区 62.5×50.5，30 时左右余 16 / 上下余 10）。
                 只放大图标不动贴纸（26→30 试过）会让绶带顶到底边，必须两者同步。
               ⚠️ 描边宽度保持 2.6 不放大 —— 图标变大后相对描边自然变细，放大 strokeWidth 会显笨。
               ⚠️ 描边 2.75 也不跟着贴纸放大：要和主卡的 2.75 描边等宽（贴纸语义是"贴"在卡上）。 */
            badge={<Award className="h-[30px] w-[30px]" strokeWidth={2.6} />}
            badgeSize="lg"
            /* 2026-11-02 用户「加大这个框的黑描边」：2.75 → **4**（+45%）。
               2.75 原本刻意与主卡描边等宽，但贴纸要「压」在卡上才够分量，加粗后层次反而更清楚。
               四档 A/B（2.75/3.5/4/4.5）里 4 是最粗一档仍不糊圆角的；4.5 圆角开始显钝。
               ⚠️ 高光 inset 由 borderWidth 推导（+0.25），写死会在粗描边时把黑边盖亮。 */
            badgeBorderWidth={4}
            subtitle={`全 ${GACHA_INGREDIENTS.length} 款食材 · 已收集 ${pantry.length} 款 · 满 10 款免费起送`}
            scroll
            maxHeight="58vh"
            maxWidth={360}
            /* 2026-11-01 用户「缩小整体这个页面」：360 宽在 410 壳里占 91.5%，边距只剩 17px，
               整张卡把壳填满。等比缩到 0.9（视觉 324 宽 / 边距 43px），文字/描边/徽章
               一起缩，比例不走形；字号仍落在 11.7/10/8 的可读区间，所以没改 maxWidth
               去挤窄（挤窄会让 desc 折行、行高反而变高）。 */
            scale={0.9}
            bodyRef={dexListRef}
            onBodyScroll={syncDexScroll}
            bodyStyle={{ maskImage: dexMask, WebkitMaskImage: dexMask }}
            bodyClassName="space-y-1.5 pb-2"
            footer={
              <StickerButton tone="ink" onClick={() => setShowChecklistModal(false)}>
                <span className="pill-label">我知道了</span>
              </StickerButton>
            }
          >
            {/* Full Catalog List — 展示全部奖池，不做截断。
                旧实现 slice(0, 10) 只显示前 10 种，而后 10 种（竹节玉米/西兰花/毛豆/
                白芝麻/松露/辣椒/油醋汁等）玩家永远无法查看，「已收录全品类」名不副实。
                isOwned 只按 id 判定；旧实现额外写了 `i === 0 && ing.id === 'ing_steak'`
                的硬编码兜底，会在未真正拥有时谎报「已收集」，已移除。

                ⚠️ 滚动容器必须是 flex 流里的 `flex-1 min-h-0`（StickerModal 已处理），
                   不能写 `absolute inset-0`：卡片高度是 max-h 撑出来的，不是定高，
                   绝对定位后这层不再贡献内容高度 → 整张卡会塌成"标题+按钮"134px。 */}
            {GACHA_INGREDIENTS.map((ing) => {
              const isOwned = pantry.some((p) => p.id === ing.id);
              return (
                <div
                  key={ing.id}
                  className={`flex items-center justify-between rounded-[12px] border-[1.5px] px-2 py-1.5 transition-all ${
                    isOwned
                      ? 'border-[#070906]/25 bg-[#ECFDC0]/70'
                      : 'border-[#070906]/12 bg-white opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[9px] border-[1.5px] border-[#070906]/15 bg-white shadow-2xs">
                      {renderIngredientVisual(ing.id, ing.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-black leading-tight text-[#070906]">{ing.name}</span>
                        <span className="rounded-full border border-[#070906]/15 bg-white px-1.5 py-0.2 text-[9px] font-bold text-[#070906]/60">
                          {ing.rarity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-tight text-[#070906]/55">{ing.desc}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {isOwned ? (
                      <span className="flex items-center gap-0.5 text-[11px] font-black text-[#54801A]">
                        <Check className="h-3 w-3" /> 已收集
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#070906]/45">待解锁</span>
                    )}
                  </div>
                </div>
              );
            })}
          </StickerModal>
        )}
      </AnimatePresence>

      {/* MODAL: Get More Gacha Tokens / Daily Check-in
          ------------------------------------------------------------
          2026-10-25 第 2 版：按用户提供的 GOT NEW INGREDIENTS **SVG 源码**逐项移植
          （用户原话「这个窗口使用这个SVG」）。换算比例 = 331 / 1018 ≈ 0.325，
          下面每个数都是 SVG 原坐标乘这个比例，注释里写了原值：
            · 主卡 1018×912 / r63 / 边 8.5  → 宽 331 / r20 / 边 2.75
            · **黑色立体边层**（SVG 主卡右下那层 #060804，偏移 +10,+8 → +3.25,+2.6）
            · **内侧白色高光描边** 3 → 1px（inset 1.6）
            · **左上 3D 徽章** 210×172 / r68 / 边 9.5 → 68×56 / r22 / 边 3，-4.2° 跨边框悬浮
              （2026-10-26 改：边 9.5→8.5 让屏上黑边 = 2.75px 与卡片边框一致，元素 68×56→71×58.7，
               见下方徽章那段注释）
            · **状态胶囊** 650×58 → 高 19；底 #ECFDC0 / 边 #C7EE74（浅绿，不是白底黑边）
            · **内容卡双层倒角**：外层 #EEEEF0→#DCDEE2，内层 #F3F5F8→#FFF + 1px 白描边
            · **按钮** 高 144 / r72 / 边 10 → 47 / r23.5 / 边 3.25，带错位投影 + 左上高光弧
          ⚠️ 整体倾斜从 SVG 的 **-3.1° 收到 -1.6°**：-3.1° 在 1064 画布上是设计感，
            在 346 宽的 HTML 卡上会把中文小字读歪，按钮点击区也跟着转。
          ⚠️ 倾斜必须放在**内层静态 div**：写进 motion.div 的 animate 会被 transform 覆盖。
          ⚠️ 3D 徽章的渐变 id 用 `gb-badge-*` 前缀，避免和页面里其它 SVG 撞 id。 */}
      <AnimatePresence>
        {showGetTokensModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/62 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              className="relative w-full max-w-[346px]"
            >
              <div className="relative -rotate-[1.6deg]">
                {/* 黑色立体边层（SVG 里主卡右下那层，偏移 3.25 / 2.6） */}
                <div className="absolute inset-0 translate-x-[3.25px] translate-y-[2.6px] rounded-[20px] bg-[#060804]" />

                {/* 主卡 */}
                <div
                  className="relative rounded-[20px] border-[2.75px] border-[#060804] bg-[#FDFDFD] px-3.5 pb-3.5 pt-4"
                  style={{
                    boxShadow:
                      'inset 0 0 0 1px rgba(255,255,255,0.85), 0 5px 7px rgba(74,107,0,0.22)',
                  }}
                >
                  {/* ===== 左上角 3D 荧光徽章（跨边框悬浮，-4.2°） =====
                      viewBox 用 SVG 原坐标（青柠块本体 = `56 30 210 172`），内部所有 path
                      都可以照抄原值，不用重算。
                      ⚠️ 2026-10-26 用户「这个修复一下，改成规则的描边」——徽章黑描边**粗细不匀**：
                        描边是**居中**画在路径上的（strokeWidth 9.5 → 屏上 3.08px，路径两侧各 1.54px），
                        而旧 viewBox 正好等于青柠块本体（210×172），元素又是 68×56 等比 →
                        **外侧那 1.54px 被 SVG 视口裁掉了**，只剩内侧 1.54px 可见。
                        于是徽章自己的黑边只有 1.54px，而卡片边框是 2.75px，
                        两条黑边在左上/左侧相接处**从 1.54 突跳到 2.75**，右下又只有 1.54 →
                        看上去就是"上厚下薄、拐角有台阶"的不规则描边。
                      解法：① viewBox 向外扩到把**整条描边**框进去（四周留 pad 0.5 单位）；
                        ② strokeWidth 9.5 → **8.5**（8.5 × 0.3236 = 2.751px），
                           和卡片边框 2.75px **严格相等**，交界处不再有台阶；
                        ③ 元素同步放大到 71×58.7（= 219.5:181.5 等比，缩放仍是 0.3236，
                           青柠块本体渲染宽 67.96px ≈ 旧 68px，**尺寸不动**），
                           再用 left/top 各 -1.54px 抵消新增的外圈，青柠块位置纹丝不动。
                      ⚠️ 改 strokeWidth 必须同步改 viewBox 与元素尺寸，三者是绑定的：
                        viewBox = 210+sw+1 : 172+sw+1，元素 = viewBox × 0.3236，
                        否则 meet 缩放改按另一轴走，描边会变细或青柠块变形。 */}
                  <div className="pointer-events-none absolute -left-[9.5px] -top-[15.5px] z-20 h-[58.7px] w-[71px] -rotate-[4.2deg] drop-shadow-[2px_3px_2px_rgba(0,0,0,0.18)]">
                    <svg viewBox="50.75 24.75 219.5 181.5" className="h-full w-full" aria-hidden="true">
                      <defs>
                        <linearGradient id="gb-badge-grad" x1="15%" y1="10%" x2="85%" y2="92%">
                          <stop offset="0%" stopColor="#DCFF4E" />
                          <stop offset="45%" stopColor="#C6FA19" />
                          <stop offset="85%" stopColor="#B0E80B" />
                          <stop offset="100%" stopColor="#8FC204" />
                        </linearGradient>
                        <linearGradient id="gb-badge-gloss" x1="0%" y1="0%" x2="60%" y2="60%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
                          <stop offset="45%" stopColor="#F2FFAA" stopOpacity="0.55" />
                          <stop offset="100%" stopColor="#C6FA19" stopOpacity="0" />
                        </linearGradient>
                        <filter id="gb-badge-blur" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="2" />
                        </filter>
                      </defs>
                      {/* 青柠块本体（**只填色不描边**：描边提到最上层单独画，见末尾） */}
                      <rect
                        x="56"
                        y="30"
                        width="210"
                        height="172"
                        rx="68"
                        fill="url(#gb-badge-grad)"
                      />
                      {/* 底侧暗绿立体倒角 */}
                      <path
                        d="M 86,184 C 120,196 204,196 238,182 C 252,174 258,156 258,136"
                        stroke="#7FB000"
                        strokeWidth="13"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.9"
                        filter="url(#gb-badge-blur)"
                      />
                      {/* 左上柔光高光层 */}
                      <path
                        d="M 70,115 C 70,62 96,42 156,42 C 195,42 225,48 240,62 C 215,52 175,50 140,54 C 98,58 80,78 76,122 Z"
                        fill="url(#gb-badge-gloss)"
                        filter="url(#gb-badge-blur)"
                      />
                      {/* 锐利高光弧 */}
                      <path
                        d="M 76,102 C 78,66 100,48 142,46"
                        stroke="#FFFFFF"
                        strokeWidth="11"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.95"
                        filter="url(#gb-badge-blur)"
                      />
                      {/* 中央大十字闪光星（4 瓣圆润） */}
                      <path
                        d="M 152,78 C 155,78 158,81 159,90 C 160,101 163,104 174,105 C 183,106 186,109 186,113 C 186,117 183,120 174,121 C 163,122 160,125 159,136 C 158,145 155,148 152,148 C 148,148 145,145 144,136 C 143,125 140,122 129,121 C 120,120 117,117 117,113 C 117,109 120,106 129,105 C 140,104 143,101 144,90 C 145,81 148,78 152,78 Z"
                        fill="#060804"
                        transform="rotate(4, 152, 113)"
                      />
                      {/* 右上小十字 */}
                      <path
                        d="M 197,72 C 199,72 201,74 202,81 C 203,87 205,89 211,90 C 217,91 219,92 219,95 C 219,98 217,99 211,100 C 205,101 203,103 202,109 C 201,116 199,118 197,118 C 195,118 193,116 192,109 C 191,103 189,101 183,100 C 177,99 175,98 175,95 C 175,92 177,91 183,90 C 189,89 191,87 192,81 C 193,74 195,72 197,72 Z"
                        fill="#060804"
                      />
                      {/* 左下圆角菱形黑点 */}
                      <rect
                        x="119"
                        y="132"
                        width="19"
                        height="19"
                        rx="6"
                        transform="rotate(-12, 128, 141)"
                        fill="#060804"
                      />
                      <circle cx="126" cy="140" r="3.5" fill="#2A2E26" />
                      {/* ===== 黑描边（**最后画**，压在所有 3D 图层之上） =====
                          ⚠️ 必须放在末尾：倒角（#7FB000 13 宽 + 模糊 2）和左上柔光高光
                          （白色 + 模糊 2）都贴着形状边缘内侧走，如果描边在它们下面，
                          会被吃掉 1px 左右 → 实测底部黑边只剩 0.00px、左右 1.50/1.25px，
                          就是用户说的"描边不规则"。描边最后画 = 四边恒定 2.75px。 */}
                      <rect
                        x="56"
                        y="30"
                        width="210"
                        height="172"
                        rx="68"
                        fill="none"
                        stroke="#060804"
                        strokeWidth="8.5"
                      />
                    </svg>
                  </div>

                  {/* ===== 右上关闭（SVG r42 → 直径 27，X 线宽 8.5 → 2.75） ===== */}
                  <button
                    onClick={() => setShowGetTokensModal(false)}
                    aria-label="关闭"
                    className="absolute right-2.5 top-2.5 z-30 flex h-[27px] w-[27px] items-center justify-center rounded-full bg-[#070906] cursor-pointer transition-all duration-200 ease-out active:scale-90"
                  >
                    <X className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />
                  </button>

                  {/* ===== 标题区（mt-[42px] 让开徽章底沿 42px） ===== */}
                  <div className="relative mt-[42px]">
                    {/* 单行大字。⚠️ 2026-10-25 用户「去掉（吉祥物），标题改成单行并扩大」：
                        吉祥物 + 动作线整块移除，标题从两行 26px 改成单行 42px。
                        42px × 5 字 ≈ 210px，占内容宽（318）的 66%，右侧留 108px 呼吸位。
                        再往上加字号（>46）中文会显得笨重、且 -2° 倾斜后右端容易压到卡片边。 */}
                    {/* ⚠️ 字体粗细：`font-black` 已是 900（中文黑体上限），要"更粗"只能靠外扩描边。
                        这里用 **8 向 text-shadow**（不是 `-webkit-text-stroke`）：
                        text-stroke 是**居中**描边，会把笔画内部吃掉、粗黑体反而显细
                        （index.css 里 `.text-stroke-white` 的注释有同样的结论）。
                        text-shadow 只向外扩，字形不动。
                        2026-10-25 用户「减少字体描边、加大字间距」：外扩从 0.9/0.65 收到 0.45/0.32
                        （笔画不再糊在一起），`tracking-tight`(-0.025em) → `tracking-[0.04em]`。 */}
                    {/* ⚠️ 2026-10-26 用户「标题右侧加上这个图标，图标为绿色描边」：
                        抽卡币皇冠（`<TokenIcon outline />`）挂在标题右侧，绿色**描边**（空心）。
                        · 旋转挪到外层 flex 上：标题和图标必须**同一个 -2°**，否则图标像贴歪的。
                        · 图标尺寸 34px 时墨迹约 29×27（描边版 viewBox 28 单位、墨迹占 24/28），
                          线宽 2.2 单位 ≈ 2.7px —— 比标题的 46px 墨迹矮一档，是"副标"的体量。
                        · 描边色 #B0E80B 取自 3D 徽章渐变的中间档：纯青柠 #C8FF1A 在白卡上
                          对比度只有 1.1:1，2~3px 的线会糊掉；这个深度约 1.5:1，仍明显是"绿"。 */}
                    <div className="relative z-10 flex items-center gap-2 -rotate-2">
                      <h3
                        className="text-[46px] font-black leading-none tracking-[0.04em] text-[#070906]"
                        style={{
                          textShadow:
                            '0.45px 0 0 #070906, -0.45px 0 0 #070906, 0 0.45px 0 #070906, 0 -0.45px 0 #070906, 0.32px 0.32px 0 #070906, -0.32px -0.32px 0 #070906, 0.32px -0.32px 0 #070906, -0.32px 0.32px 0 #070906',
                        }}
                      >
                        获取抽卡币
                      </h3>
                      {/* ⚠️ `translate-y-[10px]` 不是随手加的：`items-center` 对齐的是 h3 的**行盒**，
                          而中文墨迹在行盒里偏下 —— 实测（去旋转后）标题墨迹中心比图标中心低 **10.4px**，
                          不下移的话皇冠看着"飘在字头右上"。这个位移在旋转后的局部坐标系里，跟着标题一起斜。
                      ⚠️ 2026-10-26 演进：34 → 44 + `-rotate-90`（用户撤回旋转）→ 34 → 44 直立 → **52 直立**。
                        要再试旋转，记得：顺时针 +90° 底边朝右（背对标题），逆时针 -90° 底边才朝左对着标题。
                        · 52px 的墨迹 ≈ 45×45，比标题（46px 字、墨迹高 39.5）高一档，是"压标题"的体量。
                        · 宽度够：标题墨迹 239.2 + gap 8 + 52 = 299.2 < 内容区 314，右侧仍余 ~15px。
                          **上限 ≈ 64px**（= 314 − 239.2 − 8），再大就得缩 gap 或标题字距。
                        · ⚠️ `-my-[3px]` 是**必须的**：图标 52 > 标题行盒 46，不加负外边距的话
                          行高被撑到 52，下面 Z 划痕整块下移 6px、弹窗高度 391 → 397 全变。
                          负 margin 只压**外边距盒**（46 = 52 − 3×2），`items-center` 仍按外边距盒居中，
                          图标视觉中心一点不动，但行高不变。 */}
                      <TokenIcon
                        outline
                        strokeWidth={2.2}
                        className="-my-[3px] h-[52px] w-[52px] translate-y-[10px] text-[#B0E80B]"
                      />
                    </div>
                    {/* 荧光笔：用户「绿色下划线变成双横线（Z 形状）」——
                        照 SVG 原设计的折线来：`M 74,414 L 352,407 L 138,425 L 474,412`
                        （右上 → 折回左下 → 再拉到右），就是一道 Z。
                        线宽 11 → 屏上 6.47px（240px 宽 / 408 单位）。
                        ⚠️ 别改回单条圆角 div —— 单条是"下划线"，Z 折线才是参考图里那笔手绘划痕。
                        ⚠️ 2026-10-26 量过：内容真实包围盒 = x −0.5~401.5、y −1.5~29.5（端点 ±5.5 半线宽），
                        旧 viewBox `0 0 400 34` 比内容小 1.5 单位。但**实际没被裁**——因为
                        meet 缩放按高度走（0.588 < 240/400），viewBox 画幅只有 235.3px < 元素 240px，
                        左右各 2.35px 富余，溢出的 0.88px 落在富余区里（像素实测改前/改后画幅都是 236.25px）。
                        现在仍换成 `−3.5 −4.5 408 37` 把内容**完整框住**：等比后线宽还是 6.47px、
                        上下各留 1.76px，以后改尺寸/比例不会突然被切。
                        ⚠️ 改 viewBox 必须同步改 `h-[22px] w-[240px]`（408:37 的等比），
                        否则 meet 缩放改按高度走、线会变细 + 左右留白。`mt-2` 是补上新增的 1.76px 上留白。 */}
                    <svg
                      viewBox="-3.5 -4.5 408 37"
                      className="mt-2 h-[22px] w-[240px] -rotate-2"
                      aria-hidden="true"
                    >
                      <path
                        d="M 5,9 L 330,4 L 72,24 L 396,19"
                        stroke="#C8FF1A"
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>

                  {/* ===== 状态胶囊（SVG 650×58 → 高 19；底 #ECFDC0 / 边 #C7EE74） ===== */}
                  <div id="tokens-status-pill" className="mt-3.5 flex items-center gap-2 rounded-full border border-[#C7EE74] bg-[#ECFDC0] px-2.5 py-[5px]">
                    <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-[#070906] bg-[#ECFDC0]">
                      {/* 原来这里是 `Sparkles`（和大按钮/页头的皇冠不一致），统一到 TokenIcon */}
                      <TokenIcon className="h-2.5 w-2.5 text-[#070906]" />
                    </span>
                    <span className="pill-label text-[11px] font-black text-[#070906]">当前剩余</span>
                    <span className="h-3 w-[1.5px] shrink-0 rounded-full bg-[#B6DA6B]" />
                    <span className="pill-label text-[11px] font-black text-[#070906]">
                      <strong className="text-[13px]">{tokens}</strong> 币
                    </span>
                    <span className="ml-auto shrink-0 rounded-full border border-[#B6DA6B] bg-[#D9F79A] px-1.5 py-[2px] text-[8px] font-black leading-none text-[#0E130A]">
                      <span className="pill-label">每日 0 点刷新</span>
                    </span>
                  </div>

                  {/* ===== 任务卡 1：每日签到（双层倒角：外层灰渐变 + 内层白渐变） ===== */}
                  <div id="task-row-sign" className="mt-2 rounded-[17.5px] bg-gradient-to-br from-[#EEEEF0] via-[#E5E7EB] to-[#DCDEE2] p-[1.5px]">
                    <div className="flex items-center justify-between gap-2 rounded-[16px] bg-gradient-to-br from-[#F3F5F8] via-[#F8F9FB] to-white px-2.5 py-2 ring-1 ring-white">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border-[2px] border-[#070906] bg-[#C7F665]">
                          <TokenIcon className="h-4 w-4 text-[#070906]" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-black leading-none text-[#070906]">每日签到</span>
                            <span className="rounded-full bg-[#E4FCA9] px-1.5 py-[2px] text-[8px] font-black leading-none text-[#0E130A]">
                              每日限 1 次
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] font-bold leading-none text-[#54801A]">+1 抽卡币</div>
                        </div>
                      </div>
                      {/* 按钮：错位投影 + 青柠渐变 + 3px 黑边 + 左上高光弧 */}
                      <span className="relative shrink-0">
                        {!hasCheckedInToday && (
                          <span className="absolute inset-0 translate-y-[2.5px] rounded-full bg-[#DDF988]" />
                        )}
                        <button
                          disabled={hasCheckedInToday}
                          onClick={() => {
                            if (hasCheckedInToday) {
                              onShowToast('今日已签到');
                              return;
                            }
                            setTokens((prev) => prev + 1);
                            setHasCheckedInToday(true);
                            onShowToast('签到成功！已获得 1 枚抽卡币');
                            setShowGetTokensModal(false);
                          }}
                          className={`relative rounded-full border-[3px] px-3 py-1.5 text-[11px] font-black transition-all duration-200 ease-out ${
                            hasCheckedInToday
                              ? 'border-[#070906]/35 bg-[#E8E8E8] text-[#070906]/40 cursor-not-allowed'
                              : 'border-[#070906] bg-gradient-to-br from-[#D4FF2A] via-[#C7FD19] to-[#B8F00B] text-[#070905] cursor-pointer active:translate-y-[1.5px]'
                          }`}
                        >
                          {!hasCheckedInToday && (
                            <span
                              className="pointer-events-none absolute inset-0 rounded-full"
                              style={{
                                backgroundImage:
                                  'radial-gradient(ellipse 58% 78% at 16% 6%, rgba(255,255,255,0.9), rgba(255,255,255,0) 64%)',
                              }}
                            />
                          )}
                          {hasCheckedInToday ? '已签到' : '领 1 币'}
                        </button>
                      </span>
                    </div>
                  </div>

                  {/* ===== 任务卡 2：好友助力 ===== */}
                  <div id="task-row-share" className="mt-2 rounded-[17.5px] bg-gradient-to-br from-[#EEEEF0] via-[#E5E7EB] to-[#DCDEE2] p-[1.5px]">
                    <div className="flex items-center justify-between gap-2 rounded-[16px] bg-gradient-to-br from-[#F3F5F8] via-[#F8F9FB] to-white px-2.5 py-2 ring-1 ring-white">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border-[2px] border-[#070906] bg-[#C7F665]">
                          <TokenIcon className="h-4 w-4 text-[#070906]" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-[12px] font-black leading-none text-[#070906]">好友助力</span>
                          <div className="mt-1 text-[10px] font-bold leading-none text-[#54801A]">+1 抽卡币</div>
                        </div>
                      </div>
                      {/* 黑胶囊按钮（SVG 右侧 GO TO COOK 的语言：黑底 + 白字 + 左上反光弧） */}
                      <span className="relative shrink-0">
                        <span className="absolute inset-0 translate-y-[2px] rounded-full bg-[#E5ECC8]" />
                        <button
                          onClick={() => {
                            setTokens((prev) => prev + 1);
                            onShowToast('分享成功！已获得 +1 抽卡币');
                            setShowGetTokensModal(false);
                          }}
                          className="relative rounded-full border-[3px] border-[#070905] bg-[#070906] px-3 py-1.5 text-[11px] font-black text-white cursor-pointer transition-all duration-200 ease-out active:translate-y-[1.5px]"
                        >
                          <span
                            className="pointer-events-none absolute inset-0 rounded-full"
                            style={{
                              backgroundImage:
                                'radial-gradient(ellipse 55% 80% at 15% 4%, rgba(255,255,255,0.42), rgba(255,255,255,0) 62%)',
                            }}
                          />
                          去分享
                        </button>
                      </span>
                    </div>
                  </div>

                  {/* ===== 底部关闭（黑胶囊 + 错位投影） ===== */}
                  <span className="relative mt-3 block">
                    <span className="absolute inset-0 translate-y-[2px] rounded-full bg-[#E5ECC8]" />
                    <button
                      onClick={() => setShowGetTokensModal(false)}
                      className="relative w-full rounded-full border-[3px] border-[#070905] bg-[#070906] py-2.5 text-[13px] font-black text-white cursor-pointer transition-all duration-200 ease-out active:translate-y-[1.5px]"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{
                          backgroundImage:
                            'radial-gradient(ellipse 46% 90% at 12% 2%, rgba(255,255,255,0.34), rgba(255,255,255,0) 58%)',
                        }}
                      />
                      关闭
                    </button>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Delivery Reward Success Claimed */}
      <AnimatePresence>
        {showDeliverySuccessModal && (
          <StickerModal
            onClose={() => setShowDeliverySuccessModal(false)}
            ariaLabel="达成起送"
            title="10 款达成"
            /* 2026-11-02 用户「这个页面的其他弹窗也按照这样样式去改」：
               与食材图鉴对齐 —— 标题 xl(40)、徽章 lg(68×56)、图标 30、描边 4。
               ⚠️ 徽章必须跟标题一起放大：标题 40 而图标还是 20 时，上下比例是反的。 */
            titleSize="xl"
            badge={<Truck className="h-[30px] w-[30px]" strokeWidth={2.6} />}
            badgeSize="lg"
            badgeBorderWidth={4}
            subtitle="已集齐 10 款食材，专属免费配送订单已生成，后厨现制中。"
            maxWidth={348}
            footer={
              <StickerButton
                tone="lime"
                onClick={() => {
                  setShowDeliverySuccessModal(false);
                  onNavigate('orders');
                  onShowToast('免单配送订单已生成！正在极速配送中');
                }}
              >
                <span>查看订单</span>
              </StickerButton>
            }
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] border-[2px] border-[#070906] bg-[#ECFDC0] shadow-[1.5px_2.5px_0_rgba(7,9,6,0.16)]">
              <Truck className="h-9 w-9 text-[#54801A]" strokeWidth={2.4} />
            </div>
          </StickerModal>
        )}
      </AnimatePresence>

      {/* ============================================================
          未接入的常量与逻辑（自查发现，未删除，保留供后续接入）
          ------------------------------------------------------------
          1. DROP_RATES / DAILY_TASKS — 定义完整但页面未渲染。
             DROP_RATES 的 15/35/50 现已是 drawSingle 的真实权重（改权重需同步改这里），
             但玩家在图鉴弹窗里看不到掉率说明。
          2. onClaimCoupon — Props 里声明了，本组件既不接收也不调用。
             满 10 款时走的是 handleAddCustomMealToCart（下单）而非领券。
          3. handleClaimFreeDelivery + showDeliverySuccessModal — 已实现完整的
             「达成 10 款免单配送」弹窗，但没有任何入口调用它，目前是死代码。
             触发点应该在勾选满 10 款时的配送按钮上。
          4. dimensionStatus / completedDimensionCount / deliveryProgressPercent /
             getDynamicRecommendation / collectedCount / isDeliveryGoalMet —
             「四维均衡」与「进度百分比」的计算都已写好，但 UI 里没有对应展示。
          5. CloudSkyBackground — 已 import 未使用，背景目前是内联 img + SVG 波浪。
          ============================================================ */}
    </div>
  );
};

/* ============================================================================
   结果弹窗专用装饰组件（结果弹窗高保真复刻用）
   ---------------------------------------------------------------------------
   参考图是「手账 / doodle」风格：白卡 + 粗黑描边 + 硬斜投影 + 手绘涂鸦线条。
   这些元素全是纯装饰，用固定 viewBox 的内联 SVG 绘制 —— 不引入图片资源，
   任意缩放都清晰，且能用 CSS 变量跟随主题色。
   ========================================================================== */
