import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react';
import { DeviceFrameWrapper } from './components/DeviceFrameWrapper';
// HeaderBar（门店 + 外卖/自取 切换条）已从订单页移除，当前无页面渲染它；
// 组件文件保留，见下方第 400 行附近的说明。
import { HomePage } from './components/HomePage';
import { MenuPage } from './components/MenuPage';
import { CartPage } from './components/CartPage';
import { OrdersPage } from './components/OrdersPage';
import { MePage } from './components/MePage';
import { FavPage } from './components/FavPage';
import { GachaPage } from './components/GachaPage';
import { FloatingCart } from './components/FloatingCart';
import { BottomNavBar } from './components/BottomNavBar';
import { MiniProgramCapsule } from './components/MiniProgramCapsule';
import { ProductDetailPage } from './components/ProductDetailPage';
import { StorePage } from './components/StorePage';
import { LoginModal } from './components/LoginModal';
import { NutritionReportModal } from './components/NutritionReportModal';
import { HealthPlanModal } from './components/HealthPlanModal';
import { Toast } from './components/Toast';
import { LoadingScreen } from './components/LoadingScreen';
import {
  CartFlyOrbLayer,
  FlyingOrbItem,
  ToteMascotStage
} from './components/CartFlyOrbLayer';
import { useBackLayer } from './utils/backStack';

import {
  Dish,
  CartItem,
  OrderMode,
  Store,
  Coupon,
  Order,
  UserProfile
} from './types';
import {
  DISHES,
  STORES,
  INITIAL_COUPONS,
  INITIAL_ORDERS
} from './data/mockData';

