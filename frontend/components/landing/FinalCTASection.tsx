"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useGSAPAnimation } from "@/hooks/use-gsap-animation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCTASection() {
  const ref = useGSAPAnimation<HTMLElement>((_, container) => {
    // Subtle parallax on the radial decoration as the section scrolls past.
    gsap.to(".cta-bg-1", {
      y: -60,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.4,
      },
    });
    gsap.to(".cta-bg-2", {
      y: 40,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.6,
      },
    });
    gsap.from(".cta-content > *", {
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: { trigger: container, start: "top 70%", once: true },
    });
  });

  return (
    <section
      ref={ref}
      className="cta-section relative overflow-hidden bg-tile-dark py-24 text-foreground-on-dark md:py-32"
    >
      {/* Background atmospheric blobs */}
      <div
        className="cta-bg-1 pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="cta-bg-2 pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="cta-content relative mx-auto max-w-3xl px-4 text-center md:px-6">
        <h2 className="section-title text-foreground-on-dark">
          Prêt à transformer votre agence&nbsp;?
        </h2>
        <p className="lead-21 mx-auto mt-5 max-w-xl text-foreground-on-dark/75">
          Rejoignez plus de 500 agences africaines qui utilisent AtlasCRM pour
          structurer leur activité commerciale et accélérer leurs paiements.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full px-6 active:scale-95 transition-transform",
            )}
          >
            Commencer gratuitement
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-full border border-foreground-on-dark/30 px-6 text-[15px] font-medium text-foreground-on-dark transition-colors hover:bg-foreground-on-dark/10",
              "active:scale-95 transition-transform",
            )}
          >
            <CalendarCheck className="h-4 w-4" />
            Prendre rendez-vous
          </Link>
        </div>
        <p className="mt-4 text-[12px] text-foreground-on-dark/55">
          Aucune carte bancaire requise · Annulation en un clic
        </p>
      </div>
    </section>
  );
}
