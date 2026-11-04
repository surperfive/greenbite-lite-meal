import React, { useState } from 'react';
import { X, Sparkles, Smartphone, Check, Loader2 } from 'lucide-react';
import { useShellBox } from './StickerModal';
import { useBackLayer } from '../utils/backStack';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (name: string, phone: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [phone, setPhone] = useState('13888886666');
  const [code, setCode] = useState('8888');
  const [isLoading, setIsLoading] = useState(false);
  /* 壳内容区矩形：居中盒贴壳，tall 显示器上不跑出手机壳（同 StickerModal 2026-10-28） */
  const shellBox = useShellBox();
  useBackLayer(isOpen, onClose);

  if (!isOpen) return null;

  const handleWechatLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess('轻食小绿 (微信用户)', '13888886666');
      onClose();
    }, 800);
  };

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(`绿野会员 (${phone.slice(-4)})`, phone);
      onClose();
    }, 800);
  };

  return (
    <>
      {/* 蒙层盖满视口；居中盒贴壳内容区（2026-10-28「弹窗超出页面」同款修复） */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      />
      <div
        className="fixed z-50 flex items-center justify-center p-4 pointer-events-none animate-in fade-in duration-200"
        style={
          shellBox
            ? { top: shellBox.top, left: shellBox.left, width: shellBox.width, height: shellBox.height }
            : { inset: 0 }
        }
      >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="登录 GreenBite"
        className="w-full max-w-sm bg-white rounded-2xl p-6 flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[#C7F665] font-black text-sm border border-[#C7F665]/30">
              GB
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">登录 GreenBite</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="gb-hit w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Banner */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-[#C7F665] flex items-center justify-center mx-auto mb-2 shadow-2xs border border-[#C7F665]/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">微信轻食会员特权</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            登录即领 ¥18 新人券包 · 每次点餐返还 10% 积分
          </p>
        </div>

        {/* WeChat One-Click Login */}
        <button
          onClick={handleWechatLogin}
          disabled={isLoading}
          className="w-full py-3.5 rounded-lg bg-slate-900 hover:bg-black text-[#C7F665] font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 ease-out disabled:opacity-60 mb-3 border border-[#C7F665]/30"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M8.5 2C4.36 2 1 4.91 1 8.5c0 1.99 1.04 3.78 2.68 4.99-.12.63-.44 2.31-.5 2.66 0 0-.01.07.03.1.05.03.11.02.11.02.43-.06 2.51-1.63 2.92-1.92.71.18 1.47.28 2.26.28.31 0 .61-.02.91-.05-.27-.6-.41-1.27-.41-1.98 0-3.09 2.91-5.6 6.5-5.6.28 0 .56.02.83.05C15.48 4.09 12.27 2 8.5 2zm-2.25 4c.69 0 1.25.56 1.25 1.25S6.94 8.5 6.25 8.5 5 7.94 5 7.25 5.56 6 6.25 6zm4.5 0c.69 0 1.25.56 1.25 1.25S11.44 8.5 10.75 8.5 9.5 7.94 9.5 7.25 10.06 6 10.75 6zm5.25 4.5c-3.04 0-5.5 2.13-5.5 4.75S12.96 20 16 20c.58 0 1.14-.08 1.66-.21.31.22 1.87 1.4 2.19 1.44 0 0 .05.01.08-.01.03-.02.03-.07.03-.07-.05-.26-.29-1.52-.37-1.99 1.23-.9 2.01-2.24 2.01-3.71 0-2.62-2.46-4.75-5.5-4.75zm-1.75 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm3.5 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
              </svg>
              <span>微信快捷一键登录</span>
            </>
          )}
        </button>

        {/* Phone SMS Quick Login Form */}
        <form onSubmit={handlePhoneLogin} className="space-y-2 text-xs">
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="手机号码"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="验证码 (测试默认8888)"
              className="flex-1 px-3 py-2.5 rounded-lg bg-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-black text-[#C7F665] font-black text-xs active:scale-95 transition-all duration-200 ease-out border border-[#C7F665]/30"
            >
              验证码登录
            </button>
          </div>
        </form>

        <p className="text-[10px] text-slate-400 text-center mt-4">
          登录即代表您已阅读并同意
          <span className="text-slate-800 font-medium underline">《用户服务协议》</span>与
          <span className="text-slate-800 font-medium underline">《隐私权政策》</span>
        </p>
      </div>
      </div>
    </>
  );
};
