import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { UserProfile, Coupon } from '../types';
import {
  ChevronRight,
  Headphones,
  FileText,
  Store,
  Building2,
  Gift,
  CreditCard,
  ChevronDown,
  Activity,
  MapPin,
  LogOut,
  Target
} from 'lucide-react';

/** 与开屏 / 弹窗一致的缓出曲线：起步快、收尾稳，展开收起不“弹” */
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface MePageProps {
  user: UserProfile;
  ordersCount: number;
  favsCount: number;
  coupons: Coupon[];
  onNavigate: (tab: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
  onOpenNutritionReport: () => void;
  onOpenHealthPlan: () => void;
}

/* ============================================================================
   「我的」页 —— 高保真复刻参考图
   ---------------------------------------------------------------------------
   结构（自上而下）：
     ① 青柠头部：圆形黑边头像 / 超大用户名 / 黑底黄星会员胶囊 / 右上角四枚控件
        / 右侧吉祥物位（待补 jpg）+ 手写体 Good Food Better You / 黑色涂鸦
     ② 立省¥35 黑胶囊（压在白卡左上角）+ 白色大圆角资产卡（4 列）
     ③ 我的订单（青柠底大卡）+ 服务中心（白卡）并排
     ④ 我的功能（白卡，圆形青柠底图标 ×5 + 展开全部青柠胶囊）
     ⑤ 邀请好友（黑卡 + NEW 青柠斜标签）
     ⑥ 送礼品卡（白卡，Special 青柠底 / Classic 黑底）
     ⑦ 退出登录

   ⚠️ 插画位：`.mascot-slot` / `.order-art-slot` / `.invite-art-slot`
      三处是参考图里的插画（吉祥物、餐盒、邀请插画），已按参考图尺寸预留空位，
      等用户提供 jpg 后直接塞进去即可，不要用代码画。
   ============================================================================ */

/** 参考图里反复出现的黑色手绘涂鸦短线，用同一枚 SVG 复用 */
const Doodle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M4 18 L9 6 M13 20 L16 4 M22 19 L27 7 M31 21 L36 9"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  </svg>
);

/** 四角星贴纸 */
const Star4: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 0 C12 6 18 12 24 12 C18 12 12 18 12 24 C12 18 6 12 0 12 C6 12 12 6 12 0 Z" />
  </svg>
);


