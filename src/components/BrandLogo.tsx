import React from "react";

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
}

export function BrandLogo({
  size = 36,
  showText = true,
  showTagline = false,
}: BrandLogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#14291E] to-[#0D2017] border border-[#40E8A1]/30 shadow-glow"
        style={{ width: size, height: size }}
      >
        <svg
          width={Math.round(size * 0.7)}
          height={Math.round(size * 0.7)}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Minimalist Wallet Outline */}
          <rect
            x="3.5"
            y="8"
            width="21"
            height="17"
            rx="4"
            stroke="#40E8A1"
            strokeWidth="2"
            fill="#071510"
          />
          {/* Wallet Flap */}
          <path
            d="M17.5 15.5H25.5C26.3284 15.5 27 16.1716 27 17V18.5C27 19.3284 26.3284 20 25.5 20H17.5C16.6716 20 16 19.3284 16 18.5V17C16 16.1716 16.6716 15.5 17.5 15.5Z"
            fill="#14291E"
            stroke="#40E8A1"
            strokeWidth="1.6"
          />
          {/* Upward Financial Graph inside Wallet */}
          <path
            d="M7 20.5L11 16.5L14 18.5L19 12.5"
            stroke="#D5FA72"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.5 12.5H19V15"
            stroke="#D5FA72"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* AI 4-point Sparkle */}
          <path
            d="M25.5 2.5L26.4 5.1L29 6L26.4 6.9L25.5 9.5L24.6 6.9L22 6L24.6 5.1L25.5 2.5Z"
            fill="#D5FA72"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-lg font-bold tracking-tight text-[#F4F8F5]">
            PocketWise <span className="text-[#40E8A1]">AI</span>
          </span>
          {showTagline && (
            <span className="text-[11px] font-medium text-[#91A99B] tracking-wide">
              Small Budget. Big Dreams.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
