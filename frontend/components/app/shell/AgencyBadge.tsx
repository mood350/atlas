"use client";

import { ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import type { AgencyPlan } from "@/types/api";

const planLabels: Record<AgencyPlan, string> = {
  FREE: "Gratuit",
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Entreprise",
};

const planClasses: Record<AgencyPlan, string> = {
  FREE: "bg-background-muted text-foreground-muted",
  STARTER: "bg-info-bg text-info",
  PRO: "bg-success-bg text-success",
  ENTERPRISE: "bg-warning-bg text-warning",
};

const fallbackPlanClass = "bg-background-muted text-foreground-muted";

/**
 * Compact agency identity in the sidebar. Renders the agency name,
 * the active plan, and a chevron — clicking will eventually open an
 * agency-switcher dropdown (multi-agency support, post-Phase 2).
 */
export function AgencyBadge() {
  const agency = useAuthStore((s) => s.agency);

  if (!agency) {
    return (
      <div className="rounded-md bg-background-muted px-3 py-2.5">
        <div className="h-3 w-24 animate-pulse rounded bg-foreground/10" />
        <div className="mt-1.5 h-2.5 w-16 animate-pulse rounded bg-foreground/5" />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="group/agency flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-sidebar-hover"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[12px] font-semibold text-primary"
        aria-hidden
      >
        {agency.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {agency.name}
          </span>
        </div>
        {agency.plan ? (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] font-medium leading-none",
                planClasses[agency.plan] ?? fallbackPlanClass,
              )}
            >
              {planLabels[agency.plan] ?? "Plan"}
            </span>
          </div>
        ) : null}
      </div>
      <ChevronDown
        className="h-3.5 w-3.5 shrink-0 text-foreground-subtle transition-transform group-hover/agency:text-foreground"
        aria-hidden
      />
    </button>
  );
}
