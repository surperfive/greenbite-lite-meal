import React from 'react';

interface DishTagProps {
  children: React.ReactNode;
  /** 附加类名（如 mt-1 之类的位置微调） */
  className?: string;
}

/**
 * 菜品标签胶囊 —— 首页「人气当季轻食」卡片与点餐页菜品卡片共用。
 *
 * 2026-10-18 统一：点餐页原来是灰底方角徽章（bg-slate-100 + border），
 * 首页人气卡是浅青柠底全圆胶囊。按用户要求两处统一成首页这套：
 * `#E4F8BC` 浅青柠底 + `#26430B` 深青柠字 + rounded-full。
 * ⚠️ 文字不能用品牌主色 #C7F665（白底对比度仅 1.25:1），深字用 --lime-900。
 */
export const DishTag: React.FC<DishTagProps> = ({ children, className = '' }) => (
  <span
    /* 2026-11-02：左右内边距 8 -> 6。点餐页菜品卡的「折 + 标签 + 销量」只有 118px，
       8px 内边距下最长一行 121px，销量末位会被裁掉；收到 6px 后 112px，留 6px 余量。 */
    className={`inline-flex h-[15px] max-w-full shrink-0 items-center gap-0.5 truncate whitespace-nowrap rounded-full bg-[#E4F8BC] px-1.5 text-[9px] font-bold leading-none text-[#26430B] ${className}`}
  >
    {/* 9px 时墨迹中心比胶囊中心低 0.67px，用 pill-label 抬回（见 index.css 推导） */}
    <span className="pill-label">{children}</span>
  </span>
);
