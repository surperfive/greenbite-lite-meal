import React from 'react';

interface CategoryIconProps {
  id: string;
  className?: string;
  isActive?: boolean;
}

/**
 * Modern, simplified outline vector icons with spacious, un-crowded geometry.
 */
export const FlameIcon: React.FC<{ className?: string; strokeWidth?: number | string }> = ({
  className = 'w-3.5 h-3.5',
  strokeWidth = 2,
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 3.5C9.9 5.9 7.9 8 7.9 11.3C7.9 10 7 9.1 6.2 8.3C4.9 10.4 4.4 12.8 4.4 14.9C4.4 18.6 7.7 21 12 21C16.3 21 19.6 18.6 19.6 14.9C19.6 10.9 15.6 7 12 3.5Z" />
    <path d="M12 14.2C11.1 15.2 10.5 16.2 10.5 17.3C10.5 18.3 11.2 19.1 12 19.1C12.8 19.1 13.5 18.3 13.5 17.3C13.5 16.2 12.9 15.2 12 14.2Z" />
  </svg>
);

export const CategoryIcon: React.FC<CategoryIconProps> = ({ id, className = 'w-7 h-7' }) => {
  switch (id) {
    case 'all': // 全部热卖 - Flame (缩减体量，与全套图标视觉大小均衡统一)
      return <FlameIcon className={className} strokeWidth={1.7} />;

    case 'salad': // 清爽沙拉 - Bowl with greens (舒展沙拉碗)
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 碗身 */}
          <path d="M3.8 11.2C3.8 16.2 7.4 19.8 12 19.8C16.6 19.8 20.2 16.2 20.2 11.2H3.8Z" />
          {/* 碗底座 */}
          <path d="M9 21.8H15" />
          {/* 舒展生菜轮廓 */}
          <path d="M5.5 11.2C5.5 8.8 7.6 7 10 7.6C11.2 6.6 13 6.6 14.6 7.8C16.2 7.8 18.5 9 18.5 11.2" />
          {/* 顶部新鲜嫩芽 */}
          <path d="M12 7.2V4C12 4 10.8 4.4 10.4 5.2" />
        </svg>
      );

    case 'bowl': // 主食能量碗 - Two sprout leaves (饱满舒展嫩叶)
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 主茎 */}
          <path d="M12 21.5C12 18 12 15 12 12.8" />
          {/* 左侧饱满叶片 */}
          <path d="M12 12.8C9.5 12.2 4.2 11.5 3.5 6C6.5 6 11.2 7.8 12 12.8Z" />
          {/* 右侧饱满叶片 */}
          <path d="M12 12.8C14.5 12.2 19.8 11.5 20.5 6C17.5 6 12.8 7.8 12 12.8Z" />
        </svg>
      );

    case 'hot': // 暖心轻食 - Food cloche (空间开阔保温盅)
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 餐盘托 */}
          <path d="M3 19H21" />
          {/* 顶部把手球 */}
          <circle cx="12" cy="5" r="1.6" />
          {/* 盅罩 */}
          <path d="M4.5 16C4.5 10 8 6.8 12 6.8C16 6.8 19.5 10 19.5 16H4.5Z" />
        </svg>
      );

    case 'drink': // 低卡鲜饮 - Cup with straw (加宽舒展冷饮杯)
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 吸管 */}
          <path d="M11.5 2H13.8L15 6.5" />
          {/* 宽杯盖 */}
          <rect x="3.5" y="6.5" width="17" height="2.2" rx="1.1" />
          {/* 加宽舒展杯身 */}
          <path d="M5.2 8.7L7.2 20.4C7.4 21.2 8.1 21.8 9 21.8H15C15.9 21.8 16.6 21.2 16.8 20.4L18.8 8.7" />
          {/* 内部开阔圆标 */}
          <circle cx="12" cy="15.2" r="2.8" />
        </svg>
      );

    case 'snack': // 蛋白小食 - Sliced egg (视觉体量统一)
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 蛋身轮廓 */}
          <path d="M12 3.2C8 3.2 5.4 7.8 5.4 13.3C5.4 17.8 8.4 21 12 21C15.6 21 18.6 17.8 18.6 13.3C18.6 7.8 16 3.2 12 3.2Z" />
          {/* 蛋黄圆环 */}
          <circle cx="12" cy="13.8" r="3.2" />
        </svg>
      );

    default:
      return null;
  }
};
