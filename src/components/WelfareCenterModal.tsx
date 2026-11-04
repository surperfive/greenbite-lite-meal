import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useShellBox } from './StickerModal';
import './welfare-center.css';

/* ============================================================================
   福利中心弹窗
   ----------------------------------------------------------------------------
   2026-11-03 用户「福利中心的弹窗换成这个」：整张换成他给的 540×695 单页稿
   （原图 -4.1° 倾角 + 3D 荧光绿礼盒 + 凹槽胶囊列表 + 通栏 CTA）。

   ⚠️ 和站内其它 5 个弹窗（StickerModal）**视觉体系不同**：那套是 20px 圆角白卡、
      -1.6° 倾斜、贴纸徽章；这套是 40px 圆角、-4.1°、3D 渲染。所以没有复用
      StickerModal，而是单独一个组件 —— 硬塞进去会两边都变形。
   ⚠️ 内部坐标全部是 540×695 画布里的绝对定位，适配壳宽只靠外层 `--wf-s` 等比缩放。
      想改某个元素的位置，先确认它周围两个绝对定位元素（标题 / 礼盒）会不会跟着撞。

   2026-11-03 相对原稿的改动（仅三处，均为站内一致性，不改构图）：
   ① 去掉右上角「原图倾角 / 重置领取状态」工具条 —— 那是原稿的调试脚手架，不是设计的一部分。
   ② 关掉 `body` 的背景与居中（原稿是独立页面，这里是弹窗，背景由蒙层负责）。
   ③ 三个按钮接上真实动作：领取 = 记一笔；前往/省心 = 关弹窗跳点餐；CTA = 全部领取。

   2026-11-04 00:12 用户「这个窗口的配色参考小程序的那三个主要配色，适当进行搭配」：
   原稿自带一套**偏黄的荧光绿**（#C2FF05 / #B8FF01 / #C6FF08 / #BFFF04 —— HSL 约
   h75° s100% l51%）外加**金色皇冠**和**黄色尖角**，跟站内的品牌青柠
   （#C7F665，h79° s89% l68%）不是一个东西，并排放就是"两套绿"。
   已全量收进品牌三色，规则如下，**改这个弹窗时照着来，别再引新色**：

     · 青柠 `--lime-400 #C7F665` = 面 / 填充 / 主行动
       （礼盒、涂鸦、票面、日历、皇冠主体、领取钮、底部 CTA）
       `--lime-500 #B7EF4B` 次面 / 下缘，`--lime-700 #54801A` 深线，
       `--lime-100 #E4F8BC` 高光。礼盒 3D 需要更多明暗档，用的是同一色相的
       推导档（#DCFA9C/#D3F97E/#B0E24A/#9CCB3C/#93BE2E/#6E9420…），
       只服务这一张插画，不进 UI 调色板。
     · 黑 `#080907` = 描边 / 文字 / 硬投影（原稿本来就对，未动）
     · 玫红 `#FC5294` = **价值强调**，只出现在三处、且都在浅底上：
       券左上角两道尖角、皇冠的三颗珠、日历里的「8.8折」数字。
       ⚠️ 玫红对 #C7F665 只有 2.47:1，**绝不能直接压在青柠面上**；
          要放玫红就得先给它一块白底（对白 3.10:1，和商品价格同档）。
   ========================================================================== */

interface WelfareCenterModalProps {
  onClose: () => void;
  /** 外部持有的「已全部领取」状态（首页那张卡要用它决定文案） */
  claimed: boolean;
  onClaimAll: () => void;
  onGoMenu: () => void;
}

/* ⛔ 左上角的青柠礼盒贴纸徽章（BadgeGiftIcon + .wf-badge-wrap / -sticker / .wf-badge）
   已于 2026-11-03 20:58 按用户「福利中心去掉这一块」整块删除，组件与 CSS 一并清掉。
   它原本是 `top:-46px; left:8px` 跨在卡片左上边框外的一枚 112×98 贴纸，
   和站内 StickerModal 的徽章语言同源；但这套弹窗本身是 40px 圆角 + -4.1° 的
   3D 海报风，右上角已经有一个 3D 大礼盒，左上再挂一枚扁平贴纸确实重复。
   ⚠️ 删掉后**标题位置不动**：`.wf-title-group` 是 `top:40px` 的绝对定位，
      不依赖徽章撑高，左上角空出的那 36px 是标题白描边的呼吸区，不是漏排。 */

