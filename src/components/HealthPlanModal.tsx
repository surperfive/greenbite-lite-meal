import React, { useState } from 'react';
import { Target, CheckCircle2, Info } from 'lucide-react';
import { CheckBadge } from './CheckBadge';
import { StickerModal, StickerButton, StickerPanel } from './StickerModal';

interface HealthPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

type HealthGoal = 'balanced' | 'fatloss' | 'muscle' | 'lowcarb';
type TasteIntensity = 'light' | 'balanced' | 'rich';
type SpiceLevel = 'none' | 'mild' | 'medium' | 'hot';

interface HealthPlan {
  goal: HealthGoal;
  intensity: TasteIntensity;
  spice: SpiceLevel;
  excludedIngredients: string[];
}

const HEALTH_PLAN_KEY = 'greenbite-health-plan';
const LEGACY_TASTE_KEY = 'greenbite-taste-preferences';

const GOAL_OPTIONS: { id: HealthGoal; label: string; detail: string }[] = [
  { id: 'balanced', label: '均衡营养', detail: '三餐规律 · 不偏科' },
  { id: 'fatloss', label: '减脂塑形', detail: '低脂高纤 · 轻负担' },
  { id: 'muscle', label: '增肌补给', detail: '高蛋白 · 练后补给' },
  { id: 'lowcarb', label: '控糖轻养', detail: '慢碳低GI · 稳定精力' }
];

const INTENSITY_OPTIONS: { id: TasteIntensity; label: string; detail: string }[] = [
  { id: 'light', label: '清爽', detail: '少油少酱' },
  { id: 'balanced', label: '均衡', detail: '风味适中' },
  { id: 'rich', label: '浓郁', detail: '酱香足' }
];

const SPICE_OPTIONS: { id: SpiceLevel; label: string }[] = [
  { id: 'none', label: '不辣' },
  { id: 'mild', label: '微辣' },
  { id: 'medium', label: '中辣' },
  { id: 'hot', label: '特辣' }
];

const EXCLUDED_INGREDIENT_OPTIONS = ['香菜', '葱', '蒜', '洋葱', '花生/坚果', '海鲜'];

const DEFAULT_PLAN: HealthPlan = {
  goal: 'balanced',
  intensity: 'balanced',
  spice: 'none',
  excludedIngredients: []
};

const readHealthPlan = (): HealthPlan => {
  try {
    const raw =
      window.localStorage.getItem(HEALTH_PLAN_KEY) ??
      window.localStorage.getItem(LEGACY_TASTE_KEY);
    if (!raw) return { ...DEFAULT_PLAN, excludedIngredients: [] };

    const saved = JSON.parse(raw) as Partial<HealthPlan>;
    return {
      goal: GOAL_OPTIONS.some((o) => o.id === saved.goal)
        ? (saved.goal as HealthGoal)
        : DEFAULT_PLAN.goal,
      intensity: INTENSITY_OPTIONS.some((o) => o.id === saved.intensity)
        ? (saved.intensity as TasteIntensity)
        : DEFAULT_PLAN.intensity,
      spice: SPICE_OPTIONS.some((o) => o.id === saved.spice)
        ? (saved.spice as SpiceLevel)
        : DEFAULT_PLAN.spice,
      excludedIngredients: Array.isArray(saved.excludedIngredients)
        ? saved.excludedIngredients.filter(
            (item): item is string =>
              typeof item === 'string' && EXCLUDED_INGREDIENT_OPTIONS.includes(item)
          )
        : []
    };
  } catch {
    return { ...DEFAULT_PLAN, excludedIngredients: [] };
  }
};

