import React from 'react';
import { CircleDot } from 'lucide-react';

/**
 * MiniProgramCapsule —— 仿微信小程序右上角的「··· | ⊙」胶囊。
 * ============================================================================
 * 2026-11-03 22:06 用户「稍微扩大一点，并且所有页面都显示这个，都在这个位置」：
 * 原本只有 `ProductDetailPage` 顶栏里有一枚（当时是 20 高、12px 字号），现在提到
 * `App.tsx` 的页面舞台层，**全站固定右上角**，各页面不再各画一份。
 *
 * 尺寸沿革：20 高（px-2 py-0.5 / 12px）→ **26 高**（px-2.5 py-1 / 13px / 圆点 4×4）。
 * 之所以不能更大：这枚胶囊是**装饰**（两个图形都不可点），压在食物大图上时，
 * 26 高已经是「一眼能认出是小程序胶囊、又不抢主体」的上限；再大就会和抽卡页的
 * 信息钮、首页的轮播指示器抢位置。
 *
 * ⚠️ 它是 `pointer-events-none` 的（在 App 里包一层），不拦截任何点击 ——
 *    别把它做成可点，它没有对应功能。
 * ⚠️ 颜色跟的是详情页顶栏那套「黑底 + 青柠字形」，和抽卡页的黑胶囊语言一致；
 *    不要换成白底，白底在首页的奶油色 banner 上会糊成一片。
 */
export interface MiniProgramCapsuleProps {
  className?: string;
  onBack?: () => void;
}

export const MiniProgramCapsule: React.FC<MiniProgramCapsuleProps> = ({
  className = '',
  onBack,
}) => (
  <div
    className={`flex items-center rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[#C7F665] shadow-md backdrop-blur-md ${className}`}
  >
    <span
      className="px-0.5 text-[13px] font-black leading-none tracking-wider select-none"
      aria-hidden="true"
    >
      ···
    </span>
    <span className="mx-1.5 h-3 w-px bg-[#C7F665]/30" aria-hidden="true" />
    <button
      type="button"
      onClick={onBack}
      aria-label="返回上一页"
      className="gb-hit pointer-events-auto -my-1 -mr-1.5 py-1 pr-1.5 pl-0.5 rounded-r-full flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90 hover:opacity-85"
    >
      <CircleDot className="h-4 w-4" />
    </button>
  </div>
);

export default MiniProgramCapsule;
