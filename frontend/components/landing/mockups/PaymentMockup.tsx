import { Check } from "lucide-react";
import { MockupFrame } from "./MockupFrame";

const operators = [
  { name: "Orange Money", color: "#ff7900", initial: "OM", selected: true },
  { name: "MTN MoMo", color: "#ffcc00", initial: "MTN", selected: false },
  { name: "Wave", color: "#1dc8e9", initial: "W", selected: false },
  { name: "Moov", color: "#1d4ed8", initial: "MV", selected: false },
];

export function PaymentMockup({ className }: { className?: string }) {
  return (
    <MockupFrame variant="phone" className={className}>
      <div className="flex h-full flex-col bg-surface p-4 text-foreground">
        <div className="mb-3 text-center">
          <div className="caption-14 text-foreground-subtle">Paiement sécurisé</div>
          <div className="text-[18px] font-semibold tracking-tight">
            Yaoundé Tech
          </div>
        </div>

        <div className="rounded-xl bg-background-soft p-4 text-center">
          <div className="caption-14 text-foreground-muted">Montant à régler</div>
          <div className="mt-1 text-[24px] font-semibold tracking-tight">
            850 000
            <span className="ml-1 text-[12px] font-medium text-foreground-muted">
              XOF
            </span>
          </div>
          <div className="mt-1 text-[10px] text-foreground-subtle">
            Acompte 30% — DEV-2025-00042
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="caption-14 mb-1 font-semibold text-foreground">
            Choisissez votre opérateur
          </div>
          {operators.map((op) => (
            <div
              key={op.name}
              className="flex items-center gap-2 rounded-lg border bg-surface px-2 py-2"
              style={{
                borderColor: op.selected ? "var(--primary)" : "var(--border)",
                backgroundColor: op.selected ? "var(--accent)" : undefined,
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                style={{ backgroundColor: op.color }}
              >
                {op.initial}
              </div>
              <span className="flex-1 text-[11px] font-medium">{op.name}</span>
              {op.selected ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-border" />
              )}
            </div>
          ))}
        </div>

        <button className="mt-auto rounded-full bg-primary py-2.5 text-[12px] font-semibold text-primary-foreground">
          Confirmer le paiement
        </button>
      </div>
    </MockupFrame>
  );
}
