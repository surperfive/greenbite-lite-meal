/**
 * 图标合集导出页（非产品页面）
 * ------------------------------------------------------------------
 * 数据来源 `scripts/icon-inventory.json`：由扫描 `src/**` 的 lucide-react 导入生成，
 * 带每个图标的**引用次数**和**所在文件**。`refs === 0` 的是只导入没用过的残留，
 * 不进合集（在 MANIFEST 里单独列出）。
 *
 * 与「标志合集」同一套管线：真实组件渲染 → Playwright 截图 + 序列化，
 * 不手抄任何 path。样式一律用下面的自有 CSS 类，**不用 Tailwind arbitrary 值**
 * （本文件是 dev server 启动后才新建的，@tailwindcss/vite 的按需扫描覆盖不到，
 * `w-[1560px]` 这类类不会被生成，版面会直接塌掉）。
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as LucidePackage from 'lucide-react';
import '../src/index.css';

import TokenIcon from '../src/components/TokenIcon';
import { CheckIcon } from '../src/components/CheckBadge';
import inventory from './icon-inventory.json';

type Inv = { name: string; files: string[]; fileCount: number; refs: number };

const Lucide = LucidePackage as unknown as Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
>;

const INV = inventory as Inv[];
const byName = new Map(INV.map((i) => [i.name, i]));
const USED = INV.filter((i) => i.refs > 0);
const UNUSED = INV.filter((i) => i.refs === 0);

/* 语义分组：58 枚在用的 lucide 图标全部覆盖（下面有断言，漏一个会在控制台报错） */
const GROUPS: Array<{ title: string; en: string; names: string[] }> = [
  {
    title: '导航 · 底部 Tab', en: 'NAVIGATION',
    names: ['Home', 'UtensilsCrossed', 'Sparkles', 'ReceiptText', 'Smile'],
  },
  {
    title: '点餐 · 菜品', en: 'MENU & DISHES',
    names: ['Utensils', 'Coffee', 'Salad', 'Sandwich', 'CupSoda', 'Flame', 'Tag'],
  },
  {
    title: '购物车 · 交易', en: 'CART & CHECKOUT',
    names: ['ShoppingBag', 'Plus', 'Minus', 'Trash2', 'Ticket', 'CreditCard', 'BadgePercent', 'Gift', 'Crown', 'Zap'],
  },
  {
    title: '配送 · 门店', en: 'DELIVERY & STORES',
    names: ['Truck', 'Store', 'MapPin', 'Navigation', 'Building2', 'Phone', 'Clock', 'Target'],
  },
  {
    title: '状态 · 反馈', en: 'STATUS & FEEDBACK',
    names: ['Check', 'CheckCircle2', 'X', 'AlertCircle', 'Info', 'Loader2', 'RotateCcw', 'Activity', 'ShieldCheck', 'Heart', 'Award'],
  },
  {
    title: '箭头 · 控件', en: 'ARROWS & CONTROLS',
    names: ['ArrowLeft', 'ArrowRight', 'ChevronLeft', 'ChevronRight', 'ChevronDown'],
  },
  {
    title: '账号 · 社交', en: 'ACCOUNT & SOCIAL',
    names: ['UserRound', 'LogOut', 'MessageSquare', 'Headphones', 'Share2', 'Copy'],
  },
  {
    title: '搜索 · 筛选', en: 'SEARCH & FILTER',
    names: ['Search', 'SlidersHorizontal', 'TrendingDown', 'CircleDot', 'Bell', 'FileText'],
  },
];

/* 自有图标（非 lucide）：对勾 + 抽卡币皇冠两态 */
const CUSTOM: Array<{ code: string; name: string; sub: string; node: React.ReactNode }> = [
  { code: 'X1', name: 'CheckIcon', sub: '对勾 · 勾选态', node: <CheckIcon className="s-36 c-ink" /> },
  { code: 'X2', name: 'TokenIcon', sub: '抽卡币 · 实心', node: <TokenIcon className="s-36 c-gold" /> },
  { code: 'X3', name: 'TokenIcon', sub: '抽卡币 · 描边', node: <TokenIcon outline className="s-36 c-ink" /> },
];

/* ---- 覆盖性断言：分组必须刚好等于"在用"集合，漏项/多项都报出来 ---- */
const assigned = new Set(GROUPS.flatMap((g) => g.names));
const missing = USED.map((i) => i.name).filter((n) => !assigned.has(n));
const extra = [...assigned].filter((n) => !byName.has(n) || byName.get(n)!.refs === 0);
if (missing.length) console.error('[图标合集] 未分组:', missing);
if (extra.length) console.error('[图标合集] 分组里有不存在/未使用的:', extra);

const LUCIDE_TOTAL = USED.length;
const TOTAL = LUCIDE_TOTAL + CUSTOM.length;

const Cell: React.FC<{
  code: string; name: string; sub?: string; refs?: number; files?: string[]; children: React.ReactNode;
}> = ({ code, name, sub, refs, files, children }) => (
  <div
    className="cell"
    data-code={code}
    data-name={name}
    data-refs={refs ?? ''}
    data-files={files ? files.join(' ') : ''}
  >
    <div className="art">{children}</div>
    <div className="nm">{name}</div>
    <div className="cap">{sub ?? (refs ? `${refs} 处引用` : '')}</div>
  </div>
);

