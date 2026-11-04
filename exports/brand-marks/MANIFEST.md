# 标志合集 · 导出清单

轻食点餐小程序（remix-greenbite）全部品牌标识与功能图标，共 **16** 枚。
导出时间 2026-10-30，由 `scripts/_export-marks.mjs` 从**真实组件**渲染后序列化，非手绘复制。

## 文件

| 编号 | 名称 | 类型 | 文件 |
|---|---|---|---|
| A1 | 品牌主标 | 矢量 SVG | `marks/A1-品牌主标.svg` |
| A2 | 吉祥物头像 | 矢量 SVG | `marks/A2-吉祥物头像.svg` |
| A3 | 吉祥物 · 戴皇冠 | 矢量 SVG | `marks/A3-吉祥物-戴皇冠.svg` |
| B1 | 抽卡币 · 皇冠 | 矢量 SVG | `marks/B1-抽卡币-皇冠.svg` |
| B2 | 抽卡币 · 皇冠（描边） | 矢量 SVG | `marks/B2-抽卡币-皇冠（描边）.svg` |
| B3 | 9 折限时气泡 | 矢量 SVG | `marks/B3-9-折限时气泡.svg` |
| C1 | 全部热卖 | 矢量 SVG | `marks/C1-全部热卖.svg` |
| C2 | 清爽沙拉 | 矢量 SVG | `marks/C2-清爽沙拉.svg` |
| C3 | 主食能量碗 | 矢量 SVG | `marks/C3-主食能量碗.svg` |
| C4 | 暖心轻食 | 矢量 SVG | `marks/C4-暖心轻食.svg` |
| C5 | 低卡鲜饮 | 矢量 SVG | `marks/C5-低卡鲜饮.svg` |
| C6 | 蛋白小食 | 矢量 SVG | `marks/C6-蛋白小食.svg` |
| D1 | 红包福字 | 矢量 SVG | `marks/D1-红包福字.svg` |
| D2 | 握手缝合 | 矢量 SVG | `marks/D2-握手缝合.svg` |
| D3 | 外卖配送 | 位图 PNG | `marks/D3-外卖配送.png` |
| D4 | 到店自取 | 位图 PNG | `marks/D4-到店自取.png` |

- `标志合集.png` —— 排版好的合集图（3120px 宽，dpr2）
- `标志合集.svg` —— 单文件矢量合集，可直接在设计工具里打开逐个取用
- `marks/` —— 每枚标志一个独立文件

## 品牌色

| 用途 | 色值 |
|---|---|
| 青柠（主色 / 填充描边） | `#C7F665` |
| 青柠深（白底可当文字） | `#54801A` |
| 玫红（价格 / 促销 / 气泡） | `#FC5294` |
| 品牌金（抽卡币 / 高亮） | `#FDCF29` |
| 墨黑（文字 / 描边） | `#0B0F14` |

## 来源

| 编号 | 来源 |
|---|---|
| A1 | `src/components/FreshFoodLogo.tsx` |
| A2 / A3 | `public/mascot-avatar-hd.svg` / `mascot-avatar-crowned.svg` |
| B1 / B2 | `src/components/TokenIcon.tsx` |
| B3 | `src/components/GachaPage.tsx` → `DISCOUNT_BUBBLE_D` |
| C1–C6 | `src/components/CategoryIcons.tsx` |
| D1 | `src/components/RedPacketFuIcon.tsx` |
| D2 | `src/components/HandshakeStitchIcon.tsx` |
| D3 / D4 | `public/1b67bdaeb3b2740899ad324d0df7f544.png` / `edd0acc180bfd09016dd25d86701cc17.png` |

## 重新导出

组件改过之后重跑：

```bash
node scripts/_export-marks.mjs
```

⚠️ 唯一需要手工同步的是 B3 气泡：它的路径在 `GachaPage.tsx` 内部（未导出为常量），
`scripts/export-marks.tsx` 顶部有一份副本，改那边要同步这里。
