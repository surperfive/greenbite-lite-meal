/**
 * 抽卡币图标 —— **全站唯一形状来源**。
 *
 * 2026-10-26 用户：「规范一下抽卡币的图标，统一用一种形状」。
 * 之前同一枚「抽卡币」在不同位置画成了三种形状：
 *   · 页头 `#btn-header-tokens` 胶囊 —— lucide `Crown`（金色）
 *   · 弹窗状态胶囊「当前剩余 12 币」 —— lucide `Sparkles`（黑色）
 *   · 弹窗「每日签到」行 —— lucide `Crown`
 *   · 弹窗「好友助力」行 —— lucide `Sparkles`
 *   · 两个抽卡按钮的胶囊「1 抽卡币 / 9 抽卡币」 —— SVG `<use href="#ic-crown-*">`
 * 现在统一到**皇冠**：它就是大按钮里跟「N 抽卡币」并排的那枚（最明确的"图标=抽卡币"
 * 定义），lucide 的 Crown 轮廓也最接近，替换后页头/签到行几乎看不出差别。
 *
 * ⚠️ 路径必须与 GachaPage 里 `<defs>` 的 `#ic-crown-lime` / `#ic-crown-pale`
 * 逐字一致（`M-12,11 L-12,-6 L-6,0 L0,-11 L6,0 L12,-6 L12,11 Z`），
 * 那边是 SVG 画布坐标、这边是 HTML 图标，两边形状才真的是同一个。
 * 改这里要同步改那边（反之亦然）。
 *
 * ⚠️ viewBox 用正方形 `-12 -12 24 24`：皇冠墨迹是 **24×22**（上下各留 1 单位），
 * 所以 `h-3 w-3` 画出来是 12×11，不会因为非等比被拉扁。
 * ⚠️ 颜色一律走 `currentColor`：黑底上是品牌金 `#FDCF29`，青柠底上是 `#070906`。
 * ⚠️ 别用它代替装饰性闪光（3D 徽章、导航 tab、Banner 上的 Sparkles）——
 * 那些是"抽卡/魔法"的语义，不是货币。
 */
export default function TokenIcon({
  className = '',
  outline = false,
  strokeWidth = 2.6,
}: {
  className?: string;
  /** 描边（空心）版：只画轮廓，颜色同样走 currentColor。装饰用，别拿去当货币计数图标。 */
  outline?: boolean;
  /** 仅 outline 生效，单位是 viewBox 单位（28 宽），屏上像素 = strokeWidth × 尺寸/28 */
  strokeWidth?: number;
}) {
  // 实心版墨迹正好铺满 24×24（上下各留 1）；描边版要在四周再留出半个线宽，
  // 否则 stroke 会被 viewBox 裁掉 —— 所以描边版换用 28×28 的框（墨迹占 24/28）。
  const vb = outline ? '-14 -14 28 28' : '-12 -12 24 24';
  return (
    <svg
      viewBox={vb}
      className={`block shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M-12,11 L-12,-6 L-6,0 L0,-11 L6,0 L12,-6 L12,11 Z"
        fill={outline ? 'none' : 'currentColor'}
        {...(outline
          ? {
              stroke: 'currentColor',
              strokeWidth,
              strokeLinejoin: 'round' as const,
              strokeLinecap: 'round' as const,
            }
          : {})}
      />
    </svg>
  );
}
