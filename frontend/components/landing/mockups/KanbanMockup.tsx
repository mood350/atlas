import { MockupFrame } from "./MockupFrame";
import { cn } from "@/lib/utils";

interface DealCard {
  client: string;
  title: string;
  amount: string;
  priority: "low" | "medium" | "high" | "urgent";
}

const columns: { name: string; color: string; deals: DealCard[]; total: string }[] = [
  {
    name: "Prospect",
    color: "var(--foreground-subtle)",
    total: "2 400 000",
    deals: [
      { client: "Yaoundé Tech", title: "Refonte vitrine", amount: "850 000 XOF", priority: "high" },
      { client: "Bamako Web", title: "Audit SEO", amount: "320 000 XOF", priority: "low" },
    ],
  },
  {
    name: "En négo.",
    color: "var(--info)",
    total: "5 100 000",
    deals: [
      { client: "Dakar Studio", title: "Plateforme e-commerce", amount: "3 200 000 XOF", priority: "urgent" },
      { client: "Lomé Digital", title: "App mobile", amount: "1 900 000 XOF", priority: "medium" },
    ],
  },
  {
    name: "Gagné",
    color: "var(--success)",
    total: "3 750 000",
    deals: [
      { client: "Abidjan Pro", title: "Site institutionnel", amount: "2 250 000 XOF", priority: "medium" },
      { client: "Cotonou Co", title: "Branding", amount: "1 500 000 XOF", priority: "low" },
    ],
  },
];

const priorityColor: Record<DealCard["priority"], string> = {
  low: "var(--foreground-subtle)",
  medium: "var(--info)",
  high: "var(--warning)",
  urgent: "var(--danger)",
};

export function KanbanMockup({ className }: { className?: string }) {
  return (
    <MockupFrame variant="browser" className={className}>
      <div className="flex gap-2 overflow-hidden p-3">
        {columns.map((col) => (
          <div
            key={col.name}
            className="flex w-[150px] shrink-0 flex-col rounded-lg border border-border-soft bg-background-soft p-2"
          >
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: col.color }}
              />
              <div className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
                {col.name}
              </div>
              <div className="ml-auto text-[10px] font-medium text-foreground-muted">
                {col.deals.length}
              </div>
            </div>
            <div className="mb-2 px-1 text-[9px] text-foreground-subtle">
              {col.total} XOF
            </div>
            <div className="flex flex-col gap-1.5">
              {col.deals.map((deal, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded border border-border-soft border-l-[3px] bg-surface p-2",
                  )}
                  style={{ borderLeftColor: priorityColor[deal.priority] }}
                >
                  <div className="text-[10px] font-semibold leading-tight text-foreground">
                    {deal.title}
                  </div>
                  <div className="mt-0.5 text-[9px] text-foreground-muted">
                    {deal.client}
                  </div>
                  <div className="mt-1.5 text-[10px] font-semibold text-foreground">
                    {deal.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}
