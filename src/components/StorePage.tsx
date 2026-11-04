import React from 'react';
import { Store } from '../types';
import { STORES } from '../data/mockData';
import { MapPin, Check, Phone, Clock, Navigation } from 'lucide-react';
import { StickerModal, StickerButton } from './StickerModal';

/**
 * 门店选择 —— 2026-10-28 从「壳内整页」改回「贴纸风弹窗」。
 *
 * 历史（别再翻回去，容易踩旧坑）：
 *   ① 最初是 `StoreModal`（fixed 浮层，跑出手机壳）→ 删；
 *   ② 2026-10-25 改成壳内整页 `StorePage`（App 里 `absolute inset-0 z-[60]` 右滑进入）；
 *   ③ 2026-10-28 用户「切换点开的也换成贴纸风弹窗」→ 改成 `StickerModal`，
 *      和健康计划 / 福利中心 / 邀请好友同一套外壳。
 *
 * ⚠️ 因为改回弹窗，`App.tsx` 里那个包着它的 `motion.div`（右滑 + `absolute inset-0`）
 *    已经移除 —— 留着它的话，子级 `fixed` 会相对这个带 transform 的祖先定位，
 *    弹窗只会铺满手机壳而不是视口，遮罩也压不住底部导航。
 * ⚠️ 选中即返回：点门店直接 `onSelectStore`（App 负责关弹窗 + 提示），所以没有「确认」按钮。
 */
export const StorePage: React.FC<{
  isOpen: boolean;
  currentStore: Store;
  onBack: () => void;
  onSelectStore: (store: Store) => void;
}> = ({ isOpen, currentStore, onBack, onSelectStore }) => {
  if (!isOpen) return null;

  return (
    <StickerModal
      onClose={onBack}
      ariaLabel="选择点餐门店"
      title="选择门店"
      titleSize="xl"
      badge={<MapPin className="h-[30px] w-[30px]" strokeWidth={2.6} />}
      badgeSize="lg"
      badgeBorderWidth={4}
      subtitle="已按距您远近排序，切换门店后价格与配送时效会同步更新"
      /* 2026-11-03 21:33 用户「往右偏居中位置」：4 字标题左对齐时右侧空太多 */
      titleAlign="center"
      scroll
      maxHeight="84vh"
      maxWidth={356}
      /* ⚠️ 2026-11-03 20:50 用户「缩小这个弹窗」。
         只缩**视觉**不缩布局盒：maxWidth 仍是 356，卡片布局宽不变，所以三行说明
         （「已按距您远近排序…」/「门店周边 3km 内支持外卖配送…」）不会因为挤窄而多折
         一行、把卡片顶高 —— 这正是「改 maxWidth 反而更高」的坑。
         实测（scripts/_store-modal-scale-ab.mjs，视口 435×700）：372.3→335.1 宽、
         597.7→537.9 高，左右留白 18.9→37.5，上下 51.1→81，与壳的比例 90.8%→81.7%。
         再小到 0.86 时上下留白 93 就开始显空了，0.9 是这一档的平衡点。 */
      scale={0.9}
      bodyClassName="space-y-2 pb-1"
      footer={
        <StickerButton tone="ink" onClick={onBack}>
          <span>完成</span>
        </StickerButton>
      }
    >
      {STORES.map((store) => {
        const isSelected = store.id === currentStore.id;
        return (
          <button
            key={store.id}
            onClick={() => onSelectStore(store)}
            className={`w-full rounded-[14px] border-[2px] p-2.5 text-left transition-all duration-200 ease-out active:scale-[0.98] ${
              isSelected
                ? 'border-[#070906] bg-[#ECFDC0] shadow-[1.5px_2px_0_rgba(7,9,6,0.14)]'
                : 'border-[#070906]/15 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="truncate text-[13px] font-black text-[#070906]">{store.name}</h4>
                  <span className="flex-shrink-0 rounded-full border border-[#070906]/20 px-1.5 py-[1px] text-[9px] font-bold text-[#070906]/65">
                    距您 {store.distance}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#070906]/55">{store.address}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] font-medium text-[#070906]/45">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {store.openTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {store.phone}
                  </span>
                </div>
              </div>

              {isSelected && (
                <span className="mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[7px] border-[2px] border-[#070906] bg-[#C7F665] text-[#070906]">
                  <Check className="h-3 w-3 stroke-[3.5]" />
                </span>
              )}
            </div>
          </button>
        );
      })}

      <p className="flex items-center justify-center gap-1 pt-0.5 text-center text-[10px] text-[#070906]/40">
        <MapPin className="h-3 w-3" />
        共 {STORES.length} 家门店 · 营业时间以门店实际为准
      </p>

      {/* 配送规则说明：切换门店的真实后果，也是弹窗底部的信息落点 */}
      <div className="rounded-[14px] border-[1.5px] border-[#070906]/12 bg-[#F7F8FA] px-2.5 py-2">
        <div className="flex items-center gap-1 text-[11px] font-black text-[#070906]">
          <Navigation className="h-3 w-3 text-[#54801A]" strokeWidth={2.6} />
          配送与自取说明
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-[#070906]/50">
          门店周边 3km 内支持外卖配送，超出范围将自动切换为到店自取；营业时间外下单，订单顺延至次日首单配送。
        </p>
      </div>
    </StickerModal>
  );
};