export const HealthPlanModal: React.FC<HealthPlanModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [plan, setPlan] = useState<HealthPlan>(readHealthPlan);

  if (!isOpen) return null;

  const toggleExcludedIngredient = (ingredient: string) => {
    setPlan((current) => ({
      ...current,
      excludedIngredients: current.excludedIngredients.includes(ingredient)
        ? current.excludedIngredients.filter((item) => item !== ingredient)
        : [...current.excludedIngredients, ingredient]
    }));
  };

  const handleSave = () => {
    try {
      window.localStorage.setItem(HEALTH_PLAN_KEY, JSON.stringify(plan));
      onShowToast('健康计划已保存');
      onClose();
    } catch {
      onShowToast('暂时无法保存计划，请稍后重试');
    }
  };

  const cardCls = (selected: boolean) =>
    `flex flex-col rounded-[18px] border-[2px] px-3 py-2 text-left transition-all duration-200 ease-out active:scale-95 ${
      selected
        ? 'border-[#080907] bg-[linear-gradient(180deg,#D3F97E_0%,#C7F665_70%,#B7EF4B_100%)] text-[#080907] shadow-[0_2px_0_rgba(0,0,0,0.14),inset_0_-3px_0_rgba(38,67,11,0.2),inset_0_2px_2px_rgba(255,255,255,0.8)]'
        : 'border-[#e1e4dd] bg-[linear-gradient(180deg,#f3f5f0_0%,#fcfdfc_55%,#ffffff_100%)] text-[#0e100c] shadow-[0_2.5px_0_#ebeee6,inset_0_2px_3px_rgba(0,0,0,0.04),inset_0_-2px_0_#ffffff]'
    }`;

  const sectionTitle = 'text-[12.5px] font-black text-[#0e100c]';
  const sectionHint = 'text-[10px] font-bold text-[#6b6f68]';

  return (
    <StickerModal
      onClose={onClose}
      ariaLabel="健康计划"
      title="健康计划"
      titleSize="xl"
      badge={<Target className="h-[30px] w-[30px]" strokeWidth={2.9} />}
      badgeSize="lg"
      badgeBorderWidth={4}
      scribble
      tilt={0}
      scroll
      maxHeight="86vh"
      maxWidth={388}
      bodyClassName="space-y-3"
      footer={
        <StickerButton tone="lime" onClick={handleSave}>
          <Target className="h-4 w-4" strokeWidth={2.8} />
          <span>保存健康计划</span>
        </StickerButton>
      }
    >
      {/* 说明条 */}
      <StickerPanel innerClassName="flex items-start gap-2 px-3 py-2.5 text-[11px] font-medium leading-relaxed text-[#26430B]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#54801A]" strokeWidth={2.6} />
        <span>设定你的健康目标和口味偏好，我们会据此为你推荐合适的轻食搭配。偏好保存在本机，随时可回来调整。</span>
      </StickerPanel>

      {/* 计划目标（单选） */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <h4 className={sectionTitle}>计划目标</h4>
          <span className={sectionHint}>单选</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((option) => {
            const selected = plan.goal === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setPlan((current) => ({ ...current, goal: option.id }))}
                className={`${cardCls(selected)} min-h-[58px] justify-center`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-[12.5px] font-black">{option.label}</span>
                  {selected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#080907]" strokeWidth={2.8} />}
                </div>
                <span
                  className={`mt-0.5 text-[10px] ${
                    selected ? 'font-bold text-[#26430B]' : 'font-medium text-[#6b6f68]'
                  }`}
                >
                  {option.detail}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 口味浓淡 */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <h4 className={sectionTitle}>口味浓淡</h4>
          <span className={sectionHint}>按喜好选择</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {INTENSITY_OPTIONS.map((option) => {
            const selected = plan.intensity === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setPlan((current) => ({ ...current, intensity: option.id }))}
                className={`${cardCls(selected)} min-h-[54px] items-center justify-center text-center`}
              >
                <span className="text-[11.5px] font-black">{option.label}</span>
                <span
                  className={`mt-0.5 text-[9.5px] ${
                    selected ? 'font-bold text-[#26430B]' : 'font-medium text-[#6b6f68]'
                  }`}
                >
                  {option.detail}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 辣度（福利中心凹槽托盘 + 立体胶囊按钮语言） */}
      <div>
        <h4 className={`${sectionTitle} mb-1.5`}>辣度偏好</h4>
        <div
          className="flex gap-1.5 rounded-full border-[2px] border-[#e1e4dd] p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
          style={{
            background: 'linear-gradient(180deg, #e5e8e1 0%, #f8faf6 100%)',
          }}
        >
          {SPICE_OPTIONS.map((option) => {
            const selected = plan.spice === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setPlan((current) => ({ ...current, spice: option.id }))}
                className={`relative min-w-0 flex-1 rounded-full border-[2.2px] px-1.5 py-[6px] text-[11px] font-black transition-all duration-150 ease-out active:scale-95 ${
                  selected
                    ? 'border-[#080907] bg-[linear-gradient(180deg,#D3F97E_0%,#C7F665_68%,#B7EF4B_100%)] text-[#0b0d09] shadow-[0_1.5px_0_rgba(0,0,0,0.14),inset_0_-2.5px_0_rgba(38,67,11,0.22),inset_0_1.5px_2px_rgba(255,255,255,0.8)]'
                    : 'border-transparent text-[#6b6f68] hover:text-[#0e100c]'
                }`}
              >
                <span className="pill-label">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 忌口食材 */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h4 className={sectionTitle}>不想加入的食材</h4>
          <span className={sectionHint}>可多选</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {EXCLUDED_INGREDIENT_OPTIONS.map((ingredient) => {
            const selected = plan.excludedIngredients.includes(ingredient);
            return (
              <button
                key={ingredient}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleExcludedIngredient(ingredient)}
                className={`flex min-h-[36px] items-center justify-between gap-1 rounded-full border-[2px] px-3 transition-all duration-150 ease-out active:scale-95 ${
                  selected
                    ? 'border-[#080907] bg-[linear-gradient(180deg,#D3F97E_0%,#C7F665_68%,#B7EF4B_100%)] text-[#080907] shadow-[0_1.5px_0_rgba(0,0,0,0.12),inset_0_-2.5px_0_rgba(38,67,11,0.2)]'
                    : 'border-[#e1e4dd] bg-[linear-gradient(180deg,#ffffff_0%,#f8faf6_75%,#ecefe9_100%)] text-[#0e100c] shadow-[0_1.5px_0_rgba(0,0,0,0.06),inset_0_-2.5px_0_#dfe3dc]'
                }`}
              >
                <span className="pill-label truncate text-[10.5px] font-black">{ingredient}</span>
                <CheckBadge selected={selected} className="h-3.5 w-3.5 shrink-0" />
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[9.5px] font-medium leading-relaxed text-[#6b6f68]">
          过敏食材请在下单时额外备注，以便门店确认。
        </p>
      </div>
    </StickerModal>
  );
};
