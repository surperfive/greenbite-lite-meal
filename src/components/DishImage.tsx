import React, { useState } from 'react';
import { Utensils, Salad, Coffee, Sandwich, Sparkles, Flame } from 'lucide-react';

interface DishImageProps {
  src: string;
  alt: string;
  className?: string;
  category?: string;
  aspectRatio?: string;
  fallbackBg?: string;
  fallbackIcon?: string;
}

/**
 * 电商小程序棚拍风格 SVG 商品主图渲染器
 * 采用柔和 45° 俯拍工作室漫射光影、纯净极简浅色底台（自带轻微环境光晕与接触投影）、
 * 高饱和度食材分层刻画，确保不依赖脆弱外链也能呈现统一、诱人的电商主图质感。
 */
const EcommerceDishArtwork: React.FC<{ name: string; category?: string }> = ({
  name,
  category
}) => {
  const n = (name || '').toLowerCase();

  // 1. 牛油果鸡胸沙拉（白瓷绿边小鸡碗棚拍主图）
  if (n.includes('牛油果') || n.includes('鸡胸')) {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full block select-none" fill="none">
        <defs>
          <radialGradient id="ec-bg-avocado" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#F2F2EE" />
            <stop offset="70%" stopColor="#E6E5E0" />
            <stop offset="100%" stopColor="#DCDAD3" />
          </radialGradient>
          <linearGradient id="ec-bowl-body" x1="15%" y1="10%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F4F4F0" />
            <stop offset="100%" stopColor="#DCDCD4" />
          </linearGradient>
          <linearGradient id="ec-glaze-chunk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB703" />
            <stop offset="55%" stopColor="#FB8500" />
            <stop offset="100%" stopColor="#CC4400" />
          </linearGradient>
        </defs>

        {/* Warm Neutral Studio Backdrop */}
        <rect width="200" height="200" fill="url(#ec-bg-avocado)" />

        {/* Soft Studio Contact Shadow */}
        <ellipse cx="102" cy="166" rx="64" ry="15" fill="#1E293B" opacity="0.16" />
        <ellipse cx="100" cy="162" rx="46" ry="10" fill="#1E293B" opacity="0.22" />

        {/* Ceramic Bowl Foot & Deep Cylindrical-Rounded Body */}
        <ellipse cx="100" cy="157" rx="38" ry="8" fill="#D4D4CC" stroke="#94A3B8" strokeWidth="1" />
        <path
          d="M 32 76 L 38 128 C 42 152 70 160 100 160 C 130 160 158 152 162 128 L 168 76 Z"
          fill="url(#ec-bowl-body)"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />

        {/* Bowl Rim Opening (Back Half) */}
        <ellipse
          cx="100"
          cy="75"
          rx="68"
          ry="24"
          fill="#F8FAFC"
          stroke="#159947"
          strokeWidth="5"
        />

        {/* Mound of Glossy Glazed Chicken Breast Cubes, Avocado & Greens */}
        <g>
          {/* Base Greens & Avocado Cubes */}
          <circle cx="56" cy="74" r="13" fill="#22C55E" />
          <circle cx="144" cy="74" r="13" fill="#16A34A" />
          <circle cx="74" cy="62" r="14" fill="#4ADE80" />
          <circle cx="126" cy="62" r="14" fill="#22C55E" />

          {/* Glossy Glazed Chicken Breast Cubes */}
          <rect x="46" y="66" width="24" height="19" rx="7" fill="url(#ec-glaze-chunk)" stroke="#7C2D12" strokeWidth="1.2" />
          <rect x="128" y="65" width="24" height="19" rx="7" fill="url(#ec-glaze-chunk)" stroke="#7C2D12" strokeWidth="1.2" />
          <rect x="64" y="54" width="26" height="20" rx="8" fill="url(#ec-glaze-chunk)" stroke="#7C2D12" strokeWidth="1.2" />
          <rect x="108" y="55" width="26" height="20" rx="8" fill="url(#ec-glaze-chunk)" stroke="#7C2D12" strokeWidth="1.2" />
          <rect x="85" y="48" width="28" height="22" rx="9" fill="url(#ec-glaze-chunk)" stroke="#7C2D12" strokeWidth="1.2" />
          <rect x="58" y="73" width="26" height="18" rx="7" fill="url(#ec-glaze-chunk)" stroke="#7C2D12" strokeWidth="1.2" />
          <rect x="114" y="72" width="26" height="18" rx="7" fill="url(#ec-glaze-chunk)" stroke="#7C2D12" strokeWidth="1.2" />
          <rect x="84" y="68" width="32" height="22" rx="9" fill="url(#ec-glaze-chunk)" stroke="#7C2D12" strokeWidth="1.2" />

          {/* Fresh Avocado & Broccoli Florets */}
          <circle cx="72" cy="74" r="7.5" fill="#84CC16" />
          <circle cx="126" cy="73" r="7.5" fill="#65A30D" />
          <circle cx="92" cy="46" r="8" fill="#16A34A" />
          <circle cx="106" cy="46" r="8" fill="#15803D" />
          <circle cx="99" cy="41" r="7" fill="#22C55E" />

          {/* Glossy Highlights & Sesame Seeds */}
          <ellipse cx="96" cy="55" rx="6" ry="2.2" fill="#FEF08A" opacity="0.75" />
          <ellipse cx="98" cy="75" rx="7" ry="2.5" fill="#FEF08A" opacity="0.8" />
          <ellipse cx="72" cy="61" rx="5" ry="2" fill="#FEF08A" opacity="0.7" />
          <ellipse cx="122" cy="62" rx="5" ry="2" fill="#FEF08A" opacity="0.7" />
        </g>

        {/* Front Rim Emerald Green Band Overlapping Bottom of Food Mound */}
        <path
          d="M 32 75 C 32 89 62 99 100 99 C 138 99 168 89 168 75"
          stroke="#159947"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Cute Cartoon Chicken Character Painted on Front of Ceramic Bowl */}
        <g transform="translate(100, 128)">
          {/* Red 3-Lobed Comb */}
          <path
            d="M -12 -14 C -18 -26 -6 -30 -2 -20 C 2 -32 14 -30 10 -18 C 18 -24 24 -14 14 -9 Z"
            fill="#EF4444"
            stroke="#0F172A"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Chubby White Chicken Head/Cheeks */}
          <path
            d="M -22 -2 C -26 -14 -12 -18 0 -18 C 12 -18 26 -14 22 -2 C 28 6 22 18 10 18 C 4 20 -4 20 -10 18 C -22 18 -28 6 -22 -2 Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Cute Arched Eyebrows & Dot Eyes */}
          <path d="M -12 -9 Q -9 -12 -6 -9" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 6 -9 Q 9 -12 12 -9" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="-9" cy="-4" r="2.6" fill="#0F172A" />
          <circle cx="9" cy="-4" r="2.6" fill="#0F172A" />
          {/* Rosy Cheeks */}
          <ellipse cx="-15" cy="2" rx="3.5" ry="2" fill="#FCA5A5" />
          <ellipse cx="15" cy="2" rx="3.5" ry="2" fill="#FCA5A5" />
          {/* Red Wattle Underneath Beak */}
          <path
            d="M -4 6 C -6 14 0 17 2 11 C 5 16 9 12 6 6 Z"
            fill="#EF4444"
            stroke="#0F172A"
            strokeWidth="1.8"
          />
          {/* Golden Yellow Beak */}
          <path
            d="M -7 1 L 0 -4 L 7 1 L 0 7 Z"
            fill="#F59E0B"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    );
  }

  // 2. 羽衣甘蓝酸奶昔
  if (n.includes('羽衣甘蓝') || n.includes('奶昔') || n.includes('果昔')) {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full block select-none" fill="none">
        <defs>
          <radialGradient id="ec-bg-kale" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F0FDF4" />
            <stop offset="100%" stopColor="#DCFCE7" />
          </radialGradient>
          <linearGradient id="ec-kale-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#16A34A" />
            <stop offset="42%" stopColor="#4ADE80" />
            <stop offset="68%" stopColor="#DCFCE7" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#ec-bg-kale)" />
        <circle cx="44" cy="42" r="36" fill="#C7F665" opacity="0.28" />
        <ellipse cx="102" cy="172" rx="46" ry="11" fill="#0F172A" opacity="0.12" />

        {/* Decorative Fresh Kale Leaf Behind Cup */}
        <path
          d="M 134 148 C 154 140 168 118 158 98 C 148 92 134 106 128 124 Z"
          fill="#15803D"
          stroke="#0F172A"
          strokeWidth="2.2"
        />

        {/* Straw */}
        <path
          d="M 108 18 L 116 20 L 104 68 L 96 66 Z"
          fill="#C7F665"
          stroke="#0F172A"
          strokeWidth="2.2"
        />

        {/* Dome Whipped Yogurt Peak */}
        <path
          d="M 56 64 C 58 34 84 26 100 30 C 116 24 142 34 144 64 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.6"
        />
        <path
          d="M 68 54 C 82 40 96 46 104 54 C 114 42 126 44 134 54"
          stroke="#DCFCE7"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Cup Rim */}
        <rect
          x="50"
          y="60"
          width="100"
          height="10"
          rx="5"
          fill="#F8FAFC"
          stroke="#0F172A"
          strokeWidth="2.6"
        />

        {/* Clear Smoothie Cup Body */}
        <path
          d="M 56 70 L 66 164 C 67 170 133 170 134 164 L 144 70 Z"
          fill="url(#ec-kale-body)"
          stroke="#0F172A"
          strokeWidth="2.8"
        />

        {/* Coconut Greek Yogurt Swirl ribbons */}
        <path
          d="M 60 106 C 78 122 98 96 118 112 C 128 120 136 114 140 108"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M 63 132 C 82 146 104 124 126 138 C 132 142 135 138 137 134"
          stroke="#F0FDF4"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Brand Label Sticker on Cup */}
        <rect
          x="76"
          y="96"
          width="48"
          height="32"
          rx="8"
          fill="#0F172A"
        />
        <text x="100" y="111" textAnchor="middle" fill="#C7F665" fontSize="8.5" fontWeight="900">
          KALE
        </text>
        <text x="100" y="122" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="700">
          0 SUGAR
        </text>

        {/* Glass Specular Highlight */}
        <path d="M 62 76 L 70 156" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }

  // 3. 金枪鱼三明治
  if (n.includes('三明治') || n.includes('sandwich') || category === 'snack' && n.includes('鱼')) {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full block select-none" fill="none">
        <defs>
          <radialGradient id="ec-bg-sandwich" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FFFBEB" />
            <stop offset="100%" stopColor="#FEF3C7" />
          </radialGradient>
          <linearGradient id="ec-toast-crust" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <linearGradient id="ec-toast-crumb" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#ec-bg-sandwich)" />
        <circle cx="156" cy="40" r="38" fill="#FDE68A" opacity="0.45" />
        <ellipse cx="102" cy="160" rx="68" ry="15" fill="#0F172A" opacity="0.12" />

        {/* Ceramic Plate */}
        <ellipse
          cx="100"
          cy="142"
          rx="76"
          ry="24"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.6"
        />
        <ellipse cx="100" cy="142" rx="62" ry="17" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />

        {/* Bottom Whole-Wheat Bread Slice */}
        <path
          d="M 34 122 L 166 106 L 152 144 C 148 150 140 152 132 150 L 42 136 C 34 134 32 128 34 122 Z"
          fill="url(#ec-toast-crust)"
          stroke="#0F172A"
          strokeWidth="2.6"
        />
        <path d="M 40 124 L 158 110 L 146 142 L 44 132 Z" fill="url(#ec-toast-crumb)" />

        {/* Crispy Romaine Lettuce Frills */}
        <path
          d="M 28 112 Q 48 98 68 110 Q 88 96 108 108 Q 128 94 148 106 Q 164 96 172 108 L 160 122 Q 136 112 112 122 Q 82 112 56 124 Q 36 118 28 112 Z"
          fill="#22C55E"
          stroke="#0F172A"
          strokeWidth="2.4"
        />

        {/* Deep-Sea Tuna Salad Layer */}
        <path
          d="M 36 98 L 164 84 L 156 110 L 42 120 Z"
          fill="#FDA4AF"
          stroke="#0F172A"
          strokeWidth="2.4"
        />
        <path
          d="M 46 106 L 152 94"
          stroke="#FECDD3"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />

        {/* Sliced Hard-Boiled Eggs */}
        <ellipse cx="76" cy="98" rx="18" ry="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
        <circle cx="76" cy="98" r="6" fill="#F59E0B" />
        <ellipse cx="124" cy="92" rx="18" ry="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
        <circle cx="124" cy="92" r="6" fill="#F59E0B" />

        {/* Top Whole-Wheat Bread Triangle */}
        <path
          d="M 38 68 L 158 46 C 166 45 170 50 168 58 L 154 90 C 150 96 144 98 136 98 L 32 84 C 26 82 26 72 38 68 Z"
          fill="url(#ec-toast-crust)"
          stroke="#0F172A"
          strokeWidth="2.8"
        />
        <path d="M 44 70 L 156 51 L 146 86 L 38 78 Z" fill="url(#ec-toast-crumb)" />

        {/* Oat & Flax Seeds on Bread */}
        <circle cx="72" cy="68" r="1.8" fill="#78350F" />
        <circle cx="96" cy="64" r="1.8" fill="#78350F" />
        <circle cx="118" cy="68" r="1.8" fill="#78350F" />
        <circle cx="134" cy="60" r="1.8" fill="#78350F" />

        {/* wooden pick with olive */}
        <line x1="98" y1="28" x2="98" y2="66" stroke="#78350F" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="98" cy="36" r="6.5" fill="#84CC16" stroke="#0F172A" strokeWidth="2" />
        <circle cx="98" cy="36" r="2.2" fill="#EF4444" />
      </svg>
    );
  }

  // 4. 日式照烧鸡肉锅
  if (category === 'hot' || n.includes('锅') || n.includes('照烧')) {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full block select-none" fill="none">
        <defs>
          <radialGradient id="ec-bg-hotpot" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FFF7ED" />
            <stop offset="100%" stopColor="#FFEDD5" />
          </radialGradient>
          <linearGradient id="ec-teriyaki-glaze" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="55%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#ec-bg-hotpot)" />
        <circle cx="152" cy="40" r="38" fill="#FDBA74" opacity="0.28" />
        <ellipse cx="100" cy="162" rx="70" ry="16" fill="#0F172A" opacity="0.16" />

        {/* Cast Iron Nabe Handles */}
        <path
          d="M 24 96 C 12 96 12 112 26 112"
          stroke="#0F172A"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 176 96 C 188 96 188 112 174 112"
          stroke="#0F172A"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Cast Iron Pot Base */}
        <path
          d="M 26 96 C 32 156 168 156 174 96 Z"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="3"
        />
        <ellipse
          cx="100"
          cy="94"
          rx="74"
          ry="42"
          fill="#334155"
          stroke="#0F172A"
          strokeWidth="3"
        />
        {/* Golden Kombu Teriyaki Broth */}
        <ellipse cx="100" cy="96" rx="66" ry="36" fill="#9A3412" />
        <ellipse cx="100" cy="97" rx="60" ry="32" fill="#B45309" />

        {/* Baby Bok Choy Greens (Top Left) */}
        <path
          d="M 44 86 C 36 68 58 56 72 68 C 82 58 98 66 92 82 Z"
          fill="#22C55E"
          stroke="#0F172A"
          strokeWidth="2.2"
        />

        {/* Carved Shiitake Mushroom Caps */}
        <g transform="translate(52, 74)">
          <ellipse cx="22" cy="16" rx="19" ry="14" fill="#451A03" stroke="#0F172A" strokeWidth="2.2" />
          <path d="M 11 16 L 33 16 M 22 7 L 22 25" stroke="#FDE68A" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <g transform="translate(114, 64)">
          <ellipse cx="18" cy="14" rx="16" ry="12" fill="#451A03" stroke="#0F172A" strokeWidth="2.2" />
          <path d="M 8 14 L 28 14 M 18 6 L 18 22" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* Glossy Teriyaki Chicken Thigh Chunks */}
        <rect
          x="84"
          y="86"
          width="32"
          height="22"
          rx="8"
          fill="url(#ec-teriyaki-glaze)"
          stroke="#0F172A"
          strokeWidth="2.2"
        />
        <path d="M 92 92 L 108 92" stroke="#FEF3C7" strokeWidth="2.2" strokeLinecap="round" />
        <rect
          x="112"
          y="94"
          width="30"
          height="20"
          rx="8"
          fill="url(#ec-teriyaki-glaze)"
          stroke="#0F172A"
          strokeWidth="2.2"
        />
        <path d="M 118 100 L 132 100" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />

        {/* Konjac Silk Knot (Bottom Left) */}
        <ellipse cx="64" cy="108" rx="15" ry="9" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2" />
        <rect x="61" y="99" width="6" height="18" rx="2" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.6" />

        {/* White Sesame & Scallion Rings */}
        <circle cx="96" cy="102" r="1.4" fill="#FEF3C7" />
        <circle cx="104" cy="98" r="1.4" fill="#FEF3C7" />
        <circle cx="126" cy="106" r="1.4" fill="#FEF3C7" />
        <circle cx="88" cy="114" r="3.5" fill="#4ADE80" stroke="#0F172A" strokeWidth="1.4" />
        <circle cx="108" cy="116" r="3.5" fill="#4ADE80" stroke="#0F172A" strokeWidth="1.4" />

        {/* Subtle Steam Wisps */}
        <path d="M 76 44 C 72 34 80 26 76 18" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
        <path d="M 102 38 C 98 28 106 20 102 12" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        <path d="M 128 44 C 124 34 132 26 128 18" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }

  // 5. 冷萃燕麦拿铁
  if (n.includes('拿铁') || n.includes('咖啡') || n.includes('冷萃') || category === 'drink') {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full block select-none" fill="none">
        <defs>
          <radialGradient id="ec-bg-latte" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FAF5FF" />
            <stop offset="100%" stopColor="#F3E8FF" />
          </radialGradient>
          <linearGradient id="ec-latte-layers" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B1D0E" />
            <stop offset="36%" stopColor="#6F3B1C" />
            <stop offset="58%" stopColor="#D6A87C" />
            <stop offset="82%" stopColor="#F5EBE1" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#ec-bg-latte)" />
        <circle cx="154" cy="42" r="36" fill="#E9D5FF" opacity="0.5" />
        <ellipse cx="100" cy="172" rx="46" ry="11" fill="#0F172A" opacity="0.12" />

        {/* Flat Minimalist Sip Lid */}
        <rect
          x="50"
          y="42"
          width="100"
          height="11"
          rx="5.5"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.6"
        />
        <rect x="56" y="36" width="88" height="7" rx="3.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.2" />

        {/* Cup Body with Espresso-Oat Gradient */}
        <path
          d="M 56 53 L 66 164 C 67 170 133 170 134 164 L 144 53 Z"
          fill="url(#ec-latte-layers)"
          stroke="#0F172A"
          strokeWidth="2.8"
        />

        {/* Crystal Ice Cubes */}
        <rect
          x="64"
          y="60"
          width="24"
          height="20"
          rx="5"
          fill="#FFFFFF"
          fillOpacity="0.75"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          transform="rotate(-8 76 70)"
        />
        <rect
          x="92"
          y="58"
          width="26"
          height="22"
          rx="5"
          fill="#FFFFFF"
          fillOpacity="0.7"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          transform="rotate(10 105 69)"
        />
        <rect
          x="112"
          y="64"
          width="20"
          height="18"
          rx="4"
          fill="#FFFFFF"
          fillOpacity="0.65"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          transform="rotate(-12 122 73)"
        />

        {/* Swirling Oat Milk Marble */}
        <path
          d="M 60 102 C 78 120 98 92 118 110 C 128 118 134 112 139 104"
          stroke="#FFFBEB"
          strokeWidth="5.5"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Minimalist Specialty Coffee Badge */}
        <rect x="74" y="102" width="52" height="30" rx="7" fill="#0F172A" />
        <text x="100" y="116" textAnchor="middle" fill="#C7F665" fontSize="8" fontWeight="900">
          OAT LATTE
        </text>
        <text x="100" y="126" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="700">
          COLD BREW
        </text>

        {/* Roasted Coffee Beans beside Cup */}
        <g transform="translate(36, 154) rotate(-20)">
          <ellipse cx="10" cy="7" rx="9" ry="6" fill="#451A03" stroke="#0F172A" strokeWidth="1.8" />
          <path d="M 3 7 Q 10 4 17 7" stroke="#78350F" strokeWidth="1.5" />
        </g>
        <g transform="translate(144, 156) rotate(25)">
          <ellipse cx="10" cy="7" rx="9" ry="6" fill="#451A03" stroke="#0F172A" strokeWidth="1.8" />
          <path d="M 3 7 Q 10 4 17 7" stroke="#78350F" strokeWidth="1.5" />
        </g>

        {/* Glass Specular Gloss */}
        <path d="M 62 62 L 70 156" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      </svg>
    );
  }

  // 6. 希腊酸奶杯 (Default / Yogurt)
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full block select-none" fill="none">
      <defs>
        <radialGradient id="ec-bg-yogurt" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FDF2F8" />
          <stop offset="100%" stopColor="#FCE7F3" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#ec-bg-yogurt)" />
      <circle cx="152" cy="40" r="36" fill="#FBCFE8" opacity="0.55" />
      <ellipse cx="100" cy="168" rx="54" ry="13" fill="#0F172A" opacity="0.12" />

      {/* Parfait Glass Bowl Body */}
      <path
        d="M 46 74 L 60 156 C 62 164 138 164 140 156 L 154 74 Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="2.8"
      />

      {/* Wild Blueberry Compote Layer at Bottom */}
      <path
        d="M 56 128 C 78 142 104 122 144 134 L 140 156 C 128 162 72 162 60 156 Z"
        fill="#7E22CE"
        stroke="#0F172A"
        strokeWidth="2.2"
      />
      <path
        d="M 62 142 C 84 152 110 138 134 148"
        stroke="#A855F7"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Crunchy Granola Middle Ribbon */}
      <path
        d="M 51 102 C 76 110 124 110 149 102 L 147 114 C 122 122 78 122 53 114 Z"
        fill="#F59E0B"
        stroke="#0F172A"
        strokeWidth="2"
      />

      {/* Thick Creamy Greek Yogurt Mounds */}
      <path
        d="M 42 76 C 46 44 76 38 100 46 C 124 36 154 44 158 76 Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="2.8"
      />
      <path
        d="M 58 68 C 76 52 96 58 104 68 C 116 54 132 56 142 68"
        stroke="#F1F5F9"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Plump Fresh Blueberries on Top */}
      <circle cx="76" cy="52" r="10.5" fill="#3B0764" stroke="#0F172A" strokeWidth="2.2" />
      <circle cx="73" cy="49" r="3" fill="#C084FC" />
      <circle cx="100" cy="42" r="12" fill="#2E1065" stroke="#0F172A" strokeWidth="2.2" />
      <circle cx="97" cy="39" r="3.5" fill="#C084FC" />
      <circle cx="124" cy="52" r="10.5" fill="#3B0764" stroke="#0F172A" strokeWidth="2.2" />
      <circle cx="121" cy="49" r="3" fill="#C084FC" />

      {/* Toasted Almond Flakes & Granola Clusters */}
      <ellipse
        cx="62"
        cy="70"
        rx="8"
        ry="4"
        fill="#D97706"
        stroke="#0F172A"
        strokeWidth="1.6"
        transform="rotate(18 62 70)"
      />
      <ellipse
        cx="138"
        cy="70"
        rx="8"
        ry="4"
        fill="#D97706"
        stroke="#0F172A"
        strokeWidth="1.6"
        transform="rotate(-18 138 70)"
      />
      <ellipse cx="100" cy="68" rx="7" ry="3.5" fill="#FBBF24" stroke="#0F172A" strokeWidth="1.6" />

      {/* Fresh Mint Leaf Sprig */}
      <path
        d="M 100 30 C 90 18 104 10 112 18 C 120 26 108 32 100 30 Z"
        fill="#22C55E"
        stroke="#0F172A"
        strokeWidth="2"
      />
    </svg>
  );
};

