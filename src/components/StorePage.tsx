import React from 'react';
import { Store } from '../types';
import { STORES } from '../data/mockData';
import { MapPin, Check, Phone, Clock, Navigation } from 'lucide-react';
import { StickerModal, StickerButton, StickerPanel } from './StickerModal';

/**
 * 门店选择弹窗（参照福利中心视觉语言：28px 立体白板 + 凹槽卡片 + 立体托盘胶囊按钮 + 通栏青柠主 CTA）
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
      titleAlign="center"
      scroll
      maxHeight="84vh"
      maxWidth={356}
      scale={0.9}
      bodyClassName="space-y-2 pb-1"
      footer={
        <StickerButton tone="lime" onClick={onBack}>
          <span>确认当前门店</span>
        </StickerButton>
      }
    >
      {STORES.map((store) => {
        const isSelected = store.id === currentStore.id;
        return (
          <div
            key={store.id}
            onClick={() => onSelectStore(store)}
            className={`relative cursor-pointer rounded-[22px] border-[2px] p-3 text-left transition-all duration-200 ease-out active:scale-[0.98] ${
              isSelected
                ? 'border-[#b9e265] bg-[linear-gradient(180deg,#f1fde0_0%,#fbfef5_60%,#ffffff_100%)] shadow-[0_3px_0_#d8f09e,inset_0_2.5px_4px_rgba(84,128,26,0.06),inset_0_-2.5px_0_#ffffff]'
                : 'border-[#e1e4dd] bg-[linear-gradient(180deg,#f3f5f0_0%,#fcfdfc_55%,#ffffff_100%)] shadow-[0_3px_0_#ebeee6,0_5px_10px_rgba(0,0,0,0.04),inset_0_2.5px_4px_rgba(0,0,0,0.045),inset_0_-2.5px_0_#ffffff]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="truncate text-[13.5px] font-black text-[#0e100c]">{store.name}</h4>
                  <span className="flex-shrink-0 rounded-full border border-[#080907]/15 bg-white px-1.5 py-[1px] text-[9px] font-bold text-[#6b6f68]">
                    距您 {store.distance}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#6b6f68]">{store.address}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] font-bold text-[#6b6f68]/85">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {store.openTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {store.phone}
                  </span>
                </div>
              </div>

              <StickerButton
                size="sm"
                block={false}
                tone={isSelected ? 'lime' : 'white'}
                onClick={() => onSelectStore(store)}
              >
                {isSelected ? (
                  <>
                    <Check className="h-3 w-3" strokeWidth={3} />
                    <span>当前</span>
                  </>
                ) : (
                  <span>切换</span>
                )}
              </StickerButton>
            </div>
          </div>
        );
      })}

      <p className="flex items-center justify-center gap-1 pt-0.5 text-center text-[10px] font-bold text-[#6b6f68]">
        <MapPin className="h-3 w-3" />
        共 {STORES.length} 家门店 · 营业时间以门店实际为准
      </p>

      {/* 配送规则说明 */}
      <StickerPanel innerClassName="px-3 py-2.5">
        <div className="flex items-center gap-1 text-[11px] font-black text-[#0e100c]">
          <Navigation className="h-3 w-3 text-[#54801A]" strokeWidth={2.6} />
          配送与自取说明
        </div>
        <p className="mt-1 text-[10px] font-medium leading-relaxed text-[#6b6f68]">
          门店周边 3km 内支持外卖配送，超出范围将自动切换为到店自取；营业时间外下单，订单顺延至次日首单配送。
        </p>
      </StickerPanel>
    </StickerModal>
  );
};
