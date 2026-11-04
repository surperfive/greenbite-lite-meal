export type CategoryId = 'all' | 'salad' | 'bowl' | 'drink' | 'snack' | 'hot';

export type OrderMode = 'takeout' | 'pickup';

export type TemperatureType = 'hot' | 'cold' | 'ambient';

export interface Dish {
  id: number;
  name: string;
  subtitle?: string;
  description: string;
  kcal: number;
  protein: number; // grams
  fat: number; // grams
  carbs: number; // grams
  price: number;
  dealPrice: number;
  originalPrice: number;
  sold: string;
  category: CategoryId;
  image: string;
  /** 透明底抠图，用于点餐页「圆形框 + 食材溢出」的破框设计；缺省时退回 image */
  imageCutout?: string;
  /**
   * 「标准份」实拍抠图。详情页 hero 默认渲染这张；缺省时退回手绘裸图
   * （`DishCoverArt` 的 bare 模式）。
   * 和大份图同一套归一化口径（最长边 = 画布 89%），切份量时两张图尺寸才对得上。
   */
  imageStandard?: string;
  /**
   * 「大份 / 加大杯」专用实拍抠图。详情页把份量切到 large 时，hero 换成这张图
   * —— 原插画换成实拍，用户能直接看到加量后的真实份量。
   * 缺省时 large 沿用 imageCutout 的放大版本。
   */
  imageLarge?: string;
  bg: string;
  color: string;
  tags: string[];
  isPopular?: boolean;
  isLimit?: boolean;
  maxLimit?: number;
  /**
   * 已售尽（2026-10-27 用户：点餐卡「加号按钮改成灰色，点击后会显示已售尽」）。
   * 只影响点餐列表的加号按钮：变灰、点击弹 toast 而不是加购。
   * ⚠️ 不做"整卡置灰/遮罩" —— 用户只要求按钮，卡片其余信息照常可读可点进详情。
   */
  soldOut?: boolean;
  icon: 'salad' | 'bowl' | 'cup' | 'sandwich' | 'flame' | 'apple';
  // Advanced Nutrition & Dietary Attributes
  isVegetarian?: boolean; // 素食
  isVegan?: boolean; // 纯素
  isSugarFree?: boolean; // 0蔗糖
  isKeto?: boolean; // 生酮
  isHighFiber?: boolean; // 高纤
  temperature?: TemperatureType; // 热食 / 冷餐
  allergens?: string[]; // 过敏原/成分: '海鲜' | '乳制品' | '牛肉' | '坚果' | '麸质' | '辛辣'
}

export interface FilterState {
  calorieRange: 'all' | 'under250' | '250to400' | 'over400';
  proteinMin: number; // 0: any, 20: >=20g, 30: >=30g
  carbsMax: number; // 0: any, 20: <=20g, 35: <=35g
  fatMax: number; // 0: any, 10: <=10g
  dietary: string[]; // ['vegetarian', 'sugar_free', 'keto', 'high_fiber']
  excludedIngredients: string[]; // ['海鲜', '乳制品', '牛肉', '坚果', '麸质', '辛辣']
  temperature: 'all' | 'hot' | 'cold';
  priceRange: 'all' | 'under20' | '20to30' | 'over30';
  onlyDiscount: boolean;
  onlyPopular: boolean;
}

export interface Category {
  id: CategoryId;
  name: string;
  count?: number;
  badge?: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

export type OrderStatus = 'pending' | 'cooking' | 'delivering' | 'ready' | 'completed';

export interface Order {
  id: string;
  orderNo: string;
  createdAt: string;
  mode: OrderMode;
  storeName: string;
  address?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  statusText: string;
  estimatedTime: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  distance: string;
  openTime: string;
  phone: string;
}

export interface Coupon {
  id: string;
  title: string;
  discount: number;
  minSpend: number;
  desc: string;
  validUntil: string;
  tag: string;
}

export interface GachaCard {
  id: number;
  name: string;
  rarity: 'SSR' | 'SR' | 'R';
  tag: string;
  rewardTitle: string;
  rewardValue: number;
  dishRefId?: number;
  bg: string;
  accentColor: string;
  icon: string;
}

export interface GachaIngredient {
  id: string;
  name: string;
  category: 'base' | 'protein' | 'topping' | 'sauce';
  categoryName: string;
  rarity: 'SSR' | 'SR' | 'R';
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  price: number;
  originalPrice: number;
  emoji: string;
  tag: string;
  desc: string;
}

export interface CustomMealCombo {
  name: string;
  ingredients: GachaIngredient[];
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  totalPrice: number;
  totalOriginalPrice: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  phone: string;
  isLoggedIn: boolean;
  level: string;
  points: number;
  nextLevelPoints: number;
}
