import { TrendingUp, Users, FileText, Banknote } from "lucide-react";
import { MockupFrame } from "./MockupFrame";

const kpis = [
  { label: "CA ce mois", value: "4 850 000", suffix: "XOF", trend: "+12%", icon: Banknote },
  { label: "Devis envoyés", value: "12", trend: "+3", icon: FileText },
  { label: "Clients actifs", value: "47", trend: "+5", icon: Users },
  { label: "Taux de conversion", value: "67", suffix: "%", trend: "+2pts", icon: TrendingUp },
];

/**
 * The hero mockup — a tiny dashboard with KPIs and a stylized chart.
 * Acts as the single product render under the hero headline.
 */
export function DashboardHeroMockup({ className }: { className?: string }) {
  return (
    <MockupFrame variant="browser" className={className}>
      <div className="flex h-[440px]">
        {/* Sidebar */}
        <div className="w-[140px] shrink-0 border-r border-border-soft bg-background-soft p-3">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-primary" />
            <div className="h-2.5 flex-1 rounded bg-foreground/15" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="mb-1.5 flex items-center gap-2 rounded-md px-2 py-1.5"
              style={{
                backgroundColor: i === 0 ? "var(--sidebar-active)" : undefined,
              }}
            >
              <div
                className="h-2 w-2 rounded"
                style={{
                  backgroundColor:
                    i === 0 ? "var(--primary)" : "var(--foreground-muted)",
                }}
              />
              <div
                className="h-2 flex-1 rounded"
                style={{
                  backgroundColor: i === 0 ? "var(--primary)" : "var(--foreground-muted)",
                  opacity: i === 0 ? 1 : 0.4,
                }}
              />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="mb-1 h-3 w-32 rounded bg-foreground/10" />
              <div className="h-2 w-24 rounded bg-foreground-subtle/40" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-32 rounded-full bg-background-muted" />
              <div className="h-6 w-6 rounded-full bg-background-muted" />
              <div className="h-6 w-6 rounded-full bg-primary/30" />
            </div>
          </div>

          {/* KPI grid */}
          <div className="mb-3 grid grid-cols-4 gap-2">
            {kpis.map((kpi, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-soft bg-surface p-2.5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <kpi.icon className="h-3 w-3 text-primary" />
                  <span className="rounded-full bg-success-bg px-1 py-0.5 text-[8px] font-medium text-success">
                    {kpi.trend}
                  </span>
                </div>
                <div className="text-[14px] font-semibold leading-tight tracking-tight text-foreground">
                  {kpi.value}
                  {kpi.suffix ? (
                    <span className="ml-0.5 text-[9px] font-medium text-foreground-muted">
                      {kpi.suffix}
                    </span>
                  ) : null}
                </div>
                <div className="text-[8px] text-foreground-subtle">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Chart card */}
          <div className="rounded-lg border border-border-soft bg-surface p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="h-2 w-24 rounded bg-foreground/15" />
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="h-2 w-2 rounded-full bg-success" />
              </div>
            </div>
            <ChartLines />
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}

function ChartLines() {
  // Two stylized polylines mimicking revenue trend.
  return (
    <svg viewBox="0 0 300 100" className="h-[110px] w-full">
      <defs>
        <linearGradient id="grad-primary" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,80 C40,60 60,30 100,40 C140,50 160,75 200,55 C240,35 270,25 300,18 L300,100 L0,100 Z"
        fill="url(#grad-primary)"
      />
      <path
        d="M0,80 C40,60 60,30 100,40 C140,50 160,75 200,55 C240,35 270,25 300,18"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
      />
      <path
        d="M0,90 C50,85 70,60 120,70 C170,80 200,55 250,48 L300,42"
        fill="none"
        stroke="var(--success)"
        strokeWidth="2"
        strokeDasharray="3 3"
      />
    </svg>
  );
}
