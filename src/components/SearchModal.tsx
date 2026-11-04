import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dish } from '../types';
import { DishImage } from './DishImage';
import { useBackLayer } from '../utils/backStack';
import {
  Search,
  ArrowLeft,
  X,
  Trash2,
  Flame,
  Sparkles,
  TrendingUp,
  Heart,
  Plus,
  Minus,
  SlidersHorizontal,
  ChevronRight,
  UtensilsCrossed,
  Tag,
  Zap
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishes: Dish[];
  cartQuantities: Record<number, number>;
  onAddToCart: (dish: Dish, qty?: number) => void;
  onRemoveFromCart: (dish: Dish) => void;
  onSelectDish: (dish: Dish) => void;
  favorites: Set<number>;
  onToggleFavorite: (dishId: number) => void;
  onShowToast: (msg: string) => void;
  initialQuery?: string;
}

const DEFAULT_HISTORY = ['牛油果鸡胸', '羽衣甘蓝', '能量碗', '低卡酸奶', '≤300kcal'];

const HOT_SEARCHES = [
  { rank: 1, keyword: '牛油果鸡胸沙拉', tag: '热销榜TOP1', isHot: true },
  { rank: 2, keyword: '羽衣甘蓝酸奶昔', tag: '0蔗糖爆款', isHot: true },
  { rank: 3, keyword: '藜麦南瓜能量碗', tag: '主食招牌', isHot: true },
  { rank: 4, keyword: '金枪鱼三明治', tag: '高蛋白小食', isHot: false },
  { rank: 5, keyword: '清爽沙拉', tag: '低GI控卡', isHot: false },
  { rank: 6, keyword: '低卡鲜饮', tag: '下午茶必点', isHot: false },
];

const QUICK_FILTERS = [
  { label: '≤ 300 kcal 极轻', query: '300', icon: '🔥', desc: '轻松减负' },
  { label: '高蛋白增肌', query: '高蛋白', icon: '🥩', desc: '能量满满' },
  { label: '0 蔗糖饮品', query: '低糖', icon: '🥤', desc: '清爽无负担' },
  { label: '主食能量碗', query: '能量碗', icon: '🥗', desc: '优质慢碳' },
];

