"use client";

import { gsap } from "@/lib/gsap";
import { useGSAPAnimation } from "@/hooks/use-gsap-animation";

const agencies = [
  "PixelForge",
  "WebTech Dakar",
  "DigiCraft Accra",
  "Cotonou Studio",
  "Sahel Digital",
  "Lagos Labs",
];

/**
 * Continuous horizontal scroll of fictional agency names. The list is
 * duplicated so the loop point is invisible.
 */
export function LogosBand() {
  const ref = useGSAPAnimation<HTMLDivElement>(() => {
    gsap.to(".logos-track", {
      xPercent: -50,
      ease: "none",
      duration: 28,
      repeat: -1,
    });
  });

  return (
    <section
      ref={ref}
      className="border-y border-border-soft bg-background-soft py-10"
      aria-label="Nos clients"
    >
      <div className="mx-auto max-w-6xl">
        <p className="caption-14 mb-6 text-center text-foreground-subtle">
          Plus de 500 agences africaines nous font confiance
        </p>
        <div className="relative overflow-hidden">
          <div className="logos-track flex w-max items-center gap-12">
            {[...agencies, ...agencies].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="flex shrink-0 items-center gap-2 px-2 text-foreground-muted"
              >
                <span className="h-3 w-3 rounded-full border-2 border-foreground-muted" />
                <span className="text-[18px] font-semibold tracking-tight">
                  {name}
                </span>
              </div>
            ))}
          </div>
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background-soft to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background-soft to-transparent" />
        </div>
      </div>
    </section>
  );
}
