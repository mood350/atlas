"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Clock } from "lucide-react";
import type { Deal, KanbanColumn } from "@/types/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/app/shared/PriorityBadge";
import { RelativeTime } from "@/components/app/shared/RelativeTime";
import { EmptyState } from "@/components/app/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "title" | "client" | "stage" | "amount" | "priority" | "owner" | "closeDate" | "activity";
type SortDir = "asc" | "desc";

interface DealsListViewProps {
  columns: KanbanColumn[];
  onSelectDeal: (deal: Deal) => void;
}

const PRIORITY_RANK: Record<Deal["priority"], number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  URGENT: 3,
};

function ownerInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export function DealsListView({ columns, onSelectDeal }: DealsListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("activity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const allDeals = useMemo(() => columns.flatMap((c) => c.deals), [columns]);

  const sorted = useMemo(() => {
    const list = [...allDeals];
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "title":
          return a.title.localeCompare(b.title, "fr") * dir;
        case "client":
          return a.clientName.localeCompare(b.clientName, "fr") * dir;
        case "stage":
          return a.stageName.localeCompare(b.stageName, "fr") * dir;
        case "amount":
          return (a.amount - b.amount) * dir;
        case "priority":
          return (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * dir;
        case "owner":
          return (a.ownerName ?? "").localeCompare(b.ownerName ?? "", "fr") * dir;
        case "closeDate":
          return ((a.expectedCloseDate ?? "") > (b.expectedCloseDate ?? "") ? 1 : -1) * dir;
        case "activity":
          return ((a.lastActivityAt ?? "") > (b.lastActivityAt ?? "") ? 1 : -1) * dir;
        default:
          return 0;
      }
    });
    return list;
  }, [allDeals, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "amount" || key === "priority" || key === "activity" ? "desc" : "asc");
    }
  }

  if (allDeals.length === 0) {
    return (
      <EmptyState
        title="Aucun deal"
        description="Aucun deal ne correspond aux filtres en cours."
      />
    );
  }

  const totalAmount = allDeals.reduce((s, d) => s + d.amount, 0);
  const currency = allDeals[0]?.currency ?? "XOF";

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between text-[13px] text-foreground-muted">
        <span>
          {allDeals.length} deal{allDeals.length > 1 ? "s" : ""}
        </span>
        <span>
          Total :{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(totalAmount, currency)}
          </span>
        </span>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-background-muted">
            <tr className="border-b border-border">
              <SortHeader label="Deal"      k="title"     sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Client"    k="client"    sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Étape"     k="stage"     sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Montant"   k="amount"    sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
              <SortHeader label="Priorité"  k="priority"  sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Owner"     k="owner"     sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Clôture"   k="closeDate" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Activité"  k="activity"  sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((deal) => (
              <tr
                key={deal.id}
                onClick={() => onSelectDeal(deal)}
                className="cursor-pointer transition-colors hover:bg-background-muted"
              >
                <td className="px-4 py-3">
                  <p className="line-clamp-1 font-medium text-foreground">{deal.title}</p>
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  <span className="line-clamp-1">{deal.clientName}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-background-muted px-2 py-0.5 text-[12px]">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: deal.stageColor }}
                      aria-hidden
                    />
                    <span className="text-foreground-muted">{deal.stageName}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                  {formatCurrency(deal.amount, deal.currency)}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={deal.priority} />
                </td>
                <td className="px-4 py-3">
                  {deal.ownerName ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        {deal.ownerAvatarUrl ? <AvatarImage src={deal.ownerAvatarUrl} alt="" /> : null}
                        <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                          {ownerInitials(deal.ownerName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="line-clamp-1 text-foreground-muted">{deal.ownerName}</span>
                    </div>
                  ) : (
                    <span className="text-foreground-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate, "dd MMM yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-[12px] text-foreground-muted">
                    <Clock className="h-3 w-3" />
                    <RelativeTime date={deal.lastActivityAt} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SortHeaderProps {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}

function SortHeader({ label, k, sortKey, sortDir, onClick, align = "left" }: SortHeaderProps) {
  const active = sortKey === k;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      className={cn(
        "px-4 py-3 font-medium text-foreground-muted",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        onClick={() => onClick(k)}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        <span>{label}</span>
        <Icon className={cn("h-3 w-3", active ? "opacity-100" : "opacity-40")} />
      </button>
    </th>
  );
}
