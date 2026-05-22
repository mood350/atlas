"use client";

import { ChevronDown, Filter, Kanban, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Pipeline } from "@/types/api";
import { cn } from "@/lib/utils";

export type DealFilter = "all" | "mine" | "urgent";
export type ViewMode = "kanban" | "list";

interface PipelineHeaderProps {
  pipelines: Pipeline[];
  activePipelineId: number | null;
  onChangePipeline: (id: number) => void;
  filter: DealFilter;
  onChangeFilter: (filter: DealFilter) => void;
  view: ViewMode;
  onChangeView: (view: ViewMode) => void;
  onCreateDeal: () => void;
  onCreatePipeline?: () => void;
}

const filterLabels: Record<DealFilter, string> = {
  all: "Tous les deals",
  mine: "Mes deals",
  urgent: "Urgents seulement",
};

export function PipelineHeader({
  pipelines,
  activePipelineId,
  onChangePipeline,
  filter,
  onChangeFilter,
  view,
  onChangeView,
  onCreateDeal,
  onCreatePipeline,
}: PipelineHeaderProps) {
  const activePipeline = pipelines.find((p) => p.id === activePipelineId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Pipeline selector */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-2 text-[15px] font-semibold transition-colors",
            "hover:bg-background-muted",
          )}
        >
          {activePipeline?.name ?? "Sélectionner un pipeline"}
          <ChevronDown className="h-4 w-4 text-foreground-muted" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          <DropdownMenuLabel>Pipelines</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {pipelines.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={() => onChangePipeline(p.id)}
              aria-current={p.id === activePipelineId}
            >
              {p.name}
              {p.isDefault ? (
                <span className="ml-auto text-[11px] text-foreground-subtle">
                  Par défaut
                </span>
              ) : null}
            </DropdownMenuItem>
          ))}
          {pipelines.length === 0 ? (
            <div className="px-2 py-3 text-center caption-14 text-foreground-muted">
              Aucun pipeline
            </div>
          ) : null}
          {onCreatePipeline ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCreatePipeline}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Nouveau pipeline
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right cluster — filter + view toggle + new deal */}
      <div className="flex items-center gap-2">
        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[13px] text-foreground-muted transition-colors",
              "hover:bg-background-muted hover:text-foreground",
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            {filterLabels[filter]}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            {(Object.keys(filterLabels) as DealFilter[]).map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onChangeFilter(key)}
                aria-current={filter === key}
              >
                {filterLabels[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle */}
        <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
          <button
            type="button"
            onClick={() => onChangeView("kanban")}
            aria-pressed={view === "kanban"}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors",
              view === "kanban"
                ? "bg-primary text-primary-foreground"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            <Kanban className="h-3.5 w-3.5" />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => onChangeView("list")}
            aria-pressed={view === "list"}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            <List className="h-3.5 w-3.5" />
            Liste
          </button>
        </div>

        <Button
          onClick={onCreateDeal}
          className="rounded-full active:scale-95 transition-transform"
        >
          <Plus className="mr-1 h-4 w-4" />
          Nouveau deal
        </Button>
      </div>
    </div>
  );
}
