import React from 'react';

interface CloudSkyBackgroundProps {
  className?: string;
}

/**
 * CloudSkyBackground
 * High-fidelity vector recreation of the vibrant lime-sky and billowing white clouds
 * based on user artwork with exact bezier curves, layered volumetric gradients,
 * wind speed streaks, and seamless foreground white wave transition.
 */
export const CloudSkyBackground: React.FC<CloudSkyBackgroundProps> = ({
  className = ''
}) => {
  return (
    <div
      className={`absolute inset-x-0 top-0 h-[890px] pointer-events-none overflow-hidden select-none bg-white z-0 ${className}`}
      id="gacha-cloud-sky-backdrop"
      aria-hidden="true"
    >
      <img
        src="/online_9f52938bdc.jpg"
        alt=""
        className="w-full h-[720px] object-cover object-top"
        draggable={false}
       loading="lazy" decoding="async" />

      {/* Reference Image Bottom Wave Transition with Right Smiley Face - Positioned right at user's blue line below the status panel */}
      <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none overflow-hidden">
        {/* Layer 1: Soft Translucent Lime Background Wave behind main wave */}
        <svg
          viewBox="0 0 400 80"
          className="absolute inset-x-0 bottom-0 w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 52 C 50 35, 110 38, 170 54 C 230 68, 300 48, 360 22 C 380 12, 395 6, 400 3 L 400 80 L 0 80 Z"
            fill="#dcfc48"
            opacity="0.55"
          />
        </svg>

        {/* Layer 2: Main Vibrant Lime Wave (#c2fb18 / #bef91b) */}
        <svg
          viewBox="0 0 400 80"
          className="absolute inset-x-0 bottom-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 16 C 5 28, 25 58, 65 52 C 105 46, 140 60, 205 60 C 265 60, 315 56, 350 32 C 375 14, 390 4, 400 0 L 400 80 L 0 80 Z"
            fill="#c0fa1a"
          />
        </svg>

        {/* Layer 3: The Black Smiley Face on the right side wave slope */}
        <div className="absolute right-6 bottom-4 pointer-events-none select-none z-10 rotate-[8deg]">
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            className="w-7 h-7"
          >
            {/* Left Eye: tilted oval pill */}
            <ellipse
              cx="9"
              cy="10"
              rx="2.6"
              ry="3.6"
              fill="#000"
              transform="rotate(6 9 10)"
            />
            {/* Right Eye: tilted oval pill */}
            <ellipse
              cx="21"
              cy="8.5"
              rx="2.6"
              ry="3.6"
              fill="#000"
              transform="rotate(10 21 8.5)"
            />
            {/* Smile Mouth: thick curved grin */}
            <path
              d="M 6.5 17.5 C 9.5 24.5, 20.5 24.5, 24.5 16.5"
              stroke="#000"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right dimple / corner mark of smile */}
            <path
              d="M 23 15 C 24.8 16.2, 26 18, 26.5 19.5"
              stroke="#000"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
export default CloudSkyBackground;
