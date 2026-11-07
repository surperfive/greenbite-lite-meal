import React from 'react';
import { CartItem, Coupon, OrderMode, Dish, Store } from '../types';
import { DishImage } from './DishImage';
import { DISHES } from '../data/mockData';
import {
  ShoppingBag,
  Ticket,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
} from 'lucide-react';

interface CartPageProps {
  cartItems: CartItem[];
  mode: OrderMode;
  store?: Store;
  onOpenStore?: () => void;
  onAddToCart: (dish: CartItem['dish']) => void;
  onRemoveFromCart: (dish: CartItem['dish']) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
  onNavigate: (tab: string) => void;
  onBack?: () => void;
  selectedCoupon: Coupon | null;
  onSelectCoupon: (coupon: Coupon | null) => void;
  coupons: Coupon[];
  onSelectDish?: (dish: Dish) => void;
}

/** 25.6 → 25.6 / 26 → 26（不显示无意义的 .0） */
const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

/** 预计时间：外卖 +28 分钟、自取 +12 分钟，格式 HH:MM */
const etaText = (mode: OrderMode) => {
  const d = new Date(Date.now() + (mode === 'takeout' ? 28 : 12) * 60_000);
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
};

export const CartPage: React.FC<CartPageProps> = ({
  cartItems,
  mode,
  store,
  onOpenStore,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onOpenCheckout,
  onNavigate,
  onBack,
  selectedCoupon,
  coupons,
  onSelectDish,
}) => {
  const subtotal = cartItems.reduce((acc, item) => acc + item.dish.dealPrice * item.quantity, 0);
  const originalTotal = cartItems.reduce((acc, item) => acc + item.dish.originalPrice * item.quantity, 0);
  const totalCalories = cartItems.reduce((acc, item) => acc + item.dish.kcal * item.quantity, 0);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const freeThreshold = 40;
  const deliveryFee = mode === 'pickup' ? 0 : subtotal >= freeThreshold ? 0 : 4;
  const packageFee = cartItems.length > 0 ? 2 : 0;
  const discount = selectedCoupon ? selectedCoupon.discount : 0;
  const finalTotal = Math.max(0, subtotal + deliveryFee + packageFee - discount);
  // 已优惠 = 商品原价差 + 优惠券（底部条用）
  const savedTotal = Math.max(0, originalTotal - subtotal) + discount;

  /** 超值换购：不在购物车里的最便宜 3 款 */
  const upsell = DISHES.filter((d) => !cartItems.some((c) => c.dish.id === d.id))
    .sort((a, b) => a.dealPrice - b.dealPrice)
    .slice(0, 3);

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-xs">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-black text-slate-800">购物车还是空的</h3>
        <p className="mt-1 max-w-xs text-sm text-slate-400">
          甄选低脂轻食、减脂能量碗与0卡生椰酸奶昔正在热卖中
        </p>
        <button
          onClick={() => onNavigate('menu')}
          className="mt-6 rounded-full bg-[#C7F665] px-6 py-2.5 text-sm font-black text-[#070906] shadow-xs transition-transform duration-200 ease-out active:scale-95"
        >
          <span className="pill-label">立即去选餐</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-3 pb-36 pt-11">
      {/* ===== 标题行 =====
          ⚠️ 顶部留白 `pt-11`（44px）：高于全局「··· | ⊙」胶囊底边（top-2.5 + 26 = 36px），
             标题行整体下移至胶囊下方留出充足呼吸空间，不再贴顶拥挤。 */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (onBack ? onBack() : onNavigate('menu'))}
            aria-label="返回"
            className="gb-hit -ml-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900 shadow-2xs transition-transform active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2.6]" />
          </button>
          <h2 className="text-[17px] font-black tracking-tight text-slate-900">确认订单</h2>
          <span className="rounded-full bg-white px-2 py-[3px] text-[10px] font-black text-slate-500 shadow-xs">
            <span className="pill-label">共 {totalCount} 件</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onClearCart}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-400 transition-colors hover:text-slate-600 active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
          清空
        </button>
      </div>

      {/* ===== ① 门店卡（信息布局照「确认订单」范式：标签 + 店名 + 地址 + 预计时间/距离） ===== */}
      <div className="rounded-2xl bg-white px-3.5 py-3 shadow-xs">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={onOpenStore}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left active:scale-[0.99]"
          >
            <span className="shrink-0 rounded-[5px] bg-[#070906] px-1.5 py-[2px] text-[9px] font-black leading-none text-[#C7F665]">
              距离最近
            </span>
            <span className="truncate text-[15px] font-black leading-none text-slate-900">
              {store?.name ?? '静安寺旗舰店'}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" strokeWidth={3} />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] leading-[1.55] text-slate-400">
          {store?.address ?? '上海市静安区南京西路1601号越洋广场B2'}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[12px] font-black text-[#54801A]">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.6} />
            预计 {etaText(mode)} {mode === 'takeout' ? '送达' : '可取餐'}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] font-bold text-slate-400">
            <MapPin className="h-3 w-3" strokeWidth={2.6} />距您 {store?.distance ?? '966m'}
          </span>
        </div>
      </div>

      {/* ===== ② 商品卡：缩略图 + 名称 + 营养 + 现价/原价 + 步进器，末行接「打包费」 ===== */}
      <div className="rounded-2xl bg-white px-3.5 pt-1 shadow-xs">
        {cartItems.map(({ dish, quantity }, i) => (
          <div
            key={dish.id}
            className={`flex gap-2.5 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
          >
            <div
              onClick={() => onSelectDish && onSelectDish(dish)}
              className="relative h-[62px] w-[62px] shrink-0 cursor-pointer overflow-hidden rounded-xl bg-slate-100 transition-transform duration-200 ease-out active:scale-95"
              title="查看商品详情"
            >
              <DishImage
                src={dish.image}
                alt={dish.name}
                category={dish.category}
                className="h-full w-full object-cover"
              />
              {dish.originalPrice > dish.dealPrice && (
                <span className="absolute bottom-0 left-0 rounded-tr-[6px] bg-[#C7F665] px-1 py-[1.5px] text-[9px] font-black leading-none text-[#070906]">
                  优惠
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4
                onClick={() => onSelectDish && onSelectDish(dish)}
                className="cursor-pointer truncate text-[14px] font-black leading-tight text-slate-900"
              >
                {dish.name}
              </h4>
              <p className="mt-1 text-[11px] leading-none text-slate-400">
                {dish.kcal} kcal · 蛋白 {dish.protein}g
              </p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <span className="text-[11px] font-black text-[#FC5294]">¥</span>
                  <span className="text-[17px] font-black leading-none tracking-tight text-[#FC5294]">
                    {fmt(dish.dealPrice * quantity)}
                  </span>
                  {dish.originalPrice > dish.dealPrice && (
                    <span className="text-[11px] leading-none text-slate-300 line-through">
                      ¥{fmt(dish.originalPrice * quantity)}
                    </span>
                  )}
                </div>

                {/* 步进器：确认订单页也要能改份数 */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(dish)}
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-transform duration-200 ease-out active:scale-95"
                    aria-label="减少一份"
                  >
                    <Minus className="h-3 w-3" strokeWidth={3} />
                  </button>
                  <span className="w-4 text-center text-[12px] font-black tabular-nums text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddToCart(dish)}
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#070906] text-[#C7F665] transition-transform duration-200 ease-out active:scale-95"
                    aria-label="增加一份"
                  >
                    <Plus className="h-3 w-3" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 打包费行（参考图是「是否需要打包 ›」，我们真实收费，所以如实展示金额） */}
        <div className="flex items-center justify-between border-t border-slate-100 py-2.5">
          <span className="text-[13px] font-bold text-slate-800">环保保温打包费</span>
          <span className="text-[12px] font-bold text-slate-400">¥{fmt(packageFee)}</span>
        </div>
      </div>

      {/* ===== ③ 超值换购（横向 3 卡，点 + 直接加购） ===== */}
      {upsell.length > 0 && (
        <div className="rounded-2xl bg-white px-3.5 py-3 shadow-xs">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-[15px] font-black text-slate-900">超值换购</h3>
            <span className="text-[10px] font-bold text-slate-400">近期有 136 人换购</span>
          </div>
          <div className="mt-2.5 flex gap-2">
            {upsell.map((dish) => (
              <div key={dish.id} className="min-w-0 flex-1 rounded-xl bg-[#F6F7F9] p-1.5">
                <div
                  onClick={() => onSelectDish && onSelectDish(dish)}
                  className="mx-auto h-[64px] w-[64px] cursor-pointer overflow-hidden rounded-lg bg-white transition-transform duration-200 ease-out active:scale-95"
                >
                  <DishImage
                    src={dish.image}
                    alt={dish.name}
                    category={dish.category}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h5 className="mt-1.5 line-clamp-2 h-[26px] text-[10px] font-black leading-[1.3] text-slate-800">
                  {dish.name}
                </h5>
                <p className="mt-[3px] text-[9px] leading-none text-slate-400">
                  {(dish.id * 37) % 80 + 12} 人换购
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="flex items-baseline gap-0.5">
                    <span className="text-[9px] font-black text-[#FC5294]">¥</span>
                    <span className="text-[14px] font-black leading-none text-[#FC5294]">
                      {fmt(dish.dealPrice)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddToCart(dish)}
                    className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#C7F665] text-[#070906] shadow-xs transition-transform duration-200 ease-out active:scale-90"
                    aria-label={`换购 ${dish.name}`}
                  >
                    <Plus className="h-3 w-3" strokeWidth={3.2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== ④ 优惠券 ===== */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-3.5 py-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 fill-[#FDCF29] text-[#E0A800]" />
          <span className="text-[13px] font-black text-slate-800">轻食优惠券</span>
        </div>
        {selectedCoupon ? (
          <span className="rounded-full bg-[#F2FCE0] px-2 py-[3px] text-[11px] font-black text-[#54801A]">
            <span className="pill-label">已抵扣 -¥{fmt(selectedCoupon.discount)}</span>
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-[11px] font-bold text-slate-400">
            {coupons.length} 张可用
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" strokeWidth={3} />
          </span>
        )}
      </div>

      {/* ===== ⑤ 本单健康统计 ===== */}
      <div className="flex items-center justify-between rounded-2xl bg-[#F2FCE0] px-3.5 py-3">
        <span className="flex items-center gap-1.5 text-[12px] font-black text-[#26430B]">
          <ShieldCheck className="h-4 w-4" strokeWidth={2.4} />
          本单健康总热量
        </span>
        <span className="text-[13px] font-black text-[#26430B]">约 {totalCalories} kcal</span>
      </div>

      {/* ===== ⑥ 费用明细 ===== */}
      <div className="space-y-2 rounded-2xl bg-white px-3.5 py-3 text-[12px] shadow-xs">
        <div className="flex justify-between font-medium text-slate-500">
          <span>商品小计</span>
          <span>¥{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between font-medium text-slate-500">
          <span>环保保温打包费</span>
          <span>¥{fmt(packageFee)}</span>
        </div>
        <div className="flex justify-between font-medium text-slate-500">
          <span>{mode === 'takeout' ? '外卖配送费' : '门店自取服务费'}</span>
          <span>{deliveryFee === 0 ? '¥0 (已免)' : `¥${fmt(deliveryFee)}`}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between font-black text-[#FC5294]">
            <span>优惠券抵扣</span>
            <span>-¥{fmt(discount)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
          <span className="text-[13px] font-black text-slate-900">合计应付</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[11px] font-black text-[#FC5294]">¥</span>
            <span className="text-[21px] font-black tracking-tight text-[#FC5294]">
              {fmt(finalTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ===== 底部结算条（实付 + 已优惠 + 提交订单） ===== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[72px] z-30 mx-auto max-w-lg px-3">
        <div className="pointer-events-auto flex items-center justify-between rounded-2xl bg-[#070906] p-2 pl-4 shadow-xl">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] font-bold text-white/55">实付</span>
              <span className="text-[21px] font-black leading-none tracking-tight text-[#C7F665]">
                ¥{fmt(finalTotal)}
              </span>
            </div>
            {savedTotal > 0 && (
              <div className="mt-[3px] text-[10px] font-bold leading-none text-white/40">
                已优惠 ¥{fmt(savedTotal)}
              </div>
            )}
          </div>
          <button
            onClick={onOpenCheckout}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#C7F665] px-6 py-2.5 text-[14px] font-black text-[#070906] shadow-xs transition-transform duration-200 ease-out active:scale-95"
          >
            <span className="pill-label">提交订单</span>
            <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