/* ── 「福利中心」超大粗黑标题 + 荧光绿涂鸦横条（整块是 SVG） ────────── */
/* ⚠️ 2026-11-03 21:20 标题改成右对齐后，荧光涂鸦的右端（原到 svg x=296/308）
   会从卡片右边**戳出去**约 16px 并盖住黑色边框 —— 因为涂鸦比文字右缘还长 23。
   已按「跟着文字收尾」缩短：白 path 296→268、绿主条 244→214、细尾巴 292→266，
   现在涂鸦右端停在文字右缘 +4，留在卡内约 10px。别再加长回去。 */
const TitleArt = () => (
  <svg width="335" height="145" viewBox="0 0 335 145" fill="none" style={{ overflow: 'visible' }}>
    {/* ⚠️ 2026-11-03 21:30 用户「取消掉福利中心的投影效果」：
        原来这里有一个 `<filter id="wfTitleShadow">`（feDropShadow dy=4 / stdDeviation 3.5 /
        黑 10%），挂在包住「文字白描边 + 涂鸦」的 <g> 上 —— 效果是标题和荧光条下方各拖一条
        淡灰影。删掉后标题组是纯平的贴纸，压在卡片上靠白描边本身分层，不再有浮起感。
        ⛔ 别用 `filter: drop-shadow(...)` 从 CSS 加回来，那会连 svg 的 overflow:visible
           区域一起投影，边缘会多出一圈方角灰边。 */}
    <g>
      <text
        x="14"
        y="76"
        fontFamily="'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
        fontWeight="900"
        fontSize="68"
        letterSpacing="-2"
        transform="skewX(-5)"
        stroke="#FFFFFF"
        strokeWidth="20"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="#FFFFFF"
      >
        福利中心
      </text>
      <path
        d="M40 96 L268 93 C284 93 288 118 268 119 L62 121 Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="14"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>

    <g>
      <rect x="64" y="88" width="214" height="22" rx="11" transform="rotate(-0.8 186 99)" fill="#C7F665" />
      <rect x="40" y="96" width="140" height="7" rx="3.5" transform="rotate(-1.2 110 99)" fill="#C7F665" />
      <rect x="60" y="106" width="128" height="6.5" rx="3.25" transform="rotate(-1 124 109)" fill="#C7F665" />
      <path d="M225 108 H266 C271 108 272 113 266 113.5 L218 114 Z" fill="#C7F665" />
    </g>

    {/* ⚠️ 2026-11-03 21:08 用户「去除福利中心这四个字的黑描边」：
        原来这一层是 `stroke="#090B08" strokeWidth="3.2"` + 同色 fill，等于拿
        **居中描边**给字形外扩 1.6px 当伪加粗 —— 68px 的粗黑体本来就到 900 了，
        再加这圈只会把笔画边缘（尤其 skewX(-5) 之后的斜边）糊出不规则毛刺。
        删掉后字重完全由字体本身的 font-black 决定，边缘干净锐利；
        下面那层白色 stroke 20 是贴纸白边，**不动**。
        ⚠️ 别用 `-webkit-text-stroke` 或 text-shadow 来找回「更粗」的错觉 ——
           前者是居中描边会吃掉字形内部，后者在倾斜 + 非整数缩放下长锯齿。 */}
    <text
      x="14"
      y="76"
      fontFamily="'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
      fontWeight="900"
      fontSize="68"
      letterSpacing="-2"
      transform="skewX(-5)"
      fill="#090B08"
    >
      福利中心
    </text>
  </svg>
);

/* ── 右上角 3D 荧光绿礼盒（原稿的 SVG 光影建模，逐路径照搬） ────────── */
/* ⚠️ 2026-11-03 21:12 用户「礼物盒水平翻转一下，并且放到右边，文字放到左边」：
   ① 尺寸从写死的 222×220 改成 100%×100% —— 原来 svg 比容器（.wf-gift 210×206）还宽，
      会从容器右边溢出去 12px，导致「容器右移多少」和「礼盒实际在哪」对不上。
      现在礼盒严格等于容器大小，位置全由 .wf-gift 的 right 决定。
   ② 水平翻转（scaleX(-1)）**不写在这里**，而是并进 `.wf-gift` 的 `wfFloatBox` 关键帧 ——
      容器上已经有 `animation`，外部再写 transform 会被动画整帧覆盖掉。
      翻转后 `feDropShadow dx=2` 会变成向左投影，与卡片左下硬投影同向，反而更统一。 */