export default function App() {
  // Navigation & Mode
  const [activeTab, setActiveTab] = useState<string>('menu');
  const [previousTab, setPreviousTab] = useState<string>('menu');
  const [orderMode, setOrderMode] = useState<OrderMode>('takeout');
  const [currentStore, setCurrentStore] = useState<Store>(STORES[0]);

  // Cart & Orders & Favorites State (Empty initially; cart popup triggers when clicking +)
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customDishes, setCustomDishes] = useState<Record<number, Dish>>({});
  const [favorites, setFavorites] = useState<Set<number>>(new Set([1]));
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(INITIAL_COUPONS[0]);

  // User Profile
  const [user, setUser] = useState<UserProfile>({
    name: 'Alex',
    avatar: '/mascot-avatar.svg',
    phone: '13888886666',
    isLoggedIn: true,
    level: '黄金会员 LV.2',
    points: 680,
    nextLevelPoints: 1000
  });

  // Selected dish for full-page product detail
  const [selectedDishDetail, setSelectedDishDetail] = useState<Dish | null>(DISHES[0]);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  // 门店选择已从「弹窗」改成「壳内页面」（2026-10-25），状态名同步改成 Page
  const [isStorePageOpen, setIsStorePageOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNutritionReportOpen, setIsNutritionReportOpen] = useState(false);
  const [isHealthPlanOpen, setIsHealthPlanOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingCycle, setLoadingCycle] = useState(0);
  const [loadingDuration, setLoadingDuration] = useState(1100);
  // 下层在退场淡出期间也保持 inert，避免点击穿透和键盘进入底部导航。
  const [isLoadingOverlayPresent, setIsLoadingOverlayPresent] = useState(true);
  const reduceMotion = useReducedMotion();
  const finishLoading = useCallback(() => setIsLoading(false), []);

  const triggerPageLoad = useCallback((minDurationMs: number = 680) => {
    setLoadingDuration(minDurationMs);
    setLoadingCycle((c) => c + 1);
    setIsLoadingOverlayPresent(true);
    setIsLoading(true);
  }, []);

  const handleNavigateTab = useCallback(
    (nextTab: string) => {
      if (nextTab === activeTab && !isProductDetailOpen) return;
      triggerPageLoad(680);
      setIsProductDetailOpen(false);
      setPreviousTab(activeTab);
      setActiveTab(nextTab);
    },
    [activeTab, isProductDetailOpen, triggerPageLoad]
  );

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Flying Dish-to-Orb animation state & Tote Bag Mascot choreography stage
  const [flyingOrbs, setFlyingOrbs] = useState<FlyingOrbItem[]>([]);
  const [mascotStage, setMascotStage] = useState<ToteMascotStage>('idle');
  const pendingOrbAdditionsRef = React.useRef<
    Map<string, { dish: Dish; qty: number }>
  >(new Map());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Cart Item calculation helpers
  const cartItems: CartItem[] = Object.entries(cart)
    .map(([idStr, qty]) => {
      const numId = Number(idStr);
      const dish = DISHES.find((d) => d.id === numId) || customDishes[numId];
      const quantity = Number(qty);
      if (!dish || quantity <= 0) return null;
      return { dish, quantity };
    })
    .filter((item): item is CartItem => item !== null);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectDish = (dish: Dish) => {
    /* ⚠️ 售尽不能进详情（2026-10-27 用户「已售尽的不能点进去」）。
       拦截放在这里而不是卡片上：进详情的入口有点餐卡、搜索弹窗结果、收藏页卡片、
       首页人气卡四处，全部走这一个函数。
       点了给一句「已售尽」而不是毫无反应 —— 卡片本身已经去掉手型和按压反馈，
       不会让人觉得"能点却没反应"。 */
    if (dish.soldOut) {
      showToast('已售尽');
      return;
    }
    triggerPageLoad(620);
    setSelectedDishDetail(dish);
    setIsProductDetailOpen(true);
  };

  const handleCloseProductDetail = () => {
    triggerPageLoad(560);
    setIsProductDetailOpen(false);
    if (activeTab === 'product-detail') {
      setActiveTab(previousTab || 'home');
    }
  };

  const handleBackFromSubpage = useCallback(() => {
    const fallback = activeTab === 'fav' ? 'me' : 'menu';
    const target = previousTab && previousTab !== activeTab ? previousTab : fallback;
    handleNavigateTab(target);
  }, [activeTab, previousTab, handleNavigateTab]);

  // 接入全局 LIFO 返回栈（顺序：二级页在下，详情页在上，弹窗通过各自组件挂载在最顶）
  useBackLayer(activeTab === 'cart' || activeTab === 'fav', handleBackFromSubpage);
  useBackLayer(isProductDetailOpen, handleCloseProductDetail);

  const commitDishToCart = useCallback((dish: Dish, qty: number = 1) => {
    if (!DISHES.some((d) => d.id === dish.id)) {
      setCustomDishes((prev) => ({ ...prev, [dish.id]: dish }));
    }
    setCart((prev) => ({
      ...prev,
      [dish.id]: (prev[dish.id] || 0) + qty
    }));
  }, []);

  const handleOrbComplete = useCallback(
    (orbId: string) => {
      const pending = pendingOrbAdditionsRef.current.get(orbId);
      if (pending) {
        pendingOrbAdditionsRef.current.delete(orbId);
        commitDishToCart(pending.dish, pending.qty);
      }
      setFlyingOrbs((prev) => prev.filter((o) => o.id !== orbId));
    },
    [commitDishToCart]
  );

  const handleAddToCart = (
    dish: Dish,
    qty: number = 1,
    sourceRect?: DOMRect | null
  ) => {
    /* ⚠️ 售尽拦截放在**这里**，而不是各个按钮上：
       加购入口一共有 4 个（点餐卡加号、详情页加入购物车/立即购买、收藏页加入购物车、
       购物车页的「再来一份」），逐个加判断必然漏一个。这里是唯一收口处。
       各个按钮自己那一份判断只负责**视觉**（灰底/文案），不承担拦截。 */
    if (dish.soldOut) {
      showToast('已售尽');
      return;
    }
    const stageEl = document.getElementById('cart-fly-orb-stage');
    if (activeTab === 'menu' && !isProductDetailOpen && stageEl && sourceRect) {
      const stageRect = stageEl.getBoundingClientRect();
      const startX =
        sourceRect.left - stageRect.left + sourceRect.width * 0.5;
      const startY =
        sourceRect.top - stageRect.top + sourceRect.height * 0.5;
      const orbId = `orb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // If cart is currently empty, mount FloatingCart immediately so the tote bag is ready to catch
      if (totalCartCount === 0) {
        commitDishToCart(dish, qty);
      } else {
        pendingOrbAdditionsRef.current.set(orbId, { dish, qty });
      }

      setFlyingOrbs((prev) => [
        ...prev,
        {
          id: orbId,
          dishName: dish.name,
          dishImage: dish.image,
          startX,
          startY,
          createdAt: performance.now(),
          duration: 540
        }
      ]);
      return;
    }

    commitDishToCart(dish, qty);
    showToast(`已添加【${dish.name}】${qty > 1 ? `×${qty}` : ''}到购物车`);
  };

  const handleBuyNow = (dish: Dish, qty: number = 1) => {
    // 「立即购买」不走 handleAddToCart（它自己写 cart + 触发页载），所以售尽要单独拦一次
    if (dish.soldOut) {
      showToast('已售尽');
      return;
    }
    triggerPageLoad(560);
    setCart((prev) => ({
      ...prev,
      [dish.id]: (prev[dish.id] || 0) + qty
    }));
    setIsProductDetailOpen(false);
    showToast(`已添加【${dish.name}】到购物车，可在微信小程序中结算`);
  };

  const handleOpenCheckout = () => {
    if (cartItems.length === 0) {
      showToast('购物车还是空的，快去挑选心仪轻食吧');
      return;
    }
    showToast('已同步购物车，结算将在微信小程序中完成');
  };

  const handleRemoveFromCart = (dish: Dish) => {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[dish.id] || 0;
      if (current <= 1) {
        delete next[dish.id];
      } else {
        next[dish.id] = current - 1;
      }
      return next;
    });
  };

  const handleClearCart = () => {
    setCart({});
    showToast('购物车已清空');
  };

  const handleToggleFavorite = (dishId: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(dishId)) {
        next.delete(dishId);
        showToast('已从收藏中移除');
      } else {
        next.add(dishId);
        showToast('已加入我的收藏');
      }
      return next;
    });
  };

  const handleReorder = (order: Order) => {
    const newCart: Record<number, number> = {};
    order.items.forEach((item) => {
      newCart[item.dish.id] = item.quantity;
    });
    setCart(newCart);
    handleNavigateTab('cart');
    showToast('菜品已重新加入购物车');
  };

  const handleClaimGachaCoupon = (newCoupon: Coupon) => {
    setCoupons((prev) => [newCoupon, ...prev]);
    setSelectedCoupon(newCoupon);
  };

  const handlePaymentSuccess = () => {
    // Generate new order
    const subtotal = cartItems.reduce(
      (acc, item) => acc + item.dish.dealPrice * item.quantity,
      0
    );
    const freeThreshold = 40;
    const deliveryFee = orderMode === 'pickup' ? 0 : subtotal >= freeThreshold ? 0 : 4;
    const packageFee = 2;
    const discount = selectedCoupon ? selectedCoupon.discount : 0;
    const finalTotal = Math.max(0, subtotal + deliveryFee + packageFee - discount);

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNo: `#20260822${Math.floor(100 + Math.random() * 900)}`,
      createdAt: '刚刚',
      mode: orderMode,
      storeName: currentStore.name,
      address:
        orderMode === 'takeout'
          ? '静安寺路 88 号 嘉里中心 2F 208室'
          : `${currentStore.name} 门店自取柜`,
      items: [...cartItems],
      subtotal,
      deliveryFee,
      discount,
      total: finalTotal,
      status: orderMode === 'takeout' ? 'delivering' : 'cooking',
      statusText:
        orderMode === 'takeout'
          ? '后厨已接单，骑手正在路上'
          : '后厨制作中，预计 10 分钟后可取',
      estimatedTime: orderMode === 'takeout' ? '约 25 分钟' : '约 10 分钟'
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart({});
    handleNavigateTab('orders');
    showToast('支付成功！已为您生成点餐订单');
  };

  const handleLoginSuccess = (name: string, phone: string) => {
    setUser({
      name,
      avatar: '/mascot-avatar.svg',
      phone,
      isLoggedIn: true,
      level: '黄金会员 LV.2',
      points: 800,
      nextLevelPoints: 1000
    });
    showToast(`欢迎回来，${name}！`);
  };

  const handleLogout = () => {
    setUser((prev) => ({
      ...prev,
      isLoggedIn: false,
      name: '游客用户',
      points: 0
    }));
    showToast('已退出登录');
  };

  const favoriteDishesList = DISHES.filter((d) => favorites.has(d.id));
  const popularDishesList = DISHES.filter((d) => d.isPopular);
  const ongoingOrdersCount = orders.filter(
    (o) => o.status === 'delivering' || o.status === 'cooking' || o.status === 'pending'
  ).length;

  return (
    /* reducedMotion="user"：系统开了「减弱动态效果」时，motion 自动跳过 transform / layout 动画，
       只保留 opacity 淡入淡出。
       ⚠️ 2026-10-30 补：此前只有加载屏那一处 transition 读了 useReducedMotion()，
          其余全部 motion.div（详情页 spring 缩放、下层 0.93 缩放、购物车飞球）在
          减弱动效下照旧弹跳 —— 这正是「前庭失调用户会不适」的那一类大幅位移动画。
          挂在根节点一处，比逐个组件传 prefersReducedMotion 可靠：新加的 motion 动画自动继承。
       ⚠️ CSS 侧兜底仍靠 index.css 里的 @media (prefers-reduced-motion: reduce)，
          两条路互不覆盖（motion 管 JS 动画，CSS 管 keyframes）。 */
    <MotionConfig reducedMotion="user">
    <DeviceFrameWrapper
      bgColor={activeTab === 'gacha' ? 'bg-[#C7F665]' : 'bg-[#F4F6F8]'}
      fitHeight={activeTab === 'gacha'}
    >
      {/* 品牌开场与页面切换加载动画：实时检测 #app-page-stage 内所有图片/视频/字体加载完成后再揭幕 */}
      <AnimatePresence onExitComplete={() => setIsLoadingOverlayPresent(false)}>
        {isLoading && (
          <motion.div
            key={`brand-loading-screen-${loadingCycle}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-[70] overflow-hidden"
          >
            <LoadingScreen
              onFinish={finishLoading}
              duration={loadingDuration}
              targetSelector="#app-page-stage"
              canSkip
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        id="app-page-stage"
        className={`flex-1 w-full min-h-0 flex flex-col relative overflow-hidden transition-opacity duration-150 ${
          isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        inert={isLoadingOverlayPresent ? true : undefined}
        aria-busy={isLoadingOverlayPresent}
      >
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* 仿微信小程序右上角的「··· | ⊙」胶囊 —— 2026-11-03 22:06 用户
          「稍微扩大一点，并且所有页面都显示这个，都在这个位置」。
          挂在这里而不是各页面自己画：全站只有一个实例、坐标只有一处、尺寸改一次全站跟着变。
          ⚠️ z-[55] 是算出来的：详情页 50 之上（详情页会盖住页面舞台），门店/登录弹窗
             60 之下（它们是 body 上的 portal，本来也压得住壳内所有内容）。
          ⚠️ pointer-events-none：它是装饰，两个图形都不可点，别加 onClick。
          ⚠️ 各页面右上角若有自带元素（抽卡页信息钮 / 首页轮播指示器 / 订单页搜索钮），
             需要各自让位 —— 见各页面里的说明，不要靠挪这枚胶囊解决。 */}
      <div id="mp-capsule" className="pointer-events-none absolute right-3 top-2.5 z-[55]">
        <MiniProgramCapsule />
      </div>

      {/* 2026-10-28 用户「订单页面去掉」这张门店/配送方式条 —— 已整行移除。
          它原本只在 activeTab === 'orders' 时出现（home/menu/gacha/me/product-detail
          全被排除），所以这里去掉后 `HeaderBar` 暂时没有任何页面在用；
          组件文件保留（门店页/结算页以后想复用），不要顺手删。
          门店入口没丢：点餐页与「我的」页仍能打开门店页。
          ⚠️ 想恢复只留门店、只去掉「外卖配送 / 到店自取」切换，请只删 HeaderBar 里
             那个 Mode Toggle 的 div，不要把整行加回来。 */}

      {/* Main Tab Screen Content */}
      <main className="flex-1 w-full min-h-0 flex flex-col overflow-hidden relative">
        <motion.div
          animate={{
            scale: isProductDetailOpen ? 0.93 : 1,
            y: isProductDetailOpen ? 6 : 0,
            opacity: isProductDetailOpen ? 0.6 : 1,
            borderRadius: isProductDetailOpen ? 20 : 0,
            filter: isProductDetailOpen ? 'brightness(0.92)' : 'brightness(1)'
          }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 32,
            mass: 0.75
          }}
          className="flex-1 w-full min-h-0 flex flex-col overflow-hidden relative origin-top transform-gpu will-change-transform"
        >
          {activeTab === 'home' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <HomePage
                onNavigate={handleNavigateTab}
                onSelectDish={handleSelectDish}
                onAddToCart={handleAddToCart}
                onSetMode={setOrderMode}
                popularDishes={popularDishesList}
                isLoggedIn={user.isLoggedIn}
                user={user}
                onOpenLogin={() => setIsLoginModalOpen(true)}
                onShowToast={showToast}
              />
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <MenuPage
                dishes={DISHES}
                currentStore={currentStore}
                mode={orderMode}
                onModeChange={setOrderMode}
                onOpenStorePage={() => setIsStorePageOpen(true)}
                cartQuantities={cart}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onSelectDish={handleSelectDish}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onShowToast={showToast}
              />
            </div>
          )}

          {activeTab === 'cart' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <CartPage
                cartItems={cartItems}
                mode={orderMode}
                store={currentStore}
                onOpenStore={() => setIsStorePageOpen(true)}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onOpenCheckout={handleOpenCheckout}
                onNavigate={handleNavigateTab}
                onBack={handleBackFromSubpage}
                selectedCoupon={selectedCoupon}
                onSelectCoupon={setSelectedCoupon}
                coupons={coupons}
                onSelectDish={handleSelectDish}
              />
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <OrdersPage
                orders={orders}
                onReorder={handleReorder}
                onShowToast={showToast}
                onNavigate={handleNavigateTab}
              />
            </div>
          )}

          {activeTab === 'gacha' && (
            /* ⚠️ 2026-11-02 补 `flex-1`：盲盒页内容高度随宽度变（头图 aspect-[4/3]、
               卡片 grid），390×844 时正好 836 塞得下，360×640 是 803、412×732 是 868 ——
               以前壳是 `h-auto` 被内容撑开，整页滚起来把底栏一起滚走（实测要滚 163px
               才能切 tab）。补上 `flex-1 min-h-0` 后这一层变成真正的滚动区：
               壳被 `.shell-maxh-safe` 锁在视口内，内容超出就只滚这里，底栏留在原位。 */
            <div className="w-full flex-1 min-h-0 overflow-y-auto bg-[#C7F665]">
              <GachaPage
                onClaimCoupon={handleClaimGachaCoupon}
                onAddToCart={handleAddToCart}
                onNavigate={handleNavigateTab}
                onShowToast={showToast}
              />
            </div>
          )}

          {activeTab === 'fav' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <FavPage
                favoriteDishes={favoriteDishesList}
                onAddToCart={handleAddToCart}
                onRemoveFavorite={handleToggleFavorite}
                onSelectDish={handleSelectDish}
                onNavigate={handleNavigateTab}
                onBack={handleBackFromSubpage}
              />
            </div>
          )}

          {activeTab === 'me' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <MePage
                user={user}
                ordersCount={orders.length}
                favsCount={favorites.size}
                coupons={coupons}
                onNavigate={handleNavigateTab}
                onOpenLogin={() => setIsLoginModalOpen(true)}
                onLogout={handleLogout}
                onShowToast={showToast}
                onOpenNutritionReport={() => setIsNutritionReportOpen(true)}
                onOpenHealthPlan={() => setIsHealthPlanOpen(true)}
              />
            </div>
          )}
        </motion.div>

        {/* Expanding Product Detail Overlay Modal with Card-Zoom Spring Physics */}
        <AnimatePresence>
          {isProductDetailOpen && selectedDishDetail && (
            <>
              {/* Dimmed backdrop layer */}
              <motion.div
                key="product-detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
                onClick={handleCloseProductDetail}
                className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
              />

              <motion.div
                key={`product-detail-modal-${selectedDishDetail.id}`}
                initial={{
                  opacity: 0,
                  scale: 0.86,
                  y: 40,
                  borderRadius: 28,
                  boxShadow: '0 25px 60px -12px rgba(28, 54, 16, 0.4)'
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  borderRadius: 0,
                  boxShadow: '0 0px 0px 0px rgba(0, 0, 0, 0)'
                }}
                exit={{
                  opacity: 0,
                  scale: 0.86,
                  y: 45,
                  borderRadius: 26,
                  boxShadow: '0 15px 35px -10px rgba(28, 54, 16, 0.3)'
                }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 32,
                  mass: 0.75
                }}
                className="absolute inset-0 z-50 overflow-hidden bg-[#F4F6F8] flex flex-col origin-center transform-gpu will-change-transform"
              >
                <ProductDetailPage
                  dish={selectedDishDetail}
                  onBack={handleCloseProductDetail}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  isFav={favorites.has(selectedDishDetail.id)}
                  onToggleFav={handleToggleFavorite}
                  onShowToast={showToast}
                  orderMode={orderMode}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Store Branch Picker —— 2026-10-28 改回「贴纸风弹窗」（StickerModal）。
          原来这里是 `absolute inset-0 z-[60]` 的右滑整页；换成弹窗后**必须去掉这层
          motion.div**：它身上有 transform，子级 `fixed` 会以它为包含块，
          弹窗只会铺满手机壳、遮罩也压不住底部导航。现在由 StorePage 内部自己 fixed。 */}
      <StorePage
        isOpen={isStorePageOpen}
        currentStore={currentStore}
        onBack={() => setIsStorePageOpen(false)}
        onSelectStore={(store) => {
          setCurrentStore(store);
          setIsStorePageOpen(false);
          showToast(`已切换至【${store.name}】`);
        }}
      />

      {/* Floating Bottom Cart with Upward Expanding Drawer (Only visible on menu/ordering page when detail is not open) */}
      {activeTab === 'menu' && !isProductDetailOpen && (
        <FloatingCart
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onOpenCheckout={handleOpenCheckout}
          onSelectDish={handleSelectDish}
          mascotStage={mascotStage}
        />
      )}

      {/* High-FPS Parabolic Dish-to-Orb Flight & Bag Impact Burst Layer */}
      <CartFlyOrbLayer
        orbs={flyingOrbs}
        onOrbComplete={handleOrbComplete}
        onMascotStageChange={setMascotStage}
      />

      {/* Fixed Bottom Navigation Bar (Hidden when on product detail page) */}
      {!isProductDetailOpen && (
        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={handleNavigateTab}
          cartCount={totalCartCount}
          ongoingOrdersCount={ongoingOrdersCount}
        />
      )}

      {/* User Login Authorization Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Nutrition Weekly Intake Report Modal */}
      <NutritionReportModal
        isOpen={isNutritionReportOpen}
        onClose={() => setIsNutritionReportOpen(false)}
      />

      {/* Health Plan Modal */}
      <HealthPlanModal
        isOpen={isHealthPlanOpen}
        onClose={() => setIsHealthPlanOpen(false)}
        onShowToast={showToast}
      />
      </div>
    </DeviceFrameWrapper>
    </MotionConfig>
  );
}
