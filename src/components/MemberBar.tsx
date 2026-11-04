import React from 'react';
import { ChevronRight, UserRound } from 'lucide-react';
import { UserProfile } from '../types';

/**
 * 首页「身份条」—— 骑在 hero 海报与四宫格交界线上的一条 42px 小栏。
 *
 * 2026-10-27 用户：「在我圈中的部分加入一个小栏，用于角色登录，或显示角色登录状态，
 * 最高质量，参考优秀作品」→ 底色先淡青柠、再纯白、最后「把登录栏改成绿色」。
 *
 * 参考作品（瑞幸 / 美团 / 叮咚的首页身份条）的共性，也是这版的四条取舍：
 *   ① **只占一行**，绝不抢 hero 与功能入口的重量 —— 高度压到 42px（入口卡 125 的 34%）；
 *   ② **左头像 / 中身份 / 右动作** 三段式，动作永远在最右（拇指区）；
 *   ③ 已登录展示**等级 + 升级进度**（这是"身份条"和"普通登录条"的分水岭），
 *      未登录把进度换成一句利益点（登录后能得到什么）；
 *   ④ 底色**青柠 400 `#C7F665` 实底**（2026-10-27「把登录栏改成绿色」）。
 *      首页的青柠权重全部收到这一条上 —— 原来那条「限时超值福利」的青柠底已经改成白卡，
 *      所以全页只剩这一块高饱和绿，视觉焦点明确。
 *      骑缝压在 hero 上。**2026-10-27 定稿：不带黑描边**（用户「去掉黑描边」），
 *      换成 **2px 白色描边**（用户「加上浅色描边」）+ `0 4px 16px rgba(0,0,0,0.10)` 柔影。
 *      ⚠️ 试过浅青柠 `#F2FCE0` 描边：它和卡面 `#C7F665` 太接近，**基本看不见**，
 *      等于没加；白色才有"贴纸压在海报上"的那种分离感。
 *      ⚠️ 为什么是白色而不是"更浅的绿"：这条卡上半压海报、下半压浅灰页面底（≈#F4F6F8）。
 *      白色在两种底上都读得出来（对页面底只差一点点，但足以勾出边），
 *      浅绿在两种底上都糊掉。
 *      ⚠️ 曾经加过 `0 0 0 1.5px #070906` 的硬黑描边，理由是"第三张 banner 是绿底海报，
 *      青柠卡会融进背景"。**用户明确否掉了黑线** —— 宁可轻，也不要一圈黑把整条卡框成"按钮"。
 *      换成白描边后同一个问题解决了，而且不沉。别再改回黑的。
 *      ⚠️ 描边走 `box-shadow` 的 spread 而不是 `border`，**不占布局**，高度仍是 42。
 *
 * 配色规则（青柠实底上只有三种颜色，别再加第四种）：
 *   · **黑 `#070906`** —— 昵称、进度条填充、chevron、登录按钮底
 *   · **白** —— 头像底圈、等级胶囊底、未登录头像圆
 *   · **黑 / 半透明黑** —— 次要文字走 `text-black/55`、分母 `text-black/60`、chevron 55%
 *     ⚠️ 分母原为 40%，在青柠底上只有 2.77:1（审计 P1）；提到 60% 后约 5.0:1，
 *        视觉上仍明显轻于前面的主数字（纯黑），层级没丢。
 *   ⚠️ 青柠 400 不能当文字（白底/黑底上都不行），但**当卡面底完全没问题**，
 *      它上面的黑字对比度约 17:1，是全站最稳的一组。
 *   ⚠️ 等级胶囊走**黑底黄字 `#FDCF29`**（2026-10-27「黄金会员改成黄字」，和页头币胶囊
 *      完全同款）。试过白底黑字：白胶囊 + 白头像圈 + 白按钮在青柠卡上连成三块白，太亮；
 *      试过浅金底：青柠面上金色发脏。黑胶囊被头像白圈隔开，不会和黑头像粘成一块。
 *   ⚠️ 次要文字别用青柠 900 `#26430B` 半透明：同色相叠在青柠底上会"发闷"，
 *      中性黑透明度反而干净。
 */
