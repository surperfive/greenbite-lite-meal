import React from "react";
import { Home, UtensilsCrossed, Sparkles, ReceiptText, Smile } from "lucide-react";

interface BottomNavBarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  cartCount: number;
  ongoingOrdersCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  ongoingOrdersCount = 1
}) => {
  const tabs = [
    { id: "home", label: "首页", icon: Home },
    { id: "menu", label: "点餐", icon: UtensilsCrossed },
    /* 「今日抽卡」→「十鲜盲盒」（2026-10-30 用户「今日抽卡改成十鲜盲盒」）：
       抽卡页头图原本就印着「十鲜能量盲盒」，名字对不上才改的 —— 现在名称、
       头图、玩法（集满 10 款免配送费）三处终于同一个词。
       ⚠️ 仍是 4 个字，11px 下 44px 宽，五等分 tab（≈73px）够放，不会换行。 */
    { id: "gacha", label: "十鲜盲盒", icon: Sparkles },
    /* 计数徽章只在**真的有进行中订单**时才挂。
       2026-10-30 修：原写法 `ongoingOrdersCount > 0 ? ongoingOrdersCount : 1`
       在 0 单时仍然显示 `1` —— 小红点成了常驻装饰，订单全做完还在亮。
       规范口径（ui-ux-pro-max §Color is not the only indicator / §语义正确优先）：
       徽章是**状态指示**，不是品牌元素，数值必须与真实状态一致，宁可没有。
       ⚠️ 如果演示需要常驻红点，改这里而不是改调用方。 */
    {
      id: "orders",
      label: "订单",
      icon: ReceiptText,
      badge: ongoingOrdersCount > 0 ? ongoingOrdersCount : undefined
    },
    { id: "me", label: "我的", icon: Smile }
  ];

  return (
    <nav
      aria-label="底部导航"
      className={`${
        activeTab === 'gacha' ? 'relative' : 'absolute bottom-0'
      } inset-x-0 z-40 bg-white rounded-t-[22px] pt-1.5 safe-pb-tight px-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] ${
        activeTab === 'gacha' ? 'border-t border-[#C7F665]/50' : 'border-t border-slate-100'
      } select-none`}
      id="main-bottom-navigation-bar"
    >
      {/* ⚠️ 2026-10-25 修「内容被导航切一半」：这条 nav 原来是 `bg-white/95 + backdrop-blur-md`，
             内容从下面滚过时**既看得见、又只看得到 5%**，字形断口正好落在条顶，
             观感像渲染 bug（用户截图：礼品卡 "Fresh" 被切成两半，条子里还有一层淡黄鬼影）。
             改成**纯白实心**（去掉 /95 与 backdrop-blur）：半透明在这里只产生鬼影，没有任何收益。
          ⚠️ 试过在条子上沿加 24px 白→透明渐隐来"软化"断口，**效果更差**：
             渐隐压住的是条子上方**本该正常显示的内容**（礼品卡底部被糊成一片雾），
             所以这层不要加回来。内容是「滑到条子底下消失」，不是「渐隐消失」。 */}

      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center cursor-pointer select-none transition-transform duration-200 ease-out active:scale-95 group py-0.5"
              id={`nav-tab-${tab.id}`}
            >
              {/* Icon container */}
              <div className="relative flex items-center justify-center w-7 h-7 text-black">
                {/* 选中态：沿图标线条形状的绿色外描边 —— 底层同款图标用更粗的
                    青柠 stroke 垫底，上层黑图标盖住内部，露出的就是「形状外描边」。
                    ⚠️ 不是给按钮加 ring 外框（用户明确否掉过）。 */}
                {isActive && (
                  <Icon
                    className="absolute h-5 w-5 stroke-[4.5] text-[#C7F665]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={`relative w-5 h-5 transition-transform ${
                    isActive
                      ? "text-black stroke-[2.4] scale-105"
                      : "text-slate-400 stroke-[1.8] group-hover:scale-105 group-hover:text-slate-700"
                  }`}
                />
                {/* 计数红点：品牌粉 #EC4899 → 正红 #E60012 → 玫红 #FC259B（2026-10-27
                    「所有红色改成 #fc259b」）→ **#FC5294**（2026-10-28 晚「所有红色
                    改成 #fc5294」，此后不再有深色档）。
                    ⚠️ 字是**白**的（2026-10-28 晚用户圈着这颗徽章说「里面黑色都改成白色」）：
                       白对 #FC5294 只有 3.10:1，10px 严格来说不过 AA；
                       中间曾换成近黑 #070906（6.77:1）被用户否掉 —— 视觉上要的就是
                       「粉底白字」这颗经典小红点，**别再改回黑字**。
                    全项目只有这一处和 FloatingCart 那处是「小红点」。 */}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#FC5294] text-white text-[10px] font-black flex items-center justify-center shadow-2xs border border-white leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] tracking-tight mt-0.5 leading-tight ${
                  isActive ? "text-black font-black" : "text-slate-500 font-medium group-hover:text-slate-800"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