type SortType = 'default' | 'calorie_asc' | 'price_asc' | 'protein_desc';

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  dishes,
  cartQuantities,
  onAddToCart,
  onRemoveFromCart,
  onSelectDish,
  favorites,
  onToggleFavorite,
  onShowToast,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('light_food_search_history');
      return saved ? JSON.parse(saved) : DEFAULT_HISTORY;
    } catch {
      return DEFAULT_HISTORY;
    }
  });
  const [sortType, setSortType] = useState<SortType>('default');
  const inputRef = useRef<HTMLInputElement>(null);
  useBackLayer(isOpen, onClose);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, initialQuery]);

  const saveHistory = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('light_food_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('light_food_search_history');
    } catch {}
    onShowToast('搜索历史已清空');
  };

  const handleSelectKeyword = (keyword: string) => {
    setQuery(keyword);
    saveHistory(keyword);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      saveHistory(query);
    }
  };

  // Filtered & Sorted Search Results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    let results = dishes.filter((dish) => {
      const matchName = dish.name.toLowerCase().includes(q);
      const matchSubtitle = dish.subtitle?.toLowerCase().includes(q) || false;
      const matchDesc = dish.description.toLowerCase().includes(q);
      const matchTags = dish.tags.some((t) => t.toLowerCase().includes(q));
      const matchCategory = dish.category.toLowerCase().includes(q);
      const matchCalorie = String(dish.kcal).includes(q);

      // Support number calorie comparison if query is like "<300" or "300"
      let numericMatch = false;
      const num = parseInt(q, 10);
      if (!isNaN(num) && num > 0) {
        numericMatch = dish.kcal <= num;
      }

      return matchName || matchSubtitle || matchDesc || matchTags || matchCategory || matchCalorie || numericMatch;
    });

    if (sortType === 'calorie_asc') {
      results = [...results].sort((a, b) => a.kcal - b.kcal);
    } else if (sortType === 'price_asc') {
      results = [...results].sort((a, b) => a.dealPrice - b.dealPrice);
    } else if (sortType === 'protein_desc') {
      results = [...results].sort((a, b) => b.protein - a.protein);
    }

    return results;
  }, [dishes, query, sortType]);

  const recommendedDishes = useMemo(() => {
    return dishes.filter((d) => d.isPopular).slice(0, 4);
  }, [dishes]);

  // Helper to highlight matching text in title/description
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-[#54801A] font-black bg-[#E4F8BC] px-0.5 rounded-xs">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="absolute inset-0 z-50 bg-[#F4F6F8] flex flex-col overflow-hidden select-none"
      >
        {/* Top Header & Search Input Box
            ⚠️ `pr-[92px]` 是给全局右上角 `#mp-capsule`（right-3 top-2.5 z-[55]，73.4×26）让位，
               避免「取消 / 搜索」按钮与输入框右端被小程序胶囊遮挡。 */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200/80 pl-3 pr-[92px] pt-2.5 pb-2.5 shadow-2xs">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="返回"
              className="gb-hit w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all duration-200 ease-out flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Input Capsule */}
            <div className="relative flex-1 min-w-0 flex items-center bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200/60 focus-within:border-slate-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
              <Search className="w-4 h-4 text-slate-900 flex-shrink-0 mr-2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索餐品、卡路里(如: 300)..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  aria-label="清空搜索词"
                  className="gb-hit w-4 h-4 rounded-full bg-slate-300 hover:bg-slate-400 text-white flex items-center justify-center text-[10px] ml-1 flex-shrink-0"
                >
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                </button>
              )}
            </div>

            {/* Submit or Cancel Action */}
            {query ? (
              <button
                type="submit"
                className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-black text-[#C7F665] text-xs font-black border border-[#C7F665]/30 shadow-2xs active:scale-95 transition-all duration-200 ease-out flex-shrink-0"
              >
                搜索
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-1 py-1 flex-shrink-0"
              >
                取消
              </button>
            )}
          </form>
        </div>

        {/* Search Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-24">
          {!query.trim() ? (
            /* Idle State: Search History + Hot Searches + Quick Nutrition Filters */
            <div className="p-3.5 space-y-4">
              {/* 1. Search History */}
              {searchHistory.length > 0 && (
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>搜索历史</span>
                    </span>
                    <button
                      onClick={handleClearHistory}
                      className="text-slate-400 hover:text-[#FC5294] text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>清空</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {searchHistory.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectKeyword(item)}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium active:scale-95 transition-all duration-200 ease-out truncate max-w-[150px]"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Hot Searches / Trending (大家都在搜) */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">热门搜索</span>
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#FC5294]/15 border border-[#FC5294]/45 text-[#FC5294] text-[9px] font-black">
                      <Flame className="w-2.5 h-2.5 text-[#FC5294] fill-[#FC5294]" /> HOT
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">实时轻食热度榜</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {HOT_SEARCHES.map((item) => {
                    const isTopThree = item.rank <= 3;
                    return (
                      <div
                        key={item.rank}
                        onClick={() => handleSelectKeyword(item.keyword)}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 cursor-pointer border border-slate-100 active:scale-[0.98] transition-all duration-200 ease-out"
                      >
                        {/* Rank Badge */}
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                            isTopThree
                              ? 'bg-amber-100 text-amber-900 border border-amber-300/80 shadow-2xs'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {item.rank}
                        </div>
                        {/* Keyword & Mini Tag */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {item.keyword}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium truncate">
                            {item.tag}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Quick Nutrition Shortcuts */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                  <span className="text-xs font-bold text-slate-900">按营养目标速选</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {QUICK_FILTERS.map((filter, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectKeyword(filter.query)}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/60 border border-slate-200/60 hover:border-slate-400 cursor-pointer flex items-center justify-between group active:scale-[0.98] transition-all duration-200 ease-out"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{filter.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                            {filter.label}
                          </p>
                          <p className="text-[10px] text-slate-400">{filter.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Search Results State */
            <div className="p-3.5 space-y-3">
              {/* Result Count and Sort Selector */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-500 font-medium">
                  共找到 <span className="font-bold text-slate-900">{searchResults.length}</span> 款相关轻食
                </span>

                {/* Sort tabs */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    onClick={() => setSortType('default')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      sortType === 'default'
                        ? 'bg-[#C7F665]/25 text-[#26430B] font-bold border border-[#C7F665]/50'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    综合
                  </button>
                  <button
                    onClick={() => setSortType('calorie_asc')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      sortType === 'calorie_asc'
                        ? 'bg-[#C7F665]/25 text-[#26430B] font-bold border border-[#C7F665]/50'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    热量 ↑
                  </button>
                  <button
                    onClick={() => setSortType('protein_desc')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      sortType === 'protein_desc'
                        ? 'bg-[#C7F665]/25 text-[#26430B] font-bold border border-[#C7F665]/50'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    高蛋白
                  </button>
                  <button
                    onClick={() => setSortType('price_asc')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      sortType === 'price_asc'
                        ? 'bg-[#C7F665]/25 text-[#26430B] font-bold border border-[#C7F665]/50'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    价格 ↑
                  </button>
                </div>
              </div>

              {/* Dish Results List */}
              {searchResults.length > 0 ? (
                <div className="space-y-2.5">
                  {searchResults.map((dish) => {
                    const qty = cartQuantities[dish.id] || 0;
                    const isFav = favorites.has(dish.id);

                    return (
                      <div
                        key={dish.id}
                        onClick={() => onSelectDish(dish)}
                        className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md flex gap-2.5 cursor-pointer group active:scale-[0.98] transition-all duration-200 ease-out relative overflow-hidden items-center"
                      >
                        {/* E-Commerce Mini-Program Product Thumbnail */}
                        <div className="w-[88px] h-[88px] rounded-xl overflow-hidden relative flex-shrink-0 bg-[#F8FAFC] shadow-2xs">
                          <DishImage
                            src={dish.image}
                            alt={dish.name}
                            category={dish.category}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            fallbackBg={dish.bg}
                            fallbackIcon={dish.icon}
                          />
                          {dish.isPopular && (
                            /* 和首页人气卡的 HOT 块同一套：玫红底 + **白字**。
                               2026-10-28 原本写黑（黑对 #FC5294 6.77:1，白只有 3.10:1，8px 必须黑），
                               2026-10-29 首页 HOT 块被用户改成白字后，这里跟齐 —— 同一个角标
                               两处两种墨色比"8px 略糊"更扎眼。见 HomePage 那条 HOT 注释的取舍说明。 */
                            <span className="absolute top-0 left-0 z-10 flex items-center gap-0.5 rounded-br-lg bg-[#FC5294] px-1.5 py-0.5 text-[9px] font-black leading-none text-white">
                              <Flame className="w-2.5 h-2.5 fill-white text-white" />
                              <span>TOP</span>
                            </span>
                          )}
                          <div className="absolute bottom-1 left-1 right-1 z-10 flex items-center justify-between rounded-md bg-black/75 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
                            <span>{dish.kcal}kcal</span>
                            <span className="text-[#C7F665]">蛋白{dish.protein}g</span>
                          </div>
                        </div>

                        {/* Dish Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0 self-stretch py-0.5">
                          <div>
                            {/* Title & Favorite */}
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-extrabold text-slate-900 text-[14px] leading-snug tracking-tight group-hover:text-[#54801A] transition-colors truncate">
                                {renderHighlightedText(dish.name, query)}
                              </h3>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(dish.id);
                                }}
                                className="text-slate-300 hover:text-[#FC5294] p-0.5 -mr-1 transition-colors flex-shrink-0"
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${
                                    isFav ? 'text-[#FC5294] fill-[#FC5294]' : ''
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Subtitle / Description */}
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5 leading-tight">
                              {renderHighlightedText(dish.subtitle || dish.description, query)}
                            </p>

                            {/* Nutrition Tags */}
                            <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                              {dish.tags.slice(0, 2).map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-[2px] rounded-full bg-[#E4F8BC] text-[#26430B] text-[9px] font-bold flex-shrink-0 leading-none truncate"
                                >
                                  {t}
                                </span>
                              ))}
                              <span className="text-[9px] text-slate-400 ml-auto flex-shrink-0 leading-tight">
                                月售{dish.sold}
                              </span>
                            </div>
                          </div>

                          {/* Price & Add to Cart Stepper */}
                          <div className="flex items-end justify-between mt-1.5 pt-0.5">
                            <div className="flex items-baseline gap-0.5 min-w-0 leading-none">
                              <span className="text-[11px] font-extrabold text-[#FC5294]">¥</span>
                              <span className="text-[17px] font-black text-[#FC5294] leading-none tabular-nums">
                                {dish.dealPrice}
                              </span>
                              {dish.originalPrice > dish.dealPrice && (
                                <span className="text-[10px] text-slate-300 line-through leading-none ml-1 tabular-nums">
                                  ¥{dish.originalPrice}
                                </span>
                              )}
                            </div>

                            {/* Add to Cart Stepper */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="relative flex items-center justify-end h-6 flex-shrink-0"
                            >
                              <motion.div
                                layout
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                className="flex items-center rounded-full"
                              >
                                <AnimatePresence initial={false}>
                                  {qty > 0 && (
                                    <motion.div
                                      key="search-stepper-track-content"
                                      initial={{ width: 0, opacity: 0 }}
                                      animate={{ width: 'auto', opacity: 1 }}
                                      exit={{ width: 0, opacity: 0 }}
                                      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                      className="flex items-center overflow-hidden"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => onRemoveFromCart(dish)}
                                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 flex items-center justify-center transition-all duration-200 ease-out font-bold flex-shrink-0 border border-slate-200/80"
                                        aria-label="减少一份"
                                      >
                                        <Minus className="w-3 h-3 stroke-[2.5]" />
                                      </button>
                                      <motion.span
                                        key={`search-qty-${qty}`}
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

                                <button
                                  type="button"
                                  onClick={() => onAddToCart(dish)}
                                  className="w-6 h-6 rounded-full bg-[#C7F665] hover:bg-[#B7EF4B] text-black active:scale-95 flex items-center justify-center transition-all duration-200 ease-out flex-shrink-0 font-black shadow-2xs"
                                  aria-label="增加一份"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                                </button>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty Results: No Match Found -> Show Friendly Recommendations */
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 text-center space-y-4 shadow-2xs">
                  <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <UtensilsCrossed className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      未找到与 “{query}” 相关的餐品
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      换个关键词试试，或直接查看下方为您推荐的热门轻食
                    </p>
                  </div>

                  <button
                    onClick={() => setQuery('')}
                    className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold active:scale-95 transition-all duration-200 ease-out inline-flex items-center gap-1"
                  >
                    <span>清除搜索词</span>
                  </button>

                  {/* Hot Recommendations */}
                  <div className="pt-3 border-t border-slate-100 text-left space-y-2.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[#FC5294] fill-[#FC5294]" />
                      <span>为您推荐以下招牌热卖</span>
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      {recommendedDishes.map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => onSelectDish(dish)}
                          className="p-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 cursor-pointer flex items-center gap-2 group active:scale-[0.98] transition-all duration-200 ease-out"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                            <DishImage
                              src={dish.image}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                              fallbackBg={dish.bg}
                              fallbackIcon={dish.icon}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-slate-900">
                              {dish.name}
                            </p>
                            <p className="text-[11px] font-black text-[#FC5294] mt-0.5">
                              ¥{dish.dealPrice}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
