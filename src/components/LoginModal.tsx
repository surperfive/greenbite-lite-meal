import React, { useState } from 'react';
import { UserCheck, Smartphone, KeyRound, Loader2 } from 'lucide-react';
import { StickerModal, StickerButton, StickerPanel } from './StickerModal';

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

  if (!isOpen) return null;

  const handleWechatLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess('轻食小绿 (微信用户)', '13888886666');
      onClose();
    }, 600);
  };

  const handlePhoneLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(`绿野会员 (${phone.slice(-4)})`, phone);
      onClose();
    }, 600);
  };

  return (
    <StickerModal
      onClose={onClose}
      ariaLabel="登录 GreenBite"
      title="会员登录"
      titleSize="xl"
      badge={<UserCheck className="h-[30px] w-[30px]" strokeWidth={2.6} />}
      badgeSize="lg"
      badgeBorderWidth={4}
      subtitle="登录即领 ¥18 新人尊享券包 · 每次点餐返还 10% 能量积分"
      maxWidth={356}
      bodyClassName="space-y-2.5"
      footer={
        <StickerButton tone="lime" onClick={handleWechatLogin} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M8.5 2C4.36 2 1 4.91 1 8.5c0 1.99 1.04 3.78 2.68 4.99-.12.63-.44 2.31-.5 2.66 0 0-.01.07.03.1.05.03.11.02.11.02.43-.06 2.51-1.63 2.92-1.92.71.18 1.47.28 2.26.28.31 0 .61-.02.91-.05-.27-.6-.41-1.27-.41-1.98 0-3.09 2.91-5.6 6.5-5.6.28 0 .56.02.83.05C15.48 4.09 12.27 2 8.5 2zm-2.25 4c.69 0 1.25.56 1.25 1.25S6.94 8.5 6.25 8.5 5 7.94 5 7.25 5.56 6 6.25 6zm4.5 0c.69 0 1.25.56 1.25 1.25S11.44 8.5 10.75 8.5 9.5 7.94 9.5 7.25 10.06 6 10.75 6zm5.25 4.5c-3.04 0-5.5 2.13-5.5 4.75S12.96 20 16 20c.58 0 1.14-.08 1.66-.21.31.22 1.87 1.4 2.19 1.44 0 0 .05.01.08-.01.03-.02.03-.07.03-.07-.05-.26-.29-1.52-.37-1.99 1.23-.9 2.01-2.24 2.01-3.71 0-2.62-2.46-4.75-5.5-4.75zm-1.75 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm3.5 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
            </svg>
          )}
          <span>微信快捷一键登录</span>
        </StickerButton>
      }
    >
      {/* 手机号码凹槽胶囊 */}
      <StickerPanel pill innerClassName="flex items-center gap-2.5 px-3.5 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] border-[#080907] bg-[linear-gradient(180deg,#D3F97E_0%,#C7F665_100%)] shadow-[0_1.5px_0_rgba(0,0,0,0.12)]">
          <Smartphone className="h-4 w-4 text-[#080907]" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <span className="block text-[9.5px] font-bold text-[#6b6f68]">手机号码</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号码"
            className="w-full bg-transparent text-[13px] font-black text-[#0e100c] placeholder-[#6b6f68]/50 focus:outline-none"
          />
        </div>
      </StickerPanel>

      {/* 短信验证码凹槽胶囊 + 右侧立体胶囊登录按钮 */}
      <form onSubmit={handlePhoneLogin}>
        <StickerPanel pill innerClassName="flex items-center justify-between gap-2 pl-3.5 pr-2 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] border-[#080907] bg-white shadow-[0_1.5px_0_rgba(0,0,0,0.08)]">
              <KeyRound className="h-4 w-4 text-[#080907]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="block text-[9.5px] font-bold text-[#6b6f68]">短信验证码</span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="默认 8888"
                className="w-full bg-transparent text-[13px] font-black text-[#0e100c] placeholder-[#6b6f68]/50 focus:outline-none"
              />
            </div>
          </div>
          <StickerButton
            type="submit"
            size="sm"
            block={false}
            tone="white"
            disabled={isLoading}
          >
            <span>验证码登录</span>
          </StickerButton>
        </StickerPanel>
      </form>

      <p className="pt-0.5 text-center text-[10px] font-medium text-[#6b6f68]">
        登录即代表您已阅读并同意
        <span className="font-black text-[#0e100c] underline">《用户服务协议》</span>与
        <span className="font-black text-[#0e100c] underline">《隐私权政策》</span>
      </p>
    </StickerModal>
  );
};
