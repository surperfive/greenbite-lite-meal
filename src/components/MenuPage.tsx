import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dish, CategoryId, OrderMode, Store, FilterState } from '../types';
import { CATEGORIES } from '../data/mockData';
import { CategoryIcon, FlameIcon } from './CategoryIcons';
import { DishTag } from './DishTag';
import { DishCoverArt } from './DishCoverArt';
import { SearchModal } from './SearchModal';
import { MenuBottomDecor } from './MenuBottomDecor';
import {
  Search,
  Heart,
  Plus,
  Minus,
  SlidersHorizontal,
  Flame,
  Ticket,
  X,
  RotateCcw,
  Check,
  MapPin,
  ChevronRight,
  Wifi,
  Battery,
  Bike
} from 'lucide-react';

interface MenuPageProps {
  dishes: Dish[];
  currentStore: Store;
  mode: OrderMode;
  onModeChange: (mode: OrderMode) => void;
  onOpenStorePage: () => void;
  cartQuantities: Record<number, number>;
  onAddToCart: (dish: Dish, qty?: number, sourceRect?: DOMRect | null) => void;
  onRemoveFromCart: (dish: Dish) => void;
  onSelectDish: (dish: Dish) => void;
  favorites: Set<number>;
  onToggleFavorite: (dishId: number) => void;
  onShowToast: (msg: string) => void;
}

export const INITIAL_FILTER_STATE: FilterState = {
  calorieRange: 'all',
  proteinMin: 0,
  carbsMax: 0,
  fatMax: 0,
  dietary: [],
  excludedIngredients: [],
  temperature: 'all',
  priceRange: 'all',
  onlyDiscount: false,
  onlyPopular: false,
};

// 商品图的构图参数（椭圆盘比例 / 食物偏移缩放 / 弧文字）已抽到 `DishCoverArt` ——
// 详情页 hero 要用同一套视觉、只是容器更大，参数只能有一份。改参数请去那个文件。

