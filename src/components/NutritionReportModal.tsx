import React from 'react';
import { Activity, Award, Heart, CheckCircle2, TrendingDown } from 'lucide-react';
import { StickerModal, StickerButton, StickerPanel } from './StickerModal';

interface NutritionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NutritionReportModal: React.FC<NutritionReportModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <StickerModal
      onClose={onClose}
      ariaLabel="本周轻食健康分析报告"
      title="健康周报"
      titleSize="xl"
      badge={<Activity className="h-[30px] w-[30px]" strokeWidth={2.6} />}
      badgeSize="lg"
      badgeBorderWidth={4}
      subtitle="本周轻食健康分析报告 · 已连续 5 天保持低脂高蛋白优质摄入"
      scroll
      maxHeight="86vh"
      maxWidth={364}
      bodyClassName="space-y-2.5"
      footer={
        <StickerButton tone="lime" onClick={onClose}>
          <Award className="h-4 w-4" strokeWidth={2.8} />
          <span>知晓了，继续保持！</span>
        </StickerButton>
      }
    >
      {/* Overview Score Recessed Slot */}
      <StickerPanel pill innerClassName="flex items-center justify-between pl-4 pr-2.5 py-2.5">
        <div className="text-left">
          <span className="block text-[10px] font-bold text-[#6b6f68]">
            本周综合轻体健康得分
          </span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-[24px] font-black leading-none text-[#0e100c]">94</span>
            <span className="text-[11px] font-black text-[#54801A]">/ 100 卓越</span>
          </div>
        </div>
        <StickerButton size="sm" block={false} tone="lime">
          <Award className="h-3.5 w-3.5" strokeWidth={2.8} />
          <span>达标</span>
        </StickerButton>
      </StickerPanel>

      {/* Calorie & Protein Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StickerPanel innerClassName="p-3 space-y-1 text-left">
          <span className="text-[10px] font-bold text-[#6b6f68]">累计热量摄入</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[17px] font-black text-[#0e100c]">2,340</span>
            <span className="text-[10px] font-bold text-[#6b6f68]">kcal</span>
          </div>
          <span className="flex items-center gap-0.5 text-[10px] font-black text-[#54801A]">
            <TrendingDown className="h-3 w-3 text-[#54801A]" strokeWidth={2.8} /> 较上周减少 18%
          </span>
        </StickerPanel>

        <StickerPanel innerClassName="p-3 space-y-1 text-left">
          <span className="text-[10px] font-bold text-[#6b6f68]">优质蛋白摄入</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[17px] font-black text-[#0e100c]">142</span>
            <span className="text-[10px] font-bold text-[#6b6f68]">g</span>
          </div>
          <span className="flex items-center gap-0.5 text-[10px] font-black text-[#54801A]">
            <CheckCircle2 className="h-3 w-3 text-[#54801A]" strokeWidth={2.8} /> 完美达标
          </span>
        </StickerPanel>
      </div>

      {/* Macronutrient Distribution */}
      <StickerPanel innerClassName="p-3.5 space-y-2.5 text-left">
        <h4 className="text-[12px] font-black text-[#0e100c]">营养素比例分布</h4>
        <div className="space-y-2 text-[11px]">
          <div>
            <div className="mb-1 flex justify-between font-bold text-[#6b6f68]">
              <span>蛋白质 (38%)</span>
              <span className="font-black text-[#0e100c]">高蛋白</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-[#080907]/15 bg-[#e5e8e1]">
              <div className="h-full w-[38%] rounded-full bg-[#C7F665]" />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between font-bold text-[#6b6f68]">
              <span>慢碳复合糖 (42%)</span>
              <span className="font-black text-[#54801A]">低GI适中</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-[#080907]/15 bg-[#e5e8e1]">
              <div className="h-full w-[42%] rounded-full bg-[#9CCB3C]" />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between font-bold text-[#6b6f68]">
              <span>健康脂肪 (20%)</span>
              <span className="font-black text-[#FC5294]">轻负担</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-[#080907]/15 bg-[#e5e8e1]">
              <div className="h-full w-[20%] rounded-full bg-[#FC5294]" />
            </div>
          </div>
        </div>
      </StickerPanel>

      {/* Dietitian Recommendation */}
      <StickerPanel innerClassName="p-3 text-left text-[11px] leading-relaxed space-y-1">
        <div className="flex items-center gap-1 font-black text-[#0e100c]">
          <Heart className="h-3.5 w-3.5 text-[#FC5294] fill-[#FC5294]" />
          <span>营养师建议：</span>
        </div>
        <p className="font-medium text-[#6b6f68]">
          本周膳食纤维与原切蛋白摄取极佳！建议下午茶时段多补充 1 杯【羽衣甘蓝酸奶昔】，有助于维持肠道益生菌群平衡。
        </p>
      </StickerPanel>
    </StickerModal>
  );
};
