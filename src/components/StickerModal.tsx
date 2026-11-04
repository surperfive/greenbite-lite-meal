import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
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
 *
 * ⚠️ 2026-10-28 用户「弹窗已经超出页面了」：壳是 `justify-start` **顶对齐**的
 *    844px 盒子（DeviceFrameWrapper），而弹窗原来是 `fixed inset-0` 相对
 *    **整个视口**居中 —— 高个显示器（视口 ≳1100px）上卡片会伸出壳底
 *    （视口 1242 时食材图鉴卡底部出壳 ~105px）。
 *    portal 到 body 的弹窗拿不到壳做定位祖先，只能测矩形自己贴。
 *    resize / scroll 时重测（body 滚动会移动壳；壳内列表滚动不会，值不变时
 *    浅比较跳过 setState，不触发多余渲染）。
 */
export const useShellBox = (): ShellBoxRect | null => {
  const [box, setBox] = useState<ShellBoxRect | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector('[data-app-stage-box]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      /* ⚠️ 壳矩形要和**视口**取交集：壳本身可能比屏幕高（fitHeight 内容撑高 /
         矮窗口把 844px 壳顶出去、body 出滚动条）。不取交集的话卡片会按「壳整体」
         居中，两端伸出可视区 —— 2026-10-28 用户在小程序 webview 里实测"出小程序了"。
         交集后卡片永远以「壳的可见部分」为中线下沉/上收，必在屏内。 */
      const top = Math.max(r.top, 0);
      const bottom = Math.min(r.bottom, window.innerHeight);
      if (bottom - top < 200) return; // 退化（几乎看不见壳）时不更新，保留上一个有效值
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

/**
 * StickerModal —— 「黑粗描边 + 青柠贴纸」弹窗外壳
 * ============================================================================
 * 视觉母本来自抽卡页的「获取抽卡币」弹窗（GachaPage.tsx 里那一坨），
 * 2026-10-28 按用户要求抽象成共享壳，供全站弹窗统一使用：
 *   首页 · 福利中心 / 邀请好友 / 每日抽奖
 *   健康计划 · 食材图鉴 · 起送成功 · 门店切换
 *
 * 结构（自外向内）：
 *   1. 蒙层 bg-black/62 + backdrop-blur-sm
 *   2. 外层 motion：spring 进场缩放
 *   3. 立体边层：向右下偏移 3.25 / 2.6px 的纯黑圆角块（“纸片厚度”）
 *   4. 主卡：2.75px 黑描边 + 白底 + 内白描边 + 下方绿色投影
 *   5. 左上角青柠徽章（跨边框悬浮，-4.2°）
 *   6. 右上角黑圆关闭钮
 *
 * ⚠️ 关于滚动：卡片是 `flex flex-col` + `max-h`，内容区必须
 *    `flex-1 min-h-0 overflow-y-auto` —— 少了 `min-h-0`，flex 子项的最小高度
 *    会自动撑到内容高度，`overflow-y-auto` 永远不触发（之前图鉴弹窗踩过）。
 */

export const STICKER = {
  ink: '#070906',
  lime: '#C7F665',
  limeDeep: '#B0E80B',
  limePale: '#ECFDC0',
  limeEdge: '#C7EE74',
  paper: '#FDFDFD',
} as const;

/* ------------------------------------------------------------------ */
/* 青柠立体徽章                                                         */
/* ------------------------------------------------------------------ */
/* ⚠️ 必须挂在**主卡外面**（倾斜层里），不能放进主卡内部。
   主卡 `overflow-hidden` 会把这枚 `-left/-top` 伸出去贴纸剪成一个小方块，
   图标虽然靠 flex 居中，但“可见区域”不是整个贴纸，看上去就贴在左上角
   （2026-10-28 用户「这些图标放到框内中心位置」即此症）。
   实测（scripts/probe-badge-center.mjs）挪出来后 icon 中心与贴纸中心 dx=dy=0。 */
export const StickerBadge: React.FC<{
  icon?: React.ReactNode;
  className?: string;
  rotate?: number;
  /**
   * 贴纸尺寸档位。md = 60×52（默认，全站弹窗在用）；
   * lg = 68×56 —— 原始设计稿 210×172 按 0.325 换算就是 68×56（r22/边3），
   * 后来为压缩弹窗被改成 60×52。2026-11-02 用户「扩大」时按设计稿还原。
   * ⚠️ 圆角、高光内缩要跟着一起算：radius ≈ 0.316×h；高光 inset 由 borderWidth 推导（见下）。
   */
  size?: 'md' | 'lg';
  /** 描边宽度（px）。默认 2.75 = 与主卡描边等宽；用户要「更贴纸」时可单独加粗 */
  borderWidth?: number;
}> = ({ icon, className = '', rotate = -4.2, size = 'md', borderWidth = 2.75 }) => {
  const geo = {
    md: { box: 'h-[52px] w-[60px] rounded-[19px]', radius: 15 },
    lg: { box: 'h-[56px] w-[68px] rounded-[21.5px]', radius: 17.5 },
  }[size];
  return (
    <div
      className={`pointer-events-none absolute -left-[9.5px] -top-[15.5px] z-20 flex items-center justify-center border-[#060804] shadow-[2px_3px_2px_rgba(0,0,0,0.18)] ${geo.box} ${className}`}
      style={{
        borderWidth,
        transform: `rotate(${rotate}deg)`,
        backgroundImage:
          'linear-gradient(148deg, #DCFF4E 0%, #C6FA19 45%, #B0E80B 85%, #8FC204 100%)',
      }}
    >
      {/* 左上柔光：模拟参考图里那层高光，别用纯白（会显脏） */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          /* ⚠️ 高光必须整体落在描边**内侧**：inset 跟着 borderWidth 走（+0.25 让出 1/4 像素的贴边）。
             写死 3 时，描边一加粗高光就会盖到黑边上，左上角泛出一圈脏亮边。 */
          inset: borderWidth + 0.25,
          borderRadius: geo.radius,
          backgroundImage:
            'radial-gradient(ellipse 78% 62% at 26% 16%, rgba(255,255,255,0.9), rgba(242,255,170,0.4) 46%, rgba(198,250,25,0) 72%)',
        }}
      />
      <span className="relative text-[#060804]">{icon}</span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 手绘 Z 划痕（标题下的荧光笔）                                        */
/* ------------------------------------------------------------------ */
export const StickerScribble: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const map = { sm: 'h-[13px] w-[132px]', md: 'h-[18px] w-[186px]', lg: 'h-[22px] w-[240px]' };
  return (
    <svg
      viewBox="-3.5 -4.5 408 37"
      className={`${map[size]} -rotate-2 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M 5,9 L 330,4 L 72,24 L 396,19"
        stroke="#C8FF1A"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* 贴纸风胶囊按钮                                                       */
/* ------------------------------------------------------------------ */
export const StickerButton: React.FC<{
  tone?: 'ink' | 'lime';
  size?: 'sm' | 'md';
  block?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}> = ({ tone = 'lime', size = 'md', block = true, onClick, children, className = '', disabled, ariaLabel }) => {
  const isInk = tone === 'ink';
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'py-2.5 text-[13px]';
  return (
    <span className={`relative ${block ? 'block w-full' : 'inline-block'} ${className}`}>
      {/* 错位投影：和按钮同形，向下 2.5px，做出“纸片贴上去”的厚度 */}
      {!disabled && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 translate-y-[2.5px] rounded-full ${isInk ? 'bg-[#E5ECC8]' : 'bg-[#DDF988]'}`}
        />
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`relative rounded-full border-[3px] font-black transition-all duration-200 ease-out ${
          block ? 'w-full' : ''
        } ${pad} ${
          disabled
            ? 'cursor-not-allowed border-[#070906]/35 bg-[#E8E8E8] text-[#070906]/40'
            : isInk
              ? 'cursor-pointer border-[#070905] bg-[#070906] text-white active:translate-y-[1.5px]'
              : 'cursor-pointer border-[#070906] bg-gradient-to-br from-[#D4FF2A] via-[#C7FD19] to-[#B8F00B] text-[#070905] active:translate-y-[1.5px]'
        }`}
      >
        {!disabled && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              backgroundImage: isInk
                ? 'radial-gradient(ellipse 46% 90% at 12% 2%, rgba(255,255,255,0.34), rgba(255,255,255,0) 58%)'
                : 'radial-gradient(ellipse 58% 78% at 16% 6%, rgba(255,255,255,0.9), rgba(255,255,255,0) 64%)',
            }}
          />
        )}
        <span className="relative inline-flex items-center justify-center gap-1.5">{children}</span>
      </button>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* 内容小节：双层倒角的浅灰卡片（参考图里“每日签到 / 好友助力”那一格）    */
