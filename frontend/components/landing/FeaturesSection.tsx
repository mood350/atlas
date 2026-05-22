import { FeatureTile } from "./FeatureTile";
import { KanbanMockup } from "./mockups/KanbanMockup";
import { QuotePdfMockup } from "./mockups/QuotePdfMockup";
import { PaymentMockup } from "./mockups/PaymentMockup";
import { PortalMockup } from "./mockups/PortalMockup";
import { CalendarMockup } from "./mockups/CalendarMockup";
import { AnalyticsMockup } from "./mockups/AnalyticsMockup";

/**
 * Six full-bleed feature tiles, alternating light and dark surfaces.
 * Each tile pairs a piece of explanatory copy with a stylized mockup
 * of the actual product UI.
 */
export function FeaturesSection() {
  return (
    <div id="features">
      <FeatureTile
        surface="light"
        eyebrow="Pipeline CRM"
        title="Votre pipeline commercial, enfin structuré."
        description="Kanban personnalisable, deals suivis en temps réel, relances automatiques quand un deal stagne. Plus jamais d'opportunité oubliée dans WhatsApp."
        bullets={[
          "Drag & drop entre étapes, mise à jour live pour toute l'équipe",
          "Relances automatiques après 48h sans activité",
          "Vue par responsable, par priorité, par client",
        ]}
        primaryCta={{ label: "En savoir plus", href: "#pricing" }}
        secondaryCta={{ label: "Essayer", href: "/register" }}
        mockup={<KanbanMockup />}
      />

      <FeatureTile
        surface="dark"
        reverse
        eyebrow="Devis professionnels"
        title="Des devis pro en 2 minutes chrono."
        description="Templates conformes au droit OHADA, génération PDF instantanée, suivi d'ouverture par le client, signature en ligne. Le devis qui n'attend pas."
        bullets={[
          "Numérotation OHADA automatique (DEV-2025-NNNNN)",
          "Notification dès que le client ouvre le PDF",
          "Acceptation en ligne sans compte requis",
        ]}
        primaryCta={{ label: "En savoir plus", href: "#pricing" }}
        secondaryCta={{ label: "Voir un exemple", href: "/devis-exemple" }}
        mockup={<QuotePdfMockup />}
      />

      <FeatureTile
        surface="parchment"
        eyebrow="Paiements Mobile Money"
        title="FedaPay et PayDunya, intégrés nativement."
        description="Vos clients règlent en Orange Money, MTN MoMo, Wave ou Moov. La réconciliation se fait toute seule, l'acompte arrive le jour de la signature."
        bullets={[
          "10+ opérateurs Mobile Money supportés (XOF, XAF)",
          "Webhooks sécurisés avec idempotency keys",
          "Réconciliation automatique vers la facture",
        ]}
        primaryCta={{ label: "En savoir plus", href: "#pricing" }}
        secondaryCta={{ label: "Voir les opérateurs", href: "/mobile-money" }}
        mockup={<PaymentMockup />}
      />

      <FeatureTile
        surface="dark"
        reverse
        eyebrow="Portail client"
        title="Un portail client qui impressionne."
        description="Vos clients suivent l'avancement de leur projet en temps réel et valident les livrables depuis leur téléphone. Moins de questions, plus de confiance."
        bullets={[
          "Vue projet en lecture seule, sans création de compte",
          "Validation de livrables en un clic",
          "Branding personnalisé aux couleurs de votre agence",
        ]}
        primaryCta={{ label: "En savoir plus", href: "#pricing" }}
        secondaryCta={{ label: "Démo portail", href: "/portal-demo" }}
        mockup={<PortalMockup />}
      />

      <FeatureTile
        surface="light"
        eyebrow="Rendez-vous"
        title="Votre agenda, synchronisé automatiquement."
        description="Page de booking publique, rappels SMS et email avant chaque réunion, compte rendu structuré après. Synchronisé avec Google Calendar."
        bullets={[
          "Synchronisation Google Calendar bidirectionnelle",
          "Rappels SMS 24h et 1h avant le rendez-vous",
          "Compte rendu lié au deal du client",
        ]}
        primaryCta={{ label: "En savoir plus", href: "#pricing" }}
        secondaryCta={{ label: "Tester le booking", href: "/booking-demo" }}
        mockup={<CalendarMockup />}
      />

      <FeatureTile
        surface="dark"
        reverse
        eyebrow="Analytics"
        title="Vos chiffres, enfin lisibles."
        description="Taux de conversion, MRR, délai de paiement moyen, projets en retard. Prenez vos décisions sur des données — plus à l'instinct."
        bullets={[
          "Tableau de bord personnalisable par rôle",
          "Export CSV pour votre comptable",
          "Alertes automatiques sur les KPIs critiques",
        ]}
        primaryCta={{ label: "En savoir plus", href: "#pricing" }}
        secondaryCta={{ label: "Voir un dashboard", href: "/analytics-demo" }}
        mockup={<AnalyticsMockup />}
      />
    </div>
  );
}
