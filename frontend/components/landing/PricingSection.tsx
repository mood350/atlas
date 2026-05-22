"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useGSAPAnimation } from "@/hooks/use-gsap-animation";
import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Plan {
  id: "free" | "starter" | "pro";
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Pour démarrer en douceur",
    monthly: 0,
    yearly: 0,
    cta: { label: "Démarrer", href: "/register?plan=free" },
    features: [
      "Jusqu'à 3 clients",
      "2 projets actifs",
      "Devis en PDF",
      "Support communautaire",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "Pour les agences qui décollent",
    monthly: 29900,
    yearly: 23920,
    featured: true,
    cta: { label: "Essayer 14 jours", href: "/register?plan=starter" },
    features: [
      "Jusqu'à 20 clients",
      "10 projets actifs",
      "Contrats électroniques",
      "Mobile Money — FedaPay & PayDunya",
      "Portail client",
      "500 emails / mois",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les agences ambitieuses",
    monthly: 79900,
    yearly: 63920,
    cta: { label: "Contacter", href: "/contact?plan=pro" },
    features: [
      "Clients illimités",
      "Projets illimités",
      "WhatsApp Business intégré",
      "Analytics avancés",
      "Emails illimités",
      "Support prioritaire",
    ],
  },
];

type Cycle = "monthly" | "yearly";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}

export function PricingSection() {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  const ref = useGSAPAnimation<HTMLElement>(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".pricing-grid",
        start: "top 65%",
        once: true,
      },
    });
    tl.from(".pricing-card", {
      y: 60,
      opacity: 0,
      duration: 0.6,
      ease: "back.out(1.4)",
      stagger: 0.1,
    });
  });

  return (
    <section
      ref={ref}
      id="pricing"
      className="border-t border-border-soft bg-background py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="section-title text-foreground">
            Tarifs simples, sans surprise
          </h2>
          <p className="lead-21 mt-4 text-foreground-muted">
            En francs CFA. Pas de carte bancaire requise pour démarrer. Annulation
            en un clic.
          </p>
        </div>

        {/* Cycle toggle */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={cn(
              "text-[14px] font-medium transition-colors",
              cycle === "monthly" ? "text-foreground" : "text-foreground-muted hover:text-foreground",
            )}
          >
            Mensuel
          </button>

          <Switch
            checked={cycle === "yearly"}
            onCheckedChange={(checked) => setCycle(checked ? "yearly" : "monthly")}
            aria-label="Basculer la facturation mensuelle ou annuelle"
          />

          <button
            type="button"
            onClick={() => setCycle("yearly")}
            className={cn(
              "text-[14px] font-medium transition-colors",
              cycle === "yearly" ? "text-foreground" : "text-foreground-muted hover:text-foreground",
            )}
          >
            Annuel
          </button>
          <span className="rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success">
            -20%
          </span>
        </div>

        {/* Plans */}
        <div className="pricing-grid grid gap-6 md:grid-cols-3 md:items-stretch">
          {plans.map((plan) => {
            const price = cycle === "monthly" ? plan.monthly : plan.yearly;
            return (
              <article
                key={plan.id}
                className={cn(
                  "pricing-card relative flex flex-col rounded-[20px] border bg-surface p-6 md:p-8",
                  plan.featured
                    ? "border-primary shadow-product md:scale-[1.04] md:-translate-y-2 z-10"
                    : "border-border-soft",
                )}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    Plus populaire
                  </span>
                ) : null}

                <header className="mb-6">
                  <h3 className="text-[22px] font-semibold tracking-tight text-foreground">
                    {plan.name}
                  </h3>
                  <p className="caption-14 mt-1 text-foreground-muted">
                    {plan.description}
                  </p>
                </header>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] font-semibold leading-none tracking-tight text-foreground">
                      {formatPrice(price)}
                    </span>
                    <span className="text-[14px] font-medium text-foreground-muted">
                      XOF
                    </span>
                  </div>
                  <p className="caption-14 mt-1 text-foreground-subtle">
                    /mois{cycle === "yearly" ? " · facturé annuellement" : ""}
                  </p>
                </div>

                <Link
                  href={plan.cta.href}
                  className={cn(
                    buttonVariants({
                      size: "lg",
                      variant: plan.featured ? "default" : "outline",
                    }),
                    "mb-6 rounded-full active:scale-95 transition-transform",
                  )}
                >
                  {plan.cta.label}
                </Link>

                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[14px] text-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <p className="caption-14 mt-10 text-center text-foreground-subtle">
          Tous les plans incluent l&apos;hébergement, la sauvegarde quotidienne et les
          mises à jour. La TVA n&apos;est pas applicable (article 261).
        </p>
      </div>
    </section>
  );
}
