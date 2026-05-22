import { Check, Clock, FileText } from "lucide-react";
import { MockupFrame } from "./MockupFrame";

const milestones = [
  { label: "Cahier des charges", state: "done" as const },
  { label: "Maquettes UX/UI", state: "done" as const },
  { label: "Développement front-end", state: "active" as const },
  { label: "Intégration CMS", state: "pending" as const },
  { label: "Mise en ligne", state: "pending" as const },
];

export function PortalMockup({ className }: { className?: string }) {
  return (
    <MockupFrame variant="browser" className={className}>
      <div className="flex h-[420px] flex-col bg-background-soft p-4 text-foreground">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between rounded-lg bg-surface p-3">
          <div>
            <div className="caption-14 text-foreground-subtle">Projet</div>
            <div className="text-[14px] font-semibold tracking-tight">
              Refonte vitrine Yaoundé Tech
            </div>
          </div>
          <div className="text-right">
            <div className="caption-14 text-foreground-subtle">Avancement</div>
            <div className="text-[14px] font-semibold text-success">62%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-background-muted">
          <div
            className="h-full rounded-full bg-success"
            style={{ width: "62%" }}
          />
        </div>

        {/* Milestones */}
        <div className="mb-4 space-y-1.5">
          <div className="caption-14 font-semibold text-foreground-subtle">
            Étapes
          </div>
          {milestones.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md bg-surface px-3 py-2"
            >
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    m.state === "done"
                      ? "var(--success)"
                      : m.state === "active"
                      ? "var(--primary)"
                      : "var(--background-muted)",
                  color: m.state === "pending" ? "var(--foreground-subtle)" : "white",
                }}
              >
                {m.state === "done" ? (
                  <Check className="h-3 w-3" />
                ) : m.state === "active" ? (
                  <Clock className="h-3 w-3" />
                ) : (
                  <span className="text-[8px]">{i + 1}</span>
                )}
              </div>
              <span
                className={
                  m.state === "pending"
                    ? "text-[11px] text-foreground-subtle"
                    : "text-[11px] font-medium text-foreground"
                }
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {/* Latest deliverable */}
        <div className="mt-auto rounded-lg border border-border-soft bg-surface p-3">
          <div className="caption-14 mb-1 font-semibold text-foreground-subtle">
            Dernier livrable
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-medium">
                Maquettes-finales-v3.fig
              </div>
              <div className="text-[9px] text-foreground-subtle">
                À valider — déposé hier
              </div>
            </div>
            <button className="rounded-full bg-primary px-2.5 py-1 text-[9px] font-semibold text-primary-foreground">
              Valider
            </button>
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}