const GiftBox3D = () => (
  <svg width="100%" height="100%" viewBox="0 0 230 225" fill="none" style={{ overflow: 'visible' }}>
    <defs>
      <filter id="wfBoxShadow" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="2" dy="10" stdDeviation="6" floodColor="#141e00" floodOpacity="0.32" />
      </filter>
      <linearGradient id="wfBoxFront" x1="40" y1="75" x2="135" y2="195" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#DCFA9C" />
        <stop offset="25%" stopColor="#C7F665" />
        <stop offset="80%" stopColor="#B0E24A" />
        <stop offset="100%" stopColor="#93BE2E" />
      </linearGradient>
      <linearGradient id="wfBoxSide" x1="125" y1="85" x2="198" y2="195" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#B7EF4B" />
        <stop offset="45%" stopColor="#96C43A" />
        <stop offset="100%" stopColor="#6E9420" />
      </linearGradient>
      <linearGradient id="wfLidFront" x1="35" y1="45" x2="155" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E8FBC4" />
        <stop offset="22%" stopColor="#D3F97E" />
        <stop offset="70%" stopColor="#C7F665" />
        <stop offset="100%" stopColor="#A9D94A" />
      </linearGradient>
      <linearGradient id="wfLidSide" x1="145" y1="65" x2="212" y2="118" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C9F470" />
        <stop offset="50%" stopColor="#9CCB3C" />
        <stop offset="100%" stopColor="#749E1E" />
      </linearGradient>
      <linearGradient id="wfRibbon" x1="75" y1="55" x2="118" y2="190" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#555a52" />
        <stop offset="14%" stopColor="#1e201d" />
        <stop offset="55%" stopColor="#090a08" />
        <stop offset="88%" stopColor="#262925" />
        <stop offset="100%" stopColor="#0d0e0c" />
      </linearGradient>
      <linearGradient id="wfBowLeft" x1="55" y1="10" x2="125" y2="62" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#626760" />
        <stop offset="22%" stopColor="#151714" />
        <stop offset="70%" stopColor="#060706" />
        <stop offset="100%" stopColor="#2c302b" />
      </linearGradient>
      <linearGradient id="wfBowRight" x1="125" y1="22" x2="198" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6d726b" />
        <stop offset="28%" stopColor="#181a17" />
        <stop offset="75%" stopColor="#070807" />
        <stop offset="100%" stopColor="#3a3f38" />
      </linearGradient>
      <filter id="wfSoftSpec" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
      <filter id="wfGlowStar" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.8" />
      </filter>
    </defs>

    <ellipse
      cx="116"
      cy="188"
      rx="76"
      ry="18"
      transform="rotate(14 116 188)"
      fill="rgba(0,0,0,0.22)"
      filter="url(#wfSoftSpec)"
    />

    <g filter="url(#wfBoxShadow)">
      <g>
        <path
          d="M122 52 C110 22, 74 2, 58 18 C44 32, 64 56, 114 56 Z"
          fill="url(#wfBowLeft)"
          stroke="#070807"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M114 48 C102 28, 76 16, 68 25 C61 33, 76 46, 110 50 Z" fill="#050605" />
        <path
          d="M115 44 C104 24, 78 11, 63 20"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        <path
          d="M128 55 C154 28, 192 22, 200 42 C206 58, 178 78, 130 62 Z"
          fill="url(#wfBowRight)"
          stroke="#070807"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M136 55 C156 36, 184 32, 188 44 C191 53, 170 64, 136 58 Z" fill="#050605" />
        <path
          d="M136 49 C158 30, 186 27, 195 39"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        <rect
          x="112"
          y="42"
          width="24"
          height="20"
          rx="7"
          transform="rotate(15 124 52)"
          fill="url(#wfRibbon)"
          stroke="#070807"
          strokeWidth="3"
        />
        <path d="M117 45 L131 49" stroke="rgba(255,255,255,0.65)" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      <g>
        <path
          d="M36 92 L134 114 L192 128 L168 198 C166 204 160 206 153 205 L108 196 L32 174 C25 172 22 166 24 159 L36 92 Z"
          fill="#080907"
          stroke="#080907"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path
          d="M38 94 L134 116 L112 195 L32 172 C27 170 25 166 27 160 L38 94 Z"
          fill="url(#wfBoxFront)"
        />
        <path
          d="M134 116 L190 130 L167 196 C165 201 161 203 155 202 L112 195 L134 116 Z"
          fill="url(#wfBoxSide)"
        />
        <path d="M36 95 L134 117 L189 131 L185 143 L131 129 L34 106 Z" fill="rgba(45, 78, 0, 0.35)" />
        <path
          d="M133 118 L111 193"
          stroke="rgba(228, 248, 188, 0.85)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#wfSoftSpec)"
        />
        <path
          d="M74 98 L108 106 L88 189 L54 180 Z"
          fill="url(#wfRibbon)"
          stroke="#070807"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="77" y1="102" x2="58" y2="177" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
        <path
          d="M158 120 L177 125 L154 201 L134 198 Z"
          fill="url(#wfRibbon)"
          stroke="#070807"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="161" y1="124" x2="138" y2="195" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" />
      </g>

      <g>
        <path
          d="M38 49 C40 42 47 39 55 41 L150 65 L204 82 C211 84 214 90 211 97 L199 126 C197 131 192 133 186 131 L134 116 L30 91 C24 89 22 84 24 78 L38 49 Z"
          fill="#080907"
          stroke="#080907"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        <path
          d="M40 50 C42 44 48 42 55 44 L148 67 L135 115 L31 89 C26 88 25 84 27 79 L40 50 Z"
          fill="url(#wfLidFront)"
        />
        <path
          d="M148 67 L202 84 C208 86 210 90 208 96 L197 124 C195 128 192 129 187 128 L135 115 L148 67 Z"
          fill="url(#wfLidSide)"
        />
        <path
          d="M44 47 L146 72 L202 89"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.88"
          filter="url(#wfSoftSpec)"
        />
        <path
          d="M32 78 L43 50 C45 46 50 45 56 46 L90 55"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
          filter="url(#wfSoftSpec)"
        />
        <ellipse
          cx="144"
          cy="76"
          rx="7"
          ry="14"
          transform="rotate(15 144 76)"
          fill="#FFFFFF"
          opacity="0.75"
          filter="url(#wfSoftSpec)"
        />
        <path
          d="M84 48 L120 57 L107 109 L71 100 Z"
          fill="url(#wfRibbon)"
          stroke="#070807"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M88 52 L116 59 L113 68 L85 61 Z"
          fill="rgba(255,255,255,0.42)"
          filter="url(#wfSoftSpec)"
        />
        <line x1="88" y1="53" x2="75" y2="97" stroke="rgba(255,255,255,0.35)" strokeWidth="2.2" strokeLinecap="round" />
        <path
          d="M168 71 L188 78 L175 126 L155 121 Z"
          fill="url(#wfRibbon)"
          stroke="#070807"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M170 74 L185 79 L182 87 L167 82 Z" fill="rgba(255,255,255,0.35)" filter="url(#wfSoftSpec)" />
      </g>

      <g transform="translate(182, 14)">
        <ellipse
          cx="16"
          cy="22"
          rx="18"
          ry="8"
          transform="rotate(-12 16 22)"
          fill="#FFFFFF"
          opacity="0.85"
          filter="url(#wfSoftSpec)"
        />
        <path
          d="M18 0 C19.5 13 24 18 36 20 C24 22 19.5 27 18 42 C16.5 27 12 22 0 20 C12 18 16.5 13 18 0 Z"
          fill="#FFFFFF"
          filter="url(#wfGlowStar)"
        />
      </g>
    </g>
  </svg>
);

/* ── 三项权益的图标 ─────────────────────────────────────────────────── */
/* 图标 SVG 的 width/height 一律按 **64 高** 等比给（viewBox 是 94/90/92 × 74）。
   2026-11-03 收缩时先写成 68 高、而图标盒只有 64 —— 皇冠底座的绿条直接压到
   胶囊下边框上。高度必须 ≤ 图标盒高度。 */
/* ── 三枚权益图标：2026-11-04 01:15 改成**位图素材**（不再手绘 SVG）──────────
   沿革：原稿 3D（投影+白晕+星芒，脏）→ 00:21 压扁平 → 01:06 手绘 3D 光泽版
        → 01:15 用户「将这个图做裁剪替换原来的svg」：直接裁他给的 1536×1024 白底图。
   素材：`public/welfare-icons/ic-{ticket,calendar,crown}.png`
        （174px 高 = 显示 58 CSS 的 3 倍图；透明底；由 `scripts/split-welfare-icons.py`
         生成，改素材图后重跑脚本即可）
   ⚠️ 三张是**同一个白底图裁出来的**，alpha 按各自连通域生成（不是矩形套）——
      皇冠的 bbox 会和上面两枚的底边重叠，套矩形会切进邻居的边。
   ⚠️ 高度统一 58（`.wf-ic-img`），靠 `width:auto` 各走各的长宽比：
      票 72 / 日历 64 / 皇冠 78，都在 84 宽的 `wf-icon-box` 里。
      想整体放大先确认皇冠（最宽的那张）不顶到右边文字列。
   ⛔ 别再用 `<svg>` 重画这三枚 —— 手绘那版的光泽和参考图差得远，这是用户明确要求的替换。 */

const CouponIcon = () => (
  <img src="/welfare-icons/ic-ticket.png" alt="" className="wf-ic-img" draggable={false} />
);

const DiscountCalendarIcon = () => (
  <img src="/welfare-icons/ic-calendar.png" alt="" className="wf-ic-img" draggable={false} />
);

const CrownIcon = () => (
  <img src="/welfare-icons/ic-crown.png" alt="" className="wf-ic-img" draggable={false} />
);

const CtaGiftIcon = () => (
  <svg width="31" height="31" viewBox="0 0 34 34" fill="none">
    <path
      d="M17 9.5C14.2 4.2 7.5 4.8 8.2 9.2C8.6 11.8 13.2 11.2 17 11.2"
      stroke="#080907"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 9.5C19.8 4.2 26.5 4.8 25.8 9.2C25.4 11.8 20.8 11.2 17 11.2"
      stroke="#080907"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="4.5" y="11.5" width="10.5" height="6" rx="2" fill="#080907" />
    <rect x="19" y="11.5" width="10.5" height="6" rx="2" fill="#080907" />
    <path d="M6.5 20H15V30H9.5C7.8 30 6.5 28.7 6.5 27V20Z" fill="#080907" />
    <path d="M19 20H27.5V27C27.5 28.7 26.2 30 24.5 30H19V20Z" fill="#080907" />
  </svg>
);

/* 右下角黑白棋盘格彩带 `RacingRibbon` 于 2026-11-03 随青柠底板一起删除
   （它画在底板右上角之外，底板撤掉后就是一条悬空的彩带）。 */

export const WelfareCenterModal: React.FC<WelfareCenterModalProps> = ({
  onClose,
  claimed,
  onClaimAll,
  onGoMenu,
}) => {
  const shellBox = useShellBox();
  const [item1Claimed, setItem1Claimed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Esc 关闭（与其它弹窗一致的手感）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* 等比缩放：画布 540×695，按壳宽/壳高取较小的那个比例。
     ⚠️ 不做 `@media (max-width:580px)` 那套 —— 弹窗要按**壳**算，不是按视口算
        （桌面视口 1280 时媒体查询不命中，会按 540 原尺寸撑爆 410 的壳）。 */
  const box = shellBox ?? { top: 0, left: 0, width: 390, height: 844 };
  const s = Math.min(Math.max(280, box.width - 28) / 540, Math.max(380, box.height - 40) / 695, 1);

  /* ⚠️ 只能看外部的 `claimed`。第一版写成 `claimed || item1Claimed`，
     结果点单个「领取」就把底部 CTA 也翻成「已全部收入券包 ✓」——
     领了一张 ≠ 领了三张，状态在撒谎。 */
  const allClaimed = claimed;

  return createPortal(
    <>
      {/* 2026-11-03 用户「撤回这次修改」：蒙层回到全站通用的 `bg-black/62 + backdrop-blur`。
          上一版改成不透明深色是我理解错了 —— 用户指的是白卡外面那圈**青柠底板**
          （见 .wf-stage / 装饰组那两处注释），不是这层蒙层。 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-black/62 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed z-50 flex items-center justify-center pointer-events-none"
        style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 330, damping: 26 }}
          className="pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="福利中心"
        >
          <div className="wf-scale" style={{ ['--wf-s' as string]: s } as React.CSSProperties}>
            <div className="wf-stage" id="welfare-center-stage">
              <div className={`wf-toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
                {toast ?? ''}
              </div>

              {/* 2026-11-03 用户圈出「这窗口外的这一层」：白卡外面那圈青柠底板上原本铺了
                  6 组装饰（棋盘格暗纹 / 礼盒环境光晕 / 左上黑色放射线 / 右上黄色放射线 /
                  左下黑色四角星 / 左右穿插弧线 / 右下棋盘格彩带）—— 它们全是画在那层
                  青柠上的，底板一撤，黑线条在深色蒙层上直接消失、黄色和彩带变成悬空噪点。
                  所以整组一起删，只留白卡 + 标题 / 礼盒。
                  ⛔ 想恢复的话必须连 `.wf-stage` 的渐变一起加回来，别只加装饰。 */}

              {/* 主卡片（-4.1°） */}
              <div className="wf-tilt">
                <div className="wf-board" />

                {/* 左上角青柠礼盒贴纸徽章 2026-11-03 已删（见文件头 BadgeGiftIcon 处的说明） */}

                <div className="wf-title-group">
                  <TitleArt />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -13, paddingLeft: 28, width: 280 }}>
                    <svg width="64" height="12" viewBox="0 0 64 12" fill="none" aria-hidden="true">
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
                    <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, #b8bdb3 0%, #dcdfd9 85%, transparent 100%)' }} />
                  </div>
                </div>

                <div className="wf-gift">
                  <GiftBox3D />
                </div>

                <button type="button" className="wf-close" onClick={onClose} aria-label="关闭" title="关闭">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2L12 12M12 2L2 12" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
                  </svg>
                </button>

                {/* 三项权益 */}
                <div className="wf-list">
                  <div className="wf-slot">
                    <div className="wf-left">
                      <div className="wf-icon-box">
                        <CouponIcon />
                      </div>
                      <div className="wf-text-col">
                        <div className="wf-title">全品类无门槛优惠券</div>
                        <div className="wf-sub">每日可用 · 限时领取</div>
                      </div>
                    </div>
                    <div className="wf-btn-socket">
                      <button
                        type="button"
                        className={`wf-btn ${item1Claimed ? 'wf-btn-white claimed' : 'wf-btn-lime'}`}
                        onClick={() => {
                          if (item1Claimed) return;
                          setItem1Claimed(true);
                          showToast('🎉 已成功领取至您的福利券包！');
                        }}
                        aria-disabled={item1Claimed}
                      >
                        {item1Claimed ? '已领' : '领取'}
                      </button>
                    </div>
                  </div>

                  <div className="wf-slot">
                    <div className="wf-left">
                      <div className="wf-icon-box">
                        <DiscountCalendarIcon />
                      </div>
                      <div className="wf-text-col">
                        <div className="wf-title">超值能量尊享折扣券</div>
                        <div className="wf-sub">精选好物 · 8.8折起</div>
                      </div>
                    </div>
                    <div className="wf-btn-socket">
                      <button
                        type="button"
                        className="wf-btn wf-btn-white"
                        onClick={() => {
                          showToast('✨ 已为您开启 8.8 折超值能量专区！');
                          setTimeout(onGoMenu, 700);
                        }}
                      >
                        前往
                      </button>
                    </div>
                  </div>

                  <div className="wf-slot">
                    <div className="wf-left">
                      <div className="wf-icon-box">
                        <CrownIcon />
                      </div>
                      <div className="wf-text-col">
                        <div className="wf-title">外卖安心免配送服务</div>
                        <div className="wf-sub">在线下单 · 免配送费</div>
                      </div>
                    </div>
                    <div className="wf-btn-socket">
                      <button
                        type="button"
                        className="wf-btn wf-btn-white"
                        onClick={() => showToast('🛵 外卖安心免配送权益已激活！')}
                      >
                        省心
                      </button>
                    </div>
                  </div>
                </div>

                {/* 底部主 CTA */}
                <div className="wf-cta-socket">
                  <button
                    type="button"
                    className="wf-cta"
                    onClick={() => {
                      if (allClaimed) {
                        onGoMenu();
                        return;
                      }
                      setItem1Claimed(true);
                      onClaimAll();
                      showToast('🎁 恭喜！3 项尊享权益已全部放入您的券包');
                    }}
                  >
                    <div className="wf-cta-center">
                      <CtaGiftIcon />
                      <span className="wf-cta-text">{allClaimed ? '已全部收入券包 ✓' : '一键全部领取到券包'}</span>
                    </div>
                    <div className="wf-cta-arrow">
                      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                        <path
                          d="M3.5 9H14.5M14.5 9L9.8 4.2M14.5 9L9.8 13.8"
                          stroke="#FFFFFF"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>,
    document.body
  );
};
