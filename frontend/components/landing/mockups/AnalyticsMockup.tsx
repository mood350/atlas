import { ArrowUpRight } from "lucide-react";
import { MockupFrame } from "./MockupFrame";

const stats = [
  { label: "MRR", value: "1 280 000", suffix: "XOF", trend: "+18%" },
  { label: "Conversion", value: "67", suffix: "%", trend: "+5pts" },
  { label: "Délai paiement", value: "9", suffix: "jours", trend: "-3j" },
];

export function AnalyticsMockup({ className }: { className?: string }) {
  return (
    <MockupFrame variant="browser" className={className}>
      <div className="grid h-[420px] grid-cols-[1fr_220px] gap-3 p-3">
        {/* Main chart */}
        <div className="rounded-lg border border-border-soft bg-surface p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="caption-14 text-foreground-subtle">
                Chiffre d&apos;affaires
              </div>
              <div className="text-[16px] font-semibold tracking-tight">
                4 850 000 XOF
              </div>
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-success-bg px-1.5 py-0.5 text-[9px] font-semibold text-success">
              <ArrowUpRight className="h-2.5 w-2.5" />
              +12%
            </span>
          </div>
          <ChartBars />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-border-soft bg-background-soft p-3">
            <div className="caption-14 mb-2 font-semibold text-foreground-subtle">
              Répartition deals
            </div>
            <Donut />
          </div>
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-md border border-border-soft bg-surface p-2"
            >
              <div className="text-[8px] uppercase tracking-wide text-foreground-subtle">
                {stat.label}
              </div>
              <div className="mt-0.5 flex items-baseline justify-between">
                <span className="text-[12px] font-semibold tracking-tight text-foreground">
                  {stat.value}
                  <span className="ml-0.5 text-[8px] font-medium text-foreground-muted">
                    {stat.suffix}
                  </span>
                </span>
                <span className="text-[8px] font-medium text-success">
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}

function ChartBars() {
  // Stylized bar chart, 12 months.
  const heights = [25, 35, 28, 45, 38, 52, 48, 60, 55, 72, 68, 82];
  return (
    <div className="flex h-[280px] items-end justify-between gap-1.5">
      {heights.map((h, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm bg-primary/20"
            style={{ height: `${h * 0.65}%` }}
          />
          <div
            className="w-full rounded-sm bg-primary"
            style={{ height: `${h}%`, marginTop: "-100%" }}
          />
          <span className="text-[7px] uppercase text-foreground-subtle">
            {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function Donut() {
  return (
    <div className="relative mx-auto h-20 w-20">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--background-muted)"
          strokeWidth="14"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="14"
          strokeDasharray="170 251"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--success)"
          strokeWidth="14"
          strokeDasharray="50 251"
          strokeDashoffset="-170"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold tracking-tight">12</span>
      </div>
    </div>
  );
}
