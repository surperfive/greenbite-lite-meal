import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, Dish } from '../types';
import { Check, ArrowRight, Plus, Minus, Trash2 } from 'lucide-react';
import { DishImage } from './DishImage';
import { ToteMascotStage } from './CartFlyOrbLayer';

interface FloatingCartProps {
  cartItems: CartItem[];
  onAddToCart: (dish: Dish, qty?: number, sourceRect?: DOMRect | null) => void;
  onRemoveFromCart: (dish: Dish) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
  onSelectDish?: (dish: Dish) => void;
  mascotStage?: ToteMascotStage;
  defaultExpanded?: boolean;
  ctaLabel?: string;
  overrideTotal?: number;
}

/**
 * 底部结算栏左侧：立体手提购物袋吉祥物
 * 支持 4 阶段灵动交互状态：
 * - 'idle'：常态微笑呼吸
 * - 'anticipating'：光球飞来时，袋口大张 + 星星眼期待张嘴表情（"哇！"）
 * - 'catching'：光球入袋瞬间，袋身受重弹性下蹲挤压 + 袋口金光迸发 + 眨眼吞咽表情（"> ▽ <"）
 * - 'happy'：接住光球后回弹跃起 + 弯弯笑眼满足表情（"^ ◡ ^"）+ 飘星闪光
 */
