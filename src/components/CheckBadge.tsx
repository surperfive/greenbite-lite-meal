import React from 'react';

/**
 * 对勾图形 —— 抽卡页「全选」胶囊和勾选徽章共用。
 * 尺寸/颜色由调用方用 className 决定（默认 w-2 h-2，即徽章内的大小）。
 */
export const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-2 h-2' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface CheckBadgeProps {
  /** 选中 = 青柠底 + 黑对勾；未选中 = 白底 + 灰点 */
  selected?: boolean;
  /** 附加类名，用于定位（如 absolute top-1.5 right-1.5）或改尺寸 */
  className?: string;
}

/**
 * 圆形勾选徽章 —— 商品详情页的规格 / 加料、抽卡页的食材卡共用。
 *
 * 2026-10-15 重构：原先这是 **10 份逐字复制的同一段 SVG + 同一串容器类名**，
 * 且未选中态的小圆点有 bg-slate-200（抽卡页）和 bg-slate-300（详情页）两种写法。
 * 已统一收到这里，颜色取 bg-slate-300（详情页版本，对比度更好一档）。
 */
export const CheckBadge: React.FC<CheckBadgeProps> = ({ selected = false, className = '' }) => (
  <span
    className={`w-3.5 h-3.5 rounded-full border-[1.5px] border-black flex items-center justify-center transition-all ${
      selected ? 'bg-[#C7F665]' : 'bg-white'
    } ${className}`}
  >
    {selected ? (
      <CheckIcon className="w-2 h-2 text-black" />
    ) : (
      <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
    )}
  </span>
);