export const MePage: React.FC<MePageProps> = ({
  user,
  ordersCount,
  favsCount,
  coupons,
  onNavigate,
  onOpenLogin,
  onLogout,
  onShowToast,
  onOpenNutritionReport,
  onOpenHealthPlan
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  /** 升级进度：和首页身份条（`MemberBar`）同一套算法 —— 夹在 6~100，
      0 会让进度条整根消失（看起来像坏了），100 留给"已满"另有文案表达。 */
  const rawPct =
    user.nextLevelPoints > 0 ? (user.points / user.nextLevelPoints) * 100 : 0;
  const pct = Math.max(6, Math.min(100, Math.round(rawPct)));

  /** 资产卡四列数据，按参考图顺序 */
  const assets = [
    {
      value: user.isLoggedIn ? coupons.length : 0,
      unit: '张',
      label: '优惠券',
      onClick: () => {
        if (!user.isLoggedIn) onOpenLogin();
        else onShowToast(`您当前拥有 ${coupons.length} 张可用优惠券`);
      }
    },
    {
      value: user.isLoggedIn ? 2 : 0,
      unit: '张',
      label: '咖啡卡券',
      onClick: () => onShowToast('咖啡卡券专区：已开通全国门店通用饮品兑换')
    },
    {
      value: user.isLoggedIn ? 1 : 0,
      unit: '张',
      label: '好运卡',
      onClick: () => onNavigate('gacha')
    },
    {
      value: 0,
      unit: '元',
      label: '余额',
      onClick: () => onShowToast(`当前账户余额：¥${user.isLoggedIn ? '0.00' : '0'} 元`)
    }
  ];

  /** 「我的功能」主区 5 项 —— 参考图：圆形青柠底 + 黑色线性图标 */
  const features = [
    { icon: Store, label: '招商加盟', toast: '招商加盟专线：021-8888-6666（全国轻食连锁合作）' },
    { icon: Building2, label: '租赁合作', toast: '场地租赁与企业团餐：支持园区专柜/智能无人柜入驻' },
    { icon: Gift, label: '兑换优惠', toast: '口令兑换：输入您的优惠兑换码即可领取轻食礼包' },
    { icon: CreditCard, label: '礼品卡', toast: '电子礼品卡：全国轻食与现磨咖啡通兑包' }
  ];

  /** 「我的功能」展开区 */
  const moreFeatures = [
    { icon: Activity, label: '营养档案', action: onOpenNutritionReport },
    { icon: MapPin, label: '地址管理', toast: '配送地址管理：上海市静安区南京西路1601号越洋广场' },
    { icon: FileText, label: '隐私协议', toast: '平台隐私政策与服务协议已生效' }
  ];

  /** 等级胶囊：登录态和未登录态都用它，只是文案不同。
      抽成变量是因为它在两种布局里的位置不同（登录态跟昵称同排、未登录独占一行），
      写两份必然漂移。
      ⚠️ 2026-10-28「缩小一点」：24 → 20 高。沿革 py-1.5/text-11/star-12
         → py-[5px]/text-10/star-10（px-3→px-2.5、gap-1→gap-[3px]、投影同步收）。
         **高度由内容决定**（`py × 2 + max(文字行高, 星 10)` = 10 + 10 = 20），
         改字号或星尺寸会自动跟随，别再写死 `h-[Npx]`。
         ⚠️ 缩到 20 不影响头部信息块：第一行高度是**昵称 22px**决定的（27.5），
         胶囊从来没撑过行高；宽度方向昵称带 `min-w-0 truncate` 会自动吃掉余量。 */
  const levelPill = (
    <div className="inline-flex shrink-0 items-center gap-[3px] rounded-full bg-black px-2.5 py-[5px] shadow-[0_3px_10px_rgba(0,0,0,0.26)]">
      <span className="pill-label text-[10px] font-extrabold leading-none text-white tracking-wide">
        {user.isLoggedIn ? user.level : '开启元气营养轻食生活'}
      </span>
      <svg
        className="h-2.5 w-2.5 text-[#FDCF29]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </div>
  );

  return (
    <div className="w-full min-h-full bg-[#F4F6F8] text-slate-900 pb-28 select-none">
      {/* ═══════════════ ① 青柠头部 Banner ═══════════════ */}
      {/* ⚠️ 2026-10-28「缩小顶部banner，上移头像和会员」：
          ① **删掉全部 `sm:` 变体** —— 应用恒在 410px 手机壳里，`sm:` 看的是**视口**宽度，
             桌面浏览器（≥640）会把 pt 48→56、pb 56→64、头像 86→96，banner 直接涨到 216。
             这是"壳内禁用 sm:"的既有约定，这里原来破了，用户看到的偏高就是这么来的。
          ② 高度沿革 **190 → 166（2026-10-28 上一轮）→ 156（同日「缩小圈中的组件」）**。
             公式：`H = pt 28 + 头像 76 + pb 52`；头像离"立省¥35"标签的间距**只由 pb 决定**
             （`gap = pb − 白卡负偏移 32 − 标签自身 10` = 10px），所以 pb 不能随便压，
             压到 48 以下标签会贴到头像底缘。**想再缩只能缩头像或压 pt**。
          ③ 白卡负偏移 -mt-9(36) → -mt-8(32)：给上面那条 gap 腾回 4px。
          ④ 宽度 `w-[72%] max-w-[340px]` 不动 —— 左边信息区宽度和吉祥物的位置是一起定的。
          ⑤ ⚠️ 背景图是 `object-cover`，scale 由**宽度**决定（0.4564），所以 banner 一变矮
             就是上下对称多裁。156 高时对称裁会把皇冠切掉 2px，所以改成
             `object-[right_33%]`（纵向 33% 而不是居中）：裁切偏向下缘，
             皇冠顶回到距 banner 顶 9.5px。**改高度要重算这个百分比**
             （`Y% = (crownS − 目标留白) / (imgH·s − H)`）。 */}
      <div className="relative overflow-hidden bg-[#D8F688] px-4 pt-7 pb-13 min-h-[150px] flex items-center">
        {/* 背景 Banner 图：完整铺满顶部头图区域，降低不透明度与高饱和刺眼感，更柔和通透 */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <img
            src="/assets/aistudio/image_9b31cf41.jpg"
            alt="我的页面头图Banner"
            className="h-full w-[114%] max-w-none object-cover object-[right_33%] translate-x-[3%] opacity-70 transition-opacity"
           loading="eager" fetchPriority="high" />
          {/* 柔和白光与轻度漫反射遮罩，降低高光抢眼感 */}
          <div className="absolute inset-0 bg-white/20 pointer-events-none" />
          {/* 左侧柔和羽化渐变遮罩，确保用户头像、昵称与文字在各种屏幕下都清晰可读且不遮挡吉祥物 */}
          <div className="absolute inset-y-0 left-0 w-[44%] bg-gradient-to-r from-[#D8F688]/90 via-[#D8F688]/40 to-transparent pointer-events-none" />
        </div>

        {/* 左侧用户信息区：高保真复刻，严格遵循参考图组件大小与结构，去掉冗余装饰
            ⚠️ 2026-10-28 规范审计：原本 `w-[67%]`，在 375 宽下昵称列只有 148.8px，
               而「Alex(41) + gap 8 + 黄金会员胶囊(99.7)」需要 153.7 →
               昵称被 `truncate` 截成「A...」，用户自己的名字显示不全。
               放到 72% 后信息列 166px，刚好容下；吉祥物那侧仍有余量（见下方截图验证）。 */}
        <div className="relative z-10 w-[70%] max-w-[350px]">
          <div
            onClick={user.isLoggedIn ? undefined : onOpenLogin}
            className={`flex items-center select-none ${
              !user.isLoggedIn ? 'cursor-pointer group' : ''
            }`}
          >
            {/* 头像区域：纯矢量高保真 IP 头像，只有锐利黑线描边（王冠与 HELLO! 气泡已按需求移除）
                ⚠️ 盒子的宽高比必须 ≈ SVG viewBox 300×245（1.2245），否则 object-contain
                   会在盒子里留出额外空白，头像会"缩水"且 -ml 的间距全乱。
                   ⚠️ SVG 内部头像圆是 cx132 / r102+stroke4.5，**圆右侧有 63.75 单位死白**
                   （圆只到 236.25 / 300），所以盒子右边本来就空一截 —— 文字的 -ml 是按
                   「盒子右缘」算的，不是按圆的右缘。76 高时圆直径 ≈ 64.6，死白 ≈ 19.8。 */}
            <div className="relative h-[76px] w-[93px] flex-shrink-0 drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.02] active:scale-[0.98]">
              <img
                src="/mascot-avatar-hd.svg"
                alt={user.isLoggedIn ? user.name : '登录/注册'}
                className="h-full w-full object-contain"
               loading="eager" fetchPriority="high" />
            </div>

            {/* 用户名 / 等级 / 量表（2026-10-28 第 5 轮「好好排版，现在排的很乱」）：
                **从三行改成两行**。原来三行是「昵称 46 / 胶囊 113 / 量表+积分 172」——
                三行三种右端，看着就是一段楼梯；而且行高 27.5 / 24 / 10 递减，
                没有任何一条对齐线。

                现在：
                  第一行 昵称 + 胶囊      → 宽 167
                  第二行 量表 + 积分      → 宽 172
                两行**几乎等宽**（差 5px，肉眼无感），合起来是一个矩形；
                行高 27.5 / 10 的主次也拉开了（身份 > 进度），层次比三行清楚得多。

                ⚠️ 昵称必须带 `min-w-0`（`truncate` 只给 overflow，flex 子项默认 min-width:auto
                   不会收缩），否则长昵称会把胶囊顶出去。
                ⚠️ 未登录的胶囊文案「开启元气营养轻食生活」有 150 宽，跟昵称并排会爆列，
                   所以未登录态**胶囊仍然独占第二行**（两态都是两行，只是分组不同）。 */}
            <div className="-ml-3 flex-1 min-w-0 flex flex-col justify-center">
              {/* 第一行：昵称 + 等级胶囊 */}
              <div className="flex items-center gap-2">
                <h1 className="min-w-0 truncate text-[22px] font-black leading-tight tracking-[-0.035em] text-black">
                  {user.isLoggedIn ? user.name : '登录 / 注册'}
                </h1>
                {user.isLoggedIn && levelPill}
              </div>

              {/* 第二行：黑胶囊量表 + 右端积分。内层 `h-full` 在 `p-[2px]` 的内容盒里 = 6px，
                  所以 100% 时青柠条正好填满黑框内圈，不会顶到圆角外面。
                  6~100% 的夹取沿用首页身份条（0 会让条子整根消失，看着像坏了）。
                  **2026-10-29 01:38 用户「这个加上白描边」→ 外圈加 `ring-2 ring-white`。**
                  为什么用 ring 不用 border：条高锁死 10px 且内部是 `p-[2px]` 算出来的 6px 内条，
                  `border` 会挤掉内容盒（内条变 4px、青柠占比全变），ring 走 box-shadow
                  不参与布局，10px 外高和 6px 内条一个像素都不动。
                  ⚠️ 白环是**画在元素外圈**，所以与右侧「680/1000」的视觉间距由 8px 收到 6px；
                     `gap-2` 不要再加大去补偿，那会把积分推出安全区。 */}
              {user.isLoggedIn ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-[10px] flex-1 overflow-hidden rounded-full bg-[#070906] p-[2px] ring-2 ring-white">
                    <div
                      className="h-full rounded-full bg-[#C7F665] transition-[width] duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* 积分数字 + 白描边（2026-10-29 09:56 用户「旁边的数字也加上白描边」）。
                      做法：**8 向 1px 白色 text-shadow**，不是 `-webkit-text-stroke` ——
                      text-stroke 是**居中**描边，会把 9px 字形的笔画从两侧各吃掉一半，
                      小字直接变细变花；text-shadow 是**向外**堆白，字形本体一点不动。
                      1px 是这颗 9px 字能承受的上限（再粗白边会连成一坨、字被"糊"掉）。
                      · 同批把墨色提实：原来 680 是 `black/80`、`/1000` 是 `black/55`，
                        半透明黑叠在青柠底上本来就是灰的，再包一圈白边就整块发脏
                        （9px 上白边会从笔画里"漏"出来）。实黑 + 白边才立得住。
                      ⚠️ 白边跟着尺寸走：以后若把这块字号放大到 11px 以上，可以同步加到 1.5px；
                        改小则必须回到 1px，否则黑字会被白边吞掉。 */}
                  <span
                    className="shrink-0 text-[9px] font-black leading-none text-black"
                    style={{
                      textShadow:
                        '1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff, 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
                    }}
                  >
                    {user.points}
                    <span className="font-bold text-black/65">/{user.nextLevelPoints}</span>
                  </span>
                </div>
              ) : (
                <div className="mt-1.5">{levelPill}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ ② 资产卡 ═══════════════ */}
      <div className="relative z-20 -mt-8 px-3">
        <div className="relative">
          {/* 立省¥35：黑胶囊压在白卡左上角 */}
          {/* 黑底金字：和抽卡页「N 币」同一套货币/价值语汇（2026-10-23 统一） */}
          <span className="absolute -top-2.5 left-3 z-10 inline-block rounded-full bg-black px-2.5 py-1 text-[10px] font-black leading-none text-[#FDCF29] shadow-2xs">
            <span className="pill-label">{user.isLoggedIn ? '立省¥35' : '登录领券'}</span>
          </span>

          <div className="flex items-stretch rounded-[26px] bg-white px-1.5 pt-3.5 pb-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            {assets.map((a, i) => (
              <React.Fragment key={a.label}>
                {i > 0 && <span className="my-1 w-px shrink-0 self-stretch bg-slate-200/80" />}
                <button
                  type="button"
                  onClick={a.onClick}
                  className="group flex flex-1 cursor-pointer flex-col items-center justify-end active:scale-95 transition-all duration-200 ease-out"
                >
                  {/* 2026-10-29「加入小程序红色和黄色的搭配」：优惠券数值用小程序红
                      #FC5294（红=优惠/促销语义，与人气卡价格同色）；其余资产保持黑。
                      ⚠️ 黄 #FDCF29 不能上白底当文字（1.6:1），黄只做底/图标。 */}
                  <div className={`text-[26px] font-black leading-none tracking-[-0.02em] ${a.label === '优惠券' ? 'text-[#FC5294]' : 'text-black'}`}>
                    {a.value}
                    <span className={`ml-0.5 text-[12px] font-black ${a.label === '优惠券' ? 'text-[#FC5294]' : 'text-black'}`}>{a.unit}</span>
                  </div>
                  <span className="mt-1 text-[12px] font-black text-black">{a.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ 主内容 ═══════════════ */}
      <div className="relative z-20 mt-3.5 space-y-3.5 px-3">
        {/* ③ 我的订单 + 服务中心 */}
        <div className="grid grid-cols-12 gap-3">
          {/* 我的订单 —— 整张卡面图（青柠底 + 大标题 + 副标题 + 黑色「去登录」胶囊 + 3D 剪贴板，全在图里）
              ⚠️ 尺寸：卡是 `col-span-7` = 217.8 宽；同排「服务中心」内容自然高 132，靠 grid 默认的
                 `items-stretch` 把这张卡也撑到 132。所以**不能用 `aspect-`**（会和 132 打架），
                 图片用 `absolute inset-0` + `object-cover` 铺满，让卡高始终跟随服务中心。
              ⚠️ 素材 1024×572（比例 1.79），卡 217.8×132（1.65）→ cover 按高度铺满，
                 左右各裁 9.25px（3.9%）：标题左边缘落在距卡左 14.2px（旧版 padding 是 16，几乎一致），
                 剪贴板右边缘只被裁 0.4%（0.9px），肉眼不可见。**别再改成 object-contain**，
                 素材青柠 #B4F31C 和品牌 #C7F665 不同，留边会露出两条色差带。
              ⚠️ 卡 bg 特意写成素材同色 #B4F31C，只为圆角抗锯齿时缝隙不露白/露品牌青柠。
              ⚠️ 素材是**未登录态**文案（登录后获取订单信息 / 去登录），而页面默认是已登录，
                 所以这张卡不再随 `user.isLoggedIn` 变文案 —— 静态图的固有限制。
              ⚠️ 旧 HTML 版（青柠底 + 17px 标题 + 副标题 + 黑胶囊按钮 + 涂鸦 + `.order-art-slot`
                 餐盒插画位）注释在下方，**没进过 git，别删**；回退就是把这段换回去。 */}
          <div
            onClick={() => {
              if (!user.isLoggedIn) onOpenLogin();
              else onNavigate('orders');
            }}
            className="relative col-span-7 cursor-pointer overflow-hidden rounded-[24px] bg-[#B4F31C] shadow-[0_4px_16px_rgba(0,0,0,0.10)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.16)] active:scale-[0.98]"
          >
            <img
              src="/me-order-card.jpg"
              alt={
                user.isLoggedIn
                  ? `我的订单 · ${ordersCount > 0 ? `您有 ${ordersCount} 笔轻食订单` : '暂无进行中订单'}`
                  : '我的订单 · 登录后获取订单信息'
              }
              className="absolute inset-0 h-full w-full object-cover"
             loading="eager" fetchPriority="high" />
          </div>

          {/*
          ── 旧版 HTML 卡面（青柠底 + 标题 + 副标题 + 黑胶囊按钮 + 涂鸦 + 餐盒插画位）──
          <div
            onClick={() => {
              if (!user.isLoggedIn) onOpenLogin();
              else onNavigate('orders');
            }}
            className="relative col-span-7 flex cursor-pointer flex-col justify-between overflow-hidden rounded-[24px] bg-[#C7F665] p-4 shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.98]"
          >
            <Doodle className="absolute right-3 bottom-3 w-7 h-4 text-black/70" />

            <div className="relative z-10">
              <div className="flex items-center text-[17px] font-black leading-none text-black">
                <span>我的订单</span>
                <ChevronRight className="h-4.5 w-4.5 stroke-[3.2]" />
              </div>
              <p className="mt-2 max-w-[120px] text-[12px] font-bold leading-tight text-black/75">
                {user.isLoggedIn
                  ? ordersCount > 0
                    ? `您有 ${ordersCount} 笔轻食订单`
                    : '暂无进行中订单'
                  : '登录后获取订单信息'}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!user.isLoggedIn) onOpenLogin();
                else onNavigate('orders');
              }}
              className="relative z-10 mt-4 flex w-fit items-center gap-0.5 rounded-full bg-black px-3.5 py-2 text-[12px] font-black text-white transition-all duration-200 ease-out active:scale-95"
            >
              <span>{user.isLoggedIn ? '查看订单' : '去登录'}</span>
              <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
            </button>

            <div className="order-art-slot absolute bottom-1 right-1 h-[76px] w-[104px]" />
          </div>
          ── 旧版结束 ──
          */}

          {/* 服务中心 —— 白卡 */}
          <div className="relative col-span-5 flex flex-col rounded-[24px] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)]">
            <Star4 className="absolute right-3 top-3 h-3.5 w-3.5 text-[#C7F665]" />
            <div className="flex items-center text-[15px] font-black leading-none text-black">
              <span>服务中心</span>
              <ChevronRight className="h-4 w-4 stroke-[3]" />
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => onShowToast('在线客服已连接（工作时间 08:00 - 22:30）')}
                className="group flex w-full items-center justify-between text-[12px] font-bold text-black transition-all"
              >
                <div className="flex items-center gap-2">
                  {/* 红黄搭配（2026-10-29）：客服 = 小程序红 #FC5294 底白图标
                      （白 on 玫红 3.10:1，图形图标按项目「观感优先」口径），
                      与下方发票管理的黄底成对。 */}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FC5294] text-white">
                    <Headphones className="h-[15px] w-[15px] stroke-[2.4]" />
                  </span>
                  <span>客服中心</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.8] text-slate-300 group-hover:text-black" />
              </button>

              <button
                type="button"
                onClick={() => onShowToast('电子发票开具：支持按月自动开票与数电发票')}
                className="group flex w-full items-center justify-between text-[12px] font-bold text-black transition-all"
              >
                <div className="flex items-center gap-2">
                  {/* 红黄搭配（2026-10-29）：发票 = 品牌金 #FDCF29 底黑图标（12.6:1），
                      与上方客服的红底成对 —— 「红 + 黄」一组，其余图标圆保持青柠。 */}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDCF29] text-black">
                    <FileText className="h-[15px] w-[15px] stroke-[2.4]" />
                  </span>
                  <span>发票管理</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.8] text-slate-300 group-hover:text-black" />
              </button>
            </div>
          </div>
        </div>

        {/* ④ 我的功能 */}
        <div className="rounded-[24px] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-[17px] font-black leading-none text-black">我的功能</h3>
            <motion.button
              type="button"
              layout
              whileTap={{ scale: 0.95 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls="me-more-features"
              className="flex items-center gap-0.5 overflow-hidden rounded-full bg-[#C7F665] px-3 py-1.5 text-[11px] font-black text-black transition-colors duration-200 ease-out"
            >
              <span className="pill-label whitespace-nowrap">{isExpanded ? '收起' : '展开全部'}</span>
              <motion.span
                className="flex"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
              >
                <ChevronDown className="h-3.5 w-3.5 stroke-[3]" />
              </motion.span>
            </motion.button>
          </div>

          {/* 圆形青柠底图标 */}
          <div className="grid grid-cols-5 gap-1 text-center">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => onShowToast(f.toast)}
                  className="group flex cursor-pointer flex-col items-center py-1 active:scale-95 transition-all duration-200 ease-out"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C7F665] text-black transition-all duration-200 ease-out group-hover:scale-105 group-active:scale-95">
                    <Icon className="h-5 w-5 stroke-[2.2]" />
                  </div>
                  <span className="mt-1.5 text-[11px] font-black text-black">{f.label}</span>
                </button>
              );
            })}

            {/* 健康计划（弹窗，组件在 App 层渲染） */}
            <button
              type="button"
              onClick={onOpenHealthPlan}
              className="group flex cursor-pointer flex-col items-center py-1 active:scale-95 transition-all duration-200 ease-out"
            >
              {/* 红黄搭配（2026-10-29）：健康计划圆改品牌金黄底黑图标，
                  与服务中心的红/黄图标圆呼应；其余功能圆保持青柠不动。 */}
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FDCF29] text-black transition-all duration-200 ease-out group-hover:scale-105 group-active:scale-95">
                <Target className="h-5 w-5 stroke-[2.2]" />
              </div>
              <span className="mt-1.5 text-[11px] font-black text-black">健康计划</span>
            </button>
          </div>

          {/* 展开区 —— 高度 0→auto 缓动，内部图标错峰上浮，收起时同步回收 */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="more-features"
                id="me-more-features"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: reduceMotion ? 0 : 0.42, ease: EASE_OUT },
                  opacity: { duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' },
                }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-5 gap-1 border-t border-slate-100 pt-3 text-center">
                  {moreFeatures.map((f, index) => {
                    const Icon = f.icon;
                    return (
                      <motion.button
                        key={f.label}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.32,
                          delay: reduceMotion ? 0 : 0.06 + index * 0.05,
                          ease: EASE_OUT,
                        }}
                        onClick={() =>
                          f.action ? f.action() : onShowToast(f.toast as string)
                        }
                        className="group flex cursor-pointer flex-col items-center py-1 active:scale-95 transition-all duration-200 ease-out"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C7F665] text-black transition-all duration-200 ease-out group-hover:scale-105 group-active:scale-95">
                          <Icon className="h-5 w-5 stroke-[2.2]" />
                        </div>
                        <span className="mt-1.5 text-[11px] font-black text-black">{f.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ⑤ 邀请好友 —— 2026-10-19 换成用户给的「邀请好友 得 9.9元」banner
            沿革：黑卡 + NEW 斜标签 + `invite-art-slot` 空插画位
                 → 2026-10-15 `/invite-card.png`（那张画的其实是「我的订单·您有 2 笔」）
                 → 2026-10-19 `/invite-banner.png`（现在这张，才是真的邀请好友）
            ⚠️ 为什么是**透明底 PNG** 而不是裁好边就完事：
               素材 1024×447 里黑卡只有 991×190，但**吉祥物的耳朵/皇冠高出卡片上边缘 54px**，
               NEW 斜标签也向左探出卡片 14px，两者都压在白底上。按卡片裁 → 皇冠被削平；
               按内容裁 → 卡片上方留白边，而页面底色是 #F4F6F8，白边一眼可见。
               所以 `scripts/make-invite-banner.mjs` 从四边 flood fill 把白底抠透明（阈值 240，
               只清外部，卡内的白字/高光不受影响），再按内容包围盒导出 764×186。
            ⚠️ 阴影用 `filter: drop-shadow(0 4px 16px …)`，**不能用 `box-shadow`**：box-shadow 只会画出
               一个矩形投影（形状对不上出界的吉祥物和斜标签），drop-shadow 才贴合透明轮廓。
               几何参数与页面其它卡（`0 4px 16px`）同一套，只是不透明度取 0.10 而非白卡的 0.06 ——
               卡面是纯黑 + 高饱和青柠，同参数在浅灰底上根本看不出立体感（0.06 实测边缘只暗 10/255）。
               0.16 试过，用户反馈"太明显"，所以定在 0.10。调轻/调重只改这一个数字，hover 同步改 0.16。
            ⚠️ 容器**不能加 `overflow-hidden` / `rounded-[24px]`**：
               会把出界的吉祥物裁掉。
               卡片自身的圆角已经烘在图里（≈7.6px 渲染值，比页面其它卡的 24px 方一点，
               这是素材固有色，要统一得重绘素材）。
            ⚠️ 382 宽卡位里渲染成 382×93（黑卡本体约 72 高）。吉祥物向上出界约 21px，
               和上面「我的功能」的 14px 间距会有约 7px 重叠 —— DOM 顺序在后，会盖在上层，看着是压叠效果。
            `public/invite-card.png` 保留未删，回退改 src 即可。 */}
        <div
          onClick={() => onShowToast('邀请链接已复制，好友首单立享 9.9 元新人特权！')}
          className="cursor-pointer select-none transition-all duration-200 active:scale-[0.98] drop-shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:drop-shadow-[0_6px_20px_rgba(0,0,0,0.16)]"
        >
          <img
            src="/invite-banner.png"
            alt="邀请好友 得 9.9 元 · 新朋友首餐享专属福利"
            className="block h-auto w-full"
            draggable={false}
           loading="lazy" decoding="async" />
        </div>

        {/* ⑥ 送礼品卡 */}
        <div className="rounded-[24px] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[17px] font-black leading-none text-black">送礼品卡</h3>
            <button
              type="button"
              onClick={() => onShowToast('礼品卡商城：支持微信一键赠礼与企业大额采购')}
              className="py-1 -my-1 flex items-center text-[12px] font-bold text-slate-500 transition-colors hover:text-black"
            >
              <span>查看全部</span>
              <ChevronRight className="h-3.5 w-3.5 stroke-[2.8]" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 礼品卡 1 —— 青柠特调卡 */}
            <div
              onClick={() => onShowToast('已选择【元气轻享卡·¥50】，可直接赠送好友！')}
              className="group flex cursor-pointer flex-col items-center active:scale-95 transition-all duration-200 ease-out"
            >
              <div className="relative aspect-[1024/765] w-full overflow-hidden rounded-[14px] bg-[#BCEA01]/10 border border-black/5 shadow-xs transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                <img
                  src="/assets/aistudio/c1f79b62d1ca498e793e833537789423_c1b98b67.jpg"
                  alt="元气轻享礼品卡"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  draggable={false}
                 loading="lazy" decoding="async" />
              </div>
              <span className="mt-2 text-[12px] font-black text-black">元气轻享卡</span>
            </div>

            {/* 礼品卡 2 —— 经典黑曜卡 */}
            <div
              onClick={() => onShowToast('已选择【心动特饮卡·¥100】，可直接赠送好友！')}
              className="group flex cursor-pointer flex-col items-center active:scale-95 transition-all duration-200 ease-out"
            >
              <div className="relative aspect-[1024/765] w-full overflow-hidden rounded-[14px] bg-zinc-950 border border-black/10 shadow-xs transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                <img
                  src="/assets/aistudio/b620c46b437e79bc2a82adb8b5ca2054_c3436860.jpg"
                  alt="心动特饮礼品卡"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  draggable={false}
                 loading="lazy" decoding="async" />
              </div>
              <span className="mt-2 text-[12px] font-black text-black">心动特饮卡</span>
            </div>
          </div>
        </div>

        {/* ⑦ 退出登录 */}
        {user.isLoggedIn && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white py-3 text-xs font-black text-black shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 ease-out hover:bg-black hover:text-[#C7F665] active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4 stroke-[2.5]" />
              <span className="pill-label">退出登录 / 切换账号</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