/* ------------------------------------------------------------------ */
export const StickerPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}> = ({ children, className = '', innerClassName = '' }) => (
  <div
    className={`rounded-[17.5px] bg-gradient-to-br from-[#EEEEF0] via-[#E5E7EB] to-[#DCDEE2] p-[1.5px] ${className}`}
  >
    <div
      className={`rounded-[16px] bg-gradient-to-br from-[#F3F5F8] via-[#F8F9FB] to-white ring-1 ring-white ${innerClassName}`}
    >
      {children}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 主外壳                                                              */
/* ------------------------------------------------------------------ */
export interface StickerModalProps {
  onClose: () => void;
  /** 大标题（纯文本或带样式的节点） */
  title?: React.ReactNode;
  /** 标题字号档位：26 / 34 / 46 / 40px（xl 供「食材图鉴」这类需要盖过徽章的大标题） */
  titleSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** 标题右侧图标（如皇冠） */
  titleIcon?: React.ReactNode;
  /** 标题下方补充说明 */
  subtitle?: React.ReactNode;
  /**
   * 标题区（大标题 + 划线 + 副标题）的水平对齐，默认 `left`。
   * 2026-11-03 21:33 用户「选择门店 … 往右偏居中位置」：门店弹窗的标题只有 4 个字，
   * 左对齐时右侧空出一大片、和下面居中的门店卡列表也不呼应，所以给了 center 档。
   * ⚠️ 只影响标题区，不动 body / footer；徽章仍钉在卡片左上角外（不跟着居中）。
   */
  titleAlign?: 'left' | 'center';
  /** 左上角徽章内容；传 `null` 则不显示徽章 */
  badge?: React.ReactNode | null;
  /** 徽章尺寸档位：md 60×52（默认）/ lg 68×56（原设计稿比例） */
  badgeSize?: 'md' | 'lg';
  /** 徽章描边宽度（px），默认 2.75（与主卡等宽） */
  badgeBorderWidth?: number;
  /** 标题下是否画 Z 划痕 */
  scribble?: boolean;
  children: React.ReactNode;
  /** 固定在底部的操作区（不随内容滚动） */
  footer?: React.ReactNode;
  maxWidth?: number;
  /** 卡片倾斜角，默认 -1.6；长表单建议传 0 */
  tilt?: number;
  /**
   * 整体等比缩放（默认 1）。用于「这张卡相对壳子太大」的场合。
   * ⚠️ 只缩**视觉**不缩布局盒：maxWidth 仍按原值算，缩放后居中位置不变。
   *    挂在与 rotate 同一层（单个 transform），别写进外层 motion.div —— 会被 spring 的
   *    animate scale 覆盖。旋转层是 `absolute` 之外唯一带 transform 的层，缩放后
   *    黑立体边 / 徽章 / 阴影一起缩，比例不会走形。
   */
  scale?: number;
  /** 内容区是否滚动 */
  scroll?: boolean;
  maxHeight?: string;
  ariaLabel?: string;
  /** 内容区额外的类名（比如让图鉴列表用 space-y-2） */
  bodyClassName?: string;
  /* ---- 下面几个是给「图鉴弹窗」这类需要测量/滚动监听的老弹窗留的口子 ---- */
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
  titleAlign = 'left',
  badge,
  badgeSize = 'md',
  badgeBorderWidth = 2.75,
  scribble = true,
  children,
  footer,
  maxWidth = 346,
  tilt = -1.6,
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
  /* 壳内容区矩形：有值 → 居中盒贴壳（弹窗不会跑出手机壳）；null → 退回视口居中 */
  const shellBox = useShellBox();
  useBackLayer(true, onClose);
  /* maxHeight 里再夹一层「壳内容高 − p-4×2」：vh 上限在 tall 显示器上会远超壳高
     （86vh @1242 = 1068 > 壳 844），min() 取小的那个。px 值不受祖先 auto 高度影响。 */
  const effectiveMaxHeight = shellBox
    ? `min(${maxHeight}, ${Math.max(240, Math.round(shellBox.height - 32))}px)`
    : maxHeight;
  const titleCls = {
    sm: 'text-[26px]',
    md: 'text-[34px]',
    lg: 'text-[46px]',
    /* xl（2026-11-02 用户「继续放大标题」）：26 → 40，+54%。
       为什么新开一档而不是把 sm 改大：sm 被 7 个弹窗共用（起送成功 / 健康计划 /
       首页三张福利卡 / 门店切换），改档会把它们一起顶大。
       40 而不是 34：卡片还带着 scale 0.9，40 × 0.9 = 36 实际渲染，才看得出来。 */
    xl: 'text-[40px]',
  }[titleSize];
  const hasBadge = badge !== null;

  return createPortal(
    <>
      {/* 蒙层：仍 fixed inset-0 盖满整个视口（压不压底部导航的行为不变） */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/62 backdrop-blur-sm"
      />
      {/* 居中盒：⚠️ 不再 `inset-0` 相对视口居中 —— 那会在 tall 显示器上把卡片
          送出顶对齐的 844px 手机壳（2026-10-28 用户「弹窗已经超出页面了」）。
          有壳矩形就贴壳内容区；拿不到（理论上不会）才退回视口居中。
          pointer-events-none + 卡片 auto：盒外空隙的点击落回蒙层，行为与旧版一致。 */}
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
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
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
              ? { transform: `${tilt ? `rotate(${tilt}deg)` : ''} ${scale !== 1 ? `scale(${scale})` : ''}`.trim() }
              : undefined
          }
        >
          {/* 立体边层 */}
          <div aria-hidden="true" className="absolute inset-0 translate-x-[3.25px] translate-y-[2.6px] rounded-[20px] bg-[#060804]" />

          {/* 主卡 */}
          <div
            id={cardId}
            ref={cardRef}
            className="relative flex flex-col overflow-hidden rounded-[20px] border-[2.75px] border-[#060804] bg-[#FDFDFD]"
            style={{
              maxHeight: effectiveMaxHeight,
              boxShadow:
                'inset 0 0 0 1px rgba(255,255,255,0.85), 0 5px 7px rgba(74,107,0,0.22)',
            }}
          >
            {/* 关闭钮 */}
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="absolute right-2.5 top-2.5 z-30 flex h-[27px] w-[27px] cursor-pointer items-center justify-center rounded-full bg-[#070906] transition-all duration-200 ease-out active:scale-90"
            >
              <X className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />
            </button>

            {/* 标题区 */}
            {(title || subtitle) && (
              <div className={`shrink-0 px-3.5 pb-1 ${hasBadge ? 'pt-[42px]' : 'pt-5'}`}>
                {title && (
                  <div
                    className={`relative z-10 flex items-center gap-2 ${titleAlign === 'center' ? 'justify-center' : ''}`}
                  >
                    {/* ⚠️ 2026-11-03 13:05 用户「去除这个字体描边」：删掉 h3 上那段
                        0.45px 四向 `text-shadow`（原本是拿它当「伪加粗 / 描边」用）。
                        · 为什么删得掉：字重已经是 `font-black`(900)，到顶了；那层 0.45px
                          纯属向外糊一圈，只会把笔画边缘撑出锯齿，不会更黑。
                        · 锯齿在大标题上最明显：`-rotate-2` + 0.9 缩放让字形落在非整数像素上，
                          再叠四向 0.45px 偏移，边缘就是「毛边」观感（40px 的「食材图鉴」最刺眼）。
                        · 删掉后笔画本身一点不动，只是回到字体原本的轮廓 —— 干净、锐利。
                        ⚠️ 别用 `-webkit-text-stroke` 替代：那是**居中**描边，会吃掉字形内部，
                           粗黑体加 2px 后笔画反而变细（index.css `.text-stroke-white` 注释同结论）。
                        ⚠️ 影响面：这是 StickerModal 的**共用标题**，所以健康计划 / 福利中心 /
                           邀请新人 / 红包已开启 / 选择门店 / 10 款达成 会一起变干净。
                           10 款达成 必须跟着改 —— 它按设计稿与「食材图鉴」对齐（都是 xl 40px），
                           只改一个会让两个弹窗的标题粗细不一致。 */}
                    <h3
                      className={`${titleCls} -rotate-2 font-black leading-none tracking-[0.02em] text-[#070906]`}
                    >
                      {title}
                    </h3>
                    {titleIcon && (
                      <span className="-my-[3px] translate-y-[6px] text-[#B0E80B]">{titleIcon}</span>
                    )}
                  </div>
                )}
                {scribble && title && (
                  <StickerScribble
                    size={titleSize === 'xl' || titleSize === 'lg' ? 'lg' : titleSize === 'md' ? 'md' : 'sm'}
                    /* svg 默认是 inline，mx-auto 不生效，居中档必须补 block */
                    className={`mt-1.5 ${titleAlign === 'center' ? 'block mx-auto' : ''}`}
                  />
                )}
                {subtitle && (
                  <p
                    className={`mt-2 text-[11px] font-bold leading-relaxed text-[#070906]/55 ${titleAlign === 'center' ? 'text-center' : ''}`}
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
              className={`px-3.5 pt-2 ${scroll ? 'gb-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1' : ''} ${bodyClassName}`}
            >
              {children}
            </div>

            {/* 底部操作区 */}
            {footer && <div className="shrink-0 px-3.5 pb-3.5 pt-2.5">{footer}</div>}
          </div>

          {/* ⚠️ 2026-10-28「这些图标放到框内中心位置」：
              徽章原来放在**主卡内部**，而主卡是 `overflow-hidden`（为了裁圆角/滚动内容），
              于是 `-left-[9.5px] -top-[15.5px]` 伸出去的那截被整块剪掉 ——
              露出的是徽章**右下 3/4**，图标（在真·几何中心）看上去就贴在可见区的左上角。
              修法：把徽章从卡内挪到**倾斜层**（无 overflow），让 60×52 的贴纸整块可见，
              图标自然落回中心，同时恢复设计本意「跨边框悬浮」。
              z-20 > 卡的 auto，不移出裁剪也会盖在卡上；pointer-events-none 不影响点击。 */}
          {hasBadge && <StickerBadge icon={badge} size={badgeSize} borderWidth={badgeBorderWidth} />}
        </div>
      </motion.div>
      </motion.div>
    </>,
    document.body
  );
};
