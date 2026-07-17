"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useGSAPAnimation } from "@/hooks/use-gsap-animation";
import { buttonVariants } from "@/components/ui/button";
import { DashboardHeroMockup } from "./mockups/DashboardHeroMockup";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const ref = useGSAPAnimation<HTMLElement>(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero-tag", { y: 20, opacity: 0, duration: 0.5 })
      .from(".hero-title", { y: 40, opacity: 0, duration: 0.7 }, "-=0.2")
      .from(".hero-subtitle", { y: 30, opacity: 0, duration: 0.6 }, "-=0.3")
      .from(".hero-ctas", { y: 20, opacity: 0, duration: 0.5 }, "-=0.2")
      .from(
        ".hero-mockup",
        { y: 60, opacity: 0, scale: 0.97, duration: 1.0 },
        "-=0.3",
      );
  });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20"
    >
      <div className="mx-auto max-w-5xl text-center">
        <span className="hero-tag inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3 py-1 text-[12px] font-medium text-foreground-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          Disponible bientôt
        </span>

        <h1 className="hero-title mt-6 max-w-4xl text-balance text-foreground mx-auto">
          Gérez votre agence.
          <br className="hidden sm:block" />{" "}
          <span className="text-primary">Développez votre business.</span>
        </h1>

        <p className="hero-subtitle lead-21 mx-auto mt-6 max-w-2xl text-foreground-muted">
          L&apos;outil pensé pour les agences web africaines. CRM, devis, projets et
          paiements Mobile Money — tout dans un seul outil, sans surprise.
        </p>

        <div className="hero-ctas mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full px-6 active:scale-95 transition-transform",
            )}
          >
            Démarrer gratuitement
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <Link
            href="#features"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full px-6 active:scale-95 transition-transform",
            )}
          >
            <PlayCircle className="mr-1 h-4 w-4" />
            Voir une démo
          </Link>
        </div>

        <p className="mt-3 text-[12px] text-foreground-subtle">
          Pas de carte bancaire requise · 14 jours d&apos;essai sur le plan Pro
        </p>
      </div>

      {/* Hero mockup */}
      <div className="hero-mockup mx-auto mt-16 max-w-5xl px-2 md:mt-20 md:px-0">
        <DashboardHeroMockup />
      </div>
    </section>
  );
}
