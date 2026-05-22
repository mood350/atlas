"use client";

import { Star } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useGSAPAnimation } from "@/hooks/use-gsap-animation";

const testimonials = [
  {
    quote:
      "Avant AtlasCRM, on perdait des devis par WhatsApp. Maintenant tout est tracé, les relances se font seules. On a gagné 20% sur notre taux de conversion en 3 mois.",
    author: "Kofi Mensah",
    role: "Directeur",
    agency: "PixelForge Abidjan",
    avatarColor: "#34c759",
  },
  {
    quote:
      "L'intégration Mobile Money a changé notre vie. On reçoit les acomptes le jour même de la signature. Plus aucune relance pour le premier paiement, jamais.",
    author: "Fatou Diallo",
    role: "CEO",
    agency: "WebTech Dakar",
    avatarColor: "#ff9f0a",
  },
  {
    quote:
      "Le portail client est bluffant. Mes clients voient tout en temps réel et posent moins de questions. J'ai supprimé 4 réunions par semaine grâce à ça.",
    author: "Ama Asante",
    role: "Fondatrice",
    agency: "DigiCraft Accra",
    avatarColor: "#0066cc",
  },
];

export function TestimonialsSection() {
  const ref = useGSAPAnimation<HTMLElement>(() => {
    gsap.from(".testimonial-card", {
      y: 50,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: ".testimonials-grid",
        start: "top 75%",
        once: true,
      },
    });
  });

  return (
    <section
      ref={ref}
      id="testimonials"
      className="bg-background-soft py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="section-title text-foreground">
            Ce que disent nos clients
          </h2>
          <p className="lead-21 mt-4 text-foreground-muted">
            Des agences en Côte d&apos;Ivoire, au Sénégal, au Ghana et au Cameroun
            utilisent AtlasCRM au quotidien.
          </p>
        </div>

        <div className="testimonials-grid grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={t.author}
              className="testimonial-card flex flex-col rounded-[18px] border border-border-soft bg-surface p-6 md:p-8"
            >
              <div className="flex gap-1 text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                ))}
              </div>

              <blockquote className="body-17 mt-4 flex-1 text-foreground">
                “{t.quote}”
              </blockquote>

              <footer className="mt-6 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold text-white"
                  style={{ backgroundColor: t.avatarColor }}
                  aria-hidden
                >
                  {t.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-[14px] font-semibold tracking-tight text-foreground">
                    {t.author}
                  </div>
                  <div className="caption-14 text-foreground-muted">
                    {t.role}, {t.agency}
                  </div>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
