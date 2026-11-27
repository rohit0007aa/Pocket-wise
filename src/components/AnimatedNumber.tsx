"use client";

import React, { useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/finance";

interface AnimatedNumberProps {
  value: number;
  currency?: boolean;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  currency = true,
  suffix = "",
  className = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number>(value);
  const prevRef = useRef<number>(value);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) return;

    const duration = 380;
    const startTime = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplay(value);
        prevRef.current = value;
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return (
    <span className={className}>
      {currency ? formatINR(display) : display}
      {suffix}
    </span>
  );
}
