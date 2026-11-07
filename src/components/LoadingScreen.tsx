import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { FreshFoodLogo } from './FreshFoodLogo';

interface LoadingScreenProps {
  onFinish?: () => void;
  canSkip?: boolean;
  /** 最短动画展示时长（毫秒），确保海浪进度条平滑走满，且必须等页面内所有图片/视频/字体资源加载完毕后才结束 */
  duration?: number;
  /** 需要等待内部所有资源（img / video / fonts）加载完成的页面容器选择器 */
  targetSelector?: string;
}

/**
 * 以「FRESH FOOD 皇冠贴纸 Logo + 黑描边黄绿渐变从左向右海浪胶囊进度条」为核心的品牌加载页：
 * - 实时扫描并监听目标页面容器（#app-page-stage）内的所有 <img loading="lazy" decoding="async">、<video> 与字体资源
 * - 只有当页面内所有图片完成下载与解码（complete + decode）、视频首帧就绪（readyState >= 2）
 *   且海浪进度条平滑推进至 100% 填满胶囊后，才揭幕展示页面内容
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onFinish,
  canSkip = true,
  duration = 750,
  targetSelector = '#app-page-stage'
}) => {
  const reduceMotion = useReducedMotion();
  const [finishing, setFinishing] = useState(false);
  const completed = useRef(false);
  const mounted = useRef(false);
  const onFinishRef = useRef(onFinish);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const waveAdvanceRef = useRef<SVGGElement>(null);
  onFinishRef.current = onFinish;

  const finish = useCallback(() => {
    if (!mounted.current || completed.current) return;
    completed.current = true;
    setFinishing(true);
    if (waveAdvanceRef.current) {
      waveAdvanceRef.current.style.transform = 'translateX(14px)';
    }
    finishTimer.current = setTimeout(() => {
      if (mounted.current) onFinishRef.current?.();
    }, reduceMotion ? 20 : 35);
  }, [reduceMotion]);

  useEffect(() => {
    mounted.current = true;
    completed.current = false;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    rootRef.current?.focus({ preventScroll: true });

    const minDuration = Number.isFinite(duration) ? Math.max(180, duration) : 320;
    const maxSafetyTimeout = Math.max(2400, minDuration + 2000);
    const startTime = performance.now();

    let assetsAllReady = false;
    let assetLoadedRatio = 0;
    let fontsReady = false;
    let domSettled = false;
    let paintFramesAfterReady = 0;

    // 1. Track Web Fonts
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(() => {
          fontsReady = true;
        })
        .catch(() => {
          fontsReady = true;
        });
    } else {
      fontsReady = true;
    }

    // 2. Track all <img>, CSS background-image URLs, and <video> elements inside target page container
    const trackedImages = new Map<HTMLImageElement, boolean>();
    const trackedBgUrls = new Map<string, boolean>();
    const trackedVideos = new Map<HTMLVideoElement, boolean>();
    const cleanups: Array<() => void> = [];

    const recomputeAssetStatus = () => {
      const total = trackedImages.size + trackedBgUrls.size + trackedVideos.size;
      if (total === 0) {
        assetLoadedRatio = domSettled ? 1 : 0;
        assetsAllReady = domSettled && fontsReady;
        return;
      }
      let done = 0;
      trackedImages.forEach((isDone) => {
        if (isDone) done++;
      });
      trackedBgUrls.forEach((isDone) => {
        if (isDone) done++;
      });
      trackedVideos.forEach((isDone) => {
        if (isDone) done++;
      });
      assetLoadedRatio = done / total;
      assetsAllReady = domSettled && fontsReady && done >= total;
    };

    const decodeAndMarkImageDone = (img: HTMLImageElement) => {
      if (trackedImages.get(img) === true) return;
      const finalize = () => {
        trackedImages.set(img, true);
        recomputeAssetStatus();
      };
      if (typeof img.decode === 'function') {
        img
          .decode()
          .catch(() => {})
          .finally(finalize);
      } else {
        finalize();
      }
    };

    const trackSingleImage = (img: HTMLImageElement) => {
      if (trackedImages.has(img)) return;
      trackedImages.set(img, false);

      // Force eager loading & high priority so below-the-fold or scrollable images fetch immediately
      if (img.getAttribute('loading') === 'lazy' || img.loading === 'lazy') {
        img.removeAttribute('loading');
        img.loading = 'eager';
      }
      try {
        img.fetchPriority = 'high';
      } catch {
        // Ignore if read-only in older browsers
      }

      const src = img.currentSrc || img.getAttribute('src') || '';
      if (!src) {
        trackedImages.set(img, true);
        recomputeAssetStatus();
        return;
      }

      // If already complete with valid dimensions (or broken with complete=true after fetch), decode & mark done
      if (img.complete && img.naturalWidth > 0) {
        decodeAndMarkImageDone(img);
        return;
      }

      // Also warm via an active in-memory Image object in case the DOM node is inside a scroll container
      const preloader = new Image();
      preloader.decoding = 'async';

      let settled = false;
      const onSettled = () => {
        if (settled) return;
        settled = true;
        img.removeEventListener('load', onSettled);
        img.removeEventListener('error', onSettled);
        preloader.onload = null;
        preloader.onerror = null;
        decodeAndMarkImageDone(img);
      };

      img.addEventListener('load', onSettled, { once: true });
      img.addEventListener('error', onSettled, { once: true });
      preloader.onload = () => {
        if (img.complete) onSettled();
      };
      preloader.onerror = () => {
        onSettled();
      };
      preloader.src = src;

      // Re-check in case it completed synchronously upon setting src
      if (img.complete && img.naturalWidth > 0) {
        onSettled();
      }

      cleanups.push(() => {
        img.removeEventListener('load', onSettled);
        img.removeEventListener('error', onSettled);
        preloader.onload = null;
        preloader.onerror = null;
      });
    };

    const trackBackgroundUrl = (url: string) => {
      if (!url || url.startsWith('data:') || trackedBgUrls.has(url)) return;
      trackedBgUrls.set(url, false);
      const bgImg = new Image();
      bgImg.decoding = 'async';
      const done = () => {
        if (typeof bgImg.decode === 'function') {
          bgImg
            .decode()
            .catch(() => {})
            .finally(() => {
              trackedBgUrls.set(url, true);
              recomputeAssetStatus();
            });
        } else {
          trackedBgUrls.set(url, true);
          recomputeAssetStatus();
        }
      };
      bgImg.onload = done;
      bgImg.onerror = () => {
        trackedBgUrls.set(url, true);
        recomputeAssetStatus();
      };
      bgImg.src = url;
      if (bgImg.complete && bgImg.naturalWidth > 0) {
        done();
      }
      cleanups.push(() => {
        bgImg.onload = null;
        bgImg.onerror = null;
      });
    };

    const registerMediaNodes = () => {
      const stage = document.querySelector(targetSelector) || document.body;

      // Scan all <img> nodes in the target page
      const imgs = Array.from(stage.querySelectorAll('img'));
      for (const img of imgs) {
        trackSingleImage(img);
      }

      // Scan inline style background-image URLs
      const bgEls = Array.from(stage.querySelectorAll<HTMLElement>('[style*="url("]'));
      for (const el of bgEls) {
        const bg = el.style.backgroundImage || '';
        const matches = bg.matchAll(/url\(['"]?([^'")]+)['"]?\)/g);
        for (const m of matches) {
          if (m[1]) trackBackgroundUrl(m[1]);
        }
      }

      // Scan all <video> nodes in the target page
      const videos = Array.from(stage.querySelectorAll('video'));
      for (const video of videos) {
        if (trackedVideos.has(video)) continue;
        if (video.readyState >= 2) {
          trackedVideos.set(video, true);
        } else {
          trackedVideos.set(video, false);
          const onVideoReady = () => {
            video.removeEventListener('loadeddata', onVideoReady);
            video.removeEventListener('canplay', onVideoReady);
            video.removeEventListener('error', onVideoReady);
            trackedVideos.set(video, true);
            recomputeAssetStatus();
          };
          video.addEventListener('loadeddata', onVideoReady, { once: true });
          video.addEventListener('canplay', onVideoReady, { once: true });
          video.addEventListener('error', onVideoReady, { once: true });
          cleanups.push(() => {
            video.removeEventListener('loadeddata', onVideoReady);
            video.removeEventListener('canplay', onVideoReady);
            video.removeEventListener('error', onVideoReady);
          });
        }
      }

      recomputeAssetStatus();
    };

    // Initial scan + MutationObserver for newly mounted child elements or src changes
    registerMediaNodes();
    const stageEl = document.querySelector(targetSelector) || document.body;
    const observer = new MutationObserver(() => {
      registerMediaNodes();
    });
    observer.observe(stageEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });

    // Allow 1 animation frame + 20ms for React child trees & effects to mount all media elements
    const settleTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        registerMediaNodes();
        domSettled = true;
        recomputeAssetStatus();
      });
    }, 20);

    // 3. Smooth 60fps Wave Progress Controller synchronized with real asset readiness
    let visualProgress = 0;
    let rafId: number;

    const tick = (now: number) => {
      if (!mounted.current || completed.current) return;

      const elapsed = now - startTime;
      const timeRatio = Math.min(1, elapsed / minDuration);
      recomputeAssetStatus();

      // Target progress combines timeRatio and real assetLoadedRatio
      // If assets are still loading, hold max visual progress at 0.88 until all assets complete
      let targetProgress: number;
      if (assetsAllReady && timeRatio >= 1) {
        targetProgress = 1;
      } else if (assetsAllReady) {
        targetProgress = timeRatio * 0.97;
      } else {
        const blended = timeRatio * 0.35 + assetLoadedRatio * 0.53;
        targetProgress = Math.min(0.88, blended);
      }

      // Smoothly interpolate visualProgress toward targetProgress
      const speed = targetProgress >= 1 ? 0.38 : 0.22;
      visualProgress += (targetProgress - visualProgress) * speed;
      if (targetProgress >= 1 && visualProgress > 0.97) {
        visualProgress = 1;
      }

      // Map visualProgress [0..1] to wave translateX [-192px .. +14px]
      const translateX = -192 + visualProgress * 206;
      if (waveAdvanceRef.current) {
        waveAdvanceRef.current.style.transform = `translateX(${translateX.toFixed(2)}px)`;
      }

      if (visualProgress >= 1 && assetsAllReady && timeRatio >= 1) {
        // Wait 1 extra paint frame after all images have decoded so the underlying layer is rasterized
        paintFramesAfterReady += 1;
        if (paintFramesAfterReady >= 1) {
          finish();
          return;
        }
      } else if (elapsed >= maxSafetyTimeout) {
        finish();
        return;
      } else {
        paintFramesAfterReady = 0;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      mounted.current = false;
      cancelAnimationFrame(rafId);
      clearTimeout(settleTimer);
      observer.disconnect();
      cleanups.forEach((fn) => fn());
      if (finishTimer.current !== null) clearTimeout(finishTimer.current);
      if (previousFocus && previousFocus !== document.body && previousFocus.isConnected) {
        queueMicrotask(() => {
          if (!previousFocus.closest('[inert]')) {
            previousFocus.focus({ preventScroll: true });
          }
        });
      }
    };
  }, [duration, finish, targetSelector]);

  return (
    <div
      ref={rootRef}
      id="app-loading-screen"
      className="brand-loader"
      data-finishing={finishing ? 'true' : 'false'}
      tabIndex={-1}
      aria-label="FRESH FOOD 小程序页面加载中"
      onClick={() => {
        if (canSkip) finish();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && canSkip) finish();
        if (event.key === 'Tab') {
          event.preventDefault();
          (skipRef.current ?? rootRef.current)?.focus({ preventScroll: true });
        }
      }}
    >
      {/* 背景色块流动层（2026-10-23）：三块低透明青柠/柠檬黄光斑在浅芽绿底上缓慢漂移，
          让纯静止的渐变背景有「一点点颜色流动」。纯装饰，pointer-events-none。
          ⚠️ 调色/调速只改 src/index.css 的 .brand-loader__aurora 段（颜色、大小、周期都有注释），
          改坏了回滚：cp scripts/backup-loading-2026-10-23/{LoadingScreen.tsx,index.css} 回 src。 */}
      <div className="brand-loader__aurora" aria-hidden="true">
        <span className="brand-loader__blob brand-loader__blob--a" />
        <span className="brand-loader__blob brand-loader__blob--b" />
        <span className="brand-loader__blob brand-loader__blob--c" />
      </div>

      {/* 右上角极简跳过 */}
      {canSkip && (
        <header className="brand-loader__header">
          <button
            ref={skipRef}
            type="button"
            className="brand-loader__skip"
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
            disabled={finishing}
          >
            跳过
          </button>
        </header>
      )}

      {/* 核心视觉：FRESH FOOD 皇冠 Logo + 黑描边黄绿渐变从左向右海浪胶囊加载条 */}
      <div className="brand-loader__main">
        <div className="brand-loader__logo-stage">
          <FreshFoodLogo className="brand-loader__logo-svg" />
        </div>

        {/* 黑描边黄绿渐变海浪波动胶囊加载条（方向严格从左到右，进度实时联动页面资源加载状态） */}
        <div className="brand-loader__wave-capsule" aria-hidden="true">
          <svg
            className="brand-loader__wave-svg"
            viewBox="0 0 208 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* 胶囊内腔圆角裁剪区 */}
              <clipPath id="brand-wave-capsule-clip">
                <rect x="6" y="6" width="196" height="22" rx="11" />
              </clipPath>

              {/* 主体黄绿水平渐变（左：明亮柠檬黄 → 中：活力青柠 → 右：鲜翠嫩绿） */}
              <linearGradient
                id="brand-wave-grad-main"
                x1="6"
                y1="17"
                x2="202"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#FFF220" />
                <stop offset="38%" stopColor="#D2F416" />
                <stop offset="74%" stopColor="#7EE41E" />
                <stop offset="100%" stopColor="#24C946" />
              </linearGradient>

              {/* 次层浪头黄绿渐变 */}
              <linearGradient
                id="brand-wave-grad-sub"
                x1="6"
                y1="17"
                x2="202"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#FFE014" />
                <stop offset="50%" stopColor="#A2E614" />
                <stop offset="100%" stopColor="#1AB442" />
              </linearGradient>

              {/* 内部从左向右流动的高光波浪纹渐变 */}
              <linearGradient
                id="brand-wave-grad-ribbon"
                x1="6"
                y1="17"
                x2="202"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#FFF852" stopOpacity="0.75" />
                <stop offset="50%" stopColor="#DCFA32" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#5EE85C" stopOpacity="0.55" />
              </linearGradient>
            </defs>

            {/* 底层：模切白边外衬 */}
            <rect
              x="2.5"
              y="2.5"
              width="203"
              height="30.5"
              rx="15.25"
              fill="#FFFFFF"
              stroke="#FFFFFF"
              strokeWidth="4.5"
            />
            {/* 立体加厚黑底偏移外框 */}
            <rect
              x="5"
              y="6.5"
              width="198"
              height="24"
              rx="12"
              fill="#000000"
              stroke="#000000"
              strokeWidth="5.5"
            />

            {/* 胶囊纯白内底槽 */}
            <rect
              x="6"
              y="6"
              width="196"
              height="22"
              rx="11"
              fill="#FFFFFF"
            />

            {/* 裁剪在胶囊内腔、严格从左向右奔涌推进的黄绿渐变海浪 */}
            <g clipPath="url(#brand-wave-capsule-clip)">
              {/* 随真实资源加载进度从左端 (-192px) 向右端 (+14px) 推进的海浪容器 */}
              <g
                ref={waveAdvanceRef}
                style={{ transform: 'translateX(-192px)' }}
              >
                {/* 1. 右端前锋次级浪头（朝右翻涌的双重正弦浪锋，营造前浪推后浪层次） */}
                <path
                  className="brand-loader__front-crest brand-loader__front-crest--back"
                  d="M -220 -24
                     L 202 -24
                     Q 211 -18, 202 -12 T 202 0 T 202 12 T 202 24 T 202 36 T 202 48 T 202 60
                     L -220 60 Z"
                  fill="url(#brand-wave-grad-sub)"
                  opacity="0.82"
                />

                {/* 2. 右端前锋主海浪（满高填满左侧，右侧浪头朝右起伏推进，纯净黄绿流光无内部黑边） */}
                <path
                  className="brand-loader__front-crest brand-loader__front-crest--main"
                  d="M -220 -24
                     L 195 -24
                     Q 205 -18, 195 -12 T 195 0 T 195 12 T 195 24 T 195 36 T 195 48 T 195 60
                     L -220 60 Z"
                  fill="url(#brand-wave-grad-main)"
                />

                {/* 3. 条体内部从左向右（+X）持续奔涌的黄绿流光海浪波纹 */}
                <path
                  className="brand-loader__wave-layer brand-loader__wave-layer--front"
                  d="M -224 16
                     Q -210 9, -196 16 T -168 16 T -140 16 T -112 16 T -84 16 T -56 16 T -28 16 T 0 16
                     T 28 16 T 56 16 T 84 16 T 112 16 T 140 16 T 168 16 T 196 16
                     L 196 34 L -224 34 Z"
                  fill="url(#brand-wave-grad-ribbon)"
                />
              </g>

              {/* 胶囊顶部高光玻璃反光条 */}
              <rect
                x="16"
                y="9"
                width="176"
                height="2.2"
                rx="1.1"
                fill="#FFFFFF"
                fillOpacity="0.65"
              />
            </g>

            {/* 顶层：加粗纯黑胶囊描边外框 */}
            <rect
              x="5"
              y="5"
              width="198"
              height="24"
              rx="12"
              stroke="#000000"
              strokeWidth="5.5"
            />
          </svg>
        </div>

        {/* 无障碍状态读屏 */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          <h1>FRESH FOOD</h1>
          <p>{finishing ? '加载完成' : '正在加载页面资源'}</p>
        </div>
      </div>
    </div>
  );
};
