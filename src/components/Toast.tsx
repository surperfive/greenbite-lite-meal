import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-14 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
      {/* ⚠️ 底色是 **65% 黑 + 背景模糊**，不是实心黑：用户要求"黑框降低透明度"。
          · 再降（< 55%）白字压在青柠绿 banner 上会发灰、看不出是浮层；
          · 再浓（> 80%）就回到原来那块"实心黑疙瘩"的观感。
          · 描边用 `white/15` 而不是深色描边：半透明底靠一条极淡亮边定轮廓，
            在深色（订单页头图）和浅色（白卡/青柠）背景上都能"浮起来"。
          ⚠️ 文案里**不要再加 emoji**（用户明确要求去掉），消息就是纯文字。 */}
      <div className="px-4 py-2.5 rounded-full bg-slate-900/65 backdrop-blur-md text-white text-xs font-bold shadow-lg border border-white/15 max-w-sm text-center">
        {message}
      </div>
    </div>
  );
};
