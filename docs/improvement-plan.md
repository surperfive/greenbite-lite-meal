# GreenBite 小程序改进清单

> 2026-10-29 评审。全部结论来自实际代码/构建/运行时检查，不是通用建议。
> 优先级按「用户是否会立刻感到卡、丢东西、不能用」排，不按技术含量排。

---

## P0 — 会让用户当场觉得"坏了"

### 1. 状态全在内存，刷新即清空

`src/App.tsx:52-71` —— 购物车 `cart`、自定义菜 `customDishes`、收藏 `favorites`、
订单 `orders`、优惠券 `coupons`、`user` 全是 `useState`，**没有一处持久化**。
全项目只有搜索历史（`SearchModal.tsx:73`）和健康计划（`HealthPlanModal.tsx:59`）用了 localStorage。

后果：微信里切后台被回收 → 回来购物车归零；用户手滑下拉刷新 → 刚加的单没了。
这是电商类产品最伤的失败模式。

改法：抽一个 `usePersistentState(key, initial)`，先接 `cart` / `favorites` / `user` / `orders`，
key 加版本号（`gb.cart.v1`），读到脏数据时 try/catch 回退默认值。

### 2. 没有返回键 / 手势返回

`src/App.tsx` 里 grep 不到 `history` / `popstate` / `pushState`。
`activeTab` 是纯内存状态，与 URL 无关。

后果：安卓物理返回键、iOS 侧滑 → 直接退出应用，而不是"从商品详情退回列表"。
商品详情（`isProductDetailOpen`）、弹窗也都吃不到返回键。

改法：`activeTab` + 弹窗栈同步到 `history.state`，监听 `popstate` 回退一层；
先覆盖「详情页 / 弹窗 / 非首页 tab」三种场景即可。

### 3. 每次切 tab 都放 680ms 全屏品牌过场

`src/App.tsx:96` —— `handleNavigateTab` 无条件调 `triggerPageLoad(680)`，
`LoadingScreen` 是全屏不透明层。

后果：点底部导航要黑屏等 0.68 秒才看到内容，连点三个 tab 就是 2 秒。
小程序里底部 tab 应当是瞬时的，这是"卡"的主要来源之一。

改法：首次冷启动保留过场（品牌需要），运行期切 tab 改成 120~180ms 的轻过渡或骨架屏；
`triggerPageLoad` 加一个 `firstLaunchOnly` 参数。

### 4. 结算没有支付，只有 toast

`CartPage.tsx:349` 的「提交订单」→ `onOpenCheckout` → 一条 toast 就结束了，
没有收银台、没有支付中/成功/失败三态、没有"待支付"订单。

后果：这是"演示"和"产品"的分界线。真上线必须有微信支付（或至少一个支付结果页 + 超时取消）。

---

## P1 — 体验与工程，直接影响留存

### 5. 首包 720 KB 单 chunk，零分包

实测 `vite build`：

```
index.js   720.09 kB │ gzip: 210.43 kB     ← 单 chunk，无 code-split
index.css  146.55 kB │ gzip:  21.71 kB
```

`GachaPage.tsx` 2643 行、`GachaBurstReveal.tsx` 686 行、`ProductDetailPage.tsx` 1240 行
全被塞进首包，用户只是来点个餐，却要先下载抽卡大动画。

改法：`React.lazy` 拆 `GachaPage` / `ProductDetailPage` / `CartPage`；
`build.rollupOptions.output.manualChunks` 把 `motion`、`lucide-react` 单独成 vendor chunk。
目标首屏 JS 压到 300 KB 以内（gzip < 100 KB）。

### 6. 33 张 img，0 个 `loading="lazy"`

```bash
grep -rn 'loading="lazy"' src | wc -l   # → 0
grep -rn '<img' src | wc -l              # → 33
```

另外 `public/891.mp4`（345 KB）、`public/893.mp4`（329 KB）大概率是自动播的装饰视频。

改法：卡片/列表内的 `<img>` 全部加 `loading="lazy" decoding="async"`；
`LoopingVideo` 加 `preload="none"` + 进入视口再 play（IntersectionObserver）。