interface MemberBarProps {
  isLoggedIn: boolean;
  user?: UserProfile;
  /** 未登录：拉起登录弹窗 */
  onOpenLogin: () => void;
  /** 已登录：进「我的」页看会员中心 */
  onOpenProfile: () => void;
}

export const MemberBar: React.FC<MemberBarProps> = ({
  isLoggedIn,
  user,
  onOpenLogin,
  onOpenProfile,
}) => {
  const name = user?.name ?? '轻食星人';
  const level = user?.level ?? '普通会员';
  const points = user?.points ?? 0;
  const nextLevelPoints = user?.nextLevelPoints ?? 1000;
  // 升级进度：只用来画条，夹在 6~100 —— 0 会让进度条整根消失（看起来像坏了），
  // 100 留着不动，因为"已满"另有文案，不靠条长表达。
  const rawPct = nextLevelPoints > 0 ? (points / nextLevelPoints) * 100 : 0;
  const pct = Math.max(6, Math.min(100, Math.round(rawPct)));
  const restPoints = Math.max(0, nextLevelPoints - points);

  return (
    /* ⚠️ `min-h-[42px]` 是两种状态的**高度锚**：已登录内容 34（头像 img 32 + 白圈 p-[1px]×2）、
       未登录内容 34（13 + mt 3 + 17 圆撑到 34），不锁高的话登录/退出时这条栏会跳，把下面四宫格整体顶一下。
       ⚠️ **高度由头像决定**（34 + py 4×2 = 42），文字块只有 22，
       所以想再压矮必须先缩头像，光调 py 没用（py 压到 0 也还有 34）。
       HomePage 里骑缝的 `-mt-[21px]` 必须永远等于这条栏高度的一半。
       📌 沿革 53 → 46（2026-10-27「高度太高了」）→ 42（同日「缩小」）
          → 46（2026-10-28「适当扩大胶囊内的内容」）→ 40 → 34
          → 30（2026-10-29「缩小一点」：头像 26→24、py 3→2、圆角 17→15）
          → 36（2026-10-30 14:26「调高这个组件」：头像 24→28、py 2→3、圆角 15→18、
          骑缝 15→18；文字字号仍一个没动）
          → **42**（2026-11-03 18:05「调高这个组件」：头像 28→32、py 3→4、圆角 18→20、
          骑缝 18→21；文字字号仍一个没动）。
          ⚠️ 2026-11-03 这次是**内容跟着一起放大**，不是只加内边距 ——
             A/B 过「只加 py 到 5（栏 40、头像仍 28）」：头像会显得缩在框里，
             整条看着"虚胖"；头像与栏高同步长才立得住。
          ⚠️ 也 A/B 过 44（头像 32 + py 5）：四张入口卡还在首屏，但整条开始显笨、
             文字块（字号没动）在更高的壳里显小。42 是"明显变高但不虚"的甜点值。
          → **40**（2026-10-28「缩小这个胶囊，但不要缩小里面的内容」）：
          **只收内边距**（py 7.5→4.5、圆角 23→20、骑缝 23→20），
          **里面一个尺寸都没动**（头像 31 / 昵称 15 / 等级胶囊 16 / 积分 13 / 进度条 5 / chevron 16 原样）。
          这是这条栏唯一"只缩壳不缩肉"的改法 —— 内容 31 已经是地板，
          再想矮只能回头缩头像，那就违背用户这次的意图了。
          → **34**（2026-10-28「缩小这个组件」）：
          这次是**整体等比缩一圈**（×0.85），壳和肉一起缩，不再是只收内边距 ——
          头像 30→26（盒子 32→28）、昵称 15→13、等级 10→9、积分 13→11、
          进度条 5→4、chevron 16→14、未登录头像 32→28、
          内边距 py 4→3、px 3→2.5、圆角 20→17、骑缝 20→17。
          白色描边**仍保持 5px**（用户此前连说两次「加粗」，不跟着缩）。 */
    <button
      type="button"
      id="home-member-bar"
      onClick={isLoggedIn ? onOpenProfile : onOpenLogin}
      title={
        isLoggedIn
          ? restPoints > 0
            ? `积分 ${points}/${nextLevelPoints}，再攒 ${restPoints} 分升级`
            : `积分 ${points}，已是最高等级`
          : '登录后同步会员权益与优惠券'
      }
      aria-label={
        isLoggedIn ? `${name}，${level}，积分 ${points}，进入会员中心` : '登录或注册账号'
      }
      /* 白描边用 `box-shadow` 的 spread 画（`0 0 0 Npx #FFFFFF`），不是 border ——
         border 会吃掉内容盒，加粗会把整条栏撑高、还挤压里面的高度预算；
         box-shadow 向外扩、不参与布局，栏高和宽度（390，与四宫格对齐）完全不变。
         📌 沿革：2px（默认）→ 3px → **5px**（2026-10-28 用户连说两次「加粗白描边」）。
         这条栏骑缝压在活动头图上，头图是黄绿棋盘格 + 咖啡豆的高噪点照片，
         白边太细在花色背景上只剩一条缝，栏和底图会糊在一起；5px 才真正切出一道白界线。
         ⚠️ 再加粗就要先看头图：超过 6px 会开始像给栏套了个白壳，
           且四宫格上方那条骑缝间距视觉上会觉得白边"吃掉"了头图。
         ⚠️ 白边 5px 是**向外**扩的，栏高收到 34 后整块视觉高度是 34 + 5×2 = 44，
           骑缝仍按 34/2 = 17 算（描边不占布局，也不改骑缝基准）。 */
      className="group flex min-h-[42px] w-full items-center gap-2 rounded-[20px] bg-[#C7F665] px-2.5 py-[4px] text-left shadow-[0_0_0_5px_#FFFFFF,0_3px_12px_rgba(0,0,0,0.10)] transition-all duration-200 ease-out hover:shadow-[0_0_0_5px_#FFFFFF,0_5px_16px_rgba(0,0,0,0.14)] active:scale-[0.98]"
    >
      {/* ── 左：头像 ──────────────────────────────────────────────
          已登录用 IP 头像（`user.avatar` = /mascot-avatar.svg，100×100 正圆，
          自带白环 + 黑描边；缩到 32px 后那道白环只剩 ~1.4px，所以在外面再垫一圈白底，
          让黑脸在青柠卡面上"站得住"）。
          未登录用**白圆 + 黑人形线稿**：青柠底上白圆最干净，也不再需要渐变。 */}
      <span className="relative shrink-0">
        {isLoggedIn ? (
          <>
            {/*  ⚠️ 2026-10-28「头像稍微大一点、不要裁剪其他部分」：
                头像 27→30、白圈内边距 2→1（盒子 31→32，**栏高仍 40**，py 由 4.5 收到 4）。
                同日「缩小这个组件」又整体收到 26（盒子 28，栏高 34）——
                那条"白圈总厚度 ≈ 2.3px"的比例关系原样保留，只是等比缩小。
                2026-11-03 随栏高 36→42 放大到 **32**（盒子 34）。
                为什么这么配：白圈总厚度 = SVG 自带白环（4.3/100×32 ≈ 1.38）+ 外层 1px ≈ 2.4px，
                黑脸直径 2×44.2/100×32 ≈ 28.3 ——
                脸大、环细，视觉上就是"头像大"而不是"框厚"。
                ⚠️ 别再靠加 `p-*` 撑大小：SVG 外圈半径 48.5/100，图本身**已经在方框内留了
                   1.5 单位的透明边**，加 padding 只会让白环变厚、脸不变，反而更小。
                ⚠️ `rounded-full object-cover` 保留：SVG 是正方形、圆直径 97/100，
                   裁不到任何部分（耳朵、鼻子都在 r=48.5 以内）。 */}
            <span className="block rounded-full bg-white p-[1px] shadow-[0_1px_4px_rgba(0,0,0,0.14)]">
              <img
                src={user?.avatar || '/mascot-avatar.svg'}
                alt=""
                className="h-[32px] w-[32px] rounded-full object-cover"
               loading="lazy" decoding="async" />
            </span>
            {/* 会员徽章：压在头像右下。青柠底上必须**白底 + 黑描边**才浮得起来
                （原来的青柠底徽章在青柠卡上会直接消失）。

                ⚠️ 整枚徽章用**一个内联 SVG** 画完（圆 + 描边 + 皇冠），不要再用
                `div 圆 + CSS 边框 + TokenIcon` 的组合：小圆（当年 14px，现在 **13px**）上
                1.5px 边框会被 Chrome 按像素取整（左 2 / 右 1），TokenIcon 的 viewBox 又恰好
                让墨迹贴死边界 —— 两者叠加实测皇冠在圆里**偏右 0.44px**，看着就是"没居中"。
                画进同一个坐标系后，圆心 x=14、皇冠 bbox 中心也是 x=14 —— 实测水平偏差
                0.000px、描边精确 1.50px。垂直另见下面的质心对齐说明。

                ⚠️ 皇冠路径 = `TokenIcon.tsx` 那条（`M-12,11 … L12,11 Z`）等比 0.5833
                再平移到圆心：24×22 → 14×12.83。**改 TokenIcon 的形状要同步改这里**，
                否则"抽卡币的皇冠"和"会员徽章的皇冠"就不是同一个形状了。

                ⚠️ **垂直不是按 bbox 居中，而是按质心**（`translate(0,-1.8149)`）。
                皇冠是"底宽顶尖 + 厚底边"，矢量质心在 y=15.81，比 bbox 中心（14）低
                1.81 单位 = 0.9075 css px。只按 bbox 对齐时视觉重量全压在下方，
                看起来是"沉"的（截图实测留白：上 2.50 / 下 2.375，看着却明显偏下）。
                上移后留白变成上 1.50 / 下 3.25，墨迹质心落在圆心（实测 y 偏差 -0.02px）。
                这和抽卡页「9折限时」徽章是同一套算法，别"修正"回 bbox 居中。 */}
            <svg
              viewBox="0 0 28 28"
              className="absolute -bottom-[1px] -right-[1px] h-[13px] w-[13px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
              aria-hidden="true"
            >
              {/* 圆：r 12.4 + stroke 3（居中）→ 外径 27.8（渲染 13px 时 ≈12.9，描边 1.39px），
                  内径 21.8（≈10.1）；留 0.1 单位余量，避免 stroke 外沿被 viewBox 裁掉抗锯齿。
                  ⚠️ 坐标全是 28 单位制，**和渲染尺寸解耦** —— 从 12px 改 13px 只改 className，
                     path/circle 一个数都不用动（这是"画进一个 SVG"换来的）。 */}
              <circle cx="14" cy="14" r="12.4" fill="#fff" stroke="#070906" strokeWidth="3" />
              {/* 皇冠：宽 14 / 高 12.83，bbox 中心 (14,14)；
                  质心对齐再上移 1.8149 单位（见上方注释） */}
              <path
                d="M7,20.42 L7,10.5 L10.5,14 L14,7.58 L17.5,14 L21,10.5 L21,20.42 Z"
                fill="#070906"
                transform="translate(0,-1.8149)"
              />
            </svg>
          </>
        ) : (
          /* ⚠️ 34px = 已登录头像的总高（img 32 + 白圈 p-[1px]×2），两态必须**同高**：
             两态不等高时 `min-h` 兜不住，登录/退出时整条栏会抽一下。
             沿革 32（初版）→ 28（2026-10-27「缩小」）→ 31（2026-10-28「内容扩大」）
             → 32（同日「头像稍微大一点」）→ 28（同日「缩小这个组件」，跟着 img 30→26 走）
             → 26（2026-10-29 跟着 img 26→24 走）→ 30（2026-10-30 跟着 img 24→28 走）
             → **34**（2026-11-03 跟着 img 28→32 走；人形图标 16→17 同步放大，
               否则 34 的白圆里那枚线稿会显得空）。 */
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]">
            <UserRound className="h-[17px] w-[17px] text-[#070906]" strokeWidth={2.6} />
          </span>
        )}
      </span>

      {/* ── 中：身份 + 进度 / 利益点 ─────────────────────────────── */}
      {isLoggedIn ? (
        <span className="flex min-w-0 flex-1 flex-col">
          {/* 第一行：昵称 + 等级（左）／积分（右）。积分放右端而不是第二行，
              是因为第二行只有一根 5px 的条，右端会空出一大块；挪上来后
              「名字·等级 ←→ 积分」形成两端对齐，条独占一行也更长更从容。 */}
          <span className="flex items-baseline gap-1.5">
            <span className="truncate text-[13px] font-black leading-none text-[#070906]">
              {name}
            </span>
            <span className="shrink-0 rounded-full bg-[#070906] px-[6px] py-[2.5px] text-[9px] font-black leading-none text-[#FDCF29]">
              <span className="pill-label">{level}</span>
            </span>
            {/* 积分：9.5 → 11.5 → 13 → **11px**（2026-10-28，最后一跳是「缩小这个组件」）。
                上限由第一行高度决定，不是栏高：昵称 13 / 等级胶囊 14（9 + py2.5×2）/
                积分三者取最大，胶囊仍是最高的那个 —— 第一行高度由它兜住。 */}
            <span className="ml-auto shrink-0 text-[11px] font-black leading-none text-[#070906]">
              {points}
              <span className="font-bold text-black/60">/{nextLevelPoints}</span>
            </span>
          </span>
          {/* 第二行：满宽进度条（4px）。青柠底上用**黑色填充 + 10% 黑轨道**，
              读起来像一条"能量条"，比青柠渐变条有力量得多。
              ⚠️ 4 → 5 是 2026-10-28「内容扩大」时跟头像一起放的；同日「缩小这个组件」
              又回到 4（整条栏 34 高，5px 的条会显得太粗、抢昵称）。 */}
          <span className="mt-[4px] flex h-[4px] w-full overflow-hidden rounded-full bg-black/10">
            <span
              className="h-full rounded-full bg-[#070906] transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </span>
        </span>
      ) : (
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-black leading-none text-[#070906]">
            登录 / 注册
          </span>
          <span className="mt-[3px] truncate text-[10px] font-bold leading-none text-black/55">
            登录后享会员价 · 专属券 · 积分
          </span>
        </span>
      )}

      {/* ── 右：动作（拇指区） ────────────────────────────────────
          已登录只给 chevron（这栏是"状态"不是"任务"，不塞第二个按钮抢视觉）；
          未登录给黑底青柠字胶囊 —— 全站主行动的标准写法，青柠卡面上黑按钮最跳。 */}
      {isLoggedIn ? (
        <ChevronRight
          className="h-[14px] w-[14px] shrink-0 text-[#070906]/55 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-[#070906]"
          strokeWidth={2.8}
        />
      ) : (
        <span className="shrink-0 rounded-full bg-[#070906] px-2.5 py-[5px] text-[10px] font-black leading-none text-[#C7F665] shadow-[0_3px_10px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out group-active:scale-95">
          <span className="pill-label">立即登录</span>
        </span>
      )}
    </button>
  );
};
