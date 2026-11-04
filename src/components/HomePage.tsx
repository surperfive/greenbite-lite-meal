import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BannerSlider } from './BannerSlider';
import { MemberBar } from './MemberBar';
import { DishCoverArt } from './DishCoverArt';
import { DishTag } from './DishTag';
import { GiftMascotAnimation } from './GiftMascotAnimation';
import { HandshakeStitchIcon } from './HandshakeStitchIcon';
import { RedPacketFuIcon } from './RedPacketFuIcon';
import { WelfareCenterModal } from './WelfareCenterModal';
import { StickerModal, StickerButton, StickerPanel } from './StickerModal';
import { Dish, OrderMode, UserProfile } from '../types';
import {
  Bike,
  Store as StoreIcon,
  Gift,
  Sparkles,
  Plus,
  Flame,
  ChevronRight,
  Zap,
  ShoppingBag,
  LogIn,
  Crown,
  Users,
  Ticket,
  X,
  Check,
  Copy,
  Share2
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onSelectDish: (dish: Dish) => void;
  onAddToCart: (dish: Dish) => void;
  onSetMode: (mode: OrderMode) => void;
  popularDishes: Dish[];
  isLoggedIn: boolean;
  user?: UserProfile;
  onOpenLogin: () => void;
  onShowToast: (msg: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectDish,
  onAddToCart,
  onSetMode,
  popularDishes,
  isLoggedIn,
  user,
  onOpenLogin,
  onShowToast
}) => {
  // In-app Modal Popup States
  const [modalType, setModalType] = useState<'benefit' | 'invite' | 'redpacket' | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [benefitClaimed, setBenefitClaimed] = useState(false);
  const [redPacketClaimed, setRedPacketClaimed] = useState(false);

  const handleCopyInviteCode = () => {
    navigator.clipboard?.writeText('SLIM888');
    setCopiedCode(true);
    onShowToast('邀请口令 [SLIM888] 已复制到剪贴板！');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  /* 2026-11-03：提示交给新弹窗自己的 wf-toast 气泡，这里只落状态。
     再叠一层全局 Toast 会出现「一屏两个提示」，位置还不同。 */
  const handleClaimBenefits = () => {
    setBenefitClaimed(true);
  };

  const handleClaimRedPacket = () => {
    setRedPacketClaimed(true);
    onShowToast('恭喜！¥15 专属轻食立减金已存入券包');
  };
  return (
    /* 版面节奏对齐参考图（scripts/measure-home-ref*.py 实测）：
       参考图为 375×666 设备，本应用壳宽 410 → 缩放系数 1.093。
       左右边距 8.5 → 10px；板块间距 11 → 12px。
       ⚠️ 下面所有尺寸一律**不挂 sm:** —— 应用恒在 410px 手机壳里，
          sm: 看的是视口宽度，只会制造「桌面/窄窗两种观感」。 */
    <div className="space-y-3 pb-28">
      {/* Full-Bleed Top Header Banner - Completely visible without any component overlay */}
      <div className="w-full relative">
        <BannerSlider onBannerClick={() => onNavigate('menu')} />

        {/* 身份条（2026-10-27）：**骑在 hero 与内容区的交界线上** —— 上移半个卡高
            （36/2 = 18），卡片中心正好落在 hero 底边，海报与四宫格之间不再是一条
            灰底缝，而是被这张卡"缝"起来。
            ⚠️ **21 必须永远等于 MemberBar 高度的一半**（46 时代是 23、42 时代是 21、
               40 时代是 20、34 时代是 17、30 时代是 15、36 时代是 18、
               **现在 42 是 21**）。
               改那边高度这里不改 → 卡会整体浮起或沉下去，缝重新露出来。
            ⚠️ 负 margin 必须挂在这个容器上（它已经是 hero 容器的子元素，不再受
               `space-y-3` 的 12px 约束）；写在外层兄弟节点上会被 `space-y-3` 压回去。
            ⚠️ 三张 banner 全是 `isGraphicBanner`（整图海报、无 overlay 文案），
               所以压住 hero 底部 20px 不会盖住任何文字；**以后加带标题的 banner
               要把它内部的 `pb-6` 加大到 20 + 24，否则文字会被这张卡压住**。
            ⚠️ 高度仍别再加 —— 骑缝后净占 21px，hero 304 + 21 + 2×125 四宫格
               还把四张入口卡留在首屏。 */}
        <div className="relative z-10 -mt-[21px] px-3">
          <MemberBar
            isLoggedIn={isLoggedIn}
            user={user}
            onOpenLogin={onOpenLogin}
            onOpenProfile={() => onNavigate('me')}
          />
        </div>
      </div>

      {/* 4-Quadrant Entry 2x2 Distinct Cards - High-Fidelity Replication */}
      <div className="px-3">
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-2">
          {/* 1. Takeout Card */}
          <button
            onClick={() => {
              onSetMode("takeout");
              onNavigate("menu");
            }}
            className="group relative flex flex-col px-3.5 pt-2.5 pb-1 bg-white rounded-[22px] border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] transition-all duration-200 ease-out text-left min-h-[111px] overflow-hidden cursor-pointer active:scale-[0.98]"
            id="home-takeout-card"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-1">
                <span className="font-black text-slate-900 text-[22px] leading-none tracking-tight">
                  外卖配送
                </span>
                {/* 箭头改成「黑圆 + 青柠箭头」徽章 —— 参考图里不是裸 chevron，
                    是实心黑圆里的浅色箭头，直径约 15px（真实 px）。 */}
                <span className="w-[18px] h-[18px] rounded-full bg-black flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-3 h-3 stroke-[3.5] text-[#C7F665]" />
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-none font-medium">安心送达 · 准时保障</p>
            </div>

            {/* 左下角标签（2026-10-18 按参考图加）
                参考图口径（卡 287×205）：胶囊高 24px、底边距卡底 38px（≈18.5% 卡高），与标题左对齐。
                落到本卡 182×111：高 16（text-[9px] + py-1）、`bottom-[44px]`（距卡底 44px）。
                ⚠️ 2026-10-23 卡高 125 → 111（用户「降低这四个卡片的高度」），标签的 `bottom` 同步 52 → 44，
                   否则标签会跟着卡底一起上浮、贴住副标题（副标题下沿固定在 y≈42）。
                ⚠️ **2026-10-25 四卡标签统一成「黄绿黑白」二级结构**（用户：「标签改成黄绿黑白的
                   这些项目内的统一颜色进行重新配色」）。改前四张卡各说各话（两张黑底青柠字、
                   两张青柠底黑字、次标签全是 slate-600 灰）—— 灰是体系外色，且主标签一黑一绿
                   排成 2×2 时看不出归类，只像随手上的色。现在固定：
                     · 主标签（HOT/FRESH/WOW/FREE）**一律白底 + 品牌红**，四卡完全同构；
                     · 次标签**一律白底 + black/10 描边 + 黑 55% 字**，承担「说明」这一级，不用彩色；
                       （2026-10-25 01:29 从 75% 降到 55%：主标签改成米粉状的深金字后，8px 的
                        金字比 75% 黑字更「轻」，层级反而倒了；把说明降到 55% 才回到「主/次」。）
                     · 青柠退回箭头徽章，白/黑归结构与底。
                   四色各司其职，不再按卡片语义换色 —— 想恢复「每卡一色」看 `.backup/src-20261025-0058/`。
                ⚠️ **2026-10-25 01:29 二次改色：主标签「黑底金字」→「白底金字」**（用户：
                   「这几个黄黑搭配改成白黄搭配」）。⚠️ 不能直接 `bg-white` + `text-[#FDCF29]`——
                   对白只有 1.6:1，8px 上等于白纸。所以字走 `GOLD_TEXT`(#8A5F00，对白 5.6:1)，
                   「黄」由 **1px 金色内描边**承担。用 `shadow-[inset_0_0_0_1px_...]` 而不是 `border`：
                   border 会把胶囊撑高 2px，主/次两颗就不齐平了。
                🟥 **2026-11-03 10:46 用户「这可以那几个黄框适当的改成小程序红框」**：
                   金框+金字 → **红框 #FC5294 + 红字 #FC5294**，四张卡一起换。
                   · 为什么字也跟着红：金那版字必须压深（#8A5F00）是因为亮金对白只有 1.49:1、
                     不压深等于白纸；红 #FC5294 对白 3.10:1 本身就能读，不需要第二档深红。
                   · ⚠️ 别再引入深红字（如 #B83C6C）：index.css 已定「全站红只有 #FC5294 一个值」，
                     用户之前看到深色价格直接问「为什么是暗色」，明确否决过压暗版。
                     要补可读性就加字重/字号，别换深色。
                   · 3.10:1 对 9px 严格说不到 AA 4.5:1 —— 与价格同档，是"色号优先"的既有取舍。
                ⚠️ 现在主标签和次标签**都是白底**，层级全靠「红描边 + 红粗字」对「灰描边 + 灰黑字」。
                   把 `inset` 那段 shadow 删掉，两颗会糊成一颗 —— 不要删。
                ⚠️ 次标签是白底、本卡也是白底 → 必须靠 `border` + `shadow` 才浮得起来，不能只靠底色。
                   `py-[3px]` + 1px 描边 = 16px 高，与主标签（py-1、描边用 inset）等高，两颗才能齐平。
                ⚠️ 两颗胶囊加起来约 88px，插画左侧在 y 91~105 这带大约从 x 80 起 —— 会有约 20px 重叠。
                   参考图里刚好错开（它卡片更宽），本卡更窄只能压上去；胶囊 z-10 盖在插画上，读起来是「贴纸叠标签」。 */}
            <div className="absolute left-3.5 bottom-[44px] z-10 flex items-center gap-1">
              <span className="rounded-full bg-white px-1.5 py-1 text-[9px] font-black leading-none text-[#FC5294] shadow-[inset_0_0_0_1px_#FC5294,0_1px_2px_rgba(15,23,42,0.12)]">
                <span>HOT</span>
              </span>
              <span className="rounded-full bg-white border border-black/10 px-[5px] py-[3px] text-[9px] font-bold leading-none text-black/55 shadow-[0_1px_2px_rgba(15,23,42,0.10)]">
                <span className="pill-label">美食·饮品</span>
              </span>
            </div>

            {/* 插画（2026-10-18 换素材 + 按参考图重排版）
                参考图口径（卡 287×205）：插画贴右下角、**下沿故意溢出卡片**被 `overflow-hidden` 切掉，
                读起来是「贴纸压出边」。
                换算到本卡 182×111：
                  · 容器 `h-[62px] w-[94px]`、`bottom-1`（距卡底 4px，**不裁切**）
                  · ⚠️ **沿革（2026-10-23 一天内两版）**：卡高 125 → 111 后先试过把插画下溢
                    4/8px 让 `overflow-hidden` 切掉下沿（用户当时说「底部可以适当遮住一点插画」），
                    但三张真被切了之后用户立刻反悔 →「除了红包其他三个插画都向上移动到不被遮住」。
                    所以**外卖/自取/抽卡三张回到 `bottom-1` 完整显示，只有福利中心那张保留 `-bottom-2`**。
                    别再把这三张往 `-bottom-*` 改，除非用户又改主意。
                  · 代价：插画上沿会与副标题同一水平线（实测插画顶 45，副标题底 47 —— 垂直方向重叠 2px），
                    因为 x 方向错开（副标题文字右端 ≈x103，插画内容左缘 ≈x110）所以不撞字。
                    要留呼吸只能缩尺寸：62 → 54 才有 6px 余量，属于另一次取舍，别擅自改。
                  · 容器宽只是「够宽」，实际宽度由 `object-contain` 按素材比例决定，
                    所以四张卡共用一个尺寸也不会变形。
                实测四张素材的非白内容占画布：宽 77~89%、高 96%，
                所以 content 高度 ≈ 容器高，`object-right-bottom` 保证贴右下不被居中留白。
                ⚠️ **尺寸沿革（三次收小，别再来回试）**：92 → 80 → **62**。
                   92 时被左下角胶囊压住 13px（用户「至少不要被卡片标签挡住」）；
                   80 时刚好相切（胶囊右端 x≈97，外卖卡踏板车左缘 97）；
                   62 是用户「继续缩小」后再收一档，现在让出约 20px 余量。
                ⚠️ 上限约束是**左下角胶囊**，不是副标题：想放大得先改窄胶囊或把插画右移。
                ⚠️ 四张卡共用尺寸，别只缩其中一张 —— 会让两行插画大小不一致。
                三档对照图：`scripts/compare-entry-sizes.mjs 80 70 62` → `outputs/entry-compare/size-compare.png`。
                ⚠️ **描边粗细已归一化（2026-10-19）**：四张素材原描边占画面高 1.74%~3.12%，
                   加上 62/72 两档渲染高，落到屏幕上是 1.25~2.06px（1.65× 差），所以看着不齐。
                   `scripts/normalize-entry-stroke.mjs` 用膨胀/腐蚀把四张统一到 **1.52~1.65px（1.09×）**，
                   产物在 `public/entry-norm/*.png`（导出 4× 渲染高，约 120KB/张，和原 JPG 同量级）。
                   原图 `public/entry-*.jpg` 保留未动，要回退直接改回 `src` 即可。 */}
            <div className="absolute -right-1 bottom-1 h-[62px] w-[94px] z-0 pointer-events-none">
              <img
                src="/entry-norm/entry-takeout.png"
                alt="外卖配送"
                className="w-full h-full object-contain object-right-bottom pointer-events-none group-hover:scale-105 transition-transform"
               loading="lazy" decoding="async" />
            </div>
          </button>

          {/* 2. Pickup Card */}
          <button
            onClick={() => {
              onSetMode("pickup");
              onNavigate("menu");
            }}
            className="group relative flex flex-col px-3.5 pt-2.5 pb-1 bg-white rounded-[22px] border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] transition-all duration-200 ease-out text-left min-h-[111px] overflow-hidden cursor-pointer active:scale-[0.98]"
            id="home-pickup-card"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-1">
                <span className="font-black text-slate-900 text-[22px] leading-none tracking-tight">
                  到店自取
                </span>
                {/* 箭头改成「黑圆 + 青柠箭头」徽章 —— 参考图里不是裸 chevron，
                    是实心黑圆里的浅色箭头，直径约 15px（真实 px）。 */}
                <span className="w-[18px] h-[18px] rounded-full bg-black flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-3 h-3 stroke-[3.5] text-[#C7F665]" />
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-none font-medium">提前点单 · 到店即取</p>
            </div>

            {/* 左下角标签：口径同外卖卡（白底金字 FRESH + 白底描边「省时·方便」），四卡统一 */}
            <div className="absolute left-3.5 bottom-[44px] z-10 flex items-center gap-1">
              <span className="rounded-full bg-white px-1.5 py-1 text-[9px] font-black leading-none text-[#FC5294] shadow-[inset_0_0_0_1px_#FC5294,0_1px_2px_rgba(15,23,42,0.12)]">
                <span>FRESH</span>
              </span>
              <span className="rounded-full bg-white border border-black/10 px-[5px] py-[3px] text-[9px] font-bold leading-none text-black/55 shadow-[0_1px_2px_rgba(15,23,42,0.10)]">
                <span className="pill-label">省时·方便</span>
              </span>
            </div>

            {/* 插画：PICK UP 小店，口径同外卖配送卡（容器 94×62，贴右下、下溢 8px） */}
            <div className="absolute -right-1 bottom-1 h-[62px] w-[94px] z-0 pointer-events-none">
              <img
                src="/entry-norm/entry-pickup.png"
                alt="到店自取"
                className="w-full h-full object-contain object-right-bottom pointer-events-none group-hover:scale-105 transition-transform"
               loading="lazy" decoding="async" />
            </div>
          </button>

          {/* 3. Benefit Card */}
          <button
            onClick={() => setModalType("benefit")}
            className="group relative flex flex-col px-3.5 pt-2.5 pb-1 bg-white rounded-[22px] border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] transition-all duration-200 ease-out text-left min-h-[111px] overflow-hidden cursor-pointer active:scale-[0.98]"
            id="home-benefit-card"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-1">
                <span className="font-black text-slate-900 text-[22px] leading-none tracking-tight">
                  福利中心
                </span>
                {/* 箭头改成「黑圆 + 青柠箭头」徽章 —— 参考图里不是裸 chevron，
                    是实心黑圆里的浅色箭头，直径约 15px（真实 px）。 */}
                <span className="w-[18px] h-[18px] rounded-full bg-black flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-3 h-3 stroke-[3.5] text-[#C7F665]" />
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-none font-medium">点击唤醒 · 天天领红包</p>
            </div>

            {/* 左下角标签：口径同外卖卡（白底金字 WOW + 白底描边「超多福利」），四卡统一 */}
            <div className="absolute left-3.5 bottom-[44px] z-10 flex items-center gap-1">
              <span className="rounded-full bg-white px-1.5 py-1 text-[9px] font-black leading-none text-[#FC5294] shadow-[inset_0_0_0_1px_#FC5294,0_1px_2px_rgba(15,23,42,0.12)]">
                <span>WOW</span>
              </span>
              <span className="rounded-full bg-white border border-black/10 px-[5px] py-[3px] text-[9px] font-bold leading-none text-black/55 shadow-[0_1px_2px_rgba(15,23,42,0.10)]">
                <span className="pill-label">超多福利</span>
              </span>
            </div>

            {/* 插画：红包 + 铜钱。
                ⚠️ 原来是 `LoopingVideo`（/893.mp4 循环视频），这次换成静态图 —— 不再有动效。
                ⚠️ 尺寸比上面两张卡大（72 vs 62）：这张素材内容比例只有 1.08（很方），
                   同样的高度下**视觉宽度明显偏窄、看起来更小**，所以按「视觉等大」而不是「数值等大」给。
                   上限：插画上沿不能越过副标题（下沿 y=42）。卡高 111 + 下溢 8 时上沿 y=47，
                   只剩 5px 余量 —— 再往下探就把「¥」纸角压到字上了，所以 `-bottom-2` 到这里为止。 */}
            <div className="absolute -right-1 -bottom-2 h-[72px] w-[100px] z-0 pointer-events-none">
              <img
                src="/entry-norm/entry-benefit.png"
                alt="福利中心"
                className="w-full h-full object-contain object-right-bottom pointer-events-none group-hover:scale-105 transition-transform"
               loading="lazy" decoding="async" />
            </div>
          </button>

          {/* 4. Gacha Card */}
          <button
            onClick={() => onNavigate("gacha")}
            className="group relative flex flex-col px-3.5 pt-2.5 pb-1 bg-white rounded-[22px] border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] transition-all duration-200 ease-out text-left min-h-[111px] overflow-hidden cursor-pointer active:scale-[0.98]"
            id="home-gacha-card"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-1">
                {/* 「今日抽卡」→「十鲜盲盒」（2026-10-30 用户要求改名）。
                    和底部 tab、抽卡页 h1 同步改 —— 三处必须一致，改一处就露破绽。
                    同为 4 字、22px，标题宽度不变（≈88px），右侧箭头徽章位置不动。 */}
                <span className="font-black text-slate-900 text-[22px] leading-none tracking-tight">
                  十鲜盲盒
                </span>
                {/* 箭头改成「黑圆 + 青柠箭头」徽章 —— 参考图里不是裸 chevron，
                    是实心黑圆里的浅色箭头，直径约 15px（真实 px）。 */}
                <span className="w-[18px] h-[18px] rounded-full bg-black flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-3 h-3 stroke-[3.5] text-[#C7F665]" />
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-none font-medium">翻牌抽免费招牌碗</p>
            </div>

            {/* 左下角标签：口径同外卖卡（白底金字 FREE + 白底描边「惊喜多多」），四卡统一 */}
            <div className="absolute left-3.5 bottom-[44px] z-10 flex items-center gap-1">
              <span className="rounded-full bg-white px-1.5 py-1 text-[9px] font-black leading-none text-[#FC5294] shadow-[inset_0_0_0_1px_#FC5294,0_1px_2px_rgba(15,23,42,0.12)]">
                <span>FREE</span>
              </span>
              <span className="rounded-full bg-white border border-black/10 px-[5px] py-[3px] text-[9px] font-bold leading-none text-black/55 shadow-[0_1px_2px_rgba(15,23,42,0.10)]">
                <span className="pill-label">惊喜多多</span>
              </span>
            </div>

            {/* 插画：掀开的餐盖 + 问号牌。
                ⚠️ 原来是 `LoopingVideo`（/891.mp4 循环视频），这次换成静态图 —— 不再有动效。
                ⚠️ 尺寸 72 比上面两张卡（62）大，原因同福利中心：素材内容比例 1.06 偏方，
                   同高度下视觉宽度窄，按「视觉等大」给。
                ⚠️ 这张是四张里最高的插画，卡高 111 + `bottom-1` 时上沿 y=35，**会和标题同一水平线**
                   （标题底 y≈32），比福利中心那张更容易顶到标题。实测没撞字是因为 x 错开：
                   标题+箭头徽章右端 ≈x126，插画内容左缘 ≈x153。
                   再往下压就会碰箭头，所以 `bottom-1` 是这张的底线。 */}
            <div className="absolute -right-1 bottom-1 h-[72px] w-[100px] z-0 pointer-events-none">
              <img
                src="/entry-norm/entry-gacha.png"
                alt="十鲜盲盒"
                className="w-full h-full object-contain object-right-bottom pointer-events-none group-hover:scale-105 transition-transform"
               loading="lazy" decoding="async" />
            </div>
          </button>
        </div>
      </div>

      {/* Section Header: "限时超值福利 LIMITED TIME" - Neon Lime Capsule Bar
          ⚠️ 高度沿革：44 → 72（按参考图 375 设备 66px × 1.093 换算）→ 54 → **46**。
          参考图那档换算出来在 410 壳里偏胖（用户：「降低高度，现在太大了」），
          说明**竖向尺寸不该跟着宽度比例缩放** —— 比例只用于宽度方向的推导。
          2026-10-19 用户再要求「减小这个组件的高度」：54 → 46（-15%）。
          内容跟着收，否则圆徽章会从占条高 59% 涨到 70%、读起来头重脚轻：
            圆徽章 32→28（占 61%）、Flame 18→16、标题 16→15、
            LIMITED TIME 10→9、按钮 24→21（py-1→py-0.5、text-xs→11px）、左右 padding 14→12。
          ⚠️ 46 时圆徽章上下各留 9px；再往下收（42）圆就得跟着到 26，否则会贴边。
          2026-10-22 用户第三次要「减小这个高度」：46 → **40**（-13%），内容再次同比例收：
            圆徽章 28→24（占 60%）、Flame 16→14、标题 15→14、
            LIMITED TIME 9→8、按钮 11→10（py-0.5→py-0、px-3→px-2.5）、左右 padding 12→10。
          40 时圆徽章上下各留 8px；**38 是下限**（留 7px，再小圆就要缩到 22 才不贴边）。 */}
      <div className="px-3" id="home-welfare-section">
        {/* 区块头（2026-10-29 10:55 用户「这个也这么改」，指上一条「人气当季轻食」的裸排版）：
            从「白底圆角条（h-40 + 边框 + 投影）+ 英文副标 + 黑底青柠按钮」
            → **裸排版**：黑圆图标 + 15px 纯黑标题 + 12px 灰字文字链，不加任何容器。
            ⛔ 沿革（别再回退）：这条底子换过三轮 ——
                青柠实底 `#C7F665`（10-27 前）→ 白底 + slate-100 边 + 投影（10-27「去掉绿框」，
                为把全页唯一的高饱和绿让给骑缝登录栏）→ **裸排版无容器**（本次）。
                所以现在它连"白条"都不是了，也别再往回归到任何带底的条。
            ⛔ 英文副标 `LIMITED TIME` 一并删掉：同一套裸排版里，旁边那条区块头已经没有副标，
                留着会变成"两个区块头两种语法"。要恢复必须两条一起恢复。
            尺寸：图标 24px 黑圆（金火焰 14px，保留原来的暖色点缀）、标题 15px/800、
            右侧 12px/700 灰字 + 14px chevron。高度由容器 40px 变成一行 24px，
            上下间距交给父级 `space-y-3`（12px），不再自己撑高。 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {/* 圆徽章：粉橙渐变 → 黑底金火焰（2026-10-23）。粉是体系外的情绪色，
                「黑 + 金」更提气，也和点餐页 TOP热销 角标同一套语言。
                裸排版后它是这一行唯一的颜色锚点，比原来压在白条里更聚焦。 */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black">
              {/* 火焰金 #FDCF29 → 品牌玫红 #FC5294（2026-10-29 11:41「这两个图标
                  的黄色和绿色都改成小程序的红色」）。黑圆上的玫红 6.77:1，够清楚。
                  ⚠️ 沿革：2026-11-02 23:09 用户要「空心」→ 去 fill + stroke-[2.3]；
                     2026-11-03 10:42 用户又要「实心」→ **改回 `fill-[#FC5294]`**。
                     两轮来回说明这就是口味选择，不是修 bug —— 下次再动先问一句，
                     别在"实心/空心"之间自己反复推。
                  ⚠️ 实心态下 `stroke-[N]` 不影响观感（fill 已铺满），保留 2 默认即可。 */}
              <Flame className="h-3.5 w-3.5 fill-[#FC5294] text-[#FC5294]" />
            </div>
            {/* ⛔ 不带 `pill-label`：那是胶囊按钮里小字的基线微调（-0.075em ≈ 1px），
                这条现在和「人气当季轻食」同构，带上去会比旁边那条整体高 1px。 */}
            <span className="truncate whitespace-nowrap text-[15px] font-extrabold tracking-tight text-[#070906]">
              限时超值福利
            </span>
          </div>

          <button
            onClick={() => onNavigate("menu")}
            className="gb-hit-y -my-1 flex shrink-0 cursor-pointer items-center gap-0.5 py-1 text-[12px] font-bold text-slate-600 transition-colors duration-200 ease-out hover:text-slate-900 active:scale-95"
          >
            <span>查看更多</span>
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 2 Benefit Cards Grid: Left (Black Card) & Right (Warm Yellow Card)
          ⚠️ 参考图里没有这两个组件（截图只到「限时福利」+ 分类 tab），
             所以**尺寸没动**，只跟着全局改了左右边距与列间距。
          ⚠️ 2026-10-19 用户要求招牌卡改 **1:1**（原 192×220，比例 0.873）。
             两卡同排 + `items-stretch` → 必须**同时**改，否则被 220 那张撑回去。
             所以两张的 `min-h` 都改成 192，一行就是 192×192 的正方形。
             若哪天只想让招牌卡方、邀请卡留 220：把 grid 改成 `items-start`，
             再分别给 min-h（但两卡底边会错开，慎用）。 */}
      <div className="px-3">
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-2 items-stretch">
          {/* Left Black Card: 招牌能量减脂餐
              2026-10-19 用户给了**整张 1:1 成品卡面**（1254×1254，胶囊/标题/碗/涂鸦全在图里），
              要求「内换成这个图 + 卡片尺寸改为 1:1」→ 整张卡就是这张图，不再用 HTML 拼。
              · 卡宽固定 192（两列 390 减 6 gap 的一半），所以 `aspect-square` = 192×192；
              · 素材 1:1 + `object-cover` → 不裁切，比例对得上才不会有黑边；
              · 圆角/裁切由卡负责（素材本身是直角满幅暗底）；
              · `alt` 保留完整文案，读屏仍能读到卖点。
              ⚠️ 素材导出：`node scripts/optimize-image.mjs <源> public/signature-card.jpg 640 88`
                 （640 = 192 × 3 DPR 再留余量；1254 原图直接用会多带 ~200KB）。
              ⚠️ 原来那套 HTML 版（青柠「镇店招牌」胶囊 + 白标题 + 圆形碗 80px + 黄色 EAT CLEAN
                 STAY COOL 涂鸦）已整段注释在下面 —— 那张是**黄字 + 更小的碗**，与这张成品图的
                 青柠字 + 满幅碗不是同一个设计，别拿它当「参考实现」去改这张图。 */}
          <div
            onClick={() => {
              if (popularDishes.length > 0) {
                onSelectDish(popularDishes[0]);
              } else {
                onNavigate("menu");
              }
            }}
            className="cursor-pointer bg-[#111111] rounded-[22px] relative overflow-hidden aspect-square shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.16)] transition-all duration-200 ease-out group active:scale-[0.98]"
            id="home-signature-card"
          >
            <img
              src="/signature-card.jpg"
              alt="招牌能量减脂餐 · 高蛋白慢碳 · 营养师科学控卡"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
             loading="lazy" decoding="async" />
          </div>

          {/* ── 旧版 HTML 卡面（2026-10-19 被上面那张成品图取代，留作回退）────────
          <div
            className="cursor-pointer bg-[#111111] rounded-[22px] p-3.5 text-white relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition-all duration-200 ease-out group active:scale-[0.98]"
            id="home-signature-card"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#C7F665] text-black text-[11px] font-black tracking-tight">镇店招牌</span>
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-bold backdrop-blur-xs">精选热卖</span>
              </div>
              <h4 className="font-black text-white text-base tracking-tight mt-2 leading-snug">招牌能量减脂餐</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium leading-tight">高蛋白慢碳 · 营养师科学控卡</p>
            </div>
            <div className="flex items-end justify-between mt-2 pt-1">
              <div className="w-22 h-22 rounded-full overflow-hidden border-2 border-white/20 shadow-md flex-shrink-0 bg-slate-800">
                <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" alt="招牌能量减脂餐" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
              </div>
              <div className="flex flex-col items-center justify-center pr-1 select-none pointer-events-none pb-1">
                <svg className="w-5 h-4 text-[#FACC15] fill-current mb-0.5" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" /></svg>
                <span className="font-black text-[#FACC15] text-xs leading-none tracking-tight transform rotate-2">EAT</span>
                <span className="font-black text-[#FACC15] text-xs leading-none tracking-tight transform -rotate-1 mt-0.5">CLEAN</span>
                <span className="font-black text-[#FACC15] text-xs leading-none tracking-tight transform rotate-1 mt-0.5">STAY</span>
                <span className="font-black text-[#FACC15] text-xs leading-none tracking-tight transform -rotate-2 mt-0.5">COOL!</span>
              </div>
            </div>
          </div>
          ─────────────────────────────────────────────────────────────── */}

          {/* Right Warm Yellow Card: 邀请新人享免单
              2026-10-19 与招牌卡同样处理：用户给了**整张 1:1 成品卡面**（1920×1920，
              「新人免单」橙胶囊 / 0元享 / 标题 / 副标题 / 青柠「立即邀请」按钮 /
              GOOD FRIENDS HEALTHY LIFE! / 皇冠兔吉祥物，全在图里）→ 整张卡就是这张图。
              · 卡宽 192 → `aspect-square` = 192×192，和左边招牌卡对齐成一行正方形；
              · 素材 1:1 + `object-cover` → 不裁切；
              · 圆角由卡负责（素材是直角米黄满幅底）。
              ⚠️ 素材导出：`node scripts/optimize-image.mjs <源> public/invite-card.jpg 640 88`
                 （1920 原图直接进包会多带 ~300KB，640 已够 192×3 DPR）。
              ⚠️ 旧的 HTML 版（橙胶囊 + 标题 + 青柠按钮 + `/mascot_invite.png` 吉祥物）
                 整段注释在下面 —— 那张的吉祥物是**绿色手掌**，这张成品图是**皇冠兔子**，
                 不是同一个角色，别拿旧的当参考。
              ⚠️ 旧版里的「立即邀请」是嵌套 `<button>`（stopPropagation 后再开弹窗）；
                 换成整图后没有内层按钮了，点卡任意位置都走外层 `onClick` → 行为一致。 */}
          <div
            onClick={() => setModalType("invite")}
            className="cursor-pointer bg-[#FFFDF0] rounded-[22px] relative overflow-hidden aspect-square shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.16)] transition-all duration-200 ease-out group active:scale-[0.98]"
            id="home-invite-card"
          >
            <img
              src="/invite-card.jpg"
              alt="邀请新人享免单 · 好友首单立享 0 元起"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
             loading="lazy" decoding="async" />
          </div>

          {/* ── 旧版 HTML 卡面（2026-10-19 被上面那张成品图取代，留作回退）────────
          <div
            className="cursor-pointer bg-gradient-to-b from-[#FFFDF0] via-[#FFFBE8] to-[#FFF3C4] rounded-[22px] p-3.5 border border-[#FDE68A]/70 relative overflow-hidden flex flex-col justify-between min-h-[192px] shadow-sm hover:shadow-md transition-all duration-200 ease-out group active:scale-[0.98]"
            id="home-invite-card"
          >
            <div className="absolute top-2.5 right-2.5 flex flex-col items-end pointer-events-none select-none z-10 leading-none">
              <span className="font-black text-slate-900 text-[9px] tracking-tight">GOOD</span>
              <span className="font-black text-slate-900 text-[9px] tracking-tight mt-0.5">FRIENDS</span>
              <span className="font-black text-slate-900 text-[9px] tracking-tight mt-0.5">HEALTHY</span>
              <span className="font-black text-slate-900 text-[9px] tracking-tight mt-0.5">LIFE!</span>
              <span className="text-slate-900 text-[9px] font-bold mt-0.5">♡</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded-full bg-[#FF9800] text-white text-[11px] font-black tracking-tight shadow-2xs">新人免单</span>
                <span className="text-xs font-black text-[#FF9800] ml-0.5">0元享</span>
              </div>
              <h4 className="font-black text-slate-900 text-base tracking-tight mt-2 leading-snug">邀请新人享免单</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">好友首单立享 0 元起</p>
              <button className="mt-2.5 px-3 py-1 rounded-full bg-[#C7F665] text-black font-black text-xs inline-flex items-center gap-0.5 shadow-2xs">立即邀请</button>
            </div>
            <div className="absolute -bottom-1 -right-1 w-32 h-28 pointer-events-none select-none overflow-hidden z-0">
              <img src="/mascot_invite.png" alt="邀请新人享免单" className="w-full h-full object-contain object-bottom-right"  loading="lazy" decoding="async" />
            </div>
          </div>
          ─────────────────────────────────────────────────────────────── */}
        </div>
      </div>

      {/* Popular Menu Dishes Grid
          ⚠️ 参考图截图没滚到这里，基础卡片尺寸跟随全局边距/列间距。
          2026-10-18 按用户参考图最终定稿「白卡 + 青柠 HOT + 黑底 kcal」造型
          （详见 grid 内注释）；中间做过的深色卡版本已被用户否决，勿回退。 */}
      <div className="px-3" id="home-popular-dishes-section">
        {/* 区块头（2026-10-29 11:00 用户「反了，是学习这张去掉胶囊框的样式」）：
            定稿为**裸排版**——不加白胶囊底、不加英文副标、不加黑底按钮，
            直接排在页面底色 #F4F6F8 上：
              · 左：24px 黑圆 + 青柠火花，紧接 15px/800 纯黑中文标题；
              · 右：12px/700 深灰文字链「全部菜单 ›」，只有字和箭头。
            ⛔ 沿革（别再回退成上一种）：同日上午先按另一张参考图做成「白胶囊条 +
              绿色斜体 POPULAR PICKS + 黑底青柠按钮」，被用户当场否掉（「反了」）。
              所以这里**不要**再加容器底色/投影/边框，也不要再塞英文副标 ——
              这一条靠"字号差 + 留白"分层，不靠容器。
            参数定值：
              · 图标 24px（比旧 18px 大一圈，配合 15px 标题不至于被字压小）、火花 14px；
              · 右侧文字链 12px，`gb-hit-y` 把命中区撑到 44 高（视觉上仍是一行字）。 */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {/* 火花青柠 #C7F665 → 品牌玫红 #FC5294（2026-10-29 11:41 与福利区那条同步改，
                两个区块头的图标现在都是「黑圆 + 玫红」，别再单独染回绿/黄）。 */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[#FC5294]">
              {/* ⚠️ 沿革：2026-11-02 23:09「空心」→ `stroke-[1.9]` 去 fill；
                     2026-11-03 10:42「实心」→ **`fill-[#FC5294]`**。
                  ⚠️ 别用"加粗描边"假装实心：A/B 过 `stroke-[2.4]`（原状）和 2.8，
                     四角星中心始终留着一个洞，用户一眼就看得出不是实心。
                     真填充才是实心 —— 大星变实心四角星、右上十字与小圆点也各自实心。
                  ⚠️ 填充态下不要再挂 `stroke-[N]`：描边会让实心轮廓整体胖一圈
                     （14px 下每边多 ~1.2px），星尖变钝。用 lucide 默认 2 即可。 */}
              <Sparkles className="h-3.5 w-3.5 fill-[#FC5294]" />
            </div>
            <h3 className="truncate whitespace-nowrap text-[15px] font-extrabold tracking-tight text-slate-900">
              人气当季轻食
            </h3>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="gb-hit-y -my-1 flex shrink-0 cursor-pointer items-center gap-0.5 py-1 text-[12px] font-bold text-slate-600 transition-colors duration-200 ease-out hover:text-slate-900 active:scale-95"
          >
            <span>全部菜单</span>
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.2]" />
          </button>
        </div>

        {/* Popular Menu Dishes Grid
            2026-10-18 按参考图实测尺寸定稿（参考图单卡裁切放大后量得 190×200）：
            · 图片区 h-[100px]（约占卡高一半），顶部圆角裁剪
            · HOT 是**贴左上角的青柠圆角块**（左/上贴边，右下大圆角），不是悬浮胶囊
            · kcal 是**小圆角黑底块**（rounded-md，非全圆），橙火焰白字
            · 内容区 px-3 pt-3 pb-3；菜名 13px 黑；标签浅灰底全圆胶囊
            · 价格黑色（参考图如此，覆盖玫红 #FC5294 的全局规范）
            · 加号 28px 青柠圆，**在卡内右下**（不是骑跨边缘）
            ⚠️ 深色卡版本被用户否决过两次返工，勿回退。
            ⚠️ 上面「图片区 h-[100px]」「HOT 是青柠块」两条**已作废**（2026-10-25 图片区
               改 1:1、2026-10-28 HOT 改玫红 + 图片区改灰底居中抠图），以后面各处的注释为准。 */}
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-2">
          {/* ⛔ 卡片描边：**已撤销，别再往上加**（2026-10-29）
              沿革：00:43「给这两个卡片加上小程序里的红色描边」→ 加 1.5px；
              04:43「描边粗一点」→ 2px；06:56「不要这个描边了」→ 全撤，
              className 回到「白卡 + 投影」。
              至此这个位置**加过两次描边、被撤过两次**（10-28 那圈图区绿 inset 一次，
              10-29 这次整卡玫红 border 一次）。两张卡靠 `shadow-[0_4px_16px_...]`
              的柔和投影跟 #F4F6F8 页底分离就够了，不要再拿边框去"加强分割"。
              真要区分卡片，改投影 / 底色，别动边框。 */}
          {popularDishes.map((dish) => (
            <div
              key={dish.id}
              onClick={() => onSelectDish(dish)}
              className="group relative cursor-pointer bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] transition-all duration-200 ease-out flex flex-col overflow-hidden text-left active:scale-[0.98]"
            >
              {/* Dish Image
                  **2026-10-28 用户：「食材居中，食材部分（上块）是灰色，下块是白色」** ——
                  这里从「品类色不规则色块 + 越界抠图」改成**中性浅灰底 + 居中抠图**：
                    · `bare` 模式 = 不画色块、不画营养框，食物按内容**最长边归一化到 90%** 居中，
                      所以沙拉（宽 90.9）/ 三明治（宽 91.2）/ 奶昔（高 93.8）并排看**视觉等大**；
                    · 灰底用 `#E7E9EB`（中性灰，不带黄绿），和下方白色文字区形成"上灰下白"两段；
                      ⚠️ 初版用 #F2F3F3，与页面底色 #F4F6F8 只差 2 个灰阶、卡片图区整个
                      糊进背景里（2026-10-28 晚用户反馈「卡片背景跟背景分不开」），
                      加深到 #E7E9EB（231,233,235）拉开 13 个灰阶，仍保持中性不带色。
                    · **同日更晚「不变灰色了，变白色」→ 图区改 `bg-white`。** 绿内描边
                      （`shadow-[inset_0_0_0_2px_#C7F665]` + `rounded-t-2xl`）加过后
                      又被「去除绿描边」去掉（2026-10-28 深夜）—— 现在图区就是纯白，
                      分离只靠卡片自身投影。别再把「图区那圈绿 inset」加回来。
                      （2026-10-29 凌晨也试过整卡玫红 border，加完 1.5 → 2px 后
                       又被「不要这个描边了」全撤，见本段上方那条 ⛔ 注释。）
                    · 抠图的 alpha bbox 中心实测都在画布 (50,50) ±1.8% 内（见 `CONTENT_BBOX`
                      上方的量法），所以 `bare` 的几何居中 = 肉眼居中，不需要再写死 x/y。
                    · **同日深夜「减少这两个卡片的高度」→ 图区 1:1 改 `aspect-[4/3]`**
                      （192 → 144px，整卡 296 → 248）。`bare` 食物是 `object-contain`
                      + 中心 `scale(bareScale)`，容器变扁只会等比缩小、六张卡相对
                      大小关系不变，不变形不裁切。
                    · **同日上午（10:39）用户再发同款截图「减少这两个卡片的高度」
                      → 4:3 再压一档到 `aspect-[3/2]`**（139.5 → 124px，整卡 ≈228）。
                      文字区（标题/副标/标签/价格行 ≈104px）内容齐全没有可砍的行，
                      高度只能继续从图区出。
                      ⚠️ 上面「图片区保持 **1:1**」一条**就此作废**；想调高矮只动
                      这个 aspect 值（16/9≈102、1/1=192）。 */}
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-white">
                <DishCoverArt
                  dish={dish}
                  size={192}
                  bare
                  fluid
                  className="transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                />
                {/* HOT：贴左上角的玫红块
                    2026-10-28 用户「这块改成系统规定的玫红色」：青柠 #C7F665 → 玫红 #FC5294。
                    **2026-10-29 01:16 用户「内部改成白字」：块内文字 + 火焰由黑改白。**
                    沿革：10-28 是先写黑（理由是黑对 #FC5294 6.77:1、白只有 3.10:1，
                    10px 小字不过 AA）→ 10-29 用户明确要白，跟随。
                    ⚠️ 已知代价：白对玫红 3.10:1，10px 不过 WCAG AA，这是"观感优先于对比度"
                       的显式取舍，和底部导航/悬浮购物车计数徽章（粉底白字）同一口径。
                       要提可读性**只加字重/字号**（现已 font-black），不要偷偷换回黑字，
                       也不要引深色号 —— 用户 10-28 否过深玫红 #B83C6C。
                    ⚠️ 火焰跟着 text-white 走，别单独染成黑/黄 —— 整块要保持"一块色 + 白墨"。
                    ⚠️ `z-10` 和下面 kcal 胶囊同理（图内抠图是 `z-[1]`、涂鸦框 `z-[3]`），
                       否则小屏上碗沿会从左上斜插进来压掉角标。 */}
                <span className="absolute left-0 top-0 z-10 flex items-center gap-1 rounded-br-xl bg-[#FC5294] px-2 py-1 text-[10px] font-black leading-none text-white">
                  HOT
                  <Flame className="h-2.5 w-2.5 fill-white text-white" />
                </span>
                {/* kcal：小圆角黑底块
                    ⚠️ **必须带 `z-10`**（2026-10-29 用户「卡路里不要被挡住」）：`DishCoverArt`
                       里面的抠图是 `z-[1]`、营养涂鸦框是 `z-[3]`，胶囊原来没有 z-index
                       （= auto/0）→ 被碗沿压掉右上角。给 10 是为了压过图内所有层，
                       而不是"刚好比 3 大"——以后图里再加层不用回来改。 */}
                <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-md bg-black px-2 py-1 text-[11px] font-bold leading-none text-white">
                  <Flame className="h-3 w-3 shrink-0 fill-orange-400 text-orange-400" />
                  <span>{dish.kcal} kcal</span>
                </div>
              </div>

              {/* Dish Body */}
              <div className="flex-1 bg-white px-3 pt-2 pb-2.5">
                <h4 className="truncate whitespace-nowrap text-[13px] font-black leading-tight text-slate-900 transition-colors group-hover:text-[#54801A]">
                  {dish.name}
                </h4>
                <p className="mt-0.5 truncate whitespace-nowrap text-[10px] font-medium leading-tight text-slate-500">
                  {dish.subtitle || dish.description}
                </p>

                <div className="mt-1.5 flex items-center gap-1 overflow-hidden whitespace-nowrap">
                  {dish.tags.slice(0, 2).map((tag, idx) => (
                    <DishTag key={idx}>{tag}</DishTag>
                  ))}
                </div>

                {/* 价格 + 加号：同一行 flex，**不再用 absolute**。
                    ⚠️ 2026-10-28 用户「这个组件错乱完了」：加号原来是
                    `absolute bottom-2 right-2.5`，被 `.gb-hit{position:relative}`
                    顶掉了定位（详见 index.css 那条注释），掉回文档流后又被
                    `right:2.5` 左移 10px，正好压在 ¥ 价格上。
                    现在改成「价格块 + 加号」两端对齐的 flex 行：
                    · 位置由布局算，不会再被任何 utility 的定位覆盖；
                    · `items-center` 让 28px 的圆和价格**同轴**（原来差 4.5px）；
                    · `-mr-1` 把圆往右推到距卡边 8px（原 right-2.5 的观感）；
                    · `shrink-0` 保证价格再长也不会把加号挤扁。
                    ⚠️ 2026-10-29 12:46 用户「价格大一点」：数字 15→17、¥ 10→11、
                       划线原价 9→10。17 仍是 font-black 大文本（3:1 及格线之上），
                       17 在 192 宽卡里和 28px 加号同排不挤（最长价「¥36.9 原¥45」
                       实测占 ~90px）。再大要先看这一行还剩多少余量。 */}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-baseline gap-0.5 whitespace-nowrap">
                    <span className="text-[11px] font-bold text-[#FC5294]">¥</span>
                    <span className="text-[17px] font-black leading-none text-[#FC5294]">
                      {dish.dealPrice.toFixed(1)}
                    </span>
                    {dish.originalPrice && (
                      <span className="ml-1 text-[10px] text-slate-500 line-through">
                        ¥{dish.originalPrice}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDish(dish);
                    }}
                    className="gb-hit -mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#C7F665] text-black shadow-xs transition-all duration-200 ease-out hover:bg-[#B7EF4B] active:scale-95"
                    aria-label={`查看详情：${dish.name}`}
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* In-App Animated Modal Popups */}
      <AnimatePresence>
        {/* 1. 福利中心（2026-11-03 用户「福利中心的弹窗换成这个」）
            ⚠️ 这是全站唯一不走 StickerModal 的弹窗：用户给的稿子是 540×695 的整幅海报
               （-4.1° 倾角 + 3D 荧光绿礼盒 + 凹槽胶囊列表），和站内「20px 圆角白卡 +
               贴纸徽章」是两套视觉体系，硬塞进 StickerModal 会两边都变形。
            ⚠️ 旧的三行券包列表（白卡 + ¥10/8.8折/免邮 面额块）已随这版删掉，内容搬进了
               新弹窗的三条 wf-slot。不要再按「福利中心里有个券包列表」去改别处。 */}
        {modalType === 'benefit' && (
          <WelfareCenterModal
            onClose={() => setModalType(null)}
            claimed={benefitClaimed}
            onClaimAll={handleClaimBenefits}
            onGoMenu={() => {
              setModalType(null);
              onNavigate('menu');
            }}
          />
        )}

        {/* 2. Invite Friends / 0 Yuan Free Meal In-App Modal */}
        {modalType === 'invite' && (
          <StickerModal
            onClose={() => setModalType(null)}
            ariaLabel="邀请好友"
            title="邀请新人 0 元免单"
            /* ⚠️ 这一条**不进 xl**：8 个字（含空格），40px 时宽约 320px，
               正好等于卡片内宽（348 − px-3.5×2），会顶到圆角甚至折行。
               用 md(34) 后约 272px，仍是一行且留 48px 余量。 */
            titleSize="md"
            badge={<Gift className="h-[30px] w-[30px]" strokeWidth={2.6} />}
            badgeSize="lg"
            badgeBorderWidth={4}
            subtitle="好友通过您的专属口令下单，好友首单立减，您可获得免费招牌能量碗！"
            maxWidth={348}
            bodyClassName="space-y-3"
            footer={
              <>
                <StickerButton tone="lime" onClick={handleCopyInviteCode}>
                  <Share2 className="w-4 h-4" strokeWidth={2.8} />
                  <span>立即分享邀请好友</span>
                </StickerButton>
                <button
                  onClick={() => setModalType(null)}
                  className="mt-2 w-full text-[10px] font-bold text-[#070906]/45 transition-colors hover:text-[#070906]/70"
                >
                  关闭
                </button>
              </>
            }
          >
            {/* Graphic Header */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] border-[2px] border-[#070906] bg-[#ECFDC0] shadow-[1.5px_2px_0_rgba(7,9,6,0.14)]">
              <img
                src="/853c20910e5626627b9b82adf81b1c68.png"
                alt="邀请免单"
                className="h-10 w-10 object-contain"
               loading="lazy" decoding="async" />
            </div>

            {/* Invite Code Box */}
            <StickerPanel innerClassName="flex items-center justify-between p-2.5">
              <div className="text-left">
                <span className="block text-[9px] font-bold text-[#070906]/40">我的专属邀请口令</span>
                <span className="text-[15px] font-black tracking-[0.12em] text-[#070906]">SLIM888</span>
              </div>
              <button
                onClick={handleCopyInviteCode}
                className={`flex items-center gap-1 rounded-full border-[2px] px-2.5 py-1.5 text-[11px] font-black transition-all duration-200 ease-out active:translate-y-[1px] ${
                  copiedCode
                    ? 'border-[#070906] bg-[#C7F665] text-[#070906]'
                    : 'border-[#070906] bg-[#070906] text-white'
                }`}
              >
                {copiedCode ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2.8} />}
                <span>{copiedCode ? '已复制' : '复制口令'}</span>
              </button>
            </StickerPanel>

            {/* Steps */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {['发送邀请口令', '好友领取首单', '获得免单大奖'].map((label, i) => (
                <div
                  key={label}
                  className="rounded-[14px] border-[1.5px] border-[#070906]/12 bg-white px-1 py-2"
                >
                  <span className="mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-[#070906] bg-[#C7F665] text-[10px] font-black text-[#070906]">
                    {i + 1}
                  </span>
                  <p className="text-[10px] font-bold leading-tight text-[#070906]/75">{label}</p>
                </div>
              ))}
            </div>
          </StickerModal>
        )}

        {/* 3. Daily Red Packet / Lucky Draw In-App Modal */}
        {/* ⚠️ 这个「每日红包」弹窗原来是整卡 from-[#EC4899] to-red-600 的红粉渐变。
            2026-10-27「所有红色改成 #fc259b」后红色端点换过一版压暗值；
            2026-10-28 晚定版：全站红**只有一个值 #FC5294**（用户看到深玫红问「为什么是暗色」），
            这个 ¥15.0 也回到 #FC5294，不再单独压深。
            2026-10-28 外壳换成贴纸风后，粉只留在金额和标签上 ——
            整卡粉会和「黑描边 + 青柠」的贴纸语言打架。 */}
        {modalType === 'redpacket' && (
          <StickerModal
            onClose={() => setModalType(null)}
            ariaLabel="每日红包"
            title="红包已开启"
            titleSize="xl"
            badge={<Gift className="h-[30px] w-[30px]" strokeWidth={2.6} />}
            badgeSize="lg"
            badgeBorderWidth={4}
            subtitle="营养师推荐餐品专享 · 天天领红包，立省开吃！"
            maxWidth={348}
            bodyClassName="space-y-2.5"
            footer={
              <>
                {!redPacketClaimed ? (
                  <StickerButton tone="lime" onClick={handleClaimRedPacket}>
                    <Gift className="w-4 h-4" strokeWidth={2.8} />
                    <span>立即存入我的券包</span>
                  </StickerButton>
                ) : (
                  <StickerButton
                    tone="ink"
                    onClick={() => {
                      setModalType(null);
                      onNavigate('menu');
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" strokeWidth={2.8} />
                    <span>已放入券包，去点餐抵扣</span>
                  </StickerButton>
                )}
                <button
                  onClick={() => setModalType(null)}
                  className="mt-2 w-full text-[10px] font-bold text-[#070906]/45 transition-colors hover:text-[#070906]/70"
                >
                  关闭
                </button>
              </>
            }
          >
            {/* Mascot Red Packet Graphic */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center">
              <RedPacketFuIcon className="h-20 w-20" />
            </div>

            {/* Red Packet Amount Card */}
            <div className="rounded-[14px] border-[1.5px] border-[#070906]/12 bg-white p-3 text-left">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[22px] font-black leading-none text-[#FC5294]">¥15.0</span>
                  <span className="ml-1 text-[10px] font-bold text-[#070906]/40">满 ¥38 可用</span>
                </div>
                <span className="rounded-full border border-[#FAB7D9] bg-[#FDD3EA] px-2 py-0.5 text-[9px] font-black text-[#DB2777]">
                  今日专享
                </span>
              </div>
              <h5 className="mt-2 text-xs font-extrabold text-[#070906]">健康能量餐通用抵扣金</h5>
              <p className="mt-0.5 text-[10px] leading-relaxed text-[#070906]/50">
                全场所有减脂沙拉、慢碳能量碗、鲜榨轻饮均可使用
              </p>
            </div>
          </StickerModal>
        )}
      </AnimatePresence>
    </div>
  );
};

