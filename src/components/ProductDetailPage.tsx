import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dish, OrderMode } from '../types';
import { DishCoverArt, FOOD_HERO_FX } from './DishCoverArt';
import { CheckBadge } from './CheckBadge';
import { OPTION_CARD_SELECTED, OPTION_CARD_UNSELECTED } from '../tokens';
import { getDishIngredientMeta } from '../utils/ingredientBackdrops';
import {
  ChevronLeft,
  Heart,
  Plus,
  Minus,
  Sparkles,
  CupSoda,
  Coffee,
  Salad,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Store,
  Award,
  Zap,
  Info,
  Flame,
  Layers,
  X,
  ReceiptText,
  BadgePercent,
  ArrowRight
} from 'lucide-react';

/**
 * 「大份」实拍图的**逐菜微调**（默认 s=1，不改）。
 *
 * 六张图都按「内容最长边占 89%」归一化到同一个正方形画布，但内容包围盒的松紧
 * 差别很大：拿铁那张右下散着一片咖啡豆，把包围盒撑大了，归一化之后**杯子反而比
 * 标准份还矮 15%** —— 大份看着比标准份小，逻辑上说不通。所以这一张单独放大。
 * 其余五张（碗 / 三明治 / 杯）归一化后已经比标准份大，不要再乘。
 *
 * 上限提醒：hero 是 220px 高 + `overflow-hidden`，185 的盒子乘 1.05（外层）
 * 再乘 s 之后，杯底 / 垫子已经贴到白色面板；s 到 1.20 时拿铁的咖啡豆会被下沿裁掉。
 */
const LARGE_ART: Record<number, { s: number; x?: number; y?: number }> = {
  8: { s: 1.17, x: 0, y: -1 },
  /* 食品四道沿用标准份的下沉量（`y` 见 STANDARD_ART 的说明）。大份这块有
     `origin-bottom` + `-translate-y-[4px]`，底边本来就比标准份高 ~0.4px，
     所以同一组 y 落点几乎重合：192.4 / 201.1 / 193.8 / 202.6。
     饮料（3 奶昔）不加。 */
  1: { s: 1, y: 8.1 },
  4: { s: 1, y: 11.9 },
  7: { s: 1, y: 8.1 },
  9: { s: 1, y: 4.3 }
};

const DEFAULT_LARGE_ART = { s: 1, x: 0, y: 0 };

/**
 * 标准份实拍图的逐菜微调。默认不乘任何缩放：六张都在 `_crop-standard.py` 里
 * 按「内容最长边 = 画布 89%」归一化过，和点餐页 `BARE_FILL=90` 的口径一致，
 * 直接铺进 185 的盒子就是齐的。
 *
 * ⚠️ 这里的 `y` 是**只给「食品」用的下沉量**（百分比，相对 185 的盒子，5.4 ≈ 10px），
 *    饮料（3 奶昔 / 8 拿铁）**不要加**：杯子的包围盒本来就顶到画布 95%，
 *    底边落在 201px，再加就顶到 hero 下沿了。
 *    食品之所以要单独下沉，是因为碗/盘/三明治的包围盒矮（三明治只有画布 55% 高），
 *    归一化后视觉上明显比饮料"浮"在上面：
 *      沙拉 181.8 / 照烧锅 180.8 / 三明治 169.2 / 酸奶 195.0 /（饮料 ~201）
 *    下沉后各自落到 196.8 / 195.8 / 191.2 / 203.0，和饮料基本一个水平线。
 *    ⚠️ 幅度上限由**阴影**决定：内容底 + 12px 阴影必须留在 220px（hero 下沿）以内，
 *       所以酸奶（本来就在 195）只能给 4.3，三明治可以给到 11.9。
 */
const STANDARD_ART: Record<number, { s: number; x?: number; y?: number }> = {
  1: { s: 1, y: 8.1 },  // 牛油果鸡胸沙拉 181.8 → 196.8
  4: { s: 1, y: 11.9 }, // 金枪鱼三明治  169.2 → 191.2（包围盒最矮，补偿最多）
  7: { s: 1, y: 8.1 },  // 日式照烧鸡肉锅 180.8 → 195.8
  9: { s: 1, y: 4.3 }   // 希腊酸奶杯   195.0 → 203.0（已经很靠下，只给一点点）
};

