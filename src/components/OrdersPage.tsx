import React, { useRef, useState } from 'react';
import { Order, OrderStatus } from '../types';
import { DishCoverArt } from './DishCoverArt';
import {
  Clock,
  Bike,
  Store,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Utensils,
  MapPin,
  Sparkles,
  ChevronRight,
  Truck,
  Bell,
  Search,
  X
} from 'lucide-react';

interface OrdersPageProps {
  orders: Order[];
  onReorder: (order: Order) => void;
  onShowToast: (msg: string) => void;
  onNavigate: (tab: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  onReorder,
  onShowToast,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'done'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  // 2026-10-29 20:38 用户「这个发票改成搜索」：右侧胶囊从「发票」改成「搜索」。
  // 输入框是实时过滤（onChange 直接 setSearchKeyword），所以按钮不做提交，
  // 只负责聚焦输入框（移动端唤起键盘）—— 这是这一排唯一还缺的动作。
  const searchInputRef = useRef<HTMLInputElement>(null);

  const ongoingOrdersCount = orders.filter(
    (o) => o.status === 'delivering' || o.status === 'cooking' || o.status === 'ready' || o.status === 'pending'
  ).length;

  const filteredOrders = orders.filter((order) => {
    // 1. Status Tab filter
    if (activeTab === 'ongoing') {
      const isOngoing =
        order.status === 'delivering' ||
        order.status === 'cooking' ||
        order.status === 'ready' ||
        order.status === 'pending';
      if (!isOngoing) return false;
    } else if (activeTab === 'done') {
      if (order.status !== 'completed') return false;
    }

    // 2. Search Keyword filter
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return true;

    const matchOrderNo = order.orderNo?.toLowerCase().includes(keyword);
    const matchId = order.id?.toLowerCase().includes(keyword);
    const matchStore = order.storeName?.toLowerCase().includes(keyword);
    const matchStatusText = order.statusText?.toLowerCase().includes(keyword);
    const matchItems = order.items?.some(
      (item) =>
        item.dish?.name?.toLowerCase().includes(keyword) ||
        item.dish?.tags?.some((t) => t.toLowerCase().includes(keyword))
    );

    return matchOrderNo || matchId || matchStore || matchItems || matchStatusText;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivering':
        return (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs flex-shrink-0 select-none">
            <Truck className="w-3 h-3 text-black stroke-[2.2]" />
            <span className="pill-label text-[11px] font-black text-black leading-none">配送中</span>
            <ChevronRight className="w-3 h-3 text-black stroke-[2.5] -mr-0.5" />
          </div>
        );
      case 'cooking':
        return (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs flex-shrink-0 select-none">
            <Clock className="w-3 h-3 text-black stroke-[2.2]" />
            <span className="pill-label text-[11px] font-black text-black leading-none">制作中</span>
            <ChevronRight className="w-3 h-3 text-black stroke-[2.5] -mr-0.5" />
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs flex-shrink-0 select-none">
            <Store className="w-3 h-3 text-black stroke-[2.2]" />
            <span className="pill-label text-[11px] font-black text-black leading-none">待取餐</span>
            <ChevronRight className="w-3 h-3 text-black stroke-[2.5] -mr-0.5" />
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs flex-shrink-0 select-none">
            <CheckCircle2 className="w-3 h-3 text-black stroke-[2.2]" />
            <span className="pill-label text-[11px] font-black text-black leading-none">已完成</span>
            <ChevronRight className="w-3 h-3 text-black stroke-[2.5] -mr-0.5" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-full bg-[#F4F6F8] text-slate-900 pb-28 select-none">
      {/* 1. Order Search Bar & Status Filter Tabs Header (已移除原Banner底图，替换为高效订单搜索栏)
          ⚠️ 2026-10-28「订单页面给顶部多预留一些空间」：`pt-3`(12) → **`pt-6`(24)**。
          ⚠️ 2026-11-02「上面多留点空余」：`pt-6`(24) → **`pt-9`(36)**，再往上加 12px。
          ⚠️ 2026-11-03 22:50「搜索栏及以下都继续向下移动，不要跟右上角的叠到一起」：
             `pt-9`(36) → **`pt-12`(48)**。实测原来搜索栏顶边 = 胶囊底边（**间距 0**），
             且「搜索」按钮右缘 408 与胶囊右缘 408 严丝合缝对齐，视觉上就是叠在一起。
             改后：搜索栏顶 48 / 胶囊底 36，净空 **12px**。
          ⚠️ 胶囊是 App 层 `absolute right-3 top-2.5` 实测 73.4×26（底边恒在 36），
             所以 48 这个值不能随便往下调 —— 调到 44 就只剩 8px，会被看成贴在一起。
          订单页没有 HeaderBar（2026-10-28 那张门店/配送方式条已整行移除），
          搜索栏是这一页**唯一贴到壳顶的元素**，留白不足会显得"顶上去"了。
          ⚠️ 这个 header 是 `sticky top-0`，改 pt 等于改吸顶后的整体高度 —— 滚动时
             白块会一直是同样的顶留白，和未滚动时一致，不会跳。 */}
      <div className="bg-white px-3 pt-12 pb-2.5 border-b border-slate-200/80 shadow-2xs sticky top-0 z-20 space-y-2.5">
        {/* Search Input Row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[2.2]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索菜品名称、订单号、门店..."
              className="w-full bg-[#F4F6F8] hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 text-xs font-bold pl-9 pr-8 py-2 rounded-full border border-slate-200/60 focus:border-black focus:outline-none transition-all duration-150"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 w-4.5 h-4.5 rounded-full bg-slate-300 hover:bg-slate-400 flex items-center justify-center text-white active:scale-90 transition-transform"
                title="清除输入"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}
          </div>

          {searchKeyword.trim() ? (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="text-xs font-black text-black px-1.5 py-1 active:scale-95 flex-shrink-0"
            >
              取消
            </button>
          ) : (
            <button
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              className="flex items-center gap-1 bg-[#F4F6F8] hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-full text-[11px] font-bold border border-slate-200 flex-shrink-0 active:scale-95 transition-all"
            >
              <Search className="w-3 h-3 text-slate-600" />
              <span className="pill-label">搜索</span>
            </button>
          )}
        </div>

        {/* Filter Tab Buttons with High-Contrast Bold Theme
            ⚠️ 2026-10-28「去掉这些括号」：三个 tab 后面的 `(2)` / `(1)` / `(1)` 计数整块删掉了
               （不是只删括号留数字 —— 光留数字会读成标签的一部分，比括号更怪）。
               `进行中` 那颗的青柠呼吸点**保留**：它是"有进行中订单"的实时提示，
               和计数不是一回事，删了就看不出进行中有没有单了。
               ⚠️ 删计数后 `ongoingOrdersCount` 仍被那颗点用着，别顺手删变量。 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 ${
              activeTab === 'all'
                ? 'bg-black text-[#C7F665] shadow-xs scale-[1.02] border border-transparent'
                : 'bg-[#F4F6F8] text-slate-600 hover:text-black border border-slate-200/80'
            }`}
          >
            <span className="pill-label">全部</span>
          </button>

          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 ${
              activeTab === 'ongoing'
                ? 'bg-black text-[#C7F665] shadow-xs scale-[1.02] border border-transparent'
                : 'bg-[#F4F6F8] text-slate-600 hover:text-black border border-slate-200/80'
            }`}
          >
            <span className="pill-label">进行中</span>
            {ongoingOrdersCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#C7F665] inline-block animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('done')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 ${
              activeTab === 'done'
                ? 'bg-black text-[#C7F665] shadow-xs scale-[1.02] border border-transparent'
                : 'bg-[#F4F6F8] text-slate-600 hover:text-black border border-slate-200/80'
            }`}
          >
            <span className="pill-label">已完成</span>
          </button>

          {/* Search Result Count Tag if actively searching */}
          {searchKeyword.trim() && (
            <div className="ml-auto text-[11px] font-bold text-slate-500">
              找到 <span className="text-black font-black">{filteredOrders.length}</span> 单
            </div>
          )}
        </div>
      </div>

      {/* 2. Orders Content List Area */}
      <div className="px-3 space-y-2.5 mt-2.5">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-[20px] p-6 text-center shadow-xs flex flex-col items-center justify-center my-3">
            <div className="w-12 h-12 rounded-[16px] bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              {searchKeyword.trim() ? (
                <Search className="w-5 h-5 stroke-[2.2] text-slate-500" />
              ) : (
                <Utensils className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <h3 className="text-sm font-black text-black">
              {searchKeyword.trim() ? '未找到匹配的订单' : '暂无相关订单记录'}
            </h3>
            <p className="text-[11px] text-slate-500 font-bold mt-1 max-w-xs">
              {searchKeyword.trim()
                ? `未找到与“${searchKeyword.trim()}”相关的菜品、门店或单号`
                : '新鲜时蔬低卡轻食，今日点单满减优惠券已到账'}
            </p>
            {searchKeyword.trim() ? (
              <button
                onClick={() => setSearchKeyword('')}
                className="mt-3.5 px-4 py-1.5 rounded-full bg-black hover:bg-black/90 text-[#C7F665] text-xs font-black active:scale-95 transition-all duration-150"
              >
                清空搜索关键词
              </button>
            ) : (
              <button
                onClick={() => onNavigate('menu')}
                className="mt-3.5 px-5 py-2 rounded-full bg-black hover:bg-black/90 text-[#C7F665] text-xs font-black shadow-none active:scale-95 transition-all duration-200 ease-out flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C7F665]" />
                <span>去选一单美味</span>
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isOngoing = order.status === 'delivering' || order.status === 'cooking' || order.status === 'ready';
            const totalItemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white rounded-[20px] p-2.5 shadow-xs space-y-2 hover:shadow-md transition-all duration-200 relative overflow-hidden"
              >
                {/* Top Lime-Green Header Band
                    ⚠️ 用户要求「取消渐变、改纯绿」：原来是 from-#C7F665 via-#E4F8BC/75 to-transparent
                       的渐隐晕染，顶部深、往下化开；现在是一整条**纯色**青柠带，边界停在 h-9
                       的下沿，是硬边不是渐隐 —— 这是用户要的观感，不要"顺手"把它改回渐变。
                    ⚠️ 高度必须 h-9（36px）而**不是**原来的 h-11（44px）：渐变时 39→44px 已经淡到
                       几乎透明，压在菜品缩略图上也无感；换成纯色后这 5px 会把缩略图顶部"啃"掉
                       一块（实测缩略图 top = 39px、色带 bottom = 44px）。36px 卡在
                       店名行（10–31）与缩略图（39–85）之间，上下各留 5px / 3px 白，硬边才不压图。
                    ⚠️ 纯色块依赖卡片容器的 rounded-[20px] + overflow-hidden 裁圆角，
                       别给卡片去掉 overflow-hidden，否则四个角会露出直角。 */}
                <div className="absolute top-0 inset-x-0 h-9 bg-[#C7F665] pointer-events-none z-0" />

                {/* 1. Order Card Header: Courier Silhouette, Store Name, Mode Tag & Status Badge */}
                <div className="flex items-center justify-between relative z-10 pt-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Delivery Scooter Silhouette Icon */}
                    <svg
                      viewBox="0 0 28 20"
                      className="w-4.5 h-3.5 text-black flex-shrink-0"
                      fill="currentColor"
                    >
                      <circle cx="13.5" cy="4" r="2.8" />
                      <path d="M7.5 9.5c0-1.1.9-2 2-2h3.5c1.1 0 2 .9 2 2v4.5h-7.5V9.5z" />
                      <path
                        d="M14 7l4.5 2.2M16.5 7l2.2 4.5 2.3 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <path
                        d="M5 16h16"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.5 12a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zm0 2a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6z"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M21 12a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zm0 2a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6z"
                      />
                    </svg>

                    <span className="font-black text-black text-[14px] tracking-tight truncate">
                      {order.storeName}
                    </span>
                    <span className="text-[12px] font-extrabold text-[#54801A] whitespace-nowrap ml-0.5">
                      ({order.mode === 'takeout' ? '外卖' : '自提'})
                    </span>
                  </div>

                  {getStatusBadge(order.status)}
                </div>

                {/* 2. Order Dish Thumbnails, Name, Subtitle & Highlighted Price */}
                <div className="flex items-center gap-2 relative z-10 pt-0">
                  {/* Dish photo container - compact rounded rectangle */}
                  {/* ⚠️ 2026-10-24 用户两轮连续"增大商品图"：
                      66×46 → 78×54（+18%）→ **84×62**（本轮再 +24%）。
                      · 宽度只 +6（78→84）：菜品名列实测 214px 仍够排 ~13 个 13px 黑体字，
                        再加宽会重演上一轮警告过的截断问题。为把这 6px 找补回来，本行
                        gap-2.5 → gap-2（10→8px），列宽净损失压到 ~4px。
                        ⚠️ ord_101 是双品长名（「牛油果鸡胸沙拉 ×1 + 金枪鱼三明治 ×1」≈260px），
                        truncate 从 66px 缩略图那代就存在，不是本次回归；单品 ord_102 不截断。
                      · 高度 +8（54→62）：只向下长（39→101），顶部青柠带 h-9（底 36px）
                        仍有 3px 白；状态横幅由 space-y-2 自动顺延，不会相撞。
                      · 圆角随尺寸等比 15 → 17；多品订单对半切后每格 42×62（≈0.68），
                        与改前同比例区间，object-cover 裁切构图基本不变。 */}
                  {/* ⚠️ 2026-10-25 用户：「这个改成两个框」—— 多品订单原来是**一个大框对半切**
                      （84×62 的容器里两半各 42×62，中间一条 `border-r`），看起来是"一张图被劈开"，
                      不是两张商品图。现在改成**两个独立小框**：各自有圆角和边框，中间留 2px 间隙。
                      总占位仍是 84×62（41 + 2 + 41），不影响右侧菜名/价格的列宽。
                      ⚠️ 单个框的圆角用 **10** 而不是整体那个 17 —— 框只有 41 宽，
                        12 就已经把左右边缘完全圆弧化、两只并排像两颗胶囊；
                        10 保留了「小卡片」的方感（整体框的圆角率 17/62≈27%，41 宽按同比例是 11，
                        但窄框视觉上更软，所以再压 1）。
                      ⚠️ 多品只显示前两个（原来也是固定取 [0]/[1]），第三个开始靠菜名那行文字兜住。 */}
                  {/* ⚠️ 2026-10-25 用户：「这些商品的背景图都换成点餐的」——
                      缩略图从实拍图 `dish.image`（图里烘焙了各自浅色底）换成 `DishCoverArt`
                      的 **cover 模式**（品类色块铺满 + 抠图食物居中）。
                      ⚠️ 这两个容器都不是正方形（84×62 / 41×62），不能套正常构图：
                        正常构图下色块只占 68% 高、还会被百分比偏移推歪，露一大片白。
                        cover 模式把色块拉到铺满、食物只居中 contain，小尺寸下才读得成"一块品类色"。
                      ⚠️ 别在这里改回 `DishImage`：实拍图是烘焙底的 JPG，方形底会把色块整块盖住。 */}
                  {order.items.length > 1 ? (
                    <div className="flex flex-shrink-0 items-center gap-0.5">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div
                          key={idx}
                          className="h-[62px] w-[41px] flex-shrink-0 overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-2xs"
                        >
                          <DishCoverArt dish={item.dish} size={62} cover coverAspect={41 / 62} hideNutrition fluid />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative flex h-[62px] w-[84px] flex-shrink-0 overflow-hidden rounded-[17px] border border-slate-200 bg-white shadow-2xs">
                      {order.items[0] && (
                        <DishCoverArt dish={order.items[0].dish} size={84} cover coverAspect={84 / 62} hideNutrition fluid />
                      )}
                    </div>
                  )}

                  {/* Dish Title & Meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-black truncate leading-tight tracking-tight">
                      {order.items.map((i) => `${i.dish.name} ×${i.quantity}`).join(' + ')}
                    </p>
                    {/* 时间戳是售后 / 复购最常回看的信息，原来是 #8a92a0 的 3.13:1
                        配 10.5px —— 色浅字号小，双重不合格。色值提到 #5B6472（约 6:1），
                        字号 10.5→11px，只多 0.5px 行高，卡片高度不变。 */}
                    <p className="text-[11px] text-[#5B6472] font-bold mt-0.5 tracking-tight">
                      {order.createdAt.includes('下午') || order.createdAt.includes('上午')
                        ? order.createdAt
                        : `${order.createdAt} 下午`}{' '}
                      · 共 {totalItemsCount} 件
                    </p>
                  </div>

                  {/* Price in Classic Vibrant Red (#FC5294)
                      ⚠️ 位置 = `self-end`，即**贴到本行（62px 缩略图行）的底部**，不是垂直居中。
                      · 2026-10-27 `translate-y-[2px]`、2026-10-28 再调到 4px —— 都是"微调居中"，
                        只能让价格和左侧两行文字对齐在同一条视觉基线上。
                      · 2026-10-28 用户给出红框（「将价格移至红框位置」）：红框 = 缩略图行底部
                        到状态横幅之间的那块留白（实测 30px 高，y 60–89，横幅顶 91）。
                        说明价格不该跟文字块居中，而该落到本行**底部**、和缩略图底边齐平。
                        这是布局意图的变化，所以不用 translate（位移仍是"居中后再推"，
                        换个字号就会错位），直接把该列的交叉轴对齐改成 `self-end`。
                        实测墨迹中心从 y≈52 落到 y≈73.5，红框中心 74.5，落在框内。
                      ⚠️ 别改回 translate：`translate-*` 不参与布局，父行高度变化时不会自纠正。
                      ⚠️ Tailwind 4 的 `translate-y-*` 输出的是 `translate` 属性而非 `transform`，
                        所以 `getComputedStyle().transform` 会显示 none，排查时看 `.translate`。 */}
                  <div className="flex items-end gap-1 flex-shrink-0 pb-0 self-end">
                    <span className="text-[10px] text-slate-500 font-bold leading-none pb-0.5">实付</span>
                    <div className="flex items-baseline leading-none text-[#FC5294]">
                      <span className="text-[11px] font-black mr-0.5">¥</span>
                      <span className="text-[21px] font-black tracking-tight">
                        {order.total.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Status Notice Banner - Soft Lime Tint with Clock & Chevron */}
                <div
                  className={`py-1.5 px-2.5 rounded-[11px] flex items-center justify-between text-[12px] transition-colors relative z-10 ${
                    order.status === 'delivering'
                      ? 'bg-[#E4F8BC] text-black font-black'
                      : order.status === 'cooking'
                      ? 'bg-[#fef9c3] text-black font-black'
                      : order.status === 'ready'
                      ? 'bg-[#E4F8BC] text-black font-black'
                      : 'bg-[#f4f7fa] text-slate-800 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="w-3 h-3 text-black stroke-[2.2] flex-shrink-0" />
                    <span className="truncate text-[12px] font-black text-black leading-none">
                      {order.statusText}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                    <span className="text-[12px] font-black text-black whitespace-nowrap leading-none">
                      {order.estimatedTime}
                    </span>
                    <ChevronRight className="w-3 h-3 text-black stroke-[2.6]" />
                  </div>
                </div>

                {/* 4. Action Buttons Row - Exact Match to Reference Image with Compact Height */}
                <div className="flex items-center gap-1.5 pt-0 relative z-10">
                  {order.status === 'delivering' && (
                    <button
                      onClick={() => onShowToast('骑手正在全速派送中，预计 10 分钟内送达！')}
                      className="flex-1 h-7.5 px-2.5 rounded-full bg-white border border-slate-200 flex items-center justify-center gap-1 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-black fill-black flex-shrink-0" />
                      <span className="pill-label text-[11px] font-black text-black whitespace-nowrap">
                        查看骑手位置
                      </span>
                    </button>
                  )}

                  {order.status !== 'completed' && (
                    <button
                      onClick={() => onShowToast('已为您向门店加急催单，后厨正在优先制作！')}
                      className="h-7.5 px-3 rounded-full bg-[#FDCF29] flex items-center justify-center gap-1 shadow-2xs hover:bg-[#F2B705] active:scale-95 transition-all duration-200 ease-out cursor-pointer"
                    >
                      <Bell className="w-3 h-3 text-black fill-black flex-shrink-0" />
                      <span className="pill-label text-[11px] font-black text-black whitespace-nowrap">
                        加急催单
                      </span>
                    </button>
                  )}

                  {/* ⚠️ 顺序是「去评价（白，flex-1）在左 → 再来一单（黑）在右」（2026-10-24 对调）。
                      flex 里 flex-1 会吃掉剩余宽度，所以谁是 flex-1 谁就该放前面，
                      否则白按钮会把黑按钮挤到最左、右侧留一条空白。 */}
                  {order.status === 'completed' && (
                    <button
                      onClick={() => onShowToast('感谢评价！已赠送 50 会员积分')}
                      className="flex-1 h-7.5 px-3 rounded-full border border-slate-200 bg-white text-black text-[11px] font-black hover:bg-slate-50 active:scale-95 transition-all duration-200 ease-out shadow-2xs flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3 stroke-[2.2]" />
                      <span className="pill-label">去评价</span>
                    </button>
                  )}

                  <button
                    onClick={() => onReorder(order)}
                    className="h-7.5 px-3 rounded-full bg-black flex items-center justify-center gap-1 shadow-xs hover:bg-black/90 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-[#C7F665] stroke-[2.6] flex-shrink-0" />
                    <span className="pill-label text-[11px] font-black text-[#C7F665] whitespace-nowrap">
                      再来一单
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

