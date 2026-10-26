"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

export function AuthShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const spotlightRef = useRef<HTMLDivElement>(null);

  function moveSpotlight(x: number, y: number, visible: boolean) {
    const spotlight = spotlightRef.current;
    if (!spotlight) {
      return;
    }

    if (!visible) {
      spotlight.style.opacity = "0";
      return;
    }

    const mask = `radial-gradient(circle 220px at ${x}px ${y}px, #000 0%, transparent 72%)`;
    spotlight.style.opacity = "1";
    spotlight.style.maskImage = mask;
    spotlight.style.setProperty("-webkit-mask-image", mask);
  }

  function move(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("[data-auth-card]")) {
      moveSpotlight(0, 0, false);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    moveSpotlight(event.clientX - rect.left, event.clientY - rect.top, true);
  }

  return (
    <div
      className="relative flex min-h-full flex-1 items-center justify-center overflow-x-hidden overflow-y-auto bg-[#070708] px-4 py-12"
      onMouseMove={move}
      onMouseLeave={() => moveSpotlight(0, 0, false)}
    >
      <div className="ambient-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        ref={spotlightRef}
        className="spotlight-grid pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        aria-hidden="true"
      />
      <div
        data-auth-card
        className={`relative z-10 w-full rounded-2xl border border-white/10 bg-[#141416] px-6 py-7 font-sans text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:px-8 ${wide ? "max-w-[560px]" : "max-w-[400px]"}`}
      >
        {children}
      </div>
    </div>
  );
}