interface ProductDetailPageProps {
  dish: Dish;
  onBack: () => void;
  onAddToCart: (dish: Dish, quantity?: number) => void;
  onBuyNow: (dish: Dish, quantity?: number) => void;
  isFav: boolean;
  onToggleFav: (dishId: number) => void;
  onShowToast: (msg: string) => void;
  orderMode?: OrderMode;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  dish,
  onBack,
  onAddToCart,
  onBuyNow,
  isFav,
  onToggleFav,
  onShowToast,
  orderMode = 'takeout'
}) => {
  // Option state
  const [size, setSize] = useState<'regular' | 'large'>('regular');
  const [temperature, setTemperature] = useState<'ice' | 'hot'>('ice');
  const [beanBase, setBeanBase] = useState<'blend' | 'dark' | 'special'>('blend');
  const [strength, setStrength] = useState<'default' | 'extra'>('default');
  const [sweetness, setSweetness] = useState<'zero' | 'slight' | 'half' | 'regular'>('zero');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'custom' | 'nutrition' | 'reviews'>('custom');
  const [savedTasteToast, setSavedTasteToast] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [showPriceBubble, setShowPriceBubble] = useState<boolean>(false);

  // Reset state on dish change
  useEffect(() => {
    setSize('regular');
    setTemperature(dish.category === 'drink' || dish.category === 'salad' ? 'ice' : 'hot');
    setBeanBase('blend');
    setStrength('default');
    setSweetness('zero');
    setSelectedAddons([]);
    setQuantity(1);
    setActiveTab('custom');
  }, [dish.id]);

  // 预加载两套实拍图：点份量切换时立刻出图，不先白一下
  useEffect(() => {
    [dish.imageStandard, dish.imageLarge].forEach((src) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  }, [dish.imageStandard, dish.imageLarge]);

  // hero 的「下坠」只在**切换**时播，进页面这一下不播。
  // 原因：详情页本身是从 scale 0.86 / y 40 弹上来的（App.tsx 的 modal 弹簧），
  // 页面往上弹、食物同时往下砸，两个方向打架；而且进页面本来也不缺入场动效。
  const [dropEnabled, setDropEnabled] = useState(false);
  useEffect(() => {
    setDropEnabled(false);
    const t = window.setTimeout(() => setDropEnabled(true), 520);
    return () => window.clearTimeout(t);
  }, [dish.id]);

  const isDrink = dish.category === 'drink';
  const largeArt = { ...DEFAULT_LARGE_ART, ...(LARGE_ART[dish.id] ?? {}) };
  const standardArt = { ...DEFAULT_LARGE_ART, ...(STANDARD_ART[dish.id] ?? {}) };
  /** hero 当前该用哪张实拍图：标准份 / 大份各一套；都没有时退回手绘裸图 */
  const heroImage = size === 'large' ? dish.imageLarge : dish.imageStandard;
  const heroArt = size === 'large' ? largeArt : standardArt;
  const isSaladOrBowl = dish.category === 'salad' || dish.category === 'bowl';

  /** 外层动画 key：**只有换菜（dish.id）才变** —— 2026-10-25 用户：
      「除了点分量规格可以切换食材，其他点击不能切换食材」。
      原来这里还拼了 `temperature` / `beanBase`，于是点「温度」「主粮基底」都会把 hero
      整层重挂、食物从上方坠一次（实测点击后 90ms hero 区域像素差 25%）——
      而这两个选项**并不会换图**（`heroImage` 只由 size 决定），
      只是"演了一遍换菜"，用户看到的就是"食材被切换了"。
      ⚠️ 现在**换菜**（外层）与**换份量**（内层 key={size}）是唯一两个会动 hero 的动作；
         温度 / 基底 / 酱汁 / 浓度 / 糖度 / 加料点击后 hero 必须一动不动（实测 0%）。
      ⚠️ 别再往里拼任何规格字段。想给某个选项加视觉反馈，改的是**选项卡自身**
         （勾选徽章 / 青柠环 / 副标题换色），不是 hero。 */
  const heroKey = `${dish.id}`;
  /** 外层是否刚好重挂（换主角）。内层据此关闭自己的 initial，避免「外层坠一次、
      内层再坠一次」的双重下坠（渲染期读+写同一个 ref，同一轮渲染内取值一致）。 */
  const prevHeroKey = useRef(heroKey);
  const heroJustChanged = prevHeroKey.current !== heroKey;
  prevHeroKey.current = heroKey;

  // --- 1. DYNAMIC INGREDIENT BACKDROP & PROVENANCE METADATA (匹配食物食材的专属背景与溯源标识) ---
  const ingredientMeta = useMemo(() => getDishIngredientMeta(dish), [dish]);

  // Labels for options matching Luckin/Light food aesthetics
  const sizeLabels = isDrink
    ? {
        regular: { title: '大杯', desc: '约450ml', badge: '' },
        large: { title: '超大杯 +¥3', desc: '约596ml', badge: '限量联名杯·用完即止' }
      }
    : {
        regular: { title: '标准碗', desc: '约450g · 控卡均衡', badge: '' },
        large: { title: '超大碗 +¥5', desc: '约650g · 双倍蛋白', badge: '超值大份·能量加倍' }
      };

  const tempLabels = isDrink
    ? { ice: '冰', hot: '热' }
    : { ice: '常温爽脆', hot: '微温热拌' };

  const beanBaseOptions = isDrink
    ? [
        { id: 'blend', title: '意式拼配', subtitle: '坚果基调 香醇口感', badge: 'IIAC金奖', badgeColor: 'bg-[#C7F665] text-slate-950 font-black' },
        { id: 'dark', title: '深烘拼配', subtitle: '黑巧尾韵 浓郁口感', badge: '咖啡更浓', badgeColor: 'bg-slate-900 text-[#C7F665] font-black' },
        { id: 'special', title: '埃塞金烘', subtitle: '花香可可 浓醇口感', badge: 'IIAC铂金', badgeColor: 'bg-slate-900 text-[#FDCF29] font-black' }
      ]
    : [
        { id: 'blend', title: '三色高原藜麦', subtitle: '慢碳低GI 坚果麦香', badge: '主厨推荐', badgeColor: 'bg-[#C7F665] text-slate-950 font-black' },
        { id: 'dark', title: '高纤黑米荞麦', subtitle: '饱腹控糖 高膳食纤维', badge: '控卡优选', badgeColor: 'bg-slate-900 text-[#C7F665] font-black' },
        { id: 'special', title: '有机羽衣甘蓝', subtitle: '0糖0碳基底 极致生酮', badge: '生酮必选', badgeColor: 'bg-slate-900 text-[#C7F665] font-black' }
      ];

  const strengthLabels = isDrink
    ? { default: '默认浓度', extra: '加单份浓缩 +¥3' }
    : { default: '标准酱汁', extra: '加倍特调油醋汁 +¥3' };

  const sweetnessLabels = isDrink
    ? [
        { id: 'zero', label: '不另外加糖' },
        { id: 'slight', label: '微糖' },
        { id: 'half', label: '半糖' },
        { id: 'regular', label: '标准糖' }
      ]
    : [
        { id: 'zero', label: '酱料单独分装' },
        { id: 'slight', label: '微量轻酱' },
        { id: 'half', label: '标准拌匀' },
        { id: 'regular', label: '浓郁拌匀' }
      ];

  // Category specific add-ons
  const addonList = isDrink
    ? [
        { name: '加份原榨生椰乳', price: 3, kcal: '+32 kcal' },
        { name: '加份阿拉比卡浓缩', price: 3, kcal: '+4 kcal' },
        { name: '换OATLY燕麦奶基底', price: 5, kcal: '+20 kcal' },
        { name: '加份Q弹低卡马蹄爆珠', price: 3, kcal: '+18 kcal' }
      ]
    : [
        { name: '加溏心无菌温泉蛋', price: 3, kcal: '+72 kcal' },
        { name: '加优质厚切牛油果', price: 6, kcal: '+85 kcal' },
        { name: '加低温慢烤牛排粒', price: 8, kcal: '+98 kcal' },
        { name: '加原味焙烤坚果碎', price: 4, kcal: '+45 kcal' }
      ];

  const toggleAddon = (addonName: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonName) ? prev.filter((a) => a !== addonName) : [...prev, addonName]
    );
  };

  const sizePrice = size === 'large' ? (isDrink ? 3 : 5) : 0;
  const strengthPrice = strength === 'extra' ? 3 : 0;
  const addonsPrice = selectedAddons.reduce((sum, addonName) => {
    const matched = addonList.find((a) => a.name === addonName);
    return sum + (matched ? matched.price : 0);
  }, 0);

  const unitExtra = sizePrice + strengthPrice + addonsPrice;
  const unitOriginalPrice = dish.originalPrice + unitExtra;
  const unitDealPrice = dish.dealPrice + unitExtra;
  const totalDealPrice = (unitDealPrice * quantity).toFixed(1);
  const totalOriginalPrice = (unitOriginalPrice * quantity).toFixed(1);

  // Nutritional dynamic calculation
  const calculatedKcal = useMemo(() => {
    let base = dish.kcal;
    if (size === 'large') base = Math.round(base * 1.35);
    if (strength === 'extra') base += 5;
    selectedAddons.forEach((addonName) => {
      const match = addonList.find((a) => a.name === addonName);
      if (match) {
        const num = parseInt(match.kcal.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) base += num;
      }
    });
    return base;
  }, [dish.kcal, size, strength, selectedAddons]);

  // Recipe formula breakdown text (Exact string format like in the screenshot)
  const formulaText = useMemo(() => {
    const dishTitle = dish.name.includes('（') ? dish.name : `${dish.name}（首创）`;
    const sizeName = size === 'large' ? (isDrink ? '+超大杯¥3' : '+超大碗¥5') : (isDrink ? '+大杯¥0' : '+标准碗¥0');
    const tempName = `+${temperature === 'ice' ? '冰' : '热'}¥0`;
    const beanName = `+${beanBaseOptions.find((b) => b.id === beanBase)?.title || ''}¥0`;
    const strengthName = strength === 'extra' ? '+加单份浓缩¥3' : '+默认浓度¥0';
    const sweetName = isDrink
      ? `+${sweetnessLabels.find((s) => s.id === sweetness)?.label || ''}¥0`
      : '';

    const parts = [
      `${dishTitle} ¥${dish.dealPrice}`,
      sizeName,
      tempName,
      beanName,
      strengthName,
      ...(sweetName ? [sweetName] : [])
    ];

    if (selectedAddons.length > 0) {
      selectedAddons.forEach((a) => {
        const item = addonList.find((x) => x.name === a);
        parts.push(`+${a}¥${item?.price || 0}`);
      });
    }

    return parts.join('');
  }, [dish, size, temperature, beanBase, strength, sweetness, selectedAddons]);

  const saveToastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveToastTimerRef.current) {
        window.clearTimeout(saveToastTimerRef.current);
      }
    };
  }, []);

  const handleSaveTaste = () => {
    onToggleFav(dish.id);
    setSavedTasteToast(true);
    if (saveToastTimerRef.current) {
      window.clearTimeout(saveToastTimerRef.current);
    }
    saveToastTimerRef.current = window.setTimeout(() => {
      setSavedTasteToast(false);
      saveToastTimerRef.current = null;
    }, 900);
  };

  const handleAddAction = () => {
    if (dish.soldOut) {
      onShowToast('已售尽');
      return;
    }
    onAddToCart(dish, quantity);
    onShowToast(`已将 ${quantity} 份【${dish.name}】加入购物车`);
  };

  const handleBuyAction = () => {
    if (dish.soldOut) {
      onShowToast('已售尽');
      return;
    }
    onBuyNow(dish, quantity);
  };

  return (
    <div
      style={{ backgroundColor: ingredientMeta.bgColor || '#26430B' }}
      className="w-full h-full flex flex-col relative select-none overflow-hidden transition-colors duration-500"
    >
      {/* 1. Transparent Floating Top Bar (Matching Navigation) */}
      {/* 图标语言对齐抽卡页：黑底 + 青柠字形（页头 logo 方块、圆形箭头按钮、
          「12 币」胶囊都是这一套）。原来是黑底白字，白字在深色食物照片上
          与青柠底的黑胶囊不成体系。 */}
      <div className="absolute top-0 inset-x-0 z-40 px-3 pt-2.5 pb-2 flex items-center justify-between pointer-events-auto">
        {/* Left Back Arrow Circle */}
        <button
          type="button"
          onClick={onBack}
          className="gb-hit w-8 h-8 rounded-full bg-black/70 hover:bg-black/85 backdrop-blur-md text-[#C7F665] flex items-center justify-center active:scale-95 transition-all duration-200 ease-out shadow-md"
          aria-label="返回"
        >
          <ChevronLeft className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Right Mini-Program Capsule (··· | ⊙) */}
        {/* 2026-11-03 22:06 右侧的「··· | ⊙」胶囊**已上提到 App 的页面舞台层**
            （`MiniProgramCapsule`，全站固定右上角），这里不再画第二份。
            ⚠️ 顶栏保持 `justify-between` 只剩左侧返回钮 —— 不要为了「右边不空」
               再塞东西回来，胶囊会由全局那一层叠在同一个位置上。 */}
      </div>

      {/* ========================================================================= */}
      {/* 2. FIXED TOP HERO BANNER (始终保持原位，滚动时轻微压缩高度使白卡微上移) */}
      {/* ========================================================================= */}
      {/* ⚠️ **不要给 hero 加 z-index**（原来是 z-10）：用户要求「食材盖到白底上」——
             食物要压在白卡上，而 hero 背景（食材微距照片）必须留在白卡下面。
             一旦 hero 带 z-index 就成了 stacking context，里面的食物层永远
             跑不出 hero 去压白卡。现在 hero 是 z-auto，背景随 DOM 顺序垫在白卡下，
             食物网格单独 z-30 压过白卡（z-20）、又低于顶栏（z-40）。 */}
      {/* ⚠️ 2026-10-23：hero **不再随滚动压缩**（原来是 `isScrolled ? h-[155px] : h-[220px]`）。
          压缩到 155 之后食物层只有 135 的内容区，185 的盒子无论怎么缩放都容易顶到
          `overflow-hidden` 的下沿被切平；一路把 scale 从 0.85 收到 0.77 也只是「勉强不切」，
          用户实机（~383px 宽）看着仍然像被标题挡住。干脆取消这套动作：
          hero 恒 220、食物恒 scale-100，滚动只发生在白卡内部，视觉上不会有任何位移。
          代价：滚动时顶部固定占 220px，白卡下的选项区可视高度比压缩态少 65px。 */}
      <div
        style={{ backgroundColor: ingredientMeta.bgColor || '#26430B' }}
        className="relative w-full flex-shrink-0 overflow-hidden flex items-center justify-center h-[220px]"
      >
        {/* A. DYNAMIC INGREDIENT BACKGROUND (纯色补色背景 + 单一原料食材高级微距静物摄影) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
          <img
            key={ingredientMeta.bgImage}
            src={ingredientMeta.bgImage}
            alt={ingredientMeta.bgAlt}
            // `bgFilter` 有值时（目前只有照烧锅）用数据里的景深滤镜，并把 scale 提到 106；
            // 没值时保持原来那套微调。两套互斥，避免 filter 类与内联 style 打架
            // —— 内联 style 一定压过 Tailwind 的 filter 类，混用会出现「类不生效」的假象。
            className={`w-full h-full object-cover object-center transition-all duration-500 ${
              ingredientMeta.bgFilter
                ? 'scale-106'
                : 'filter brightness-[0.98] contrast-[1.03] scale-102'
            }`}
            style={ingredientMeta.bgFilter ? { filter: ingredientMeta.bgFilter } : undefined}
           loading="lazy" decoding="async" />
          {/* Minimalist soft studio lighting.
              ⚠️ 压暗层沿革：from-black/30 + to-black/20 + black/5
                → 2026-10-25「背景的阴影不要那么严重，现在太暗了」→ 12% / 8% / 2%
                → 2026-10-27「这个背景太暗了」→ **只留顶部 10%，底部和浮层全删**。
              理由：这两层当初是给顶栏的黑胶囊按钮保可读性的，但按钮本身是
              `bg-black/70 + backdrop-blur + border`，在亮底上对比更强，不需要靠压暗。
              底部那层 to-black/8 更是纯亏 —— 它压的正好是食物和白卡衔接的位置。
              ⚠️ 所以这里**只保留顶部一段**，别再加回底部渐变或整层 black/2 浮层。 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/[0.10] via-transparent to-transparent pointer-events-none" />
        </div>

        {/* B. 原 hero 左上角浮层徽章已**整体迁往白卡信息区**（见下方 WHITE SHEET
           的标题下方）—— 2026-10-23 用户实机截图：「向下移动还是会这样」。
           hero 里食物是百分比缩放、徽章文字是固定 px，渲染宽度一变窄（用户实机
           ~383px）两者就贴身（实测间隙只剩 ~6px），且在 hero 内怎么挪都躲不开
           （碗左缘在那个高度更靠左）。白卡里没有食物，才是它们的归宿。
           顶栏右侧的黑胶囊（···/圆点）不动：它是功能 chrome。
           （原来这里还有一枚分享圆钮，2026-11-03 22:04 已按用户要求删除。） */}

        {/* C. DYNAMIC FOREGROUND FOOD/DRINK (纯食物抠图本体，完美比例悬浮) */}
        {/* ⚠️ 父级用 grid + 子级 col-start-1 row-start-1 让新旧插画**叠在同一格**。
            原因见下面 AnimatePresence 的注释：去掉 mode="wait" 后两个 motion.div
            会同时在 DOM 里，用 flex 会被排成左右并排，必须靠 grid 同格叠放。
            不用 absolute inset-0 —— 那会吃掉父级的 pt-6/pb-2，插画位置整体下移约 8px。
            ⚠️ **z-30 是给「食材盖到白底上」用的**：hero 已去掉 z-index（不再是
            stacking context），这层的 z-30 直接在页面上下文里压过白卡的 z-20，
            同时低于顶栏 z-40。整层 pointer-events-none，不会挡住白卡的交互。 */}
        <div
          className="relative z-30 w-full h-full grid place-items-center pointer-events-none pt-6 pb-2 scale-100"
        >
          {/* 「下坠切换」：新图从 hero 上沿外侧坠入，落定时有一记很轻的回弹；
              旧图快速下沉淡出，让「换了一张」这件事靠落差表达，不靠交叉淡化。
              ⚠️ 仍然**不用** mode="wait" —— 那会留 0.2s 空白，之前被否过。
              这里用「新图从上方压下来 + 旧图向下让位」的方式错开，既没有空档，
              也不会出现两张图在原点糊在一起。
              ⚠️ y 从 −108 起（≈ 容器高的一半），配合父级 `overflow-hidden`，
                视觉上是从上边缘「掉」进画面，而不是凭空淡入；再小（−84）时
                第一帧就已经露出半个食物，看不出"掉"的过程。
              ⚠️ 弹簧参数：stiffness 280 / damping 21（ζ≈0.63）——落差 108px 走完约
                0.19s，落定时的回弹约 8px，看得见「落定」那一下。damping 再小
                （18 以下）会明显弹两下，像果冻；再大（28 以上）就没有顿感，成了平移。
              ⚠️ 入场**不播**这记下坠（dropEnabled 的 520ms 延迟）：详情页本身就是从
                scale 0.86 / y 40 弹上来的，页面往上、食物往下，两个方向会打架。 */}
          <AnimatePresence>
            <motion.div
              /* ⚠️ key 里**只有 dish.id**（2026-10-25 用户「除了点分量规格可以切换食材，
                 其他点击不能切换食材」）。历史上这里拼过 temperature / beanBase，
                 结果点温度、点主粮基底都会让食物重新从上方坠一次 —— 看着像"食材被换了"，
                 但那两个选项根本不换图。现在外层只管**换菜**。
                 ⚠️ 份量切换的下坠由下面**内层** motion.div 负责（key={size}，且这层外面没有
                 AnimatePresence → 旧图瞬间消失、只有新图坠入）。
                 曾经把 size 直接加到这个 key 上，结果点一下份量就旧图下沉淡出 + 新图从
                 -108 坠入，**两张碗同时在画面里**（用户实机反馈「仅切换分量会转换上面的
                 商品」）。现在的分工：外层管换菜的下坠 + 旧图下沉退场；
                 内层管换份量的下坠，同一时刻画面里只有一张图。 */
              key={heroKey}
              initial={
                dropEnabled ? { opacity: 1, scale: 0.94, y: -108 } : false
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 48,
                /* 退出单独用短 tween：沿用弹簧的话要 0.6s 才归位，
                   元素会在 DOM 里留着一段看不见的时间，也会拖慢下一次切换。
                   0.15s 之内退干净，才不会和新图在半空糊成两张。 */
                transition: { duration: 0.15, ease: 'easeIn' },
              }}
              transition={{
                y: { type: 'spring', stiffness: 280, damping: 21, mass: 1 },
                scale: { type: 'spring', stiffness: 280, damping: 24, mass: 1 },
                opacity: { duration: 0.16, ease: 'easeOut' },
              }}
              className="col-start-1 row-start-1 flex flex-col items-center justify-center"
            >
              {/* 内层：「份量切换的下坠式动画」。key={size} → 点标准碗/超大碗时 React 直接
                  换掉这一层：旧图**瞬间消失**（这层外面没有 AnimatePresence，没有退场动画），
                  新图从 hero 上沿外（y −108）坠入 + 落定回弹 —— 和换主角同一套弹簧参数，
                  视觉语言统一，但绝不会两张图同屏（那就是当初被否掉的样子）。
                  ⚠️ `heroJustChanged` 为真（外层刚重挂 = 换了主角）或 `dropEnabled` 还没到
                  520ms 时关闭 initial：否则换主角会「外层坠一次、内层再坠一次」，落差翻倍。 */}
              <motion.div
                key={size}
                initial={
                  heroJustChanged || !dropEnabled
                    ? false
                    : { opacity: 1, scale: 0.94, y: -108 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  y: { type: 'spring', stiffness: 280, damping: 21, mass: 1 },
                  scale: { type: 'spring', stiffness: 280, damping: 24, mass: 1 },
                  opacity: { duration: 0.16, ease: 'easeOut' },
                }}
                className="flex flex-col items-center justify-center"
              >
              {/* 食物本体：用 `DishCoverArt` 的 **bare 模式** —— 只有抠图，没有青柠盘、没有弧文字。
                  ⚠️ 详情页**不加盘**是刻意的（用户原话"去掉绿色底盘和文字"）：
                     hero 背景本身就是这道菜的食材微距照片，再垫一块青柠盘会和背景打架；
                     营养信息在下面白卡的标题区已经有了，弧文字属于点餐页卡片的浏览态语言。
                  ⚠️ 裸图靠 `CONTENT_BBOX` 把每道菜按**最长边**归一化到容器的 90%，
                     所以六道菜的视觉尺寸是齐的（直接套同一个 scale 会一大一小）。
                  ⚠️ `size` 别超过 ~190：hero 是 220px 高 + `overflow-hidden`，
                     再大杯盖会被裁（滚动压缩到 155px 时更明显）。
                  ⚠️ 换掉了原来的 `FoodCutoutRenderer`（手绘 SVG 杯/碗，会按 size/temperature
                     换形态）。代价是「大杯 / 冰 / 热」不再有不同造型，所以这里补一层缩放，
                     让「升级大份」至少还有尺寸反馈。
                  ⚠️ **投影 + 外轮廓光**：`shadow`/`rim` 开 → 食物加 `FOOD_HERO_FX`
                     （暗色 drop-shadow 管落地 + 白光 drop-shadow 管轮廓分离，
                     电商商品图经典的 rim light + drop shadow 组合）。
                     两者都必须是 drop-shadow 不能是 box-shadow
                     （抠图是透明 PNG，box-shadow 会画矩形框）。 */}
              {/* hero 现在是**两套实拍抠图**：
                  标准份 → `dish.imageStandard`（六道菜都已经换成实拍），
                  大份   → `dish.imageLarge`，外面再套 scale-105 让"加大"有体积差。
                  两套都在 `_crop-standard.py` / `_crop-large.py` 里按同一口径归一化
                  （内容最长边 = 画布 89%），所以切换时不会一大一小地跳。
                  没有实拍图的菜退回手绘裸图 `DishCoverArt bare`。
                  ⚠️ 这里额外加 scale-105 是刻意的：大份本来就该"更大一点"，
                     但它和兜底分支用的是同一个 scale-105，别重复叠。
                  ⚠️ 两条分支都要加同一个 `FOOD_HERO_FX`，落地感/轮廓光才一致。 */}
              {heroImage ? (
                <div
                  className={`transition-transform duration-300 ease-out ${
                    /* ⚠️ 这一串是「阴影别被 hero 底边裁掉」的补偿，不是构图微调：
                       ① `origin-bottom`：scale 默认绕中心放大，185 的盒子底部会多下沉
                          (185×0.05)/2 ≈ 4.6px，正好把杯底投影顶到 hero 下沿的裁剪线
                          （219 行留 252 的灰、220 行直接 255 —— 一条硬边）。
                          把原点改到盒底，放大只往上长、底边不动。
                       ② `-translate-y-[4px]`：大份素材里杯子右边散着一把咖啡豆，
                          那几个豆子比杯底再低约 3px，投影尾巴会比标准份多探出 3px，
                          219 行仍留 253 的灰。补 4px 后收到 254（1 个色阶，肉眼不可见）。
                          之所以不干脆省掉位移：省掉时是 253，差 2 个色阶，属于能测出来的
                          "平直灰边"，不如留着。 */
                    size === 'large'
                      ? 'scale-105 origin-bottom -translate-y-[4px]'
                      : 'scale-100'
                  }`}
                >
                  <img
                    src={heroImage}
                    alt={size === 'large' ? `${dish.name}（大份）` : dish.name}
                    draggable={false}
                    style={{
                      transform: `scale(${heroArt.s}) translate(${heroArt.x}%, ${heroArt.y}%)`,
                      filter: FOOD_HERO_FX,
                    }}
                    className="w-[185px] h-[185px] object-contain select-none pointer-events-none"
                   loading="lazy" decoding="async" />
                </div>
              ) : (
                <div
                  className={`transition-transform duration-300 ease-out ${
                    size === 'large'
                      ? 'scale-105 origin-bottom -translate-y-[4px]'
                      : 'scale-100'
                  }`}
                >
                  <DishCoverArt dish={dish} size={185} bare shadow rim />
                </div>
              )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. WHITE SHEET CONTAINER: FIXED HEADER + SCROLLABLE OPTIONS (分量规格及以下) */}
      {/* ========================================================================= */}
      {/* ⚠️ `-mt-[54px]`（原 -64px）：白卡顶上探到 hero 的 166px，食物底边（下沉后
          191~203px）压在白卡上 25~37px —— 用户要的「食材盖到白底上」还在。
          为什么这次动 `-mt` 而不是加 header 的 `pt`：
          两者对「可滚选项区」的挤压是一样的（都少 10px），差别在**白卡上沿的位置**。
          只加 `pt` 的话白卡顶仍停在 156，食物下移后等于压进白卡 47px，上沿那圈白
          会显得特别厚；把 `-mt` 一起收，白卡上沿跟着下移，保持原来 25~37px 的
          覆盖比例，标题也自然落到 230。
          「盖多少」和「标题多低」都靠这一个值。 */}
      <div className="flex-1 min-h-0 bg-white relative z-20 -mt-[54px] rounded-t-[24px] shadow-[0_-8px_20px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden">
        {/* A. Fixed Main Product Title & Meta Header (固定在白色面板顶部，不随规格滚动) */}
        {/* ⚠️ `pt-16`（64px）：白卡顶在 166px，最低的食物底边是酸奶 203px。
            h1 落在 230px，和食物（+12px 阴影到 215）之间留 ~15px 呼吸。
            改这个值之前先看 `STANDARD_ART` 的下沉量 —— 两者是一套的。 */}
        <div
          className={`bg-white rounded-t-[24px] px-4 pt-16 pb-3.5 flex-shrink-0 z-10 transition-shadow duration-200 ${
            isScrolled ? 'border-b border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)]' : ''
          }`}
        >
          {/* Product Title, Subtitle & Heart Save Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {dish.name} {dish.name.includes('（') ? '' : '（首创）'}
              </h1>
              <p className="text-[12px] text-slate-500 font-medium mt-1.5 flex items-center gap-1.5 flex-wrap">
                {ingredientMeta.subTraits.map((trait, idx) => (
                  <React.Fragment key={trait}>
                    {idx > 0 && <span className="text-slate-300">|</span>}
                    <span>{trait}</span>
                  </React.Fragment>
                ))}
              </p>

              {/* 食材徽章（2026-10-23 从 hero 左上角迁到此处，理由见 hero B 区注释）。
                  · 样式延续「黑绿搭配 + 字号层级」：徽章①的 NO.1/TOP.1 是 13px/900
                    深绿、全组最大，标签黑字；徽章②前缀深绿、正文黑字（次级溯源）。
                  · 底色 lime-50 `#F2FCE0`：白卡上白底徽章不可见，淡青柠底才既显眼
                    又不抢标题。深绿 `#54801A` 是品牌色里唯一能上浅底当文字的绿。
                  · 白卡里没有食物，任何渲染宽度都不会「挡住食材」。 */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {/* 徽章① = 金底黑字（2026-10-23 由「青柠底 + 深绿 NO.1」改）。
                    「金牌/NO.1」在全球设计语境里就是金色，青柠只代表品牌，
                    两颗徽章同底色时反而看不出主次。现在金 = 权威榜单，青柠 = 溯源背书。 */}
                <div className="bg-[#FDCF29] rounded-full px-2.5 py-1 flex items-center gap-1.5">
                  <span className="pill-label text-[#0D1F2D] text-[9px] font-extrabold leading-none">{ingredientMeta.topBadge1.bold}</span>
                  <span className="pill-label text-[#0D1F2D] text-[13px] font-black leading-none">{ingredientMeta.topBadge1.text}</span>
                </div>
                <div className="bg-[#F2FCE0] rounded-full px-2.5 py-1 flex items-center gap-1.5">
                  <span className="pill-label text-[#54801A] text-[9px] font-bold leading-none">{ingredientMeta.topBadge2.prefix}</span>
                  <span className="pill-label text-slate-900 text-[9px] font-bold leading-none whitespace-nowrap">{ingredientMeta.topBadge2.main}</span>
                </div>
              </div>
            </div>

            {/* Save Taste / Favorite (Heart Button)
                外形换成抽卡页页头「食材图鉴」那枚圆形白按钮的语言：
                圆形 + 1px 浅灰描边 + shadow-2xs，收藏后转粉底。
                原来是无底色的裸图标，在白卡上缺少可点按的实体感。

                ⚠️ 2026-11-03 用户「这个所有都改成小程序红」：收藏态底色 品牌金 #FDCF29 →
                   **#FC5294**。点餐卡上的收藏心 2026-10-25 就已经从金改成这个红了，详情页这颗
                   漏了 —— 同一个动作两个颜色。现在全站收藏态统一成唯一红，不再出现第二颗金色心。
                   · 心形改 `fill-white`：白压在 #FC5294 上是 3.09:1，过非文本 3:1；
                     深墨 #0D1F2D 压红是 5.43:1 也合规，但收藏态的白心更像「点亮」，
                     且和点餐卡的实心红心同一套语言。
                   · 描边跟着底色走同一个红（不另开深红档）：胶囊是圆的，1px 边框本就看不见，
                     留着只为维持 32×32 的盒尺寸。 */}
            <button
              onClick={handleSaveTaste}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
              aria-label={isFav ? "已收藏" : "收藏"}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 ease-out active:scale-95 shadow-2xs ${
                  isFav
                    ? 'bg-[#FC5294] border-[#FC5294]'
                    : 'bg-white border-slate-200/90 group-hover:bg-[#f1f4f8]'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isFav ? 'text-white fill-white' : 'text-slate-600'
                  }`}
                />
              </span>
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                {isFav ? '已收藏' : '收藏'}
              </span>
            </button>
          </div>

          {/* Save Toast Notification
              ⚠️ 轻透半透明雾面（45%~35% 渐变黑 + backdrop-blur + 内高光亮边）+ 快速消散动效（900ms 停留 + 0.22s 模糊淡出） */}
          <AnimatePresence>
            {savedTasteToast && (
              <motion.div
                key={isFav ? 'fav-on' : 'fav-off'}
                initial={{ opacity: 0, y: -4, scale: 0.98, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -4, scale: 0.98, filter: 'blur(3px)' }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="mt-2.5 py-1.5 px-3 bg-gradient-to-r from-slate-900/48 via-slate-800/42 to-slate-900/35 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.38),0_4px_12px_rgba(15,23,42,0.08)]"
              >
                <Sparkles className="w-3 h-3 text-amber-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]" />
                <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                  {isFav ? '已收藏当前商品！' : '已取消收藏'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* B. SCROLLABLE SPECIFICATIONS (分量规格及以下 - 加大上下与组件间距) */}
        <div
          onScroll={(e) => {
            const scrolled = e.currentTarget.scrollTop > 6;
            if (scrolled !== isScrolled) {
              setIsScrolled(scrolled);
            }
          }}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-3 pb-28 space-y-6 bg-white"
        >
          {/* Spec 1: 杯型 / 份量规格 */}
          <div>
            {/* ⚠️ mb-3（原 mb-2）：左上浮动胶囊放大到 17.5 高、悬出卡片 11px 后，
                8px 的标题间距会被吃掉 3px、胶囊顶到「份量规格」上。12px 才留出 1px 呼吸。 */}
            <div className="text-[12px] font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>{isDrink ? '杯型' : '份量规格'}</span>
              <span className="text-[9px] text-slate-400 font-normal">单选</span>
            </div>
            {/* 选项卡统一走抽卡页「食材卡」的语言：
                · 未选中 = **白底** + 1px 浅灰边（2026-10-25 用户「没选中的是白色底」，
                  原来 #f7f9fb 的浅灰底改成白，灰底在白面板上像"禁用的输入框"）
                · 选中   = 白底 + ring-2 青柠环（抽卡页选中态用的是外环，不是绿描边）
                  ⚠️ 两种状态现在都是白底，选中只靠青柠环 + 勾选徽章 + 文字变绿来区分，
                     所以**环一定不能去掉**，否则整组会看不出选的是哪张。
                · 右上角 = 1.2px 黑描边圆形勾选徽章，选中填青柠 + 黑对勾
                · 图标方块选中时走黑底青柠字（抽卡页 logo 方块 / 圆形箭头按钮同一套）
                角标从「右上浮动」挪到「左上浮动」——右上角已经交给勾选徽章了。
                ⚠️ 未选中的图标方块保留 `bg-[#f1f4f8]`：卡片变白后，这块浅灰正好承担
                   "图标的底"，别跟着卡片一起漂白，否则图标会散在卡面上没有落点。 */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: 大杯 / 标准碗 */}
              <button
                type="button"
                onClick={() => setSize('regular')}
                className={`group relative py-2.5 px-3 rounded-xl text-left flex items-center gap-2.5 transition-all duration-200 ease-out active:scale-[0.98] border ${
                  size === 'regular'
                    ? OPTION_CARD_SELECTED
                    : OPTION_CARD_UNSELECTED
                }`}
              >
                <CheckBadge selected={size === 'regular'} className="absolute top-1.5 right-1.5" />
                <motion.div
                  whileHover={{ scale: 1.12, rotate: -4, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  animate={
                    size === 'regular'
                      ? { scale: [1, 1.16, 1], rotate: [0, -5, 0] }
                      : { scale: 1, rotate: 0, y: 0 }
                  }
                  transition={
                    size === 'regular'
                      ? { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }
                      : { type: 'spring', stiffness: 450, damping: 20 }
                  }
                  className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors shadow-2xs ${
                    size === 'regular'
                      ? 'bg-black text-[#C7F665]'
                      : 'bg-[#f1f4f8] text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    {isDrink ? <CupSoda className="w-3.5 h-3.5" /> : <Salad className="w-3.5 h-3.5 stroke-[2.2]" />}
                  </motion.div>
                </motion.div>
                <div className="min-w-0">
                  <div className={`text-[12px] font-black leading-tight ${size === 'regular' ? 'text-black' : 'text-slate-600'}`}>
                    {sizeLabels.regular.title}
                  </div>
                  <div className={`text-[10px] font-medium mt-0.5 leading-tight truncate ${size === 'regular' ? 'text-[#54801A] font-bold' : 'text-slate-400'}`}>
                    {sizeLabels.regular.desc}
                  </div>
                </div>
              </button>

              {/* Option 2: 超大杯 / 超大碗 */}
              <button
                type="button"
                onClick={() => setSize('large')}
                className={`group relative py-2.5 px-3 rounded-xl text-left flex items-center gap-2.5 transition-all duration-200 ease-out active:scale-[0.98] border ${
                  size === 'large'
                    ? OPTION_CARD_SELECTED
                    : OPTION_CARD_UNSELECTED
                }`}
              >
                {/* Top-Left Floating Pill Badge — 金底墨字（抽卡页「10款起送」同款）
                    ⚠️ 字号 9.5 / padding px-2 py-[3px]：用户要求「扩大这些小标签」，
                       原来 7.5px 在真机上几乎读不出。三处一起动了，因为只放大字会让胶囊"虚胖"。
                    ⚠️ `-top-[11px]` 不是随手写的：胶囊实测 17.5 高，悬出 11px 后**卡内只占 6.5px**，
                       而卡片内容从 py-2.5 = 10px 起 → 胶囊底与标题留 3.5px。若沿用 -top-2（8px），
                       卡内会吃进 9.5px，胶囊就贴着「超大碗」的字顶了（试过，很挤）。
                       代价是上方要腾 11px，所以 Spec 标题的 mb-2 同步改成 mb-3。
                    ⚠️ 上限是卡片宽度：「超值大份·能量加倍」9 字 × 9.5 ≈ 86px + 左右 16px ≈ 102px，
                       卡片宽 184px，右端距勾选圈还有 78px，再大字就会顶到 CheckBadge。 */}
                <motion.span
                  whileHover={{ scale: 1.08, y: -1 }}
                  className="absolute -top-[11px] left-2 px-2 py-[3px] bg-[#FDCF29] text-[#0D1F2D] text-[10px] font-black rounded-full border border-black/15 shadow-2xs leading-none"
                >
                  <span className="pill-label">{sizeLabels.large.badge}</span>
                </motion.span>

                <CheckBadge selected={size === 'large'} className="absolute top-1.5 right-1.5" />

                <motion.div
                  whileHover={{ scale: 1.15, rotate: 6, y: -1.5 }}
                  whileTap={{ scale: 0.9 }}
                  animate={
                    size === 'large'
                      ? { scale: [1, 1.2, 1], rotate: [0, 6, 0] }
                      : { scale: 1, rotate: 0, y: 0 }
                  }
                  transition={
                    size === 'large'
                      ? { duration: 0.34, ease: [0.34, 1.56, 0.64, 1] }
                      : { type: 'spring', stiffness: 480, damping: 18 }
                  }
                  className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors shadow-2xs ${
                    size === 'large'
                      ? 'bg-black text-[#C7F665]'
                      : 'bg-[#f1f4f8] text-slate-600 group-hover:bg-slate-200/80 group-hover:text-slate-900'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    {isDrink ? <Coffee className="w-4.5 h-4.5" /> : <Salad className="w-5 h-5 stroke-[2.4]" />}
                  </motion.div>
                </motion.div>
                <div className="min-w-0">
                  <div className={`text-[12px] font-black leading-tight ${size === 'large' ? 'text-black' : 'text-slate-600'}`}>
                    {sizeLabels.large.title}
                  </div>
                  <div className={`text-[10px] font-medium mt-0.5 leading-tight truncate ${size === 'large' ? 'text-[#54801A] font-bold' : 'text-slate-400'}`}>
                    {sizeLabels.large.desc}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Spec 2: 温度 */}
          <div>
            <div className="text-[12px] font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>温度</span>
              <span className="text-[9px] text-slate-400 font-normal">单选</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTemperature('ice')}
                className={`relative py-2.5 px-3 rounded-xl text-center text-[12px] font-black transition-all duration-200 ease-out active:scale-[0.98] border ${
                  temperature === 'ice'
                    ? `${OPTION_CARD_SELECTED} text-black`
                    : `${OPTION_CARD_UNSELECTED} text-slate-600`
                }`}
              >
                {tempLabels.ice}
                <CheckBadge selected={temperature === 'ice'} className="absolute top-1.5 right-1.5" />
              </button>
              <button
                type="button"
                onClick={() => setTemperature('hot')}
                className={`relative py-2.5 px-3 rounded-xl text-center text-[12px] font-black transition-all duration-200 ease-out active:scale-[0.98] border ${
                  temperature === 'hot'
                    ? `${OPTION_CARD_SELECTED} text-black`
                    : `${OPTION_CARD_UNSELECTED} text-slate-600`
                }`}
              >
                {tempLabels.hot}
                <CheckBadge selected={temperature === 'hot'} className="absolute top-1.5 right-1.5" />
              </button>
            </div>
          </div>

          {/* Spec 3: 咖啡豆 / 主粮基底 */}
          <div>
            {/* ⚠️ mb-3 同上：给 11px 悬出的浮动胶囊留空间 */}
            <div className="text-[12px] font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>{isDrink ? '咖啡豆' : '主粮基底'}</span>
              <span className="text-[9px] text-slate-400 font-normal">单选</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {beanBaseOptions.map((opt) => {
                const isSelected = beanBase === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBeanBase(opt.id as any)}
                    className={`relative p-2.5 pt-3.5 rounded-xl text-center flex flex-col items-center justify-between min-h-[56px] transition-all duration-200 ease-out active:scale-[0.98] border ${
                      isSelected
                        ? OPTION_CARD_SELECTED
                        : OPTION_CARD_UNSELECTED
                    }`}
                  >
                    {/* Top Floating Badge
                        选中 = 青柠底黑字（抽卡页「10款起送」）；未选中 = **白底 + 浅灰 hairline + 深金字**
                        （2026-10-25 用户「没选中的上面的小框的黑底改成白底」→「也改成那种浅灰框」）。
                        ⚠️ 未选中原来是「黑底青柠字」，底色一改白，**青柠字必须换掉** ——
                           #C7F665 压白只有 1.4:1，等于把字擦掉。这里用 `GOLD_TEXT`（#8A5F00，对白 5.6:1）。
                        ⚠️ 边框走 `border-slate-200` —— **和卡面是同一条 hairline**（用户第二轮要求），
                           不要再改成亮金 #FDCF29：金边会把这颗标签抬成"第二重点"，
                           和它下面那张未选中的卡抢视线（金边版本见 `.backup/src-20261025-1305/`）。
                           金只留在字上，语义是"推荐/品质"，这是 4px 以内唯一该发黄的地方。
                        ⚠️ 金边用真实 border（不是 inset 阴影）—— 选中态本来就带 1px border，
                           两边都有 border 才能等高；给未选中加 inset 阴影会让它比选中态矮 2px。
                        ⚠️ 与「超值大份」胶囊同一套尺寸（9.5px / px-2 py-[3px] / -top-[11px]），
                           页内所有浮动小标签必须同号，否则同一区块会出现两种标签字号。
                        ⚠️ 这张卡 pt-3.5（14px）比份量卡更宽松，胶囊底落在 6.5px，净距 7.5px。 */}
                    <span
                      className={`absolute -top-[11px] inset-x-0 mx-auto px-2 py-[3px] rounded-full text-[10px] w-max leading-none transition-all ${
                        isSelected
                          ? 'bg-[#C7F665] text-black font-black border border-black/15 shadow-2xs'
                          : 'bg-white text-[#8A5F00] font-black border border-slate-200 shadow-2xs'
                      }`}
                    >
                      {opt.badge}
                    </span>

                    {/* 右上角圆形勾选徽章（抽卡页食材卡同款） */}
                    <CheckBadge selected={isSelected} className="absolute top-1.5 right-1.5" />

                    <div className={`font-black text-[11px] mt-0.5 leading-tight ${isSelected ? 'text-black' : 'text-slate-700'}`}>{opt.title}</div>
                    <div className={`text-[9px] mt-0.5 leading-tight line-clamp-1 ${isSelected ? 'text-[#54801A] font-bold' : 'text-slate-400'}`}>
                      {opt.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spec 4: 咖啡浓度 / 特调酱汁 */}
          <div>
            <div className="text-[12px] font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>{isDrink ? '咖啡浓度' : '特调酱汁'}</span>
              <span className="text-[9px] text-slate-400 font-normal">单选</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStrength('default')}
                className={`relative py-2.5 px-3 rounded-xl text-center text-[12px] font-black transition-all duration-200 ease-out active:scale-[0.98] border ${
                  strength === 'default'
                    ? `${OPTION_CARD_SELECTED} text-black`
                    : `${OPTION_CARD_UNSELECTED} text-slate-600`
                }`}
              >
                {strengthLabels.default}
                <CheckBadge selected={strength === 'default'} className="absolute top-1.5 right-1.5" />
              </button>
              <button
                type="button"
                onClick={() => setStrength('extra')}
                className={`relative py-2.5 px-3 rounded-xl text-center text-[12px] font-black transition-all duration-200 ease-out active:scale-[0.98] border ${
                  strength === 'extra'
                    ? `${OPTION_CARD_SELECTED} text-black`
                    : `${OPTION_CARD_UNSELECTED} text-slate-600`
                }`}
              >
                {strengthLabels.extra}
                <CheckBadge selected={strength === 'extra'} className="absolute top-1.5 right-1.5" />
              </button>
            </div>
          </div>

          {/* Spec 5: 糖度 (仅饮品类展示，食物类不展示酱料拌法) */}
          {isDrink && (
            <div>
              <div className="text-[12px] font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>糖度</span>
                <span className="text-[9px] text-slate-400 font-normal">单选</span>
              </div>
              {/* ⚠️ 原来是 grid-cols-2 sm:grid-cols-4。
                  应用恒渲染在 410px 手机壳里，sm: 看的是**视口**宽度 ——
                  桌面下会变 4 列、卡片只剩 87px，和窄窗口的 2 列是两种观感。
                  统一成 2 列，既和其它文字选项卡一致，也放得下右上角勾选徽章。 */}
              <div className="grid grid-cols-2 gap-2.5">
                {sweetnessLabels.map((s) => {
                  const isSelected = sweetness === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSweetness(s.id as any)}
                      className={`relative py-2.5 px-3 rounded-xl text-center font-black text-[12px] transition-all duration-200 ease-out active:scale-[0.98] border ${
                        isSelected
                          ? `${OPTION_CARD_SELECTED} text-black`
                          : `${OPTION_CARD_UNSELECTED} text-slate-600`
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      <CheckBadge selected={isSelected} className="absolute top-1.5 right-1.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spec 6: 个性化加料 (Optional add-ons with animated check and spring) */}
          <div>
            <div className="text-[12px] font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>个性化加料</span>
              <span className="text-[9px] text-slate-400 font-normal">可多选</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {addonList.map((addon) => {
                const isSelected = selectedAddons.includes(addon.name);
                return (
                  <button
                    key={addon.name}
                    type="button"
                    onClick={() => toggleAddon(addon.name)}
                    className={`relative py-2 px-2.5 rounded-xl text-left transition-all duration-200 ease-out active:scale-[0.98] border ${
                      isSelected
                        ? OPTION_CARD_SELECTED
                        : OPTION_CARD_UNSELECTED
                    }`}
                  >
                    {/* 勾选徽章改成抽卡页食材卡那枚右上角圆形徽章，
                        替掉原来「标题前一个 6px 小绿点」的写法 —— 那颗点太小、
                        和抽卡页的选择语言也不一致。 */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-[12px] font-black leading-tight truncate ${isSelected ? 'text-black' : 'text-slate-700'}`}>
                        {addon.name}
                      </span>
                      <CheckBadge selected={isSelected} className="" />
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className="text-[9px] text-slate-400">{addon.kcal}</span>
                      <span className="text-[12px] font-black text-slate-700 flex-shrink-0 tracking-normal">
                        +¥{addon.price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Commitment Badge Footer */}
        <div className="px-4 py-3 flex items-center justify-center gap-4.5 text-[10px] text-slate-400 bg-white border-t border-slate-100">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-slate-500" /> 现做现制保障
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-slate-500" /> 快速极速出餐
          </span>
          <span className="flex items-center gap-1">
            <Store className="w-3 h-3 text-slate-500" /> 门店自提/外卖
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM STICKY ACTION BAR (1:1 ACCURATE TO LUCKIN COFFEE SCREENSHOT)    */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="absolute bottom-0 inset-x-0 z-50 bg-white/75 backdrop-blur-xl border-t border-white/70 px-4 pt-3 pb-5 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      >
        {/* Row 1: Price & Stepper with Price Analysis Bubble */}
        <div className="relative flex items-center justify-between">
          {/* Price with interactive breakdown trigger */}
          <div className="flex items-center gap-1 tracking-normal">
            <span className="text-[14px] font-bold text-[#FC5294]">¥</span>
            <span className="text-[26px] font-black text-[#FC5294] tracking-tight leading-none">
              {totalDealPrice}
            </span>
            <span className="text-[11px] font-bold text-[#FC5294] ml-0.5">首杯价</span>
            <span className="text-[12px] text-slate-400 line-through ml-1">
              ¥{totalOriginalPrice}
            </span>

            {/* Interactive Info/Price Breakdown Button
                换成抽卡页页头「食材图鉴」那枚圆形白按钮（圆 + 浅灰描边 + shadow-2xs），
                原来是无底的裸图标，在毛玻璃底栏上几乎看不见可点区域。 */}
            <button
              type="button"
              id="price-breakdown-trigger"
              onClick={() => setShowPriceBubble((prev) => !prev)}
              className="w-6 h-6 ml-1 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-600 hover:bg-[#f1f4f8] active:scale-95 transition-all duration-200 ease-out cursor-pointer shadow-2xs"
              title="点击查看价格分析气泡"
              aria-label="查看价格分析"
            >
              <Info className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>

          {/* Interactive Price Analysis Floating Bubble (价格分析气泡) */}
          <AnimatePresence>
            {showPriceBubble && (
              <>
                {/* Backdrop to dismiss on tap outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPriceBubble(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.94 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 360 }}
                  className="absolute bottom-[calc(100%+12px)] left-1 z-50 w-[325px] bg-white/98 backdrop-blur-xl text-slate-800 rounded-2xl p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200/90"
                >
                  {/* Speech bubble downward pointer pointing to the Info icon */}
                  <div className="absolute -bottom-1.5 left-26 w-3 h-3 bg-white border-r border-b border-slate-200/90 rotate-45" />

                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-black text-[#C7F665] flex items-center justify-center">
                        <ReceiptText className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="text-xs font-black text-slate-900 tracking-tight">价格构成分析</span>
                      <span className="text-[10px] text-black font-black bg-[#C7F665] px-1.5 py-0.2 rounded-full border border-black/15">
                        省 ¥{((unitOriginalPrice - unitDealPrice) * quantity).toFixed(1)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPriceBubble(false)}
                      className="w-5 h-5 rounded-full bg-white border border-slate-200/90 hover:bg-[#f1f4f8] active:scale-95 flex items-center justify-center text-slate-500 transition-all duration-200 ease-out cursor-pointer shadow-2xs"
                      aria-label="关闭气泡"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Calculation Items */}
                  <div className="space-y-1.5 text-[12px]">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>基础原价</span>
                      <span className="font-semibold text-slate-900 font-mono">¥{dish.originalPrice.toFixed(1)}</span>
                    </div>

                    {(sizePrice > 0 || strengthPrice > 0 || addonsPrice > 0) && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="flex items-center gap-1">
                          定制加价
                          <span className="text-[10px] text-slate-400">
                            ({[
                              sizePrice > 0 ? (isDrink ? '超大杯' : '超大碗') : '',
                              strengthPrice > 0 ? (isDrink ? '加浓缩' : '加特调') : '',
                              addonsPrice > 0 ? '加料' : ''
                            ].filter(Boolean).join('+')})
                          </span>
                        </span>
                        <span className="font-semibold text-amber-700 font-mono">
                          +¥{(sizePrice + strengthPrice + addonsPrice).toFixed(1)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[#FC5294] font-medium bg-rose-50/80 px-2 py-1 rounded-lg border border-rose-100">
                      <span className="flex items-center gap-1">
                        <BadgePercent className="w-3 h-3 text-[#FC5294]" />
                        首杯 / 会员专享优惠
                      </span>
                      <span className="font-black font-mono">
                        -¥{(unitOriginalPrice - unitDealPrice).toFixed(1)}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-bold">
                        当前实付 {quantity > 1 ? `(× ${quantity})` : ''}
                      </span>
                      <div className="text-right">
                        <span className="text-[15px] font-black text-[#FC5294] font-mono">
                          ¥{totalDealPrice}
                        </span>
                        <span className="text-[11px] text-slate-400 line-through ml-1.5 font-mono">
                          ¥{totalOriginalPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>已自动应用平台最优立减优惠</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Stepper with buttons — 抽卡页的圆形按钮语言：
              减号 = 白圆 + 浅灰描边（页头「图鉴」按钮），
              加号 = 纯黑圆 + 青柠字形（页头「12 币」黑胶囊、圆形箭头按钮同款）。
              原来加号用的是 slate-900，抽卡页的黑是纯 #000。 */}
          {/* ⚠️ 已售尽时整块隐藏数量步进器：下面已经是一条「已售尽」灰胶囊，
              上面再留一颗可点的黑底青柠加号，等于自相矛盾。
              价格不跟着隐藏 —— 售尽也要让用户看得到原价。 */}
          {!dish.soldOut && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 rounded-full bg-white border border-slate-200/90 text-slate-700 flex items-center justify-center disabled:opacity-35 active:scale-95 transition-all duration-200 ease-out hover:bg-[#f1f4f8] shadow-2xs"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.4]" />
            </button>
            <span className="min-w-[26px] text-center text-base font-black text-slate-950 tracking-tight">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="w-7 h-7 rounded-full bg-black hover:bg-slate-800 text-[#C7F665] flex items-center justify-center active:scale-95 transition-all duration-200 ease-out shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
            </button>
          </div>
          )}
        </div>

        {/* Row 2: Detailed Formula Breakdown String */}
        <div className="mt-1.5 mb-1 text-[10px] text-slate-400 truncate font-mono">
          {formulaText}
        </div>

        {/* Row 3: Dual Action Buttons
            整组换成抽卡页的胶囊按钮语言：
            · 一律 rounded-full（抽卡页没有一个方角按钮：单抽/十连、全选、立即起送全是胶囊）
            · 主行动「立即购买」= 青柠底 + 黑字 + 青柠调软投影 + 黑圆青柠箭头
              —— 描边已去掉（原来 2px 黑边 + 2px 硬投影，2026-10-22 用户要求"去黑边改阴影"）。
              保留 2px **透明**边框只为占位：与左边「加入购物车」的 1px 边框+py-3 一起把
              两个胶囊撑成同一高度（实测都是 44px）；删掉边框会让本按钮矮 2px。
              投影 = 青柠调 rgba(124,180,44,.45) 提亮 + 一层极淡黑色压地，
              只靠青柠会飘，只靠黑色会脏。
              原来用的是「黑底青柠字」，那是抽卡页页头「12 币」的状态胶囊语言，
              当主行动用会和次要按钮的层级拉不开。
            · 次行动「加入购物车」= 浅灰胶囊 + 深灰字。 */}
        {/* ⚠️ 已售尽（2026-10-27 用户「加号按钮改成灰色，点击后会显示已售尽」）：
            点餐卡的加号变灰只解决了"列表里加不进去"，但卡片本身还能点进详情 ——
            不在这里也拦住，就会出现"列表说售尽、详情照样能加购"的矛盾。
            所以详情页把两个行动按钮收成一个**整宽灰胶囊**，点击同样只弹「已售尽」。
            配色沿用点餐卡那颗灰加号（`bg-slate-200` + `text-slate-400`），
            全站"不可用"就这一套灰，别再另开一套。 */}
        {dish.soldOut ? (
          <button
            type="button"
            onClick={() => onShowToast('已售尽')}
            className="w-full py-3 rounded-full bg-slate-200 text-slate-400 font-black text-xs active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center mt-3"
          >
            <span className="pill-label">已售尽</span>
          </button>
        ) : (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            type="button"
            onClick={handleAddAction}
            className="w-full py-3 rounded-full bg-[#f1f4f8] hover:bg-[#e6ebf2] active:scale-[0.98] text-slate-900 font-black text-xs transition-all duration-200 ease-out border border-slate-200/90 flex items-center justify-center"
          >
            <span className="pill-label">加入购物车</span>
          </button>
          <button
            type="button"
            onClick={handleBuyAction}
            className="w-full py-3 rounded-full bg-[#C7F665] hover:bg-[#B7EF4B] active:scale-[0.98] text-black font-black text-xs transition-all duration-200 ease-out border-[2px] border-transparent shadow-[0_6px_16px_-4px_rgba(124,180,44,0.45),0_2px_4px_rgba(0,0,0,0.08)] flex items-center justify-center gap-1.5"
          >
            <span className="pill-label">立即购买</span>
            <span className="w-4 h-4 rounded-full bg-black flex items-center justify-center shrink-0">
              <ArrowRight className="w-2.5 h-2.5 text-[#C7F665] stroke-[3]" />
            </span>
          </button>
        </div>
        )}
      </motion.div>
    </div>
  );
};
