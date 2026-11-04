import React, { useState } from 'react';
import { Target, CheckCircle2, Info } from 'lucide-react';
import { CheckBadge } from './CheckBadge';
import { StickerModal, StickerButton } from './StickerModal';

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
    // 优先读新 key；没有则尝试迁移旧的「口味定制」数据
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

/**
 * 健康计划弹窗 —— 2026-10-17 由「我的」页的内嵌口味面板改造而来。
 * 与 LoginModal / NutritionReportModal 同层渲染（App 层），
 * 规避手机壳内 fixed 会被裁剪 / 压不过底部导航的问题。
 * （注：原同层的 StoreModal 已于 2026-10-25 改造成壳内整页 `StorePage`。）
 *
 * 2026-10-28：外壳换成贴纸风 `StickerModal`（黑粗描边 + 青柠徽章），
 * 内容区的选项卡片跟着换成「选中 = 青柠浅底 + 2px 黑边」，其余逻辑未动。
 * ⚠️ 这一屏是长表单，卡片**不倾斜**（tilt={0}），标题也不倾斜 —— 一旦倾斜，
 *    十来个可点项全跟着斜，点击热区会看着歪。
 */
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

  /* 选中态统一：青柠浅底 + 2px 黑描边（贴纸风）。
     未选中态也保留 2px 透明边，切换时不会因为边框宽度变化引起位移。 */
  const cardCls = (selected: boolean) =>
    `flex flex-col rounded-[14px] border-[2px] px-2.5 py-2 text-left transition-all duration-200 ease-out active:scale-95 ${
      selected
        ? 'border-[#070906] bg-[#ECFDC0] text-[#070906] shadow-[1.5px_2px_0_rgba(7,9,6,0.12)]'
        : 'border-[#070906]/15 bg-white text-[#070906]/70'
    }`;

  const sectionTitle = 'text-[12px] font-black text-[#070906]';
  const sectionHint = 'text-[10px] font-bold text-[#070906]/40';

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
      maxWidth={396}
      bodyClassName="space-y-3.5"
      footer={
        <StickerButton tone="lime" onClick={handleSave}>
          <Target className="h-3.5 w-3.5" strokeWidth={2.9} />
          <span>保存健康计划</span>
        </StickerButton>
      }
    >
      {/* 说明条 */}
      <p className="flex items-start gap-1.5 rounded-[14px] border border-[#C7EE74] bg-[#F4FDE0] px-2.5 py-2 text-[11px] leading-relaxed text-[#26430B]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#54801A]" strokeWidth={2.6} />
        <span>设定你的健康目标和口味偏好，我们会据此为你推荐合适的轻食搭配。偏好保存在本机，随时可回来调整。</span>
      </p>

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
                  <span className="text-[12px] font-black">{option.label}</span>
                  {selected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#070906]" strokeWidth={2.6} />}
                </div>
                <span
                  className={`mt-0.5 text-[10px] ${
                    selected ? 'font-bold text-[#54801A]' : 'text-[#070906]/40'
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
                <span className="text-[11px] font-black">{option.label}</span>
                <span
                  className={`mt-0.5 text-[9px] ${
                    selected ? 'font-bold text-[#54801A]' : 'text-[#070906]/40'
                  }`}
                >
                  {option.detail}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 辣度 */}
      <div>
        <h4 className={`${sectionTitle} mb-1.5`}>辣度偏好</h4>
        <div className="flex gap-1 rounded-full border-[1.5px] border-[#070906]/12 bg-[#F3F5F8] p-1">
          {SPICE_OPTIONS.map((option) => {
            const selected = plan.spice === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setPlan((current) => ({ ...current, spice: option.id }))}
                className={`min-w-0 flex-1 rounded-full border-[2px] px-1.5 py-[7px] text-[10px] font-black transition-all duration-200 ease-out active:scale-95 ${
                  selected
                    ? 'border-[#070906] bg-[#C7F665] text-[#070906]'
                    : 'border-transparent text-[#070906]/55'
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
                className={`flex min-h-[34px] items-center justify-between gap-1 rounded-full border-[2px] px-2.5 transition-all duration-200 ease-out active:scale-95 ${
                  selected
                    ? 'border-[#070906] bg-[#ECFDC0] text-[#070906]'
                    : 'border-[#070906]/15 bg-white text-[#070906]/70'
                }`}
              >
                <span className="pill-label truncate text-[10px] font-bold">{ingredient}</span>
                <CheckBadge selected={selected} className="h-3.5 w-3.5 shrink-0" />
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-[#070906]/45">
          过敏食材请在下单时额外备注，以便门店确认。
        </p>
      </div>
    </StickerModal>
  );
};
