import React from 'react';

interface RedPacketFuIconProps {
  className?: string;
}

export const RedPacketFuIcon: React.FC<RedPacketFuIconProps> = ({ className = 'w-10 h-10' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* --- Left Sparkle Star (Diamond) --- */}
        <path
          d="M 28 92 C 28 84 32 80 40 80 C 32 80 28 76 28 68 C 28 76 24 80 16 80 C 24 80 28 84 28 92 Z"
          fill="#1C2E4A"
        />

        {/* --- Right Sparkle Star (Diamond) --- */}
        <path
          d="M 172 92 C 172 84 176 80 184 80 C 176 80 172 76 172 68 C 172 76 168 80 160 80 C 168 80 172 84 172 92 Z"
          fill="#1C2E4A"
        />

        {/* --- Main Red Envelope Body --- */}
        <rect
          x="40"
          y="28"
          width="120"
          height="140"
          rx="24"
          fill="#EF4136"
          stroke="#1C2E4A"
          strokeWidth="7"
        />

        {/* --- Flap Curved Line (Top Envelope Flap) --- */}
        {/* Yellow Trim under Flap */}
        <path
          d="M 40 70 C 70 120 130 120 160 70"
          stroke="#FDB913"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        {/* Dark Outline of Flap */}
        <path
          d="M 40 70 C 70 120 130 120 160 70"
          stroke="#1C2E4A"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        {/* --- Central Golden Fu (福) Coin / Seal --- */}
        {/* Outer Dark Ring */}
        <circle
          cx="100"
          cy="98"
          r="29"
          fill="#FDB913"
          stroke="#1C2E4A"
          strokeWidth="7"
        />

        {/* --- Fu (福) Character (Exact Clean Geometry) --- */}
        {/* Left Radical: 礻 (Shi) */}
        {/* Dot on top */}
        <line x1="83" y1="81" x2="87" y2="84" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" />
        {/* Horizontal + Left Slant */}
        <path
          d="M 79 88 L 89 88 L 84 96 L 87 114"
          stroke="#FFFFFF"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right falling dot / stroke of radical */}
        <line x1="88" y1="98" x2="92" y2="105" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" />

        {/* Right Radical: 一 + 口 + 田 */}
        {/* Top Horizontal line */}
        <line x1="97" y1="83" x2="119" y2="83" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" />

        {/* Middle '口' */}
        <rect
          x="99"
          y="88"
          width="16"
          height="8"
          rx="1"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          fill="none"
        />

        {/* Bottom '田' */}
        <rect
          x="97"
          y="100"
          width="20"
          height="14"
          rx="1"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          fill="none"
        />
        {/* Cross inside '田' */}
        <line x1="107" y1="100" x2="107" y2="114" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="97" y1="107" x2="117" y2="107" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />

        {/* --- Bottom Left Golden Ancient Coin --- */}
        <circle
          cx="42"
          cy="150"
          r="20"
          fill="#FDB913"
          stroke="#1C2E4A"
          strokeWidth="6.5"
        />
        {/* Square Hole in Left Coin (Rotated Diamond) */}
        <rect
          x="35"
          y="143"
          width="14"
          height="14"
          rx="2"
          fill="#FFFFFF"
          transform="rotate(45 42 150)"
        />

        {/* --- Bottom Right Golden Ancient Coin --- */}
        <circle
          cx="158"
          cy="150"
          r="20"
          fill="#FDB913"
          stroke="#1C2E4A"
          strokeWidth="6.5"
        />
        {/* Square Hole in Right Coin (Rotated Diamond) */}
        <rect
          x="151"
          y="143"
          width="14"
          height="14"
          rx="2"
          fill="#FFFFFF"
          transform="rotate(45 158 150)"
        />
      </svg>
    </div>
  );
};
