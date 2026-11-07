import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useBackLayer } from '../utils/backStack';

export interface ShellBoxRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * useShellBox —— 实测手机壳「内容区」在视口里的矩形（DeviceFrameWrapper 里
 * 打了 `data-app-stage-box` 标记的那层）。
 */
export const useShellBox = (): ShellBoxRect | null => {
  const [box, setBox] = useState<ShellBoxRect | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector('[data-app-stage-box]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const top = Math.max(r.top, 0);
      const bottom = Math.min(r.bottom, window.innerHeight);
      if (bottom - top < 200) return;
      const next: ShellBoxRect = {
        top,
        left: r.left,
        width: r.width,
        height: bottom - top,
      };
      setBox((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next
      );
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, []);
  return box;
};

export const STICKER = {
  ink: '#080907',
  lime: '#C7F665',
  limeDeep: '#B7EF4B',
  limePale: '#ECFDC0',
  limeEdge: '#C7EE74',
  paper: '#FCFDFB',
} as const;

/* ------------------------------------------------------------------ */
/* 青柠立体徽章                                                         */
/* ------------------------------------------------------------------ */
export const StickerBadge: React.FC<{
  icon?: React.ReactNode;
  className?: string;
  rotate?: number;
  size?: 'md' | 'lg';
  borderWidth?: number;
}> = ({ icon, className = '', rotate = -4.2, size = 'md', borderWidth = 4 }) => {
  const geo = {
    md: { box: 'h-[52px] w-[60px] rounded-[19px]', radius: 15 },
    lg: { box: 'h-[56px] w-[68px] rounded-[21.5px]', radius: 17.5 },
  }[size];
  return (
    <div
      className={`pointer-events-none absolute -left-[9.5px] -top-[15.5px] z-30 flex items-center justify-center border-[#080907] shadow-[0_4px_10px_rgba(0,0,0,0.16)] ${geo.box} ${className}`}
      style={{
        borderWidth,
        transform: `rotate(${rotate}deg)`,
        backgroundImage:
          'linear-gradient(148deg, #E2FF66 0%, #C7F665 55%, #B7EF4B 100%)',
      }}
    >
      {/* 左上柔光高光（无底部月牙灰影） */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          inset: borderWidth + 0.25,
          borderRadius: geo.radius,
          backgroundImage:
            'radial-gradient(ellipse 72% 58% at 26% 18%, rgba(255,255,255,0.88), rgba(242,255,170,0.32) 48%, rgba(199,246,101,0) 72%)',
        }}
      />
      <span className="relative text-[#080907]">{icon}</span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 福利中心同款：荧光绿多层马克笔涂鸦横条 + 白贴纸底边                    */
/* ------------------------------------------------------------------ */
export const StickerScribble: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const heightMap = {
    sm: 'h-[14px]',
    md: 'h-[16px]',
    lg: 'h-[18px]',
  };
  return (
    <svg
      viewBox="38 86 240 30"
      preserveAspectRatio="none"
      className={`block w-full ${heightMap[size]} overflow-visible ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="42"
        y="88"
        width="234"
        height="21"
        rx="10.5"
        transform="rotate(-0.8 159 98.5)"
        fill="#C7F665"
      />
      <rect
        x="38"
        y="96"
        width="156"
        height="7"
        rx="3.5"
        transform="rotate(-1.1 116 99.5)"
        fill="#C7F665"
      />
      <rect
        x="46"
        y="105.5"
        width="148"
        height="6.5"
        rx="3.25"
        transform="rotate(-0.9 120 108.5)"
        fill="#C7F665"
      />
      <path
        d="M220 107.5 H270 C275 107.5 276 112.5 270 113 L212 113.5 Z"
        fill="#C7F665"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* 福利中心同款：斜杠 + 渐变细分割线（//////// ──────────）               */
/* ------------------------------------------------------------------ */
export const StickerSlashDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
    <svg width="46" height="9" viewBox="0 0 64 12" fill="none" className="shrink-0">
      <g fill="#11130F">
        <polygon points="3,11 7,1 10.2,1 6.2,11" />
        <polygon points="10.5,11 14.5,1 17.7,1 13.7,11" />
        <polygon points="18,11 22,1 25.2,1 21.2,11" />
        <polygon points="25.5,11 29.5,1 32.7,1 28.7,11" />
        <polygon points="33,11 37,1 40.2,1 36.2,11" />
        <polygon points="40.5,11 44.5,1 47.7,1 43.7,11" />
        <polygon points="48,11 52,1 55.2,1 51.2,11" />
        <polygon points="55.5,11 59.5,1 62.7,1 58.7,11" />
      </g>
    </svg>
    <div
      className="h-[1.5px] flex-1"
      style={{
        background: 'linear-gradient(90deg, #b8bdb3 0%, #dcdfd9 85%, transparent 100%)',
      }}
    />
  </div>
);

/* ------------------------------------------------------------------ */
/* 福利中心同款按钮：
 *   1. 通栏主 CTA（block=true, size='md'）：
 *      外层凹槽托盘 (.wf-cta-socket) + 青柠立体胶囊 (.wf-cta)
 *      + 左侧标志性白色月牙高光弧 + 右侧黑底白箭头圆章 (.wf-cta-arrow)
 *   2. 行内小胶囊按钮（block=false 或 size='sm'）：
 *      外层凹槽托盘 (.wf-btn-socket) + 3px 黑描边立体胶囊 (.wf-btn)
 *      支持青柠 (lime，带左侧月牙高光) 与纯白立体 (white / ink，带灰底立体边)
/* ------------------------------------------------------------------ */
export const StickerButton: React.FC<{
  tone?: 'ink' | 'lime' | 'white';
  size?: 'sm' | 'md';
  block?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}> = ({
  tone = 'lime',
  size = 'md',
  block = true,
  type = 'button',
  onClick,
  children,
  className = '',
  disabled,
  ariaLabel,
}) => {
  const isInlineSmall = size === 'sm' || !block;

  if (isInlineSmall) {
    const isWhite = tone === 'white' || tone === 'ink';
    return (
      <span
        className={`inline-flex shrink-0 rounded-full p-[2.5px] shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.08)] ${className}`}
        style={{
          background: 'linear-gradient(180deg, #e5e8e1 0%, #ffffff 100%)',
        }}
      >
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          className={`relative inline-flex h-[32px] min-w-[60px] items-center justify-center gap-1 rounded-full border-[2.4px] border-[#080907] px-3 text-[12px] font-black tracking-[0.3px] transition-all duration-150 ease-out outline-none ${
            disabled
              ? 'cursor-default text-[#5b6155]'
              : 'cursor-pointer text-[#0b0d09] hover:scale-[1.03] hover:brightness-[1.03] active:scale-[0.94]'
          }`}
          style={
            disabled
              ? {
                  background: 'linear-gradient(180deg, #eef2e8 0%, #dce2d5 100%)',
                  boxShadow: 'inset 0 1.5px 3px rgba(0, 0, 0, 0.08)',
                }
              : isWhite
                ? {
                    background: 'linear-gradient(180deg, #ffffff 0%, #f8faf6 75%, #ecefe9 100%)',
                    boxShadow:
                      '0 1.5px 0 rgba(0, 0, 0, 0.1), inset 0 -3px 0 #dfe3dc, inset 0 1.5px 1.5px #ffffff',
                  }
                : {
                    background: 'linear-gradient(180deg, #D3F97E 0%, #C7F665 68%, #B7EF4B 100%)',
                    boxShadow:
                      '0 1.5px 0 rgba(0, 0, 0, 0.14), inset 0 -3px 0 rgba(38, 67, 11, 0.22), inset 0 1.5px 2px rgba(255, 255, 255, 0.8)',
                  }
          }
        >
          {/* 青柠小按钮左侧白色月牙高光弧线 */}
          {!disabled && !isWhite && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[4.5px] top-[4.5px] bottom-[5.5px] w-[9px] rounded-l-full"
              style={{
                borderLeft: '2.2px solid rgba(255, 255, 255, 0.92)',
                borderTop: '1.5px solid rgba(255, 255, 255, 0.92)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
              }}
            />
          )}
          <span className="relative z-10 inline-flex items-center justify-center gap-1 whitespace-nowrap">
            {children}
          </span>
        </button>
      </span>
    );
  }

  /* 底部通栏主 CTA（完全对齐福利中心 .wf-cta-socket + .wf-cta + .wf-cta-arrow） */
  return (
    <div
      className={`w-full rounded-full border-[1.5px] border-[#d8ddd3] p-[3.5px] shadow-[0_4px_10px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(0,0,0,0.08)] ${className}`}
      style={{
        background: 'linear-gradient(180deg, #e2e6de 0%, #ffffff 65%, #f4f6f1 100%)',
      }}
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`group relative flex h-[48px] w-full items-center justify-center rounded-full border-[2.75px] border-[#080907] px-4 transition-all duration-150 ease-out outline-none ${
          disabled
            ? 'cursor-not-allowed text-[#5b6155]'
            : 'cursor-pointer text-[#0b0d09] hover:-translate-y-[1px] hover:brightness-[1.03] active:translate-y-[1.5px] active:scale-[0.985]'
        }`}
        style={
          disabled
            ? {
                background: 'linear-gradient(180deg, #eef2e8 0%, #dce2d5 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.08)',
              }
            : {
                background: 'linear-gradient(90deg, #C7F665 0%, #D3F97E 50%, #C7F665 100%)',
                boxShadow:
                  '0 1.5px 0 #080907, inset 0 -4.5px 0 rgba(38, 67, 11, 0.22), inset 0 3px 5px rgba(255, 255, 255, 0.65)',
              }
        }
      >
        {/* 主按钮左侧标志性白色月牙高光弧线 */}
        {!disabled && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-[6px] top-[5px] bottom-[7px] w-[16px] rounded-l-full"
            style={{
              borderLeft: '2.8px solid rgba(255, 255, 255, 0.92)',
              borderTop: '2px solid rgba(255, 255, 255, 0.85)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.35)',
            }}
          />
        )}
        <span className="relative z-10 inline-flex items-center justify-center gap-2 pr-4 text-[14.5px] font-black tracking-[0.3px] whitespace-nowrap">
          {children}
        </span>
        {/* 右侧圆形黑底白箭头章 (.wf-cta-arrow) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-[9px] flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#080907] transition-transform duration-200 group-hover:translate-x-[2px]"
        >
          <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
            <path
              d="M3.5 9H14.5M14.5 9L9.8 4.2M14.5 9L9.8 13.8"
              stroke="#FFFFFF"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 福利中心同款：凹槽胶囊/立体卡片容器（对应 .wf-slot）                    */
/* ------------------------------------------------------------------ */
export const StickerPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  pill?: boolean;
}> = ({ children, className = '', innerClassName = '', pill = false }) => (
  <div
    className={`relative border-[2px] border-[#e1e4dd] ${
      pill ? 'rounded-full' : 'rounded-[22px]'
    } ${className}`}
    style={{
      background: 'linear-gradient(180deg, #f3f5f0 0%, #fcfdfc 55%, #ffffff 100%)',
      boxShadow:
        '0 3px 0 #ebeee6, 0 5px 10px rgba(0, 0, 0, 0.04), inset 0 2.5px 4px rgba(0, 0, 0, 0.045), inset 0 -2.5px 0 #ffffff',
    }}
  >
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-[2.5px] border-[1.5px] border-white/90 ${
        pill ? 'rounded-full' : 'rounded-[19px]'
      }`}
    />
    <div className={`relative z-10 ${innerClassName}`}>{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 主外壳（完全对齐福利中心 .wf-board / .wf-close / 标题涂鸦 / 斜杠分割线）*/
/* ------------------------------------------------------------------ */
export interface StickerModalProps {
  onClose: () => void;
  title?: React.ReactNode;
  titleSize?: 'sm' | 'md' | 'lg' | 'xl';
  titleIcon?: React.ReactNode;
  subtitle?: React.ReactNode;
  titleAlign?: 'left' | 'center';
  badge?: React.ReactNode | null;
  badgeSize?: 'md' | 'lg';
  badgeBorderWidth?: number;
  scribble?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
  tilt?: number;
  scale?: number;
  scroll?: boolean;
  maxHeight?: string;
  ariaLabel?: string;
  bodyClassName?: string;
  cardId?: string;
  cardRef?: React.Ref<HTMLDivElement>;
  bodyRef?: React.Ref<HTMLDivElement>;
  onBodyScroll?: React.UIEventHandler<HTMLDivElement>;
  bodyStyle?: React.CSSProperties;
}

export const StickerModal: React.FC<StickerModalProps> = ({
  onClose,
  title,
  titleSize = 'md',
  titleIcon,
  subtitle,
  titleAlign = 'center',
  badge,
  badgeSize = 'md',
  badgeBorderWidth = 3.2,
  scribble = true,
  children,
  footer,
  maxWidth = 348,
  tilt = -2.2,
  scale = 1,
  scroll = false,
  maxHeight = '86vh',
  ariaLabel,
  bodyClassName = '',
  cardId,
  cardRef,
  bodyRef,
  onBodyScroll,
  bodyStyle,
}) => {
  const shellBox = useShellBox();
  useBackLayer(true, onClose);
  const effectiveMaxHeight = shellBox
    ? `min(${maxHeight}, ${Math.max(240, Math.round(shellBox.height - 32))}px)`
    : maxHeight;
  const titleCls = {
    sm: 'text-[26px]',
    md: 'text-[33px]',
    lg: 'text-[44px]',
    xl: 'text-[38px]',
  }[titleSize];
  const hasBadge = badge !== null;

  return createPortal(
    <>
      {/* 蒙层 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/62 backdrop-blur-sm"
      />
      {/* 居中盒 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed z-50 flex items-center justify-center p-4 pointer-events-none"
        style={
          shellBox
            ? {
                top: shellBox.top,
                left: shellBox.left,
                width: shellBox.width,
                height: shellBox.height,
              }
            : { inset: 0 }
        }
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 330, damping: 26 }}
          className="relative w-full pointer-events-auto"
          style={{ maxWidth }}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
        >
          <div
            className="relative"
            style={
              tilt || scale !== 1
                ? {
                    transform: `${tilt ? `rotate(${tilt}deg)` : ''} ${
                      scale !== 1 ? `scale(${scale})` : ''
                    }`.trim(),
                  }
                : undefined
            }
          >
            {/* 主卡：福利中心 .wf-board 同款 28px 大圆角 + 3.5px 黑边 + 左下硬投影 + 内侧白灰立体包边 */}
            <div
              id={cardId}
              ref={cardRef}
              className="relative flex flex-col overflow-hidden rounded-[28px] border-[3.5px] border-[#080907]"
              style={{
                maxHeight: effectiveMaxHeight,
                background: 'linear-gradient(180deg, #fcfdfb 0%, #f5f7f3 100%)',
                boxShadow:
                  '-2.5px 7px 0 #080907, -5px 16px 28px rgba(45, 68, 0, 0.22), inset 0 0 0 3.5px #ffffff, inset 0 -5px 0 3.5px #eaede6, inset 0 3px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* 内侧白灰立体包边保护层（防止滚动内容压住边缘内描边） */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 rounded-[24.5px]"
                style={{
                  boxShadow: 'inset 0 0 0 3.5px #ffffff, inset 0 -5px 0 3.5px #eaede6',
                }}
              />

              {/* 右上角关闭钮（完全对齐福利中心 .wf-close：黑底 + 2px 白描边 + 悬停旋转） */}
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                title="关闭"
                className="absolute right-3 top-3 z-30 flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#080907] shadow-[0_2px_5px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out hover:rotate-90 hover:scale-108 active:scale-90"
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 2L12 12M12 2L2 12"
                    stroke="#FFFFFF"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* 标题区 */}
              {(title || subtitle) && (
                <div className={`shrink-0 px-4 pb-1 ${hasBadge ? 'pt-[42px]' : 'pt-5'}`}>
                  {title && (
                    <div
                      className={`relative z-10 flex ${
                        titleAlign === 'center'
                          ? 'justify-center'
                          : hasBadge && badgeSize === 'lg'
                            ? 'pl-12'
                            : hasBadge
                              ? 'pl-9'
                              : 'pl-1'
                      }`}
                    >
                      <div className="inline-flex flex-col items-stretch">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`${titleCls} relative -skew-x-[5deg] font-black leading-none tracking-[-0.02em] text-[#090B08]`}
                          >
                            {title}
                          </h3>
                          {titleIcon && (
                            <span className="-my-[3px] translate-y-[6px] text-[#B0E80B]">
                              {titleIcon}
                            </span>
                          )}
                        </div>
                        {scribble && (
                          <StickerScribble
                            size={
                              titleSize === 'xl' || titleSize === 'lg'
                                ? 'lg'
                                : titleSize === 'md'
                                  ? 'md'
                                  : 'sm'
                            }
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>
                  )}
                  <StickerSlashDivider
                    className={`mt-1.5 ${
                      titleAlign === 'center'
                        ? 'mx-auto max-w-[220px]'
                        : hasBadge && badgeSize === 'lg'
                          ? 'pl-12'
                          : hasBadge
                            ? 'pl-9'
                            : 'pl-1'
                    }`}
                  />
                  {subtitle && (
                    <p
                      className={`mt-1.5 text-[11px] font-bold leading-relaxed text-[#6b6f68] ${
                        titleAlign === 'center' ? 'text-center' : ''
                      }`}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* 内容区 */}
              <div
                ref={bodyRef}
                onScroll={onBodyScroll}
                style={bodyStyle}
                className={`px-4 pt-2 ${
                  scroll
                    ? 'gb-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1'
                    : ''
                } ${bodyClassName}`}
              >
                {children}
              </div>

              {/* 底部主 CTA 操作区 */}
              {footer && <div className="shrink-0 px-4 pb-4 pt-2.5">{footer}</div>}
            </div>

            {hasBadge && (
              <StickerBadge icon={badge} size={badgeSize} borderWidth={badgeBorderWidth} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </>,
    document.body
  );
};
