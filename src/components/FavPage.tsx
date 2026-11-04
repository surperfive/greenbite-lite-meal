import React from 'react';
import { Dish } from '../types';
import { DishImage } from './DishImage';
import { Heart, Plus, Trash2, ArrowRight, Flame, Sparkles, ChevronLeft } from 'lucide-react';

interface FavPageProps {
  favoriteDishes: Dish[];
  onAddToCart: (dish: Dish) => void;
  onRemoveFavorite: (dishId: number) => void;
  onSelectDish: (dish: Dish) => void;
  onNavigate: (tab: string) => void;
  onBack?: () => void;
}

export const FavPage: React.FC<FavPageProps> = ({
  favoriteDishes,
  onAddToCart,
  onRemoveFavorite,
  onSelectDish,
  onNavigate,
  onBack
}) => {
  return (
    <div className="w-full min-h-full bg-[#F4F6F8] text-slate-900 pb-28 select-none">
      {/* 1. Immersive Top Header Area with Lime Gradient */}
      {/* pr 给全局「··· | ⊙」小程序胶囊让位（胶囊 right-3 top-2.5，占 x 324.6~398.6） */}
      <div className="relative bg-gradient-to-b from-[#C7F665] via-[#C7F665]/50 to-[#F4F6F8] pt-4 pl-4 pr-[92px] pb-4 overflow-hidden">
        {/* Mascot / Leaf Translucent Watermark */}
        <div className="absolute right-2 top-3 w-28 h-28 opacity-15 pointer-events-none text-black">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
            <path d="M50 15 C45 8, 30 10, 32 24 C33 32, 42 35, 48 38 C42 45, 30 52, 30 68 C30 82, 42 90, 50 90 C58 90, 70 82, 70 68 C70 52, 58 45, 52 38 C58 35, 67 32, 68 24 C70 10, 55 8, 50 15 Z" />
            <circle cx="38" cy="20" r="4" fill="currentColor" />
          </svg>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (onBack ? onBack() : onNavigate('me'))}
              aria-label="返回"
              className="gb-hit -ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-black transition-transform active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.6]" />
            </button>
            <h2 className="text-xl font-black text-black tracking-tight">我的轻食收藏</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-black text-[#C7F665] text-[11px] font-black border border-black shadow-2xs">
              <span className="pill-label">{favoriteDishes.length} 款</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('menu')}
            className="flex items-center gap-1 bg-black text-white px-3.5 py-1 rounded-full text-xs font-black shadow-2xs border border-black hover:bg-black/85 active:scale-95 transition-all duration-200 ease-out"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C7F665]" />
            <span className="pill-label">发现更多</span>
          </button>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="px-4 space-y-3 mt-1">
        {favoriteDishes.length === 0 ? (
          <div className="bg-white rounded-[24px] border-[2px] border-black p-8 text-center shadow-xs flex flex-col items-center justify-center my-4">
            <div className="w-18 h-18 rounded-[20px] bg-[#C7F665] border-[2px] border-black flex items-center justify-center text-black mb-3 shadow-none">
              <Heart className="w-8 h-8 fill-black/15 text-black" />
            </div>
            <h3 className="text-base font-black text-black">还没有收藏喜欢的轻食</h3>
            <p className="text-xs text-slate-600 font-bold mt-1 max-w-xs">
              在点餐菜单中点击爱心 ❤️，即可随时将常吃心选收录于此
            </p>
            <button
              onClick={() => onNavigate('menu')}
              className="mt-5 px-6 py-2.5 rounded-full bg-black hover:bg-black/90 text-[#C7F665] text-xs font-black shadow-none border-[1.5px] border-black active:scale-95 transition-all duration-200 ease-out flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C7F665]" />
              <span className="pill-label">浏览全菜单</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => onSelectDish(dish)}
                className="cursor-pointer p-3.5 rounded-[22px] bg-white border-[2px] border-black shadow-xs hover:shadow-md transition-all duration-200 ease-out flex items-center gap-3.5 active:scale-[0.98]"
              >
                <div className="w-20 h-20 rounded-[16px] overflow-hidden bg-[#f4f7fa] border-[2px] border-black flex-shrink-0">
                  <DishImage
                    src={dish.image}
                    alt={dish.name}
                    category={dish.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-black text-sm truncate">{dish.name}</h4>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(dish.id);
                      }}
                      className="text-slate-400 hover:text-[#FC5294] p-1 transition-colors"
                      title="取消收藏"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 font-bold truncate mt-0.5">{dish.subtitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-black bg-[#C7F665]/30 border border-black/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                      <span className="pill-label">{dish.kcal} kcal</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-black text-black">¥</span>
                      <span className="text-lg font-black text-black tracking-tight">
                        {dish.dealPrice}
                      </span>
                      <span className="text-xs text-slate-400 line-through ml-1 font-bold">
                        ¥{dish.originalPrice}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(dish);
                      }}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-black text-[#C7F665] text-xs font-black shadow-none hover:bg-black/90 active:scale-95 transition-all duration-200 ease-out border-[1.5px] border-black"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="pill-label">加入购物车</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