export const DishImage: React.FC<DishImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  category,
  /** 是否开启电商小程序风格棚拍底台与角标增强（默认开启） */
   ecomStyle = true
}: DishImageProps & { ecomStyle?: boolean }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSvgStudioUri = src?.startsWith('ecom://') || src?.startsWith('data:image/svg+xml');

  const getCategoryStudioBg = () => {
    switch (category) {
      case 'salad':
        return 'from-[#F7FEE7] via-[#F8FAFC] to-[#ECFCCB]';
      case 'drink':
        return 'from-[#F0F9FF] via-[#F8FAFC] to-[#E0F2FE]';
      case 'snack':
        return 'from-[#FFFBEB] via-[#F8FAFC] to-[#FEF3C7]';
      case 'hot':
      case 'bowl':
        return 'from-[#FFF7ED] via-[#F8FAFC] to-[#FFEDD5]';
      default:
        return 'from-[#F8FAFC] via-[#FFFFFF] to-[#F1F5F9]';
    }
  };

  if (isSvgStudioUri || hasError) {
    return (
      <div className="relative w-full h-full overflow-hidden select-none bg-[#F8FAFC]">
        <EcommerceDishArtwork name={alt} category={category} />
        {ecomStyle && (
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/[0.05]" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br ${getCategoryStudioBg()} select-none`}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/80 animate-pulse">
          <Utensils className="w-5 h-5 text-slate-400 opacity-50" />
        </div>
      )}

      {/* 实拍商品主图：通过微提亮与柔和对比度修饰，使其贴合电商小程序棚拍白底/浅底主图调性 */}
      <img
        ref={(node) => {
          if (node && node.complete) {
            if (node.naturalWidth > 0 && isLoading) {
              setIsLoading(false);
            } else if (node.naturalWidth === 0 && !hasError) {
              setHasError(true);
              setIsLoading(false);
            }
          }
        }}
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        className={`${className} filter brightness-[1.03] contrast-[1.04] saturate-[1.08] transition-all duration-300 ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      />

      {/* 电商小程序棚拍柔光晕与内描边质感层 */}
      {ecomStyle && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 62%), linear-gradient(180deg, rgba(15,23,42,0) 68%, rgba(15,23,42,0.18) 100%)'
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/[0.06]" />
        </>
      )}
    </div>
  );
};
