"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type AnimationFn = (ctx: gsap.Context, container: HTMLElement) => void;

/**
 * Run a GSAP animation scoped to a DOM container, with automatic
 * cleanup on unmount. Honors prefers-reduced-motion by skipping the
 * animation body entirely (selectors keep their natural state).
 *
 * Use this from any client component on the landing page:
 *
 *   const ref = useGSAPAnimation((ctx) => {
 *     gsap.from(".hero-title", { y: 40, opacity: 0 });
 *   });
 */
export function useGSAPAnimation<T extends HTMLElement = HTMLDivElement>(
  animationFn: AnimationFn,
  deps: unknown[] = [],
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const container = ref.current;
    // gsap.context invokes its callback synchronously and passes the
    // context itself as the first argument — receive it via parameter
    // rather than closing over `ctx`, which is still in the TDZ here.
    const ctx = gsap.context(
      (self: gsap.Context) => animationFn(self, container),
      container,
    );
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
