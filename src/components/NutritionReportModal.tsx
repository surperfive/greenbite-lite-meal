import React from 'react';
import { X, Activity, Flame, Award, Heart, CheckCircle2, TrendingDown } from 'lucide-react';
import { useShellBox } from './StickerModal';
import { useBackLayer } from '../utils/backStack';

interface NutritionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NutritionReportModal: React.FC<NutritionReportModalProps> = ({
  isOpen,
  onClose
}) => {
  /* 壳内容区矩形：居中盒贴壳，tall 显示器上不跑出手机壳（同 StickerModal 2026-10-28）。
     ⚠️ 必须在 early return 之前调（hooks 顺序），闭合后值只是暂时用不到。 */
  const shellBox = useShellBox();
  useBackLayer(isOpen, onClose);

  if (!isOpen) return null;

  const cardMaxH = shellBox
    ? `min(90vh, ${Math.max(240, Math.round(shellBox.height - 32))}px)`
    : '90vh';

  return (
    <>
      {/* 蒙层盖满视口；居中盒贴壳内容区（2026-10-28「弹窗超出页面」同款修复） */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      />
      <div
        className="fixed z-50 flex items-center justify-center p-4 pointer-events-none animate-in fade-in duration-200"
        style={
          shellBox
            ? { top: shellBox.top, left: shellBox.left, width: shellBox.width, height: shellBox.height }
            : { inset: 0 }
        }
      >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="本周轻食健康分析报告"
        className="w-full max-w-md bg-white rounded-2xl overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
        style={{ maxHeight: cardMaxH }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-900" />
            <h3 className="font-extrabold text-slate-900 text-base">本周轻食健康分析报告</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="gb-hit w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          {/* Overview Score Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-md border border-slate-800">
            <div>
              <span className="text-[11px] text-[#C7F665] font-bold block">
                本周综合轻体健康得分
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-[#C7F665]">94</span>
                <span className="text-xs text-[#C7F665]">/ 100 卓越</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                已连续 5 天保持低脂高蛋白优质摄入
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#C7F665] border border-white/20">
              <Award className="w-7 h-7" />
            </div>
          </div>

          {/* Calorie Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-xs">累计热量摄入</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">2,340</span>
                <span className="text-xs text-slate-500 font-bold">kcal</span>
              </div>
              <span className="text-[10px] text-slate-900 font-bold flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3 text-[#C7F665]" /> 较上周减少 18%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-xs">优质蛋白摄入</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">142</span>
                <span className="text-xs text-slate-500 font-bold">g</span>
              </div>
              <span className="text-[10px] text-slate-900 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 text-[#C7F665]" /> 完美达标
              </span>
            </div>
          </div>

          {/* Macronutrient Distribution Chart Mock */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs">营养素比例分布</h4>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>蛋白质 (38%)</span>
                  <span className="font-bold text-slate-900">高</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[38%] h-full bg-[#C7F665] rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>慢碳复合糖 (42%)</span>
                  <span className="font-bold text-sky-700">适中</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[42%] h-full bg-sky-600 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>健康脂肪 (20%)</span>
                  <span className="font-bold text-amber-700">低脂</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[20%] h-full bg-amber-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Dietitian Recommendation */}
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs leading-relaxed space-y-1">
            <div className="flex items-center gap-1 font-bold">
              <Heart className="w-4 h-4 text-slate-900" />
              <span>营养师建议：</span>
            </div>
            <p className="text-slate-600">
              本周膳食纤维与原切蛋白摄取极佳！建议下午茶时段多补充 1 杯【羽衣甘蓝酸奶昔】，有助于维持肠道益生菌群平衡。
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-black text-[#C7F665] font-black text-xs shadow border border-[#C7F665]/30"
          >
            知晓了，继续保持！
          </button>
        </div>
      </div>
      </div>
    </>
  );
};