### 7. 字体走 Google Fonts 外链

`index.html:12-14` 引 `fonts.googleapis.com` 的 `Plus Jakarta Sans` + `Noto Sans SC`。

后果：国内网络基本拉不到，浏览器会挂起到超时才回退 `system-ui` ——
首屏文字会先"隐形"再蹦出来（FOIT），弱网下能卡 3~8 秒。而且中文字体包很大。

改法：自托管子集化字体（`fonttools pyftsubset` 只留用到的字），或用
`font-display: swap` + 只保留拉丁字体、中文走系统字体（微信小程序内本来就该用系统字）。

### 8. `theme-color` 是旧品牌绿，且没有 favicon / manifest

- `index.html:6`：`theme-color = #059669`（老深绿），与现在的青柠 `#C7F665` / 玫红 `#FC5294` 完全不搭。
- 全项目**没有 favicon、没有 `manifest.json`**，也没有 `apple-mobile-web-app-*` 标签。

后果：微信外打开时标签页是空白图标；"添加到主屏幕"后没有图标、没有独立窗口、顶部状态栏颜色错。

改法：补 `favicon.ico` + `apple-touch-icon` + `manifest.webmanifest`（name / icons / theme_color / display: standalone），
`theme-color` 改成页面底色 `#F5F6F8` 或品牌青柠。

### 9. 输入框缺 `inputMode` / `autoComplete`

`LoginModal.tsx:105` 手机号只写了 `type="tel"`，没有 `inputMode="numeric"`、`autoComplete="tel"`；
验证码框没有 `autoComplete="one-time-code"`（iOS 收不到短信自动填充）；
`SearchModal.tsx:210` 搜索框没有 `enterKeyHint="search"`。

改法：三个属性一行一个加上，成本极低、体感提升明显。

### 10. Toast 对读屏器不可见

`Toast.tsx:12` 只是一个 `div`，没有 `role="status"` / `aria-live="polite"`。
另外 2200ms 是 `App.tsx:115` 写死的，且 `setTimeout` 没有清理（快速连续 toast 会被前一个提前清掉）。

改法：加 `role="status" aria-live="polite"`；用 ref 存 timer，`useEffect` 里 clear。

---

## P2 — 产品完整度，看你要做到哪一步

| # | 缺口 | 现状 | 影响 |
|---|---|---|---|
| 11 | 地址 / 定位选店 | `STORES` 写死，无选址、无"距离我最近" | 外卖类硬需求，现在只能选固定门店 |
| 12 | 订单状态机 | 订单列表是静态 mock，只有"催单/评价/再来一单"三个 toast | 无法体现"制作中→配送中→已完成" |
| 13 | 分享裂变 | 有邀请 banner 图，但无分享卡片 / 邀请码 / 到账回调 | 拉新链路断在最后一米 |
| 14 | 客服 / 售后 | 无入口 | 出问题时用户无处可去 |
| 15 | 骨架屏 / 网络态 | 靠 1.1s 品牌过场盖住加载 | 接真接口后会露馅 |
| 16 | 埋点 | 无 | 不知道哪一步流失 |

---

## 如果只做三件事

1. **持久化购物车 + 收藏 + 登录态**（P0-1）—— 直接减少"白干"的挫败。
2. **切 tab 不再放全屏过场**（P0-3）—— 一行参数的事，立竿见影的流畅感。
3. **首包分包 + 图片懒加载**（P1-5、P1-6）—— 首屏从 ~2 MB 降到几百 KB。

---

## 已经做得不错、别动的部分

- `ErrorBoundary` 已包在根节点（`main.tsx:9`）。
- 安全区适配到位：`env(safe-area-inset-top/bottom)` 用在浮动层与底栏。
- `prefers-reduced-motion` 有全局降级（`index.css:503`）。
- 触摸目标三档 + `gb-hit` 伪元素扩容方案（比直接把按钮画大更聪明）。
- 色板/字号/描边/区块头有 `docs/ui-spec.md` 兜底，改样式不至于各写各的。
