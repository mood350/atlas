"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGSAPAnimation } from "@/hooks/use-gsap-animation";

interface Stat {
  value?: number;
  suffix?: string;
  prefix?: string;
  label: string;
  /** When set, render as a textual badge instead of a numeric counter. */
  textValue?: string;
}

const stats: Stat[] = [
  { value: 35, suffix: "%", label: "CA récupéré sur les paiements en retard" },
  { value: 4, suffix: "h", label: "Délai moyen pour produire un devis" },
  { value: 3, suffix: "×", label: "Plus de projets livrés à temps" },
  { textValue: "Mobile Money", label: "Paiements natifs FedaPay & PayDunya" },
];

export function StatsSection() {
  const ref = useGSAPAnimation<HTMLElement>(() => {
    // Counter animation per stat-number element. We treat the
    // textContent as a numeric tween target, snapping to integers.
    document.querySelectorAll<HTMLElement>(".stat-number").forEach((el) => {
      const target = Number(el.dataset.target ?? 0);
      gsap.fromTo(
        el,
        { textContent: 0 },
        {
          textContent: target,
          duration: 1.6,
          ease: "power2.out",
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            once: true,
          },
        },
      );
    });

    // Slide-in for the textual badge.
    gsap.from(".stat-text", {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: ".stats-grid",
        start: "top 80%",
        once: true,
      },
    });

    // ScrollTrigger.refresh keeps anchors aligned after layout shifts.
    ScrollTrigger.refresh();
  });

  return (
    <section ref={ref} className="bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="stats-grid grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="stat-text text-center">
              <div className="text-[56px] font-semibold leading-none tracking-tight text-primary">
                {stat.textValue ? (
                  <span className="text-[28px] font-semibold leading-tight">
                    {stat.textValue}
                  </span>
                ) : (
                  <>
                    {stat.prefix ?? ""}
                    <span className="stat-number" data-target={stat.value}>
                      0
                    </span>
                    {stat.suffix ?? ""}
                  </>
                )}
              </div>
              <p className="caption-14 mx-auto mt-3 max-w-[14rem] text-foreground-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
