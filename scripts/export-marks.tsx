/**
 * 标志合集导出页（非产品页面）
 * ------------------------------------------------------------------
 * 为什么不用手抄几何：标志的 path 分散在 8 个组件里，手抄必然漂移。
 * 这里把**真实组件**挂载出来，再由 `scripts/_export-marks.mjs`：
 *   1) 整页截图 → 标志合集.png
 *   2) 逐个 `[data-code] svg` 序列化 → 每个标志一个独立 .svg
 *   3) 拼装 → 标志合集.svg（一个文件里并排全部标志）
 * 因此**这里不需要维护任何形状数据**，组件改了重跑脚本即可。
 *
 * ⚠️ 版面样式一律用下面的**自有 CSS 类**，不用 Tailwind arbitrary 值：
 *   这个文件是 dev server 启动后才新建的，`@tailwindcss/vite` 的按需扫描没覆盖它，
 *   `w-[1560px]` / `text-[54px]` 这类只在它里出现过的类不会被生成 → 版面直接塌掉。
 *   （组件内部已经在源码里的 Tailwind 类是正常生成的，所以 index.css 仍要引入。）
 *
 * 唯一例外：`#badge-discount` 的气泡路径在 GachaPage 内部（非导出常量），
 * 下面 `BUBBLE_D` 是同步副本，改 GachaPage 的 `DISCOUNT_BUBBLE_D` 要同步这里。
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';

import { FreshFoodLogo } from '../src/components/FreshFoodLogo';
import TokenIcon from '../src/components/TokenIcon';
import { CategoryIcon } from '../src/components/CategoryIcons';
import { RedPacketFuIcon } from '../src/components/RedPacketFuIcon';
import { HandshakeStitchIcon } from '../src/components/HandshakeStitchIcon';

/* 同步自 GachaPage.tsx 的 DISCOUNT_BUBBLE_D */
const BUBBLE_D =
  'M650.5,22 H770.5 A16,16 0 0 1 786.5,38 V53 A16,16 0 0 1 770.5,69 H692 ' +
  'C683,69 675,78 662,87 L666,69 H650.5 A16,16 0 0 1 634.5,53 V38 A16,16 0 0 1 650.5,22 Z';

const DiscountBubble: React.FC = () => (
  <svg viewBox="618 8 178 86" className="s-h132" aria-label="9折限时气泡徽章">
    <path d={BUBBLE_D} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="12" strokeLinejoin="round" />
    <path d={BUBBLE_D} fill="#FC5294" strokeLinejoin="round" />
    <g transform="translate(663.1,47.4) scale(0.66)">
      <path
        d="M-16,10 L-16,-6 L-9,0 L0,-12 L9,0 L16,-6 L16,10 Z"
        fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round"
      />
    </g>
    <text
      x="682.1" y="56.3" fontSize="24" fill="#FFFFFF"
      style={{ fontFamily: 'var(--mk-sans)', fontWeight: 900 }}
    >9折限时</text>
  </svg>
);

type Mark = { code: string; name: string; meta: string; node: React.ReactNode };

const A: Mark[] = [
  {
    code: 'A1', name: '品牌主标', meta: 'FRESH FOOD 皇冠贴纸 · 矢量',
    node: <FreshFoodLogo className="s-h128" />,
  },
  {
    code: 'A2', name: '吉祥物头像', meta: 'mascot-avatar-hd · 矢量',
    node: <img src="/mascot-avatar-hd.svg" alt="" className="s-h128" />,
  },
  {
    code: 'A3', name: '吉祥物 · 戴皇冠', meta: 'mascot-avatar-crowned · 矢量',
    node: <img src="/mascot-avatar-crowned.svg" alt="" className="s-h128" />,
  },
];

const B: Mark[] = [
  {
    code: 'B1', name: '抽卡币 · 皇冠', meta: 'TokenIcon 实心 · 品牌金',
    node: (
      <span className="chip">
        <TokenIcon className="s-52 c-gold" />
      </span>
    ),
  },
  {
    code: 'B2', name: '抽卡币 · 皇冠（描边）', meta: 'TokenIcon outline · 装饰用',
    node: <TokenIcon outline className="s-52 c-ink" />,
  },
  {
    code: 'B3', name: '9 折限时气泡', meta: '抽卡页十连抽角标 · 矢量',
    node: <DiscountBubble />,
  },
];

const C_ITEMS = [
  { id: 'all', name: '全部热卖' },
  { id: 'salad', name: '清爽沙拉' },
  { id: 'bowl', name: '主食能量碗' },
  { id: 'hot', name: '暖心轻食' },
  { id: 'drink', name: '低卡鲜饮' },
  { id: 'snack', name: '蛋白小食' },
];
const C: Mark[] = C_ITEMS.map((it, i) => ({
  code: `C${i + 1}`,
  name: it.name,
  meta: `分类图标 · ${it.id}`,
  node: <CategoryIcon id={it.id} className="s-56 c-ink" />,
}));

const D: Mark[] = [
  { code: 'D1', name: '红包福字', meta: '邀请 / 红包 · 矢量', node: <RedPacketFuIcon className="s-104" /> },
  { code: 'D2', name: '握手缝合', meta: '好友助力 · 矢量', node: <HandshakeStitchIcon className="s-150x100" /> },
  {
    code: 'D3', name: '外卖配送', meta: '位图 256×256 · PNG',
    node: <img src="/1b67bdaeb3b2740899ad324d0df7f544.png" alt="" className="s-104" />,
  },
  {
    code: 'D4', name: '到店自取', meta: '位图 256×256 · PNG',
    node: <img src="/edd0acc180bfd09016dd25d86701cc17.png" alt="" className="s-104" />,
  },
];

