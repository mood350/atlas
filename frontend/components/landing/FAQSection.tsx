"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "AtlasCRM fonctionne-t-il en Afrique de l'Ouest ?",
    a: "Oui, AtlasCRM est conçu pour les agences de l'UEMOA et de la CEMAC. La devise par défaut est le XOF, et les modèles de devis et factures suivent les exigences OHADA (numérotation séquentielle, mentions obligatoires, RCCM, IFU).",
  },
  {
    q: "Quels opérateurs Mobile Money sont supportés ?",
    a: "Via FedaPay : Orange Money, MTN MoMo, Moov Money, Wave, T-Money. Via PayDunya : tous les opérateurs précédents plus Carte Bancaire et Free Money. Le webhook signe chaque transaction et la réconciliation se fait automatiquement.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Toutes les données sont chiffrées au repos (AES-256) et en transit (TLS 1.3). Les sauvegardes sont quotidiennes et conservées 30 jours. L'authentification est protégée par JWT à courte durée et tokens de rafraîchissement révocables.",
  },
  {
    q: "Puis-je importer mes clients existants ?",
    a: "Oui — un import CSV est disponible dès le plan Free. Pour les agences sur le plan Pro, notre équipe peut accompagner la migration depuis HubSpot, Pipedrive ou un fichier Excel.",
  },
  {
    q: "Y a-t-il une application mobile ?",
    a: "L'interface est responsive et fonctionne parfaitement sur mobile. Une PWA installable est disponible. Une app native iOS et Android est prévue pour le 2e trimestre 2026.",
  },
  {
    q: "Le devis est-il conforme au droit OHADA ?",
    a: "Oui — numérotation séquentielle annuelle, mentions obligatoires (RCCM, IFU, raison sociale), conditions de paiement, signature électronique et conservation 10 ans. Les factures suivent les mêmes règles.",
  },
  {
    q: "Puis-je personnaliser les templates de devis ?",
    a: "Oui — logo, couleurs principales, conditions générales, mentions de bas de page, signature. Le plan Pro permet aussi d'envoyer depuis votre propre nom de domaine (devis@votreagence.ci).",
  },
  {
    q: "Comment fonctionne le portail client ?",
    a: "Chaque projet a un lien unique et signé que vous pouvez partager avec votre client. Pas de création de compte requise. Le client voit l'avancement, valide les livrables et peut payer en Mobile Money directement depuis le portail.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="bg-background-soft py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="mb-10 text-center">
          <h2 className="section-title text-foreground">Questions fréquentes</h2>
          <p className="lead-21 mt-4 text-foreground-muted">
            Une question qui n&apos;est pas listée ? Écrivez-nous à
            hello@atlascrm.com.
          </p>
        </div>

        <Accordion multiple={false} className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              className="border-b border-border-soft"
            >
              <AccordionTrigger className="text-left text-[16px] font-semibold text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-foreground-muted">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
