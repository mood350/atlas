"use client";

import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { useGSAPAnimation } from "@/hooks/use-gsap-animation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TileSurface = "light" | "parchment" | "dark";

interface FeatureTileProps {
  surface: TileSurface;
  reverse?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  mockup: React.ReactNode;
}

const surfaceClasses: Record<TileSurface, string> = {
  light: "bg-tile-light text-foreground",
  parchment: "bg-tile-parchment text-foreground",
  dark: "bg-tile-dark text-foreground-on-dark",
};

export function FeatureTile({
  surface,
  reverse = false,
  eyebrow,
  title,
  description,
  bullets,
  primaryCta,
  secondaryCta,
  mockup,
}: FeatureTileProps) {
  const isDark = surface === "dark";

  const ref = useGSAPAnimation<HTMLElement>((_, container) => {
    gsap.from(".feature-text", {
      x: reverse ? 60 : -60,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: container, start: "top 70%", once: true },
    });
    gsap.from(".feature-mockup", {
      x: reverse ? -60 : 60,
      opacity: 0,
      duration: 0.8,
      delay: 0.15,
      ease: "power3.out",
      scrollTrigger: { trigger: container, start: "top 70%", once: true },
    });
  });

  return (
    <section
      ref={ref}
      className={cn(
        "feature-tile-root relative overflow-hidden",
        surfaceClasses[surface],
      )}
    >
      <div
        className={cn(
          "mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-2 lg:gap-16",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        {/* Text */}
        <div className="feature-text space-y-5">
          <div
            className={cn(
              "caption-14 inline-block font-semibold uppercase tracking-wide",
              isDark ? "text-primary" : "text-primary",
            )}
          >
            {eyebrow}
          </div>
          <h2
            className={cn(
              "section-title",
              isDark ? "text-foreground-on-dark" : "text-foreground",
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              "lead-21 max-w-lg",
              isDark ? "text-foreground-on-dark/80" : "text-foreground-muted",
            )}
          >
            {description}
          </p>

          {bullets && bullets.length > 0 ? (
            <ul className="space-y-2 pt-2">
              {bullets.map((b) => (
                <li
                  key={b}
                  className={cn(
                    "flex items-start gap-2 text-[15px]",
                    isDark ? "text-foreground-on-dark/85" : "text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      isDark ? "bg-primary" : "bg-primary",
                    )}
                    aria-hidden
                  />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}

          {(primaryCta || secondaryCta) && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-full px-5 active:scale-95 transition-transform",
                  )}
                >
                  {primaryCta.label}
                </Link>
              ) : null}
              {secondaryCta ? (
                <Link
                  href={secondaryCta.href}
                  className={cn(
                    "inline-flex items-center gap-1 text-[14px] font-medium transition-colors",
                    isDark
                      ? "text-primary hover:text-primary/80"
                      : "text-primary hover:text-primary/80",
                  )}
                >
                  {secondaryCta.label} →
                </Link>
              ) : null}
            </div>
          )}
        </div>

        {/* Mockup */}
        <div className="feature-mockup">{mockup}</div>
      </div>
    </section>
  );
}