const SECTIONS = [
  { key: 'A', title: '品牌标识', sub: 'BRAND IDENTITY', cols: 3, items: A },
  { key: 'B', title: '货币与徽章', sub: 'CURRENCY & BADGES', cols: 3, items: B },
  { key: 'C', title: '分类图标', sub: 'CATEGORY ICONS', cols: 6, items: C },
  { key: 'D', title: '场景图标', sub: 'SCENE ICONS', cols: 4, items: D },
];

const TOTAL = SECTIONS.reduce((n, s) => n + s.items.length, 0);

const Card: React.FC<{ m: Mark }> = ({ m }) => (
  <div className="card" data-code={m.code} data-name={m.name}>
    <div className="stage">{m.node}</div>
    <div className="foot">
      <div className="row">
        <span className="code">{m.code}</span>
        <span className="nm">{m.name}</span>
      </div>
      <div className="mt">{m.meta}</div>
    </div>
  </div>
);

const Sheet: React.FC = () => (
  <div className="sheet">
    <div className="head">
      <div>
        <div className="eyebrow">
          <i className="dot" />
          <span>BRAND MARKS</span>
        </div>
        <h1>标志合集</h1>
        <p className="sub">轻食点餐小程序 · 全部品牌标识与功能图标 · 共 {TOTAL} 枚</p>
      </div>
      <div className="meta">
        <div>remix-greenbite / v1.0</div>
        <div>2026-10-30</div>
        <div>矢量优先 · 位图已标注</div>
      </div>
    </div>

    {SECTIONS.map((s) => (
      <section key={s.key}>
        <div className="sec">
          <i className="bar" />
          <h2>{s.title}</h2>
          <span className="en">{s.sub}</span>
          <i className="rule" />
          <span className="n">{s.items.length} 枚</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${s.cols}, minmax(0, 1fr))` }}>
          {s.items.map((m) => <Card key={m.code} m={m} />)}
        </div>
      </section>
    ))}

    <div className="footer">
      <div>品牌色 · 青柠 #C7F665　玫红 #FC5294　品牌金 #FDCF29　墨 #0B0F14</div>
      <div>字形 · PingFang SC / Microsoft YaHei 900</div>
    </div>
  </div>
);

const style = document.createElement('style');
style.textContent = `
:root{--mk-sans:"PingFang SC","HarmonyOS Sans SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif}
*,*::before,*::after{animation:none!important;transition:none!important}
html,body{margin:0;background:#F4F6F8}
body{-webkit-font-smoothing:antialiased;font-family:var(--mk-sans)}
.brand-logo__crown,.brand-logo__fresh,.brand-logo__food{transform:none!important}

.sheet{width:1560px;box-sizing:border-box;background:#F4F6F8;padding:56px 64px 64px}
.head{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:32px;border-bottom:2px solid #0B0F14}
.eyebrow{display:flex;align-items:center;gap:12px}
.eyebrow .dot{width:10px;height:10px;border-radius:999px;background:#C7F665;display:block}
.eyebrow span{font-size:13px;font-weight:700;letter-spacing:.22em;color:#54801A}
.sheet h1{font-size:54px;line-height:1;font-weight:900;color:#0B0F14;letter-spacing:-.02em;margin:12px 0 0}
.sub{margin:12px 0 0;font-size:15px;color:#5B6472}
.meta{text-align:right;font-size:12px;line-height:1.75;color:#8A94A0;font-family:ui-monospace,monospace}

.sheet section{margin-top:40px}
.sec{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.sec .bar{width:4px;height:18px;border-radius:999px;background:#C7F665;display:block}
.sec h2{font-size:19px;font-weight:900;color:#0B0F14;margin:0}
.sec .en{font-size:11px;font-weight:700;letter-spacing:.16em;color:#A9B3BE;font-family:ui-monospace,monospace}
.sec .rule{flex:1;height:1px;background:#DFE4E9;display:block}
.sec .n{font-size:11px;font-family:ui-monospace,monospace;color:#A9B3BE}

.grid{display:grid;gap:16px}
.card{background:#fff;border:1px solid #E6EAEE;border-radius:22px;padding:28px 24px 20px;display:flex;flex-direction:column}
.stage{flex:1;display:flex;align-items:center;justify-content:center;min-height:150px;color:#0B0F14}
.foot{margin-top:20px;padding-top:16px;border-top:1px solid #EEF1F4}
.row{display:flex;align-items:baseline;gap:8px}
.code{font-size:11px;font-weight:700;letter-spacing:.08em;color:#94A3B8;font-family:ui-monospace,monospace}
.nm{font-size:16px;font-weight:700;color:#0B0F14;line-height:1.25}
.mt{font-size:11.5px;color:#8A94A0;margin-top:4px;line-height:1.35}

.footer{margin-top:48px;padding-top:20px;border-top:1px solid #DFE4E9;display:flex;justify-content:space-between;font-size:11px;color:#8A94A0;font-family:ui-monospace,monospace}

/* 标志尺寸（!important 盖掉组件内部的 Tailwind 默认尺寸类） */
.s-h128{height:128px;width:auto;display:block}
.s-h132{height:132px;width:auto;display:block}
.s-52{width:52px!important;height:52px!important;display:block}
.s-56{width:56px!important;height:56px!important;display:block}
.s-104{width:104px!important;height:104px!important;display:block;object-fit:contain}
.s-150x100{width:150px!important;height:100px!important;display:block}
.chip{display:inline-flex;align-items:center;justify-content:center;border-radius:18px;background:#101418;padding:16px 20px}
.c-gold{color:#FDCF29}
.c-ink{color:#0B0F14}
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')!).render(<Sheet />);