const Sheet: React.FC = () => (
  <div className="sheet">
    <div className="head">
      <div>
        <div className="eyebrow"><i className="dot" /><span>ICON SET</span></div>
        <h1>图标合集</h1>
        <p className="sub">
          轻食点餐小程序 · 界面图标全量 · 共 {TOTAL} 枚（线性 {LUCIDE_TOTAL} + 自有 {CUSTOM.length}）
        </p>
      </div>
      <div className="meta">
        <div>remix-greenbite / v1.0</div>
        <div>2026-10-30</div>
        <div>扫描自 src/** · lucide-react</div>
      </div>
    </div>

    {GROUPS.map((g, gi) => (
      <section key={g.title}>
        <div className="sec">
          <i className="bar" />
          <h2>{g.title}</h2>
          <span className="en">{g.en}</span>
          <i className="rule" />
          <span className="n">{g.names.length} 枚</span>
        </div>
        <div className="grid">
          {g.names.map((name, i) => {
            const Icon = Lucide[name];
            const inv = byName.get(name);
            if (!Icon) {
              console.error('[图标合集] lucide 无此导出:', name);
              return null;
            }
            return (
              <Cell
                key={name}
                code={`L${String(gi + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`}
                name={name}
                refs={inv?.refs}
                files={inv?.files}
              >
                <Icon size={36} strokeWidth={1.6} color="#0B0F14" />
              </Cell>
            );
          })}
        </div>
      </section>
    ))}

    <section>
      <div className="sec">
        <i className="bar" />
        <h2>自有图标</h2>
        <span className="en">CUSTOM</span>
        <i className="rule" />
        <span className="n">{CUSTOM.length} 枚</span>
      </div>
      <div className="grid">
        {CUSTOM.map((c) => (
          <Cell key={c.code} code={c.code} name={c.name} sub={c.sub}>{c.node}</Cell>
        ))}
      </div>
    </section>

    <div className="footer">
      <div>
        线性图标 lucide-react · 24×24 网格 · stroke 1.6 · currentColor　|　
        未使用（仅残留导入）{UNUSED.length} 枚见 MANIFEST
      </div>
      <div>品牌标志与分类图标见 exports/brand-marks/</div>
    </div>
  </div>
);

const style = document.createElement('style');
style.textContent = `
:root{--mk-sans:"PingFang SC","HarmonyOS Sans SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif}
*,*::before,*::after{animation:none!important;transition:none!important}
html,body{margin:0;background:#F4F6F8}
body{-webkit-font-smoothing:antialiased;font-family:var(--mk-sans)}

.sheet{width:1560px;box-sizing:border-box;background:#F4F6F8;padding:56px 64px 56px}
.head{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:30px;border-bottom:2px solid #0B0F14}
.eyebrow{display:flex;align-items:center;gap:12px}
.eyebrow .dot{width:10px;height:10px;border-radius:999px;background:#C7F665;display:block}
.eyebrow span{font-size:13px;font-weight:700;letter-spacing:.22em;color:#54801A}
.sheet h1{font-size:54px;line-height:1.06;font-weight:900;color:#0B0F14;letter-spacing:-.02em;margin:12px 0 0}
.sub{margin:16px 0 0;font-size:15px;color:#5B6472}
.meta{text-align:right;font-size:12px;line-height:1.75;color:#8A94A0;font-family:ui-monospace,monospace}

.sheet section{margin-top:34px}
.sec{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.sec .bar{width:4px;height:17px;border-radius:999px;background:#C7F665;display:block}
.sec h2{font-size:18px;font-weight:900;color:#0B0F14;margin:0}
.sec .en{font-size:10.5px;font-weight:700;letter-spacing:.16em;color:#A9B3BE;font-family:ui-monospace,monospace}
.sec .rule{flex:1;height:1px;background:#DFE4E9;display:block}
.sec .n{font-size:10.5px;font-family:ui-monospace,monospace;color:#A9B3BE}

.grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:12px}
.cell{background:#fff;border:1px solid #E6EAEE;border-radius:16px;padding:16px 12px 12px;display:flex;flex-direction:column;align-items:center}
.art{height:44px;display:flex;align-items:center;justify-content:center;color:#0B0F14}
.nm{margin-top:10px;font-size:11px;font-weight:700;color:#0B0F14;text-align:center;line-height:1.2;word-break:break-word}
.cap{margin-top:3px;font-size:9.5px;color:#9AA4B0;font-family:ui-monospace,monospace;text-align:center;min-height:12px}

.footer{margin-top:40px;padding-top:18px;border-top:1px solid #DFE4E9;display:flex;justify-content:space-between;gap:24px;font-size:10.5px;color:#8A94A0;font-family:ui-monospace,monospace}

.s-36{width:36px!important;height:36px!important;display:block}
.c-ink{color:#0B0F14}
.c-gold{color:#FDCF29}
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')!).render(<Sheet />);
