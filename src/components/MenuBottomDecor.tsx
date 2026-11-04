import React from 'react';

export const MenuBottomDecor: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-0 inset-x-0 h-48 pointer-events-none z-0 select-none overflow-hidden"
    >
      {/* Pure solid lime green wedge on right bottom - adjusted to moderate height */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 390 192"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M170 192 L390 18 L390 192 Z"
          fill="#C7F665"
        />
      </svg>
    </div>
  );
};
