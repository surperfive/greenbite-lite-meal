import React, { useState, useEffect } from 'react';

interface GiftMascotAnimationProps {
  className?: string;
  isInteractive?: boolean;
  onClick?: () => void;
}

export const GiftMascotAnimation: React.FC<GiftMascotAnimationProps> = ({
  className = '',
  isInteractive = true,
  onClick,
}) => {
  const [isAwake, setIsAwake] = useState(false);

  useEffect(() => {
    // Exact timing cycle matching the video animation
    // 0s-1.8s sleeping -> 1.8s-4.0s awake surprise -> loop
    const interval = setInterval(() => {
      setIsAwake((prev) => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={() => {
        setIsAwake(true);
        if (onClick) onClick();
      }}
      className={`relative flex items-center justify-center select-none ${
        isInteractive ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 200 170"
        className="w-full h-full max-h-[86px] max-w-[120px] drop-shadow-sm transition-transform duration-200 active:scale-95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glowing gradient for box interior */}
          <radialGradient id="boxGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDE7" stopOpacity="1" />
            <stop offset="50%" stopColor="#FFF59D" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFA000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* --- GOLDEN GLOW & LIGHT RAYS (When lid is open) --- */}
        {isAwake && (
          <g>
            <circle cx="132" cy="70" r="35" fill="url(#boxGlow)" />
            {/* Soft upward light beams */}
            <polygon points="132,68 108,18 120,15" fill="#FFF9C4" opacity="0.9" />
            <polygon points="132,68 128,10 138,10" fill="#FFFDE7" opacity="0.95" />
            <polygon points="132,68 146,16 156,22" fill="#FFF9C4" opacity="0.9" />
            {/* Sparkles */}
            <circle cx="112" cy="22" r="2" fill="#FFA000" />
            <circle cx="148" cy="18" r="2.2" fill="#FFA000" />
            <circle cx="160" cy="38" r="1.5" fill="#FFA000" />
          </g>
        )}

        {/* --- GREEN CAT MASCOT --- */}
        <g>
          {/* Sleeping Pose Behind Box */}
          {!isAwake && (
            <g className="transition-opacity duration-200">
              {/* Back / Body silhouette */}
              <path
                d="M 50 120 C 40 115 32 100 38 78 C 42 62 58 55 70 54 C 82 54 94 62 98 74 C 99 78 98 84 96 90 Z"
                fill="#94C843"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />

              {/* Back Hip / Tail curved */}
              <path
                d="M 40 98 C 30 102 32 118 42 122 C 48 124 55 120 54 114"
                fill="#7EAF32"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinecap="round"
              />

              {/* Front Resting Paw (Dark bottom ellipse) */}
              <ellipse
                cx="68"
                cy="120"
                rx="14"
                ry="11"
                fill="#7EAF32"
                stroke="#0D1F2D"
                strokeWidth="4.5"
              />

              {/* Head Base */}
              <path
                d="M 42 54 C 36 64 36 78 44 86 C 54 94 72 94 82 86 C 90 78 92 64 88 54 C 82 44 48 44 42 54 Z"
                fill="#94C843"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />

              {/* Left Ear */}
              <path
                d="M 42 52 L 35 28 C 42 30 50 36 54 44 Z"
                fill="#94C843"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              <path d="M 40 42 L 37 32 C 41 33 46 38 49 42 Z" fill="#7EAF32" />

              {/* Right Ear */}
              <path
                d="M 72 44 C 76 36 84 30 91 28 L 84 52 Z"
                fill="#94C843"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              <path d="M 77 42 C 80 38 85 33 89 32 L 86 42 Z" fill="#7EAF32" />

              {/* Sleeping Face Features */}
              {/* Closed Sleepy Eyes (Arch lines) */}
              <path
                d="M 52 64 C 55 60 60 60 63 64"
                stroke="#0D1F2D"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 73 64 C 76 60 81 60 84 64"
                stroke="#0D1F2D"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Stitched Mouth / Mask Arc (dashed line matching video) */}
              <path
                d="M 48 72 C 54 82 64 85 70 85 C 76 85 86 82 92 72"
                stroke="#0D1F2D"
                strokeWidth="3"
                strokeDasharray="4 3"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* Awake & Cheering Pose */}
          {isAwake && (
            <g className="transition-opacity duration-200">
              {/* Body */}
              <path
                d="M 46 120 C 38 112 32 96 38 76 C 42 60 58 52 70 52 C 82 52 94 60 98 74 C 100 80 98 86 96 92 Z"
                fill="#94C843"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />

              {/* Front Paw */}
              <ellipse
                cx="66"
                cy="120"
                rx="14"
                ry="11"
                fill="#7EAF32"
                stroke="#0D1F2D"
                strokeWidth="4.5"
              />

              {/* Waving Paw (Raised high on left) */}
              <path
                d="M 36 68 C 24 58 20 44 28 38 C 34 34 40 42 38 52 Z"
                fill="#94C843"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              <ellipse cx="28" cy="40" rx="2.5" ry="2.5" fill="#7EAF32" />

              {/* Head */}
              <path
                d="M 42 50 C 36 60 36 76 44 84 C 54 92 72 92 82 84 C 90 76 92 60 88 50 C 82 40 48 40 42 50 Z"
                fill="#94C843"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />

              {/* Left Ear */}
              <path
                d="M 42 48 L 35 24 C 42 26 50 32 54 40 Z"
                fill="#94C843"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              <path d="M 40 38 L 37 28 C 41 29 46 34 49 38 Z" fill="#7EAF32" />

              {/* Right Ear */}
              <path
                d="M 72 40 C 76 32 84 26 91 24 L 84 48 Z"
                fill="#94C843"
                stroke="#0D1F2D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              <path d="M 77 38 C 80 34 85 29 89 28 L 86 38 Z" fill="#7EAF32" />

              {/* Button Eyes: White circle with black 'X' stitch */}
              {/* Left Button Eye */}
              <circle cx="56" cy="62" r="5.5" fill="#FFFFFF" stroke="#0D1F2D" strokeWidth="2.5" />
              <line x1="53" y1="59" x2="59" y2="65" stroke="#0D1F2D" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="59" y1="59" x2="53" y2="65" stroke="#0D1F2D" strokeWidth="2.5" strokeLinecap="round" />

              {/* Right Button Eye */}
              <circle cx="78" cy="62" r="5.5" fill="#FFFFFF" stroke="#0D1F2D" strokeWidth="2.5" />
              <line x1="75" y1="59" x2="81" y2="65" stroke="#0D1F2D" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="81" y1="59" x2="75" y2="65" stroke="#0D1F2D" strokeWidth="2.5" strokeLinecap="round" />

              {/* Stitched Freckle Muzzle */}
              <path
                d="M 48 70 C 54 78 62 80 67 80 C 72 80 80 78 86 70"
                stroke="#0D1F2D"
                strokeWidth="2.5"
                strokeDasharray="3.5 2.5"
                fill="none"
              />

              {/* Open Oval Mouth */}
              <ellipse cx="67" cy="74" rx="4.5" ry="6" fill="#1C380A" stroke="#0D1F2D" strokeWidth="2.5" />
              <path d="M 64 76 C 65 79 69 79 70 76 Z" fill="#EF5350" />
            </g>
          )}
        </g>

        {/* --- ORANGE GIFT BOX --- */}
        <g>
          {/* Main Box Body */}
          <rect
            x="94"
            y="68"
            width="76"
            height="62"
            rx="4"
            fill="#F58220"
            stroke="#0D1F2D"
            strokeWidth="4.5"
          />

          {/* Green Ribbon (Vertical) on Box Body */}
          <rect
            x="122"
            y="68"
            width="20"
            height="62"
            fill="#1E7B34"
            stroke="#0D1F2D"
            strokeWidth="3.5"
          />

          {/* Box Interior / Light Gap when open */}
          {isAwake && (
            <rect
              x="97"
              y="62"
              width="70"
              height="10"
              rx="2"
              fill="#D96810"
              stroke="#0D1F2D"
              strokeWidth="3"
            />
          )}

          {/* Box Lid & Bow (Closed when sleeping, lifted & rotated when awake) */}
          <g
            className={`transition-all duration-300 origin-[166px_66px] ${
              isAwake
                ? 'transform -translate-y-4 -rotate-14'
                : 'transform translate-y-0 rotate-0'
            }`}
          >
            {/* Lid Rim */}
            <rect
              x="88"
              y="56"
              width="88"
              height="14"
              rx="3.5"
              fill="#F58220"
              stroke="#0D1F2D"
              strokeWidth="4.5"
            />

            {/* Green Ribbon on Lid */}
            <rect
              x="122"
              y="56"
              width="20"
              height="14"
              fill="#1E7B34"
              stroke="#0D1F2D"
              strokeWidth="3.5"
            />

            {/* --- BIG GREEN BOW --- */}
            {/* Left Ribbon Loop */}
            <path
              d="M 132 56 C 114 44 98 30 112 24 C 126 18 130 44 132 56 Z"
              fill="#1E7B34"
              stroke="#0D1F2D"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <path d="M 122 38 C 117 32 115 28 120 27 C 125 26 128 32 128 38 Z" fill="#0E4E1E" />

            {/* Right Ribbon Loop */}
            <path
              d="M 132 56 C 150 44 166 30 152 24 C 138 18 134 44 132 56 Z"
              fill="#1E7B34"
              stroke="#0D1F2D"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <path d="M 142 38 C 147 32 149 28 144 27 C 139 26 136 32 136 38 Z" fill="#0E4E1E" />

            {/* Ribbon Tails */}
            <path
              d="M 126 56 C 118 64 108 72 105 76"
              stroke="#0D1F2D"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M 138 56 C 146 64 156 72 159 76"
              stroke="#0D1F2D"
              strokeWidth="4.5"
              strokeLinecap="round"
            />

            {/* Central Knot */}
            <ellipse
              cx="132"
              cy="55"
              rx="7"
              ry="5.5"
              fill="#1E7B34"
              stroke="#0D1F2D"
              strokeWidth="4.5"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