export const MenuPage: React.FC<MenuPageProps> = ({
  dishes,
  currentStore,
  mode,
  onModeChange,
  onOpenStorePage,
  cartQuantities,
  onAddToCart,
  onRemoveFromCart,
  onSelectDish,
  favorites,
  onToggleFavorite,
  onShowToast
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const dishesScrollRef = useRef<HTMLDivElement>(null);
  const prevCategoryIndexRef = useRef<number>(0);

  const handleCategoryChange = (newCatId: CategoryId) => {
    const prevIdx = CATEGORIES.findIndex((c) => c.id === activeCategory);
    const newIdx = CATEGORIES.findIndex((c) => c.id === newCatId);
    setSlideDirection(newIdx >= prevIdx ? 1 : -1);
    prevCategoryIndexRef.current = newIdx;
    setActiveCategory(newCatId);

    // Smoothly scroll back to top of dish list
    if (dishesScrollRef.current) {
      dishesScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Count active filter conditions
  const activeFilterCount = useMemo(() => {
    return (
      (filters.calorieRange !== 'all' ? 1 : 0) +
      (filters.proteinMin > 0 ? 1 : 0) +
      (filters.carbsMax > 0 ? 1 : 0) +
      (filters.fatMax > 0 ? 1 : 0) +
      filters.dietary.length +
      filters.excludedIngredients.length +
      (filters.temperature !== 'all' ? 1 : 0) +
      (filters.priceRange !== 'all' ? 1 : 0) +
      (filters.onlyDiscount ? 1 : 0) +
      (filters.onlyPopular ? 1 : 0)
    );
  }, [filters]);

  // Comprehensive multi-attribute filtering logic
  const filteredDishes = useMemo(() => {
    let list = dishes.filter((dish) => {
      // 1. Category (全部展示全部餐品并置顶热卖，分类则展示对应餐品)
      const matchCategory =
        activeCategory === 'all'
          ? true
          : dish.category === activeCategory;
      if (!matchCategory) return false;

      // 2. Search keyword
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchSearch =
          dish.name.toLowerCase().includes(q) ||
          dish.description.toLowerCase().includes(q) ||
          dish.tags.some((t) => t.toLowerCase().includes(q)) ||
          String(dish.kcal).includes(q);
        if (!matchSearch) return false;
      }

      // 3. Calorie Range
      if (filters.calorieRange === 'under250' && dish.kcal > 250) return false;
      if (filters.calorieRange === '250to400' && (dish.kcal <= 250 || dish.kcal > 400)) return false;
      if (filters.calorieRange === 'over400' && dish.kcal <= 400) return false;

      // 4. Protein / Carbs / Fat Macros
      if (filters.proteinMin > 0 && dish.protein < filters.proteinMin) return false;
      if (filters.carbsMax > 0 && dish.carbs > filters.carbsMax) return false;
      if (filters.fatMax > 0 && dish.fat > filters.fatMax) return false;

      // 5. Dietary Lifestyle
      if (filters.dietary.includes('vegetarian') && !dish.isVegetarian) return false;
      if (filters.dietary.includes('vegan') && !dish.isVegan) return false;
      if (filters.dietary.includes('sugar_free') && !dish.isSugarFree) return false;
      if (filters.dietary.includes('keto') && !dish.isKeto) return false;
      if (filters.dietary.includes('high_fiber') && !dish.isHighFiber) return false;

      // 6. Excluded Allergens & Ingredients (筛除)
      if (filters.excludedIngredients.length > 0) {
        const hasExcluded = filters.excludedIngredients.some((ex) =>
          dish.allergens?.includes(ex)
        );
        if (hasExcluded) return false;
      }

      // 7. Temperature
      if (filters.temperature === 'hot' && dish.temperature !== 'hot') return false;
      if (filters.temperature === 'cold' && dish.temperature !== 'cold' && dish.temperature !== 'ambient') return false;

      // 8. Price
      if (filters.priceRange === 'under20' && dish.dealPrice >= 20) return false;
      if (filters.priceRange === '20to30' && (dish.dealPrice < 20 || dish.dealPrice > 30)) return false;
      if (filters.priceRange === 'over30' && dish.dealPrice <= 30) return false;

      // 9. Special Deals & Bestsellers
      if (filters.onlyDiscount && dish.dealPrice >= dish.originalPrice) return false;
      if (filters.onlyPopular && !dish.isPopular) return false;

      return true;
    });

    if (activeCategory === 'all') {
      list = [...list].sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    }

    return list;
  }, [dishes, activeCategory, searchQuery, filters]);

  // Quick filter toggles helper
  const toggleCalorieRange = (range: 'under250' | '250to400' | 'over400') => {
    setFilters((prev) => ({
      ...prev,
      calorieRange: prev.calorieRange === range ? 'all' : range,
    }));
  };

  const toggleDietary = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(key)
        ? prev.dietary.filter((d) => d !== key)
        : [...prev.dietary, key],
    }));
  };

  const toggleExclude = (ingredient: string) => {
    setFilters((prev) => ({
      ...prev,
      excludedIngredients: prev.excludedIngredients.includes(ingredient)
        ? prev.excludedIngredients.filter((i) => i !== ingredient)
        : [...prev.excludedIngredients, ingredient],
    }));
  };

  const toggleProtein = () => {
    setFilters((prev) => ({
      ...prev,
      proteinMin: prev.proteinMin >= 25 ? 0 : 25,
    }));
  };

  const toggleHot = () => {
    setFilters((prev) => ({
      ...prev,
      temperature: prev.temperature === 'hot' ? 'all' : 'hot',
    }));
  };

  const toggleCold = () => {
    setFilters((prev) => ({
      ...prev,
      temperature: prev.temperature === 'cold' ? 'all' : 'cold',
    }));
  };

  const toggleDiscount = () => {
    setFilters((prev) => ({
      ...prev,
      onlyDiscount: !prev.onlyDiscount,
    }));
  };

  const togglePopular = () => {
    setFilters((prev) => ({
      ...prev,
      onlyPopular: !prev.onlyPopular,
    }));
  };

  const resetAllFilters = () => {
    setFilters(INITIAL_FILTER_STATE);
    setSearchQuery('');
    setActiveCategory('all');
    onShowToast('已清空所有筛选');
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-[#C7F665] relative">
      {/* Pop-up Modern Mini-Program Search Interface */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        dishes={dishes}
        cartQuantities={cartQuantities}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
        onSelectDish={(dish) => {
          setIsSearchOpen(false);
          onSelectDish(dish);
        }}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
        onShowToast={onShowToast}
        initialQuery={searchQuery}
      />

      {/* Top Header Banner - Pure Vector Artwork Header */}
      {/* ⚠️ 2026-10-28「这个替换掉点餐的头图」：整张换成用户给的 1024×385 新图
          （`scripts/_shots/ordering_header_banner-old.png` 是旧图备份，回退改 src 那行不行，
             旧图已经不在 public 里 —— 要回退把备份拷回 public 即可）。
          · 底色从 #AEE817（旧海报顶边 174,232,23）改成 **#AED743**（新图 padding 区
             实测均值 174,215,67）—— 作用不变：img 万一加载慢/没铺满时，容器底色
             顶上去不露缝，颜色必须取自新图自己的青柠。
          · 新图底部 y 345~384 是一条 40px 的**纯色深灰条 #222127**（行内标准差 0.8，
             全宽平直顶边，且和画面里插画用的深色 #181818 不是同一个色）——
             判定是截图时带进来的背景，不是设计。⚠️ aspect 分母不能正好 = 345：
             y344 是过渡行（6.9% 暗像素），410 宽渲染时底部舍入必露 1px 黑线
             （2026-10-28 晚用户点名）。改用 **1024/340** 多裁 5 行把黑彻底盖住
             （显示 y 0~339，y334~340 的 2~4% 暗像素是插画内容不是背景条）。
             要留着黑条才把分母改回 385。
          · 高度沿革：旧图 1024×283 用 aspect-[1024/224] 压到 89.7px（旧图上下
             青柠留白太多，不裁显得头重）；新图内容带 y 55~295 占 70%，留白少得多，
             **按原生比例显示**（410 宽 → 136.2px），不再做非对称裁切 ——
             旧图那套 `object-[50%_30%]` 的推导（笑脸顶边 y≈38）对新图不成立，别沿用。
             嫌高就把 aspect 分母往大调（如 320 → 128px），内容带 y 55~295 在
             object-top 下 y≤320 都完整。
          · **2026-10-28 晚二改「对这个头图多进行裁剪」→ 340 收到 290。**
             上限是吉祥物的**白手套/奶茶杯下沿 y=283**（`scripts/probe-banner-hands.mjs`
             逐行数右侧 560~940 的近白像素得出，阈值 mn>185 & 饱和度<32）。
             分母 290 = 283 + 7px 余量，是「还能裁」的最后一档：
             再往下（≤283）会切掉右手套和杯底，画面会突然"少一只手"。
             实测 390 宽 → 129.5px 降到 **110.4px**（-19px，-15%）。
             当时判断"CSS 到底了"，但用户随后又要求「下面继续裁剪一部分」。
          · **2026-10-28 晚三改 → 290 收到 262。**
             这一档切在 y≈261：白手套/奶茶杯的下半截会被白卡压掉，只留上半段。
             视觉上仍是"吉祥物从白卡后探出头"（和 290 同一种读法），不是断手 ——
             因为切口正是卡片的上沿，读起来是遮挡而不是裁切。
             390 宽 → **99.8px**，整块头图首次压到 100px 以内。
             ⚠️ 再往下的安全线是 **y≈240（手套顶边）**：低于它手套整只消失，
             只剩一根绿管子托着光脸，就没有"举叉/举杯"的手势了。
             243≈92.5px 是这条路的终点；想再矮必须重出图（砍掉吉祥物下半身）。
          · **2026-10-28 晚四改「头图太暗了，能不能亮一点」→ 加 brightness filter。
             依据：素材青柠 padding 区实测 (167,203,68)，比品牌
             lime-400 #C7F665 (199,246,101) 暗一档（感知亮度 186 vs 232），且中段
             y80~160 有 30~37% 深色插画内容拖低整体。
             ⚠️ 容器底色 = padding 区 × brightness 系数（img 未加载时露底不跳色）。
             系数沿革：1.18（#C5F050）→ 用户「太亮了，削弱一点」→ **1.10**（#B8DF4B，
             padding 提到 ≈(184,223,75)）。要微调只动 brightness-[x] 和底色两个值；
             要还原删 filter 两个 class、底色改回 #AED743。素材本身没动。 */}
      <div
        id="menu-header-banner"
        className="relative w-full bg-[#B8DF4B] flex-shrink-0 select-none overflow-hidden aspect-[1024/262]"
      >
        <img
          id="menu-banner-image"
          src="/ordering_header_banner.jpg"
          alt="FOOD — GOOD FOOD BETTER MOOD"
          className="absolute inset-0 w-full h-full block select-none object-cover object-top brightness-[1.10] saturate-[1.05]"
         loading="eager" fetchPriority="high" />
      </div>

      {/* Main Content Container - Aligned right below header banner */}
      {/* 顶部不做圆角：头图是满幅海报，白卡再压一道 24px 圆角会在两侧露出绿色月牙，
          和海报的直边界面对不上。直角直接贴着图下沿，接缝更干净。 */}
      <div className="relative z-20 bg-white flex flex-col flex-1 min-h-0 overflow-hidden mt-0">
        {/* Row 1: Mode Switch (外卖 / 自提) & Search Bar in the SAME ROW - Frosted Matte & Unified Alignment */}
        <div className="flex-shrink-0 z-20 px-3 pt-3 pb-1.5 bg-white flex items-center gap-2">
          {/* Mode Toggle (Takeout / Pickup) Capsule - Aligned h-[34px] & Gray Background */}
          <div className="relative flex items-center h-[34px] bg-slate-100/90 p-0.5 rounded-full border border-slate-200/80 flex-shrink-0 select-none shadow-2xs">
            {/* 选中滑块走绿黑配色：青柠底 + 黑字，与下方热量筛选胶囊同一套语言
                （原来是灰底灰滑块，在白色头部里几乎看不出选中态） */}
            <div
              className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-[#C7F665] shadow-xs transition-transform duration-200 ease-out ${
                mode === 'takeout' ? 'left-0.5 translate-x-0' : 'left-0.5 translate-x-full'
              }`}
            />
            {/* 2026-11-02 对齐：按钮内边距 12 -> 10，让「外卖」的墨迹落到 x=25，
                与下一行筛选胶囊（12 + 1 边框 + 12 内边距 = 25）同一条文字列。
                改前这里是 27，和胶囊行差 4px，三行叠在一起看着是斜的。 */}
            <button
              type="button"
              onClick={() => onModeChange('takeout')}
              className={`relative z-10 h-full flex items-center justify-center px-2.5 rounded-full text-xs transition-colors whitespace-nowrap ${
                mode === 'takeout' ? 'text-black font-extrabold' : 'text-slate-600 font-bold hover:text-slate-900'
              }`}
            >
              <span className="pill-label">外卖</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('pickup')}
              className={`relative z-10 h-full flex items-center justify-center px-2.5 rounded-full text-xs transition-colors whitespace-nowrap ${
                mode === 'pickup' ? 'text-black font-extrabold' : 'text-slate-600 font-bold hover:text-slate-900'
              }`}
            >
              <span className="pill-label">自提</span>
            </button>
          </div>

          {/* Mini-Program Style Search Entry Capsule - Aligned h-[34px] & Gray Background */}
          <div
            onClick={() => setIsSearchOpen(true)}
            className="relative flex-1 min-w-0 h-[34px] flex items-center justify-between pl-3 pr-1.5 rounded-full bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 shadow-2xs cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 group-hover:text-slate-600 transition-colors" />
              {/* 占位符与真实输入分开配色：占位符在 slate-100 胶囊上要 4.5:1，
                  用 slate-600；一旦有输入就变 slate-900，和占位符拉开层级，
                  否则两者同色，用户分不清"这是提示"还是"我填过的字"。 */}
              <span
                className={`pill-label text-xs font-medium truncate ${
                  searchQuery ? 'text-slate-900' : 'text-slate-600'
                }`}
              >
                {searchQuery ? searchQuery : '搜索轻食名称、热量数值...'}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-200/90 hover:bg-slate-300 text-slate-700 hover:text-slate-900 text-[11px] font-bold shadow-2xs border border-slate-300/50 transition-all flex-shrink-0 flex items-center justify-center">
              搜索
            </span>
          </div>
        </div>

      {/* Row 2: Simplified Location Bar directly below Search */}
      <div className="flex-shrink-0 z-10 px-3 py-1 bg-white border-b border-slate-100 flex items-center justify-between gap-2 text-xs">
        <button
          onClick={onOpenStorePage}
          /* 2026-11-02 对齐：图标与文字的间距 4 -> 2，门店名的墨迹从 x=30 收到 28。
             上面两行的文字列是 25，这一行带 12px 图标、不可能压到 25（会把图标挤没），
             收到 28 后三行差 3px；原来差 7px（23 / 27 / 30），一眼能看出是斜的。 */
          className="py-1 -my-1 flex items-center gap-0.5 min-w-0 flex-1 text-left group hover:opacity-85 transition-opacity"
          title="点击切换门店"
        >
          <MapPin className="w-3.5 h-3.5 text-slate-900 flex-shrink-0" />
          <span className="font-extrabold text-slate-800 text-xs truncate max-w-[220px]">
            {currentStore.name}
          </span>
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
            (距您 {currentStore.distance})
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors flex-shrink-0" />
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium flex-shrink-0">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C7F665]" />
          {/* 送达时效是外卖决策的关键信息，从 slate-500 提到深黑加粗 */}
          <span className="text-slate-900 font-bold">{mode === 'takeout' ? '约25分钟送达' : '到店即取'}</span>
          {/* 分隔符用 1px 竖线而不是 `|` 字符：字符要满足 4.5:1 才合规，
              但它本来就是纯装饰，压到 1.49:1 才够淡 —— 与其在两难里挑，
              不如让它不再是文本。1px 高度可控，比字符更细更稳。 */}
          <span aria-hidden="true" className="h-2.5 w-px shrink-0 bg-slate-200" />
          <button
            onClick={onOpenStorePage}
            /* ⚠️ 只扩左侧：`px-1.5 -mx-1.5` 会让视觉右缘跑到 384（轨道是 378，偏出 6px），
               与搜索框右缘 378、筛选行右缘 376 对不齐。改成 `pl-1.5 -ml-1.5` ——
               左缘由 -ml 抵消、右缘不再外扩，命中区宽度不变。 */
            className="pl-1.5 -ml-1.5 py-1.5 -my-1.5 text-slate-800 hover:text-slate-950 font-bold transition-colors"
          >
            切换
          </button>
        </div>
      </div>

      {/* SINGLE ROW FILTER BAR - Strictly One Row (只占一栏，无弹窗) */}
      {/* 2026-11-02 对齐：胶囊内边距 10 -> 12（文字墨迹落到 25，与第 1 行分段控件同列），
          胶囊间距 gap 6 -> 4 用来抵消变宽 —— 四颗胶囊各 +4，间距 4 处各 -2，净 +8，
          行尾从 363 到 371，仍在 378 轨道内。 */}
      <div className="flex-shrink-0 z-10 px-3 py-1.5 bg-white border-b border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap text-xs shadow-2xs">
        {/* Reset / All Indicator Button - Styled to match the Search pill */}
        {activeFilterCount > 0 ? (
          <button
            id="filter-all-btn"
            type="button"
            onClick={resetAllFilters}
            /* 有筛选生效时它是个"当前筛了几项 + 一键重置"的状态入口。
               ⚠️ 2026-10-28 用户两连改（同一天）：
                  ① 先「选中时不要变色，仅边框变绿」—— 原来选中态是黑底青柠字，
                     一旦点任一热量筛选，整颗按钮从浅灰跳成纯黑，在一排淡底胶囊里非常突兀。
                  ② 再「普通的灰色就可以」—— 绿描边也不要了，**两态样式完全相同**，
                     选中只看内容（多出 RotateCcw 图标 + `(n)` 计数），颜色一律走中性灰。
                  ③ 再「内部改成白色或者浅灰色」—— 底色 `slate-200/90`（#E5EAF1）比同排
                     热量胶囊的 `slate-100/90`（#F1F5F9）深一档，两颗并排时这颗明显更"实"、
                     像被按下去。改为 `slate-100/90`，hover 也降到 `slate-200/70`，与邻类完全同档。
                     ⚠️ 边框刻意留在 `slate-300/50` 没有跟着变淡：底色提亮后它是这颗胶囊
                     唯一的轮廓，去掉就会糊进白底。
               ⚠️ 因此这里不要加 ring / 换字体权重：任何一个都会在点击瞬间让这颗胶囊「变样」。
                  同排热量胶囊用 `ring-2 ring-[#C7F665]` 表达选中，
                  这颗是状态入口（可重置），刻意保持低调，不跟它们抢。 */
            className="px-3 py-1 rounded-full bg-slate-100/90 hover:bg-slate-200/70 text-slate-700 text-[11px] font-bold shadow-2xs border border-slate-300/50 active:scale-95 transition-all duration-200 ease-out flex items-center gap-1 flex-shrink-0 cursor-pointer"
            title="清空筛选"
          >
            <RotateCcw className="w-3 h-3 stroke-[2.5]" />
            <span className="pill-label">全部 ({activeFilterCount})</span>
          </button>
        ) : (
          <button
            id="filter-all-btn"
            type="button"
            onClick={resetAllFilters}
            className="px-3 py-1 rounded-full bg-slate-100/90 hover:bg-slate-200/70 text-slate-700 text-[11px] font-bold shadow-2xs border border-slate-300/50 active:scale-95 transition-all duration-200 ease-out flex items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <span className="pill-label">全部</span>
          </button>
        )}

        {/* Divider */}
        <div className="h-3.5 w-px bg-slate-200 flex-shrink-0" />

        {/* 三个热量筛选胶囊：火焰图标 = **#FC5294**（2026-10-29 用户「这几个图标改成
            小程序中的玫红色」）。原来是金 #E0A800 —— 金是「价值/稀缺」语义，
            而热量档位跟价格、HOT 角标是同一类\"数据强调\"，归到唯一的红更统一。
            ⚠️ 选中态是白底 + 青柠环，玫红压白 3.10:1，14px 线性图标属非文本对比度
               （要求 3:1），刚好过关；再调浅就糊了。 */}

        {/* Calorie Range Filters (大卡/热量筛选) */}
        <button
          onClick={() => toggleCalorieRange('under250')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1 flex-shrink-0 transition-all duration-200 ease-out active:scale-95 cursor-pointer outline-none select-none ${
            filters.calorieRange === 'under250'
              ? 'bg-white text-[#26430B] border border-transparent ring-2 ring-[#C7F665] font-black shadow-2xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 border border-slate-200/50'
          }`}
        >
          <span className="flex items-center gap-1">
            <FlameIcon className="w-3.5 h-3.5 stroke-[2] text-[#FC5294] flex-shrink-0" />
            <span className="pill-label">≤250大卡</span>
          </span>
          {filters.calorieRange === 'under250' && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        <button
          onClick={() => toggleCalorieRange('250to400')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1 flex-shrink-0 transition-all duration-200 ease-out active:scale-95 cursor-pointer outline-none select-none ${
            filters.calorieRange === '250to400'
              ? 'bg-white text-[#26430B] border border-transparent ring-2 ring-[#C7F665] font-black shadow-2xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 border border-slate-200/50'
          }`}
        >
          <span className="flex items-center gap-1">
            <FlameIcon className="w-3.5 h-3.5 stroke-[2] text-[#FC5294] flex-shrink-0" />
            <span className="pill-label">250-400大卡</span>
          </span>
          {filters.calorieRange === '250to400' && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        <button
          onClick={() => toggleCalorieRange('over400')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1 flex-shrink-0 transition-all duration-200 ease-out active:scale-95 cursor-pointer outline-none select-none ${
            filters.calorieRange === 'over400'
              ? 'bg-white text-[#26430B] border border-transparent ring-2 ring-[#C7F665] font-black shadow-2xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 border border-slate-200/50'
          }`}
        >
          <span className="flex items-center gap-1">
            <FlameIcon className="w-3.5 h-3.5 stroke-[2] text-[#FC5294] flex-shrink-0" />
            <span className="pill-label">&gt;400大卡</span>
          </span>
          {filters.calorieRange === 'over400' && <Check className="w-3 h-3 stroke-[3]" />}
        </button>
      </div>

      {/* Main Two-Column Layout (Left Category Rail + Right Dish List) */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-[#F4F6F8] relative">
        {/* Left Category Rail - Narrowed slightly for better viewport proportion and dish area space
            ⚠️ 2026-11-02 窄屏降级（`max-[374px]`）：360 / 350 / 340 / 330 这些安卓宽度上，
            116 左栏 + 100 缩略图把菜品卡的文字列压到 88 / 78 / 68 / 58px —— 菜名只剩「牛…」，
            340 起价格和加号开始重叠，330 时加号压住价格 9px。窄屏收到 104，配合缩略图 86，
            文字列回到 ~128px。390 及以上完全不受影响（`max-[374px]` 不命中）。 */}
        <div className="w-[116px] max-[374px]:w-[104px] bg-white border-r border-slate-200/70 flex flex-col overflow-y-auto no-scrollbar py-2 pb-28 flex-shrink-0 relative">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                data-cat-id={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`relative w-full min-h-[56px] py-2.5 pl-2.5 pr-1 text-left transition-colors duration-150 flex items-center gap-1 select-none active:scale-[0.98] ${
                  isActive
                    ? 'text-black'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {/* Smooth sliding active background with rounded right corners and left black bar */}
                {isActive && (
                  <>
                    <motion.div
                      layoutId="activeCategoryBg"
                      className="absolute inset-y-0.5 left-0 right-1 bg-[#C7F665] rounded-r-2xl z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                    <motion.div
                      layoutId="activeCategoryBar"
                      className="absolute left-0 inset-y-0.5 w-1.5 bg-black rounded-r-sm z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  </>
                )}

                {/* Category Graphic Icon - Compact & crisp
                    未选中态刻意压到浅灰：原来图标是纯黑、文字 slate-900，
                    和选中态几乎同权重，青柠底只是"多了个背景"，层级拉不开。 */}
                <div
                  className={`relative z-10 flex-shrink-0 flex items-center justify-center ${
                    isActive ? 'text-black' : 'text-slate-400'
                  }`}
                >
                  <CategoryIcon id={cat.id} className="w-[24px] h-[24px]" isActive={isActive} />
                </div>

                {/* Category Name & Badge
                    2026-10-29 12:15 用户「HOT 改成热卖右上角」：
                    原来是 flex-col 两行（标题 / 标题正下方一行 HOT），现在改成**同一行**，
                    HOT 顶对齐成上标 —— 读法是「全部热卖ᴴᴼᵀ」，不再占两行高度。 */}
                <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center">
                  <div className="flex min-w-0 items-start gap-1">
                    <span
                      className={`min-w-0 truncate text-[12px] tracking-tight whitespace-nowrap leading-tight ${
                        isActive ? 'text-black font-extrabold' : 'text-slate-500 font-semibold'
                      }`}
                    >
                      {cat.name}
                    </span>
                    {/* 分类小徽标（只有「全部热卖」带 HOT）
                        ⚠️ 2026-10-25：由 `text-black/45`（≈#8C8C8C 灰）改为价格红 #FC5294。
                           灰在选中态的**青柠底上**几乎读不出来，而 HOT 本身就是「热度」语义。
                           红与价格同色（项目唯一红），不做第二档红。
                        ⚠️ 对比度：#FC5294 对白 3.10:1、对青柠 #C7F665 2.68:1 —— **不达 AA**，
                           2026-10-28 晚定版只留这一个红，靠 font-black + 全大写撑辨识度。
                        ⚠️ 尺寸 9px → **8px**：挪进标题同一行后，这一列只剩 71px 可用
                           （116 - pl10 - pr4 - 图标24 - gap6），12.5px 的「全部热卖」已占 ~50px，
                           9px + tracking-wider 的 HOT 会把标题挤成「全部热…」。
                           8px + tracking-wide 后 HOT 约 16px，总共 68px，留 3px 余量。
                           ⛔ 别再加大字号或 tracking，也别把标题 truncate 掉——两者是同一根绳。
                        ⚠️ 垂直：`items-start` + `-mt-px` 让它坐在标题顶线上，读成上标；
                           不用 absolute（窄列里绝对定位会飘出右边缘）。 */}
                    {cat.badge && (
                      <span className="shrink-0 text-[9px] font-black uppercase leading-none tracking-tight text-[#FC5294] -mt-px">
                        {cat.badge}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Menu Dishes List - ONLY THIS AREA SCROLLS */}
        <div
          ref={dishesScrollRef}
          className="flex-1 min-h-0 h-full overflow-y-auto p-3 pb-52 bg-transparent overscroll-contain relative z-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${activeCategory}-${JSON.stringify(filters)}-${searchQuery ? 's' : 'all'}`}
              initial={{ opacity: 0, y: slideDirection * 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -slideDirection * 20 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {filteredDishes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-2xs">
                    <SlidersHorizontal className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">没有找到符合条件的轻食菜品</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      尝试放宽部分过敏原筛除、热量或蛋白质限制
                    </p>
                  </div>
                  <button
                    onClick={resetAllFilters}
                    className="px-4 py-1.5 rounded-full bg-slate-900 text-[#C7F665] text-xs font-black shadow-2xs hover:bg-black active:scale-95 transition-all duration-200 ease-out border border-[#C7F665]/30"
                  >
                    重置所有筛选
                  </button>
                </div>
              ) : (
                filteredDishes.map((dish, index) => {
                  const qty = cartQuantities[dish.id] || 0;
                  const isFav = favorites.has(dish.id);

                  const discountRate =
                    dish.originalPrice > dish.dealPrice
                      ? ((dish.dealPrice / dish.originalPrice) * 10).toFixed(1)
                      : null;


                  return (
                    <motion.div
                      key={dish.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.15) }}
                      onClick={() => onSelectDish(dish)}
                      /* ⚠️ 售尽卡**不给手型光标、不给 hover 阴影、不给按压缩放** ——
                         它进不了详情（拦截在 App 的 handleSelectDish），
                         留着这三样等于承诺一个不存在的交互。
                         onClick 保留：点下去由 App 统一弹「已售尽」，比毫无反应友好。 */
                      className={`group p-2.5 max-[374px]:p-2 max-[374px]:gap-2 rounded-2xl bg-white border border-slate-100/90 shadow-xs transition-all duration-200 flex gap-2.5 relative items-center ${
                        dish.soldOut
                          ? 'cursor-default'
                          : 'cursor-pointer hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      {/* 商品图 = 不规则青柠/品类色块（色 = 该菜代表色 dish.bg）+ 越界食材
                          + 弧文字，整块由 `DishCoverArt` 渲染（详情页 hero 复用同一组件、
                          只是 size 更大）。构图规则、参数表、边界公式全部写在那个文件里，
                          这里**不要再复制一份**。
                          ⚠️ 2026-10-24：底盘从「椭圆」改成「不规则有机色块」（右上鼓起、
                             左上低平、下缘仍是椭圆弧），所以弧文字与月牙的既有结论不变。
                          ⚠️ 容器**不能加 `overflow-hidden`**，否则食材越出容器的部分会被切掉。
                          ⚠️ **hover 只放大这个容器**（`group-hover:scale-[1.03]`），不能放大 img
                             —— 放大食物会顶到弧线上压住文字；整容器放大则弧带比例不变，安全。 */}
                      <div
                        data-dish-thumb="true"
                        className="relative w-[100px] h-[100px] flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      >
                        {/* 盘 + 食材 + 弧文字整块抽到 `DishCoverArt`（详情页 hero 用同一套、
                            只是 size 更大）。这里只留卡片层的角标。 */}
                        <DishCoverArt dish={dish} size={100} groupDy={15} />

                        {/* 左上角标。⚠️ 盘色现在**随菜品变**（沙拉绿 / 三明治黄 / 照烧橙 /
                            拿铁棕 / 酸奶粉），所以角标必须自带底色，才能在任何盘上都读得出来。
                            沿革：
                            · 原来是「黑底 + 亮金字」，两块纯黑压在浅色盘面上太沉。
                            · 2026-10-25 改成「白底 + 深金/深绿字」（GOLD_TEXT #8A5F00 对白 5.6:1）。
                            · **2026-10-29 12:35 用户「top热销这类标签改成小程序红色」→ 三颗统一
                              白底 + 玫红 #FC5294**（含 0蔗糖，原 #26430B 深绿一并收进品牌红体系）。
                              白底玫红 = 3.10:1，8.5px 不达 AA，但这是用户选定的观感，与
                              全站「玫红即品牌红」的单档口径一致 —— ⛔ 别再为了对比度换第二档暗红。
                            ⚠️ 不要退回"彩色字 + 无底色"——黄盘上压玫红直接消失。 */}
                        {dish.isPopular ? (
                          <span className="absolute -top-0.5 -left-0.5 z-10 flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black leading-none text-[#FC5294] shadow-[0_1px_3px_rgba(15,23,42,0.16)]">
                            <Flame className="w-2.5 h-2.5 fill-[#FC5294] text-[#FC5294]" />
                            <span>TOP热销</span>
                          </span>
                        ) : dish.temperature === 'hot' ? (
                          <span className="absolute -top-0.5 -left-0.5 z-10 flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black leading-none text-[#FC5294] shadow-[0_1px_3px_rgba(15,23,42,0.16)]">
                            <span>暖心热食</span>
                          </span>
                        ) : dish.isSugarFree ? (
                          <span className="absolute -top-0.5 -left-0.5 z-10 flex items-center rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black leading-none text-[#FC5294] shadow-[0_1px_3px_rgba(15,23,42,0.16)]">
                            <span>0蔗糖</span>
                          </span>
                        ) : null}

                      </div>

                      {/* Dish E-Commerce Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-extrabold text-slate-900 text-[14px] leading-snug tracking-tight truncate group-hover:text-[#54801A] transition-colors">
                              {dish.name}
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(dish.id);
                              }}
                              className={`gb-hit p-1 -mr-1 rounded-full transition-colors flex-shrink-0 active:scale-95 ${
                                isFav ? 'text-[#FC5294]' : 'text-slate-300 hover:text-slate-500'
                              }`}
                              aria-label={isFav ? '取消收藏' : '加入收藏'}
                            >
                              {/* 已收藏 = 品牌玫红 #FC5294（2026-10-25 用户「点击改成红色」→ 原品牌金 #FDCF29；
                                  2026-10-27「所有红色改成 #fc259b」→ 正红 #E60012 换玫红 #FC259B；
                                  2026-10-28 晚「所有红色改成 #fc5294」→ **#FC5294，单档**）。
                                  fill/stroke 同色（平涂实心）：上一版用「fill 亮 + stroke 压深」
                                  做立体感，但那个压深值正是用户这次嫌「暗」的东西，一并撤掉。
                                  14px 平涂实心在浅灰底上轮廓足够清楚，不需要再描边加深。 */}
                              <Heart
                                className={`w-3.5 h-3.5 ${isFav ? 'fill-[#FC5294] stroke-[#FC5294]' : ''}`}
                              />
                            </button>
                          </div>

                          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5 leading-tight">
                            {dish.subtitle || dish.description}
                          </p>

                          {/* E-Commerce Tags + Monthly Sales Count
                              ⚠️ 2026-11-02 对齐修正：这一行只有 118px，原来 折徽章(38)
                                 + 间距(4) + 5 字标签(61) + 间距(4) + 销量(26) = 133，
                                 溢出 15px，`overflow-hidden` 把「9300+」裁掉了后两位 ——
                                 量出来的墨迹右缘 378.9，正好顶在卡片边上。
                                 ① 行间距 4 -> 2；② 折徽章内边距 6 -> 4；③ 标签内边距 8 -> 6；
                                 ④ 最长的那颗「高膳食纤维」改「高纤维」（5 字 -> 3 字，语义不变）。
                                 现在最长一行 112px，留 6px 余量。 */}
                          <div className="flex items-center gap-0.5 mt-1.5 overflow-hidden">
                            {discountRate && (
                              <span className="inline-flex h-[15px] items-center rounded-full bg-[#FDCF29] px-1 text-[9px] font-black leading-none text-[#0D1F2D] shrink-0">
                                {discountRate}折
                              </span>
                            )}
                            {dish.isKeto ? (
                              <DishTag>生酮友好</DishTag>
                            ) : dish.isSugarFree ? (
                              <DishTag>0卡糖</DishTag>
                            ) : dish.isHighFiber ? (
                              <DishTag>高纤维</DishTag>
                            ) : (
                              <DishTag>鲜制轻食</DishTag>
                            )}
                            {dish.sold && (
                              /* ⚠️ 这行只有 118px：折扣(≈30) + 品类(≈46) + gap(8) 已占 84，
                                 留给销量的只剩 34px，而「月售1.2万+」要 45px —— 必然溢出被裁。
                                 试过 min-w-0 truncate 更糟（被 flex 压成「月…」）。
                                 最终去掉「月售」前缀只留数值：「1.2万+」≈28px，正好放得下，
                                 销量信息没丢（紧挨着价格和折扣，电商语境自明）。 */
                              <span className="text-[9px] text-slate-500 font-medium ml-auto shrink-0">
                                {dish.sold}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & E-Commerce Mini-Program Stepper Control */}
                        <div className="flex items-end justify-between mt-1.5 pt-0.5">
                          <div className="flex items-baseline gap-0.5 min-w-0 leading-none">
                            <span className="text-[11px] font-extrabold text-[#FC5294]">¥</span>
                            <span className="text-[17px] font-black text-[#FC5294] leading-none tracking-tight tabular-nums">
                              {dish.dealPrice}
                            </span>
                            {/* 划线原价原为 slate-300（1.49:1，等于隐形）。删除线本身
                                已经表达了「这是原价」，不需要再靠颜色弱化；提到 slate-500
                                后用户才看得见「省了多少」。 */}
                            {dish.originalPrice > dish.dealPrice && (
                              <span className="text-[10px] text-slate-500 line-through leading-none ml-1 tabular-nums">
                                ¥{dish.originalPrice}
                              </span>
                            )}
                          </div>

                          {/* Stepper (+ / -): Brand Lime Circle Button matching HomePage E-Commerce Cards */}
                          <div
                            className="relative flex items-center justify-end h-6 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <motion.div
                              layout
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              className="flex items-center rounded-full"
                            >
                              <AnimatePresence initial={false}>
                                {qty > 0 && (
                                  <motion.div
                                    key="stepper-track-content"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 'auto', opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                    className="flex items-center overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => onRemoveFromCart(dish)}
                                      className="gb-hit-y w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 flex items-center justify-center transition-all duration-200 ease-out font-bold flex-shrink-0 border border-slate-200/80"
                                      aria-label="减少一份"
                                    >
                                      <Minus className="w-3 h-3 stroke-[2.5]" />
                                    </button>
                                    <motion.span
                                      key={`qty-${qty}`}
                                      initial={{ scale: 1.2, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ duration: 0.15 }}
                                      className="w-5 text-center text-xs font-black text-slate-900 leading-none flex-shrink-0 tracking-tight tabular-nums"
                                    >
                                      {qty}
                                    </motion.span>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* 加号：正常是青柠底黑 +；已售尽时变**灰底灰图标**，
                                  点击只弹 toast「已售尽」，不加购（2026-10-27 用户要求）。
                                  ⚠️ 保留 `active:scale-95` 和可点击性 —— 它要能接住点击去弹提示，
                                  设 `disabled` 反而点不动、什么反馈都没有。
                                  ⚠️ 售尽时左侧数量步进器不会出现（qty 永远是 0），
                                     所以这里不用额外做「隐藏步进器」的兜底。 */}
                              {dish.soldOut ? (
                                <button
                                  type="button"
                                  onClick={() => onShowToast('已售尽')}
                                  className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 active:scale-95 flex items-center justify-center transition-all duration-200 ease-out font-black flex-shrink-0"
                                  aria-label="已售尽"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const cardEl = e.currentTarget.closest('.group');
                                    const thumbEl = cardEl?.querySelector('[data-dish-thumb="true"]');
                                    const rect = (thumbEl || e.currentTarget).getBoundingClientRect();
                                    onAddToCart(dish, 1, rect);
                                  }}
                                  className="gb-hit-y w-6 h-6 rounded-full bg-[#C7F665] hover:bg-[#B7EF4B] text-black active:scale-95 flex items-center justify-center transition-all duration-200 ease-out font-black flex-shrink-0 shadow-2xs"
                                  aria-label="增加一份"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                                </button>
                              )}
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Artistic Bottom Background Canvas Matching Design Reference */}
        <MenuBottomDecor />
      </div>
    </div>
  </div>
  );
};

