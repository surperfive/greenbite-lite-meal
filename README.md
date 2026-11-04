# GreenBite · 轻食点餐小程序原型

一个**固定 410px 手机壳**的轻食外卖点餐 Web 原型，按微信小程序的操作逻辑与视觉语言实现：
底部 Tab、右上角「··· | ⊙」胶囊、贴纸风卡片、抽卡开盲盒、积分券包一应俱全。

> 纯前端原型，无后端。所有数据来自 `src/data/mockData.ts`，刷新即重置。

---

## 技术栈

| | |
|---|---|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 4（`@theme` 变量，无 CSS-in-JS） |
| 动画 | motion（原 framer-motion） |
| 图标 | lucide-react + 少量自绘 SVG |
| 3D | 纯 CSS 3D 变换（`FoodCloche3D`） |

## 本地运行

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # 产物在 dist/
npm run preview  # 预览构建结果
npm run lint     # tsc --noEmit 类型检查
```

无需任何环境变量或 API Key。

---

## 设计系统

### 三色职责（全站唯一来源，见 `src/index.css`）

| 角色 | 色值 | 用途 |
|---|---|---|
| 青柠 | `#C7F665` | 品牌主色：主行动按钮、填充、描边、高亮面 |
| 黑 | `#080907` | 描边、文字、硬投影（不用灰色软阴影） |
| 玫红 | `#FC5294` | 价值强调：价格、小红点、收藏、HOT/TOP 角标 |

色阶由 `--lime-50 / 100 / 400 / 500 / 700 / 900` 派生，新 UI 一律从变量取色，**不再手写新的绿色 hex**。

⚠️ 对比度硬约束：玫红对青柠仅 **2.47:1**，绝不能压青柠面；玫红对白 **3.10:1**，须垫白底使用。

### 卡片语言

白卡无黑边 + 极轻投影；主行动 = 青柠底 + 黑边 + 黑字 + 硬投影；胶囊一律 `rounded-full`；
按压统一 `active:scale-[0.98]`，过渡 200ms。

### 固定壳 + 壳内流体

外层 `w-full max-w-[410px]`，壳内全 flex/grid/百分比，**刻意零 `sm:`/`md:` 断点**——
这是移动端原型，不做响应式分栏。fixed 覆盖层用 portal 挂到 body，壳内弹窗走
`StickerModal` 的 `useShellBox()` 计算壳内坐标。

---

## 目录结构

```
src/
├── App.tsx                 页面舞台：状态切页 + 页面过渡 + 全局覆盖层
├── index.css               Tailwind 入口 + 品牌色变量 + 全局基础样式
├── components/             40+ 页面与组件
│   ├── HomePage / MenuPage / OrdersPage / MePage / GachaPage / ProductDetailPage
│   ├── DishCoverArt       菜品图统一构图（透明抠图 + 中心缩放）
│   ├── MiniProgramCapsule 右上角「··· | ⊙」全局胶囊
│   ├── StickerModal       壳内弹窗基座（贴纸风）
│   └── FoodCloche3D       抽卡开盖 3D 动画
├── data/mockData.ts        菜品/订单/用户 mock 数据
└── utils/                  背景映射、食材插画映射、音频单例

public/                     静态素材（已压缩至 ~1.4MB）
docs/ui-spec.md             UI 规格书（47KB，含逐组件标注）
scripts/                    验证与素材生成脚本（Playwright / PIL）
```

---

## 验证脚本

项目里保留了开发期用的验证脚本，可直接重跑：

```bash
node scripts/_asset-usage-scan.mjs     # 静态资源是否被引用
node scripts/_missing-asset-check.mjs  # 源码引用的资源是否存在（断链检查）
node scripts/_runtime-404-check.mjs    # 运行时 404 巡检（能抓 CSS 背景与动态拼接路径）
node scripts/_measure-display-size.mjs # 实测每张图的真实渲染尺寸
node scripts/_capsule-overlap-audit.mjs # 全站元素与右上角胶囊的遮挡审计
```

素材处理需要 Python 3 + Pillow + numpy + scipy（路径见各脚本头部说明）。

---

## 说明

- 这是**界面原型**，不含真实下单、支付、登录逻辑。
- 菜品图、banner 等素材为演示用途。
- 微信小程序胶囊、底部 Tab 等均为视觉还原，非真实小程序容器。
