import { MockupFrame } from "./MockupFrame";

const lines = [
  { label: "Conception UX/UI — refonte vitrine", qty: 1, unit: "forfait", price: "1 200 000" },
  { label: "Développement front-end (Next.js)", qty: 1, unit: "forfait", price: "1 800 000" },
  { label: "Intégration CMS Strapi", qty: 1, unit: "forfait", price: "650 000" },
  { label: "Hébergement & CDN — 12 mois", qty: 12, unit: "mois", price: "45 000" },
];

export function QuotePdfMockup({ className }: { className?: string }) {
  return (
    <MockupFrame variant="card" className={className}>
      <div className="bg-white p-7 text-[#1d1d1f]">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#0066cc]">
              Devis
            </div>
            <div className="text-[18px] font-semibold leading-tight tracking-tight">
              DEV-2025-00042
            </div>
            <div className="mt-1 text-[10px] text-[#6e6e73]">
              Émis le 12 mai 2025 — valable 30 jours
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 h-5 w-5 rounded-full bg-[#0066cc]" />
            <div className="text-[10px] font-semibold">Digital Agency</div>
            <div className="text-[9px] text-[#6e6e73]">Abidjan, CI</div>
          </div>
        </div>

        {/* Client */}
        <div className="mb-5 rounded-md bg-[#f5f5f7] p-3">
          <div className="text-[9px] font-semibold uppercase tracking-wide text-[#6e6e73]">
            Adressé à
          </div>
          <div className="mt-0.5 text-[11px] font-semibold">Yaoundé Tech SARL</div>
          <div className="text-[10px] text-[#6e6e73]">Rue de la Réunification, Yaoundé</div>
        </div>

        {/* Lines */}
        <div className="mb-3 grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[8px] font-semibold uppercase tracking-wide text-[#6e6e73]">
          <span>Désignation</span>
          <span>Qté</span>
          <span>P.U.</span>
          <span>Total</span>
        </div>
        <div className="space-y-1.5">
          {lines.map((line, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-2 rounded bg-[#fafafc] px-2 py-1.5 text-[10px]"
            >
              <span className="truncate">{line.label}</span>
              <span className="text-[#6e6e73]">{line.qty}</span>
              <span className="text-[#6e6e73]">{line.price}</span>
              <span className="font-semibold">{line.price}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <div className="w-44 space-y-1 text-[10px]">
            <Row label="Sous-total HT" value="4 190 000" />
            <Row label="TVA 18%" value="754 200" />
            <Row label="Total TTC" value="4 944 200 XOF" emphasis />
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        borderTop: emphasis ? "1px solid #e0e0e0" : undefined,
        paddingTop: emphasis ? 6 : 0,
        marginTop: emphasis ? 4 : 0,
        fontWeight: emphasis ? 600 : 400,
        color: emphasis ? "#1d1d1f" : "#6e6e73",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
