import React, { useState, useEffect } from 'react';
import { BANNER_SLIDES } from '../data/mockData';
import { Sparkles, Utensils } from 'lucide-react';

interface BannerSliderProps {
  onBannerClick?: (index: number) => void;
  className?: string;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ onBannerClick, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    /* 高度对齐参考图：375 设备上 hero 高 278 → 本应用壳宽 410，缩放 1.093 → 304px。
       ⚠️ 不挂 sm:：应用恒在 410px 手机壳里，sm: 看视口宽度，只会让桌面/窄窗两种观感。 */
    <div className={`relative w-full h-[304px] overflow-hidden bg-gradient-to-br from-[#C7F665] via-[#B7EF4B] to-[#54801A] ${className}`}>
      {BANNER_SLIDES.map((slide, index) => {
        const isActive = index === currentIndex;
        const isError = imageErrors[index];
        const isGraphic = (slide as any).isGraphicBanner;

        return (
          <div
            key={index}
            onClick={() => onBannerClick?.(index)}
            className={`absolute inset-0 transition-all duration-700 ease-out cursor-pointer ${
              isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            {/* Background Image or Illustrated Fallback */}
            {!isError ? (
              <img
                src={slide.img}
                alt={slide.title}
                referrerPolicy="no-referrer"
                onError={() => setImageErrors((prev) => ({ ...prev, [index]: true }))}
                className="w-full h-full object-cover object-top"
               loading="eager" fetchPriority="high" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-r ${slide.color} flex items-center justify-end p-8`}>
                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                  <Utensils className="w-16 h-16 text-white/80" />
                </div>
              </div>
            )}

            {!isGraphic && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30" />

                {/* Slide Content */}
                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end text-white pb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C7F665] text-[#26430B] text-[11px] font-black tracking-wide w-fit mb-2 shadow-sm backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#26430B]" />
                    <span className="pill-label">{slide.tag}</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white leading-tight drop-shadow-md line-clamp-1">
                    {slide.title}
                  </h3>
                  <p className="text-sm text-slate-200 font-medium opacity-95 line-clamp-1 mt-1">
                    {slide.desc}
                  </p>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Slide Dots Indicator
          位置：右上角 + 半透明黑胶囊。三张海报都是亮底且四角有装饰（星芒 / 笑脸 / NEW 徽章），
          纯白点在亮底上会糊掉，加胶囊底才稳定可读。
          真要改回右下角：`absolute bottom-5 right-5 flex items-center gap-1.5`，去掉胶囊底色。
          ⚠️ 2026-11-03 22:08 全局「··· | ⊙」胶囊上提到 App 层后，这里必须**下移**
             （top-3 → top-11 → **top-12**）：两者原来都在 right-3，叠得严丝合缝，指示器被整颗盖住。
             横向左移（right-[78px]）试过更差 —— 会横插进海报的橙字标题里。
             top-12(48) 让指示器胶囊与上方胶囊净空 **12px**，与订单页搜索栏的 12px 对齐；
             全站统一「胶囊下方 12px 起排」这条规则，别单页单独调。 */}
      <div className="absolute right-3 top-12 z-10 flex items-center gap-1 rounded-full bg-black/35 px-1.5 py-[3px] backdrop-blur-[2px]">
        {BANNER_SLIDES.map((_, dotIdx) => (
          <button
            key={dotIdx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(dotIdx);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              dotIdx === currentIndex
                ? 'w-5 bg-white shadow-sm'
                : 'w-1.5 bg-white/70 hover:bg-white/90'
            }`}
            aria-label={`切换到第 ${dotIdx + 1} 张轮播图`}
          />
        ))}
      </div>
    </div>
  );
};

