import React from 'react';

interface HandshakeStitchIconProps {
  className?: string;
}

export const HandshakeStitchIcon: React.FC<HandshakeStitchIconProps> = ({ className = 'w-10 h-10' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 300 200"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle gradient for depth */}
          <linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C6F675" />
            <stop offset="50%" stopColor="#B3EC5D" />
            <stop offset="100%" stopColor="#9BD841" />
          </linearGradient>
          <linearGradient id="thumbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4FA8B" />
            <stop offset="100%" stopColor="#AEE654" />
          </linearGradient>
          <linearGradient id="fingerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B4EB5E" />
            <stop offset="100%" stopColor="#8CCB30" />
          </linearGradient>
        </defs>

        {/* --- 1. Right Arm & Underlying Hand (clasping from right) --- */}
        {/* Right Arm base shape */}
        <path
          d="M 285 25 C 255 70 215 90 180 80 C 170 76 160 68 150 60 C 185 45 235 40 285 25 Z"
          fill="url(#handGrad)"
        />

        {/* --- 2. Left Arm & Hand Body --- */}
        {/* Left Arm curved from top-left */}
        <path
          d="M 15 25 C 65 75 110 88 150 110 C 135 130 110 145 90 140 C 75 115 50 75 15 25 Z"
          fill="url(#handGrad)"
        />

        {/* Left Arm Upper Contour with Outer Stroke */}
        <path
          d="M 15 25 C 70 80 120 95 150 90 C 158 80 162 70 148 58 C 120 62 75 45 15 25"
          fill="url(#handGrad)"
          stroke="#193B06"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        {/* Right Arm Upper Contour with Outer Stroke */}
        <path
          d="M 285 25 C 230 80 180 95 150 90 C 142 80 138 70 152 58 C 180 62 225 45 285 25"
          fill="url(#handGrad)"
          stroke="#193B06"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        {/* --- 3. Clasping Fist / Lower Fingers (The bottom interlock) --- */}
        {/* Main bottom fist bulb (Left hand fingers wrapping down) */}
        <path
          d="M 90 120 C 85 145 105 175 140 178 C 155 180 170 175 180 165 C 195 155 200 130 190 110 C 175 112 165 118 150 118 C 135 118 110 110 90 120 Z"
          fill="url(#fingerGrad)"
          stroke="#193B06"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        {/* Lower finger division bumps */}
        <path
          d="M 154 168 C 156 176 152 180 148 178"
          stroke="#193B06"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 175 156 C 178 164 175 168 170 166"
          stroke="#193B06"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* --- 4. Thumb / Overlapping Hook Hand on Top --- */}
        {/* Left Thumb curved over right hand */}
        <path
          d="M 105 78 C 120 62 145 52 175 54 C 195 56 205 72 195 90 C 185 102 165 108 140 102 C 125 98 120 85 125 76 C 130 68 145 68 165 74 C 178 78 182 72 175 66 C 160 62 135 68 115 82 Z"
          fill="url(#thumbGrad)"
          stroke="#193B06"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        {/* Handshake Center Locking Thumb Curve */}
        <path
          d="M 148 58 C 130 64 120 78 120 90 C 120 102 132 110 148 108 C 168 106 182 92 180 78 C 178 68 168 60 152 58 Z"
          fill="url(#thumbGrad)"
          stroke="#193B06"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        {/* --- 5. Handshake Lower Arm Outlines --- */}
        {/* Left Arm bottom contour */}
        <path
          d="M 15 88 C 45 125 75 140 95 148"
          stroke="#193B06"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Right Arm bottom contour */}
        <path
          d="M 285 88 C 255 125 225 140 195 148"
          stroke="#193B06"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* --- 6. Cute Puppet Stitching Lines (Dashed Green Lines) --- */}
        {/* Left Upper Arm Stitch */}
        <path
          d="M 28 42 C 60 70 95 82 125 88"
          stroke="#2A5C0E"
          strokeWidth="3.5"
          strokeDasharray="7 5"
          strokeLinecap="round"
        />
        {/* Right Upper Arm Stitch */}
        <path
          d="M 272 42 C 240 70 205 82 175 88"
          stroke="#2A5C0E"
          strokeWidth="3.5"
          strokeDasharray="7 5"
          strokeLinecap="round"
        />

        {/* Left Wrist lower stitch */}
        <path
          d="M 88 122 C 90 135 95 145 100 150"
          stroke="#2A5C0E"
          strokeWidth="3"
          strokeDasharray="5 4"
          strokeLinecap="round"
        />
        {/* Right Wrist lower stitch */}
        <path
          d="M 212 122 C 210 135 205 145 200 150"
          stroke="#2A5C0E"
          strokeWidth="3"
          strokeDasharray="5 4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
