import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { OrderMode, Store } from '../types';

/**
 * 门店 + 配送方式（外卖配送 / 到店自取）切换条。
 *
 * ⚠️ 2026-10-28 起**没有任何页面渲染它**：用户「订单页面去掉」这张条，
 *    而它原本只在订单页出现（App.tsx 里所有其它 tab 都被排除）。
 *    留着是因为门店页 / 结算页以后可能要复用同一套「门店 + 模式」控件；
 *    要重新启用，把 App.tsx 里那段注释掉的条件渲染恢复即可。
 */
interface HeaderBarProps {
  currentStore: Store;
  mode: OrderMode;
  onModeChange: (mode: OrderMode) => void;
  onOpenStorePage: () => void;
  compact?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentStore,
  mode,
  onModeChange,
  onOpenStorePage,
  compact = false
}) => {
  return (
    <div className={`w-full flex items-center justify-between gap-3 px-4 ${compact ? 'py-2' : 'py-3'} bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100`}>
      {/* Store Location */}
      <button
        onClick={onOpenStorePage}
        className="flex items-center gap-1.5 min-w-0 flex-1 text-left group transition-all"
        title="点击切换门店"
      >
        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 text-[#C7F665] group-hover:bg-black transition-colors shadow-2xs">
          <MapPin className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-slate-900 text-sm truncate max-w-[180px]">
              {currentStore.name}
            </span>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              ({currentStore.distance})
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </div>
          <p className="text-[11px] text-slate-500 truncate hidden block">
            {currentStore.address}
          </p>
        </div>
      </button>

      {/* Mode Toggle (Takeout / Pickup) */}
      <div className="relative flex bg-slate-100 p-0.5 rounded-full border border-slate-200 shadow-inner flex-shrink-0">
        {/* Active Pill Background */}
        <div
          className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-slate-900 shadow-sm transition-transform duration-200 ease-out ${
            mode === 'takeout' ? 'left-0.5 translate-x-0' : 'left-0.5 translate-x-full'
          }`}
        />
        <button
          type="button"
          onClick={() => onModeChange('takeout')}
          className={`relative z-10 px-3 py-1 rounded-full text-xs font-black transition-colors whitespace-nowrap ${
            mode === 'takeout' ? 'text-[#C7F665]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="pill-label">外卖配送</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('pickup')}
          className={`relative z-10 px-3 py-1 rounded-full text-xs font-black transition-colors whitespace-nowrap ${
            mode === 'pickup' ? 'text-[#C7F665]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="pill-label">到店自取</span>
        </button>
      </div>
    </div>
  );
};
