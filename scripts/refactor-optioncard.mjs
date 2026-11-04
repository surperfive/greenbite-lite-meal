/**
 * 把 18 处逐字复制的「选择卡 选中/未选中」类名换成 src/tokens.ts 里的常量。
 *
 * 两种形状（按是否自带文字色分开处理，保证行为不变）：
 *   'bg-white border-transparent ring-2 ring-[#C7F665] text-black shadow-xs'  (5 处)
 *   'bg-white border-transparent ring-2 ring-[#C7F665] shadow-xs'             (4 处)
 *   'bg-[#f7f9fb] border-slate-200/90 text-slate-600 hover:bg-white hover:border-slate-300 shadow-2xs' (5 处)
 *   'bg-[#f7f9fb] border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-2xs'                (5 处)
 *
 * 用法：node scripts/refactor-optioncard.mjs [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = ['src/components/ProductDetailPage.tsx', 'src/components/GachaPage.tsx'];
const WRITE = process.argv.includes('--write');

// 先长后短，避免 `... text-black shadow-xs` 被短的规则抢先匹配
const RULES = [
  {
    find: `'bg-white border-transparent ring-2 ring-[#C7F665] text-black shadow-xs'`,
    to: '`${OPTION_CARD_SELECTED} text-black`',
  },
  {
    find: `'bg-[#f7f9fb] border-slate-200/90 text-slate-600 hover:bg-white hover:border-slate-300 shadow-2xs'`,
    to: '`${OPTION_CARD_UNSELECTED} text-slate-600`',
  },
  {
    find: `'bg-white border-transparent ring-2 ring-[#C7F665] shadow-xs'`,
    to: 'OPTION_CARD_SELECTED',
  },
  {
    find: `'bg-[#f7f9fb] border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-2xs'`,
    to: 'OPTION_CARD_UNSELECTED',
  },
];

let total = 0;
const log = [];
for (const f of FILES) {
  let src = readFileSync(f, 'utf8');
  let n = 0;
  for (const r of RULES) {
    const parts = src.split(r.find);
    n += parts.length - 1;
    src = parts.join(r.to);
  }
  if (n) {
    log.push(`${f}: ${n} 处`);
    total += n;
    if (WRITE) writeFileSync(f, src);
  }
}
console.log(log.join('\n'));
console.log(`\n共 ${total} 处${WRITE ? '（已写入）' : '（试运行，加 --write 才落盘）'}`);
