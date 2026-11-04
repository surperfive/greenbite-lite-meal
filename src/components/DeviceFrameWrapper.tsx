import React, { useState } from 'react';
import { Smartphone, Monitor, Tablet, Wifi, Battery, Sparkles } from 'lucide-react';

interface DeviceFrameWrapperProps {
  children: React.ReactNode;
  bgColor?: string;
  fitHeight?: boolean;
}

export const DeviceFrameWrapper: React.FC<DeviceFrameWrapperProps> = ({
  children,
  bgColor = 'bg-[#F4F6F8]',
  fitHeight = false
}) => {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'max' | 'fluid'>('mobile');

  const getContainerWidthClass = () => {
    /* 2026-11-02 三处修正（响应式体检的结论，见 docs/ui-spec.md §7.2）：
       ① `max-shell-h-safe` 拼错了 —— index.css 里定义的是 `.shell-maxh-safe`，
          所以 fitHeight（盲盒页）的 max-height 兜底**从来没生效过**，页面被内容撑到
          803/868 高，底栏掉到首屏之外（360×640、412×732 实测都要滚才能切 tab）。
       ② `sm:h-[844px]` 是死代码：Tailwind 4 把 utilities 放进 `@layer`，而未分层的
          `.shell-h-safe` 永远压过它。桌面壳高实际一直是 100dvh。已删，改由 CSS 里的
          `@media (min-width: 640px)` 统一给出 `min(844px, calc(100dvh − 32px))`。
       ③ 桌面多出的 32px 白滚同样由那段 media query 解决（扣掉 `sm:my-4` 的上下边距）。
       ⚠️ 别把 `sm:h-[844px]` 加回来，它压不过未分层的 `.shell-h-safe`，只会误导下一个改的人。 */
    switch (deviceMode) {
      case 'mobile':
        return fitHeight
          ? 'max-w-[410px] h-auto shell-maxh-safe my-0 sm:my-4 rounded-none sm:rounded-[36px] shadow-none sm:shadow-2xl border-0 sm:border-[8px] sm:border-slate-800'
          : 'max-w-[410px] shell-h-safe my-0 sm:my-4 rounded-none sm:rounded-[36px] shadow-none sm:shadow-2xl border-0 sm:border-[8px] sm:border-slate-800';
      case 'max':
        return fitHeight
          ? 'max-w-[480px] h-auto shell-maxh-safe my-0 sm:my-4 rounded-none sm:rounded-[36px] shadow-none sm:shadow-2xl border-0 sm:border-[8px] sm:border-slate-800'
          : 'max-w-[480px] shell-h-safe my-0 sm:my-4 rounded-none sm:rounded-[36px] shadow-none sm:shadow-2xl border-0 sm:border-[8px] sm:border-slate-800';
      case 'fluid':
        return fitHeight
          ? 'max-w-2xl h-auto shell-maxh-safe my-0 sm:my-2 rounded-none sm:rounded-2xl shadow-none sm:shadow-xl border-0'
          : 'max-w-2xl shell-h-safe my-0 sm:my-2 rounded-none sm:rounded-2xl shadow-none sm:shadow-xl border-0';
    }
  };

  return (
    <div className="min-h-screen bg-[#ECEFF3] flex flex-col items-center justify-start antialiased">
      {/* Main Responsive Shell Container */}
      <div
        className={`w-full ${getContainerWidthClass()} ${bgColor} relative flex flex-col min-h-0 overflow-hidden transition-all duration-300`}
      >
        {/* Dynamic Screen Content */}
        {/* data-app-stage-box：弹窗层（StickerModal/LoginModal 等 portal 到 body 的 fixed 层）
            用它实测「壳内容区」矩形来居中 —— 2026-10-28 用户「弹窗已经超出页面了」：
            壳是 justify-start 顶对齐的 844px 盒子，弹窗原来相对整个视口居中，
            高个显示器（视口 ≳1100px）上卡片会伸出壳底。别删这个标记。 */}
        <div
          data-app-stage-box
          className={`flex-1 w-full flex flex-col min-h-0 overflow-hidden ${bgColor} relative`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
