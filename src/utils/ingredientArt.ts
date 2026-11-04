/**
 * 奖池 10 款食材的插画地址。
 *
 * ⚠️ **这份映射必须只有一处。** 此前 id → 插画 的映射在 `GachaPage` 和
 * `GachaBurstReveal` 里各写了一份 switch，改一处漏一处就会让「飞进去的」
 * 和「格子里的」长得不一样。现在两边都从这里取。
 *
 * 图源：用户提供的 10 款食材大图（1254×1254，2 行 5 列，纯白底），
 * 由 `scripts/split-gacha-ingredients.py` 用连通域拆分 + 去白底得到，
 * 输出 `public/ingredients/*.png`（320×320 透明）。
 */
const INGREDIENT_ART: Record<string, string> = {
  ing_steak: '/ingredients/ing_steak.png',       // 安格斯牛排
  ing_prawn: '/ingredients/ing_prawn.png',       // 黑虎虾串
  ing_chicken: '/ingredients/ing_chicken.png',   // 黑椒鸡胸肉
  ing_tofu: '/ingredients/ing_tofu.png',         // 高纤嫩豆腐
  ing_egg: '/ingredients/ing_egg.png',           // 溏心水波蛋
  ing_quinoa: '/ingredients/ing_quinoa.png',     // 藜麦糙米饭
  ing_kale: '/ingredients/ing_kale.png',         // 羽衣甘蓝
  ing_tomato: '/ingredients/ing_tomato.png',     // 多汁圣女果
  ing_broccoli: '/ingredients/ing_broccoli.png', // 高纤西兰花
  ing_edamame: '/ingredients/ing_edamame.png'    // 日式毛豆仁
};

/**
 * 取食材插画地址。
 * 未收录的 id（如已移出奖池的 `ing_salmon` / `ing_meat` / `ing_avocado`）
 * 返回 `null`，由调用方退回 emoji 兜底 —— 旧 localStorage 里可能还留着这些 id。
 */
export const ingredientArt = (id: string): string | null => INGREDIENT_ART[id] ?? null;

/** 奖池内、有插画的食材 id 集合（用于自检）。 */
export const INGREDIENT_ART_IDS = Object.keys(INGREDIENT_ART);