const BottomCartToteMascot: React.FC<{ stage: ToteMascotStage }> = ({ stage }) => {
  const isMouthOpen = stage === 'anticipating' || stage === 'catching';
  const isCatching = stage === 'catching';
  const isHappy = stage === 'happy';
  const isAnticipating = stage === 'anticipating';

  // Physical bag body transform for anticipation, squash-on-catch, and happy bounce
  const getBagTransform = () => {
    if (isAnticipating) {
      return 'translate(0px, -2px) rotate(-3.5deg) scale(1.05, 1.03)';
    }
    if (isCatching) {
      return 'translate(1px, 5px) rotate(2deg) scale(1.15, 0.85)';
    }
    if (isHappy) {
      return 'translate(0px, -4px) rotate(-2deg) scale(0.96, 1.06)';
    }
    return 'translate(0px, 0px) rotate(0deg) scale(1, 1)';
  };

  // Single authoritative bag silhouette path used for BOTH the outer black stroke and inner fill clipPath
  // When isMouthOpen is true, the top back rim arches high up (Q 69 12 96 27) to create a huge wide-open 3D mouth!
  const bagSilhouettePath = isMouthOpen
    ? 'M 30 44 C 31 35 35 29 42 27 Q 69 12 96 27 C 102 29 106 35 107 45 L 111.5 96 C 112.5 105 106.5 111 97.5 111.5 L 36.5 111.5 C 27.5 111.5 22.5 105 24 96 Z'
    : 'M 30 46 C 30.8 39 35.5 35.5 43 35.5 L 95 35.5 C 102 35.5 106 39 107 46 L 111.5 96 C 112.5 105 106.5 111 97.5 111.5 L 36.5 111.5 C 27.5 111.5 22.5 105 24 96 Z';

  const backHandlePath = isMouthOpen
    ? 'M 54 24 C 54 1, 82 1, 82 24'
    : 'M 54 37 C 54 12, 82 12, 82 37';

  const frontHandlePath = isMouthOpen
    ? 'M 60 55.5 C 60 31, 89 31, 89 54.5'
    : 'M 60 43.5 C 60 14, 89 14, 89 43.5';

  return (
    <svg
      viewBox="0 -4 128 128"
      className="w-full h-full overflow-visible select-none"
      fill="none"
    >
      <defs>
        {/* Front Face Lime Gradient */}
        <linearGradient id="cart-tote-front" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#D8FF66" />
          <stop offset="55%" stopColor="#C7F665" />
          <stop offset="100%" stopColor="#AEEB38" />
        </linearGradient>
        {/* Left Gusset Deeper Lime Gradient */}
        <linearGradient id="cart-tote-side" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8F225" />
          <stop offset="60%" stopColor="#9CE012" />
          <stop offset="100%" stopColor="#82C408" />
        </linearGradient>
        {/* Exact ClipPath matching bagSilhouettePath so outer black border is strictly uniform everywhere */}
        <clipPath id="cart-tote-body-clip">
          <path d={bagSilhouettePath} />
        </clipPath>
        {/* ClipPath for Front Green Panel when mouth is open so Front Handle Black Outline only shows above the green panel */}
        <clipPath id="cart-tote-open-mouth-clip">
          <path d="M 0 0 L 128 0 L 128 42 Q 74 57 45 47 L 28 34 L 0 34 Z" />
        </clipPath>
      </defs>

      {/* Soft Contact Drop Shadow Under Bag */}
      <ellipse
        cx="68"
        cy="116"
        rx={isCatching ? 42 : isHappy ? 31 : 36}
        ry={isCatching ? 6 : 5}
        fill="#000000"
        opacity={isCatching ? 0.15 : 0.09}
        style={{ transition: 'all 180ms cubic-bezier(0.22, 1, 0.36, 1)' }}
      />

      {/* Animated Bag Group with Spring Squash & Stretch */}
      <g
        style={{
          transform: getBagTransform(),
          transformOrigin: '68px 108px',
          transition: isCatching
            ? 'transform 110ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* 3 Left Black Comic Burst Ticks */}
        <g
          style={{
            transform:
              isAnticipating || isCatching || isHappy
                ? 'translate(-3px, -1px) scale(1.12)'
                : 'translate(0px, 0px) scale(1)',
            transformOrigin: '20px 76px',
            transition: 'transform 200ms ease-out'
          }}
        >
          <path
            d="M 16 68 L 7 62 M 14 77 L 4 76 M 16 85 L 7 90"
            stroke="#0F1419"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        </g>

        {/* 1. Back Handle Loop (Uniform 3.0px black border: 10.4px black outer - 4.4px inner = 3.0px per side) */}
        <path
          d={backHandlePath}
          stroke="#0F1419"
          strokeWidth="10.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={backHandlePath}
          stroke="#D8E2EC"
          strokeWidth="4.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* 2. Front Handle Outer Black Outline (In idle state, rendered behind bag body) */}
        {!isMouthOpen && (
          <path
            d={frontHandlePath}
            stroke="#0F1419"
            strokeWidth="10.6"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* 3. Uniform Outer Black Sticker Outline Around Bag Body
            Because strokeWidth="6.4" is centered on bagSilhouettePath and the inner fill is clipped to
            the exact same bagSilhouettePath, the visible outer black stroke is strictly 3.2px everywhere! */}
        <path
          d={bagSilhouettePath}
          fill="#0F1419"
          stroke="#0F1419"
          strokeWidth="6.4"
          strokeLinejoin="round"
        />

        {/* 4. Bag Interior & Panels (Strictly Clipped to bagSilhouettePath for 100% Uniform Outer Border) */}
        <g clipPath="url(#cart-tote-body-clip)">
          {/* Main Front Green Panel Fill */}
          <rect x="20" y="10" width="96" height="106" fill="url(#cart-tote-front)" />

          {/* Left 3D Gusset Panel */}
          <path
            d="M 20 10 L 45 10 L 42 115 L 20 115 Z"
            fill="url(#cart-tote-side)"
          />

          {/* Gusset Bottom-Left Crease Triangle */}
          <path
            d="M 22 97 L 36 86 L 42 113 L 22 113 Z"
            fill="#8BD00E"
            opacity="0.7"
          />

          {/* Vertical Highlight Edge Between Gusset and Front Face (Starts at front-left corner y=47 when open) */}
          <path
            d={isMouthOpen ? 'M 45 47 L 42 111' : 'M 45 35 L 42 111'}
            stroke="#E4FF7A"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Target Anchor for Flying Orbs + Huge 3D Wide-Open Mouth Cavity across BOTH Left Gusset & Front Panel */}
          <g id="floating-cart-tote-mouth">
            {isMouthOpen ? (
              <>
                <path
                  d="M 28 34 L 45 47 Q 74 57 109 42 L 109 10 L 28 10 Z"
                  fill="#1E293B"
                  stroke="#0F1419"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                />
                {/* Subtle inner gusset crease inside the dark open bag mouth for 3D depth */}
                <path
                  d="M 43 22 L 45 45"
                  stroke="#0F1419"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </>
            ) : (
              <rect x="52" y="34" width="36" height="4" fill="transparent" />
            )}
          </g>
        </g>

        {/* 5. Front Handle Black Outline when mouth is open (Clipped to only appear above the green front panel) */}
        {isMouthOpen && (
          <g clipPath="url(#cart-tote-open-mouth-clip)">
            <path
              d={frontHandlePath}
              stroke="#0F1419"
              strokeWidth="10.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {/* 6. Coaxial Dark Eyelets + Pure White Front Handle Strap */}
        <circle cx="60" cy={isMouthOpen ? 55.5 : 43.5} r="5.2" fill="#0F1419" />
        <circle cx="89" cy={isMouthOpen ? 54.5 : 43.5} r="5.2" fill="#0F1419" />
        <path
          d={frontHandlePath}
          stroke="#FFFFFF"
          strokeWidth="4.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* ============================================================
            7. DYNAMIC MASCOT FACIAL EXPRESSIONS (4 Interactive States)
           ============================================================ */}
        {isAnticipating && (
          <g transform="translate(0, 9)">
            {/* Excited Raised Eyebrows */}
            <path
              d="M 58 55 Q 64 51 69 55"
              stroke="#0F1419"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 80 53 Q 86 49 91 53"
              stroke="#0F1419"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Wide Sparkling Starry Eyes Looking Up at Orb */}
            <ellipse cx="64" cy="66" rx="5" ry="7.6" transform="rotate(-4 64 66)" fill="#0F1419" />
            <ellipse cx="85" cy="64" rx="5" ry="7.6" transform="rotate(-4 85 64)" fill="#0F1419" />
            {/* 4-Point Star Catchlights inside Eyes */}
            <path
              d="M 64 60 L 65 62.5 L 67.5 63.5 L 65 64.5 L 64 67 L 63 64.5 L 60.5 63.5 L 63 62.5 Z"
              fill="#FFFFFF"
            />
            <path
              d="M 85 58 L 86 60.5 L 88.5 61.5 L 86 62.5 L 85 65 L 84 62.5 L 81.5 61.5 L 84 60.5 Z"
              fill="#FFFFFF"
            />
            <circle cx="66" cy="69" r="1.4" fill="#FFF220" />
            <circle cx="87" cy="67" r="1.4" fill="#FFF220" />

            {/* Warm Glowing Blush Cheeks */}
            <ellipse cx="53" cy="77" rx="7.2" ry="4" transform="rotate(-6 53 77)" fill="#FF8FAB" opacity="0.8" />
            <ellipse cx="96" cy="74" rx="7.2" ry="4" transform="rotate(-6 96 74)" fill="#FF8FAB" opacity="0.8" />

            {/* Excited Wide-Open "WOW" Mouth with Pink Tongue */}
            <path
              d="M 67 75 Q 75 73 83 74 C 85 83 80 89 75 89 C 69 89 65 84 67 75 Z"
              fill="#0F1419"
            />
            <path
              d="M 69 83 Q 75 79 81 83 C 79 87 76 88.5 75 88.5 C 72 88.5 70 86.5 69 83 Z"
              fill="#FF6B9E"
            />
          </g>
        )}

        {isCatching && (
          <g>
            {/* Tightly Squeezed Catch Reflex Eyes (>  <) */}
            <path
              d="M 58 63 L 68 68 L 58 72"
              stroke="#0F1419"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 91 61 L 81 66 L 91 70"
              stroke="#0F1419"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Rosy Cheeks */}
            <ellipse cx="53" cy="78" rx="7.5" ry="4.2" transform="rotate(-6 53 78)" fill="#FF75A0" opacity="0.88" />
            <ellipse cx="96" cy="75" rx="7.5" ry="4.2" transform="rotate(-6 96 75)" fill="#FF75A0" opacity="0.88" />

            {/* Happy Gulp Smile */}
            <path
              d="M 65 77 C 70 86 80 85 85 75 Z"
              fill="#0F1419"
              stroke="#0F1419"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
        )}

        {isHappy && (
          <g>
            {/* Joyful Squinting Arc Eyes (^  ^) */}
            <path
              d="M 58 69 Q 64 59 70 68"
              stroke="#0F1419"
              strokeWidth="4.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 79 67 Q 85 57 91 66"
              stroke="#0F1419"
              strokeWidth="4.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Bright Happy Rosy Blush Cheeks */}
            <ellipse cx="53" cy="77" rx="7.2" ry="4" transform="rotate(-6 53 77)" fill="#FF75A0" opacity="0.85" />
            <ellipse cx="96" cy="74" rx="7.2" ry="4" transform="rotate(-6 96 74)" fill="#FF75A0" opacity="0.85" />

            {/* Beaming Wide Happy Smile with Pink Tongue */}
            <path
              d="M 64 75 Q 75 76 86 73 C 85 84 79 88 75 88 C 69 88 64 83 64 75 Z"
              fill="#0F1419"
            />
            <path
              d="M 68 82 Q 75 78 82 81 C 80 86 77 87.5 75 87.5 C 72 87.5 69.5 85.5 68 82 Z"
              fill="#FF6B9E"
            />

            {/* Floating Celebration Star Sparkles beside Bag */}
            <path
              d="M 18 42 L 20.2 47.5 L 26 49.5 L 20.2 51.5 L 18 57 L 15.8 51.5 L 10 49.5 L 15.8 47.5 Z"
              fill="#FFF220"
              stroke="#0F1419"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </g>
        )}

        {stage === 'idle' && (
          <g>
            {/* Standard Cute Vertical Oval Black Eyes */}
            <ellipse cx="64" cy="68" rx="4.2" ry="6.8" transform="rotate(-4 64 68)" fill="#0F1419" />
            <ellipse cx="85" cy="66" rx="4.2" ry="6.8" transform="rotate(-4 85 66)" fill="#0F1419" />

            {/* Soft Peach-Yellow Oval Blush Cheeks */}
            <ellipse cx="54" cy="78" rx="6.5" ry="3.6" transform="rotate(-6 54 78)" fill="#F6D365" opacity="0.85" />
            <ellipse cx="95" cy="75" rx="6.5" ry="3.6" transform="rotate(-6 95 75)" fill="#F6D365" opacity="0.85" />

            {/* Cheerful Curved Black Smile */}
            <path
              d="M 67 78 C 71 84 80 83 83 76"
              stroke="#0F1419"
              strokeWidth="4.2"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    </svg>
  );
};

export const FloatingCart: React.FC<FloatingCartProps> = ({
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onOpenCheckout,
  onSelectDish,
  mascotStage = 'idle',
  defaultExpanded = true,
  ctaLabel = '去结算',
  overrideTotal
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  // Track selected item IDs in cart (all checked by default)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ── 点外面收起（2026-10-29 14:12 用户「点击这个页面以外的地方，会让购物车商品展示缩回去」）──
  // 展开态下在 document 上挂捕获阶段的 pointerdown：落点在购物车根元素以外 → 收起。
  // 不 preventDefault/stopPropagation，事件照常传给底下的菜品
  // （点击菜品 = 加购飞袋 + 明细同时收起，两件事不冲突）。
  const cartRootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isExpanded) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const root = cartRootRef.current;
      if (root && e.target instanceof Node && !root.contains(e.target)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [isExpanded]);

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Initialize/keep selected IDs in sync with cart items
  const effectiveSelectedIds = React.useMemo(() => {
    if (selectedIds.size === 0 && cartItems.length > 0) {
      return new Set(cartItems.map((it) => it.dish.id));
    }
    const currentItemIds = new Set(cartItems.map((it) => it.dish.id));
    const nextSet = new Set<number>();
    selectedIds.forEach((id) => {
      if (currentItemIds.has(id)) nextSet.add(id);
    });
    return nextSet.size === 0 && cartItems.length > 0
      ? new Set(cartItems.map((it) => it.dish.id))
      : nextSet;
  }, [selectedIds, cartItems]);

  const allSelected =
    cartItems.length > 0 && cartItems.every((it) => effectiveSelectedIds.has(it.dish.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cartItems.map((it) => it.dish.id)));
    }
  };

  const toggleSelectItem = (id: number) => {
    const next = new Set(effectiveSelectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const subtotal = cartItems.reduce((acc, item) => {
    if (effectiveSelectedIds.has(item.dish.id)) {
      return acc + item.dish.dealPrice * item.quantity;
    }
    return acc;
  }, 0);

  const displayTotal = overrideTotal !== undefined && allSelected ? overrideTotal : subtotal;

  if (totalCount === 0) return null;

  const getDishSpecs = (dish: Dish) => {
    if (dish.category === 'drink') {
      return '大杯/冰/少少甜/现萃原叶';
    }
    if (dish.category === 'salad' || dish.category === 'bowl') {
      return '标准碗/三色藜麦/特调油醋汁/轻卡';
    }
    if (dish.category === 'hot') {
      return '现炖暖锅/原木花菇/昆布高汤/标准份';
    }
    return '全麦烘焙/现烤锁鲜/标准份';
  };

  return (
    <>
      {/* 1. Subtle Ambient Dimming Backdrop when Expanded (pointer-events-none so dishes above can be clicked directly to fly into bag!) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="cart-backdrop-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 z-30 bg-black/20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* 2. Cart Window
          ⚠️ bottom 必须跟底部导航的安全区一起补偿（2026-10-30）：
             导航加了 `safe-pb-tight` 后，真机上会因 env(safe-area-inset-bottom)
             再长高 0~34px。这里原来死钉 92px，安全区一出现就会被导航压住一半。
             `calc(92px + env(...))` 在桌面上 env = 0 → 仍是 92px，**观感零变化**；
             真机才整体上移，始终悬在导航上方。
             ⚠️ 别把 92px 改成更大的固定值来"预留" —— 桌面会凭空多出一段空隙。 */}
      <div className="absolute bottom-[calc(92px+env(safe-area-inset-bottom,0px))] inset-x-3.5 z-45 pointer-events-none">
        <motion.div
          layout
          ref={cartRootRef}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto w-full relative overflow-visible"
        >
          {/* Outer #C7F665 Brand Lime Shell */}
          <div className="w-full bg-[#C7F665] rounded-[22px] shadow-[0_10px_28px_rgba(0,0,0,0.16)] relative flex flex-col">
            {/* A. Expanded Top Lime Header + Middle White Item Card */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="cart-expanded-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="relative overflow-visible flex flex-col"
                >
                  {/* Header Bar on #C7F665 Lime Background */}
                  <div className="pt-2 pb-2 px-3.5 flex items-center justify-between relative z-20">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="min-w-0 text-left cursor-pointer"
                    >
                      <div className="text-[14px] font-black text-slate-900 leading-none tracking-tight">
                        已选商品 ({effectiveSelectedIds.size}/{cartItems.length})
                      </div>
                    </button>

                    {/* Clear Cart Button (Aligned with CartPage Trash2 action) */}
                    <button
                      type="button"
                      onClick={() => {
                        onClearCart();
                        setIsExpanded(false);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-800 hover:text-[#FC5294] active:scale-95 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3 flex-shrink-0" />
                      <span>清空购物车</span>
                    </button>
                  </div>

                  {/* Middle White Rounded Item Card */}
                  <div className="bg-white rounded-t-[18px] pt-2 pb-4.5 -mb-3 px-2.5 relative z-10 max-h-48 overflow-y-auto no-scrollbar divide-y divide-slate-100 shadow-[0_-2px_8px_rgba(0,0,0,0.03)]">
                    {cartItems.map((item) => {
                      const isSelected = effectiveSelectedIds.has(item.dish.id);
                      const specs = getDishSpecs(item.dish);
                      const origPrice = item.dish.originalPrice || item.dish.price;

                      return (
                        <div
                          key={item.dish.id}
                          className={`py-1.5 first:pt-0.5 last:pb-0 flex items-center gap-2 transition-opacity relative ${
                            isSelected ? 'opacity-100' : 'opacity-45'
                          }`}
                        >
                          {/* 1. Checkbox (Aligned with Mini-Program Brand Lime Selection Style) */}
                          <button
                            type="button"
                            onClick={() => toggleSelectItem(item.dish.id)}
                            className="relative flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                            aria-label={`选择 ${item.dish.name}`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-[#C7F665] text-black shadow-2xs'
                                  : 'border border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3.2]" />}
                            </div>
                          </button>

                          {/* 2. Square Product Thumbnail (Aligned with MenuPage Thumbnail Style) */}
                          <div className="relative flex-shrink-0">
                            <div
                              onClick={() => onSelectDish?.(item.dish)}
                              className="w-[54px] h-[54px] rounded-[10px] overflow-hidden bg-[#F8FAFC] border border-slate-100 shadow-2xs cursor-pointer active:scale-95 transition-transform"
                            >
                              <DishImage
                                src={item.dish.image}
                                alt={item.dish.name}
                                category={item.dish.category}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          {/* 3. Dish Title, Specs, Price & Mini-Program Stepper */}
                          <div className="flex-1 min-w-0">
                            <h4
                              onClick={() => onSelectDish?.(item.dish)}
                              className="font-extrabold text-[13px] text-slate-900 truncate leading-snug tracking-tight cursor-pointer hover:text-[#54801A] transition-colors"
                            >
                              {item.dish.name}
                            </h4>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-tight truncate">
                              {specs}
                            </p>

                            {/* Bottom Row: Unified #FC5294 Red Price + MenuPage Circular Stepper */}
                            <div className="flex items-end justify-between gap-2 mt-1">
                              <div className="flex items-baseline gap-0.5 min-w-0 leading-none">
                                <span className="text-[10px] font-extrabold text-[#FC5294]">¥</span>
                                <span className="text-[15px] font-black text-[#FC5294] leading-none tracking-tight tabular-nums">
                                  {item.dish.dealPrice.toFixed(1)}
                                </span>
                                {origPrice > item.dish.dealPrice && (
                                  <span className="text-[10px] text-slate-300 line-through leading-none ml-1 tabular-nums">
                                    ¥{origPrice.toFixed(1)}
                                  </span>
                                )}
                              </div>

                              {/* Mini-Program Standard Stepper (Matching MenuPage & ProductDetailPage) */}
                              <div
                                className="flex items-center gap-1 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => onRemoveFromCart(item.dish)}
                                  className="w-5.5 h-5.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 flex items-center justify-center transition-all duration-200 ease-out font-bold flex-shrink-0 border border-slate-200/80 cursor-pointer"
                                  aria-label="减少数量"
                                >
                                  <Minus className="w-2.5 h-2.5 stroke-[2.5]" />
                                </button>
                                <span className="w-4.5 text-center text-[12px] font-black text-slate-900 leading-none flex-shrink-0 tracking-tight tabular-nums select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    onAddToCart(item.dish, 1, rect);
                                  }}
                                  className="w-5.5 h-5.5 rounded-full bg-[#C7F665] hover:bg-[#B7EF4B] text-black active:scale-95 flex items-center justify-center transition-all duration-200 ease-out font-black flex-shrink-0 shadow-2xs cursor-pointer"
                                  aria-label="增加数量"
                                >
                                  <Plus className="w-3 h-3 stroke-[2.8]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* B. Bottom White Checkout Capsule Bar (Unified with Mini-Program Component Design) */}
            <div className="relative z-20">
              <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full bg-white rounded-[20px] px-2.5 py-1.5 flex items-center justify-between cursor-pointer select-none relative overflow-visible shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-slate-100"
              >
                {/* Left: 3D Shopping Tote Bag + Unified #FC5294 Red Dot Badge + Price Stack */}
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {/* Left Shopping Tote Mascot + Unified #FC5294 Count Badge (Matching BottomNavBar) */}
                  <div className="relative -ml-0.5 -my-1.5 w-[58px] h-[55px] flex-shrink-0 pointer-events-none">
                    <BottomCartToteMascot stage={mascotStage} />
                    <motion.span
                      key={totalCount}
                      initial={{ scale: 1.42, y: -3 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                      className="absolute top-1 right-0 min-w-[17px] h-[17px] px-1 rounded-full bg-[#FC5294] text-white text-[10px] font-black flex items-center justify-center shadow-xs border-[1.5px] border-white leading-none tabular-nums"
                    >
                      {totalCount}
                    </motion.span>
                  </div>

                  {/* Center-Left 3-Tier Price & Collapse Stack */}
                  <div className="min-w-0 pl-0.5 flex flex-col justify-center">
                    {/* Tier 1: Bold Black "预计到手" */}
                    <div className="text-[10px] font-black text-slate-900 leading-none tracking-tight mb-0.5">
                      预计到手
                    </div>

                    {/* Tier 2: Bold Red Price (#FC5294) */}
                    <div className="relative inline-flex items-baseline w-fit py-0">
                      <div className="relative z-10 flex items-baseline text-[#FC5294] leading-none tabular-nums">
                        <span className="text-[14px] font-black mr-0.5 leading-none">¥</span>
                        <span className="text-[22px] font-black leading-none tracking-tighter">
                          {displayTotal.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Tier 3: Gray "点击收起明细 ▼" */}
                    <div className="text-[10px] text-slate-500 font-bold leading-none mt-0.5 flex items-center gap-0.5">
                      <span>{isExpanded ? '点击收起明细' : '点击查看已选商品'}</span>
                      <svg
                        viewBox="0 0 10 7"
                        className={`w-2 h-1.5 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-0' : 'rotate-180'
                        }`}
                        fill="currentColor"
                      >
                        <path d="M 0.5 0.8 H 9.5 L 5 6.2 Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Right: Mini-Program Unified Primary Capsule Button ("去结算" / "提交订单") */}
                <div className="relative flex-shrink-0 ml-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCheckout();
                    }}
                    className="h-[38px] px-4 rounded-full bg-[#C7F665] hover:bg-[#B7EF4B] active:scale-95 text-black font-black text-[14px] tracking-tight flex items-center gap-1.5 transition-all duration-200 ease-out cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <span className="pill-label leading-none">{ctaLabel}</span>
                    <span className="w-4.5 h-4.5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="w-2.5 h-2.5 text-[#C7F665] stroke-[3]" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};
