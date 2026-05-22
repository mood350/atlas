"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deal, KanbanColumn as KColumn } from "@/types/api";
import { DealCard } from "./DealCard";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: KColumn;
  onSelectDeal?: (deal: Deal) => void;
  onAddDeal?: (stageId: number) => void;
}

/**
 * One pipeline stage rendered as a vertical list of deal cards.
 * The body is droppable so cards can be dropped between or below cards
 * (and into empty columns).
 */
export function KanbanColumn({
  column,
  onSelectDeal,
  onAddDeal,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.stage.id}`,
    data: { type: "column", stageId: column.stage.id },
  });

  const dealIds = column.deals.map((d) => d.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-[14px] border border-border-soft bg-background-soft p-2.5 transition-colors",
        isOver && "border-primary/40 bg-primary/5",
      )}
    >
      {/* Header — stage indicator + count + total amount */}
      <header className="mb-2 flex items-start gap-2 px-1.5 pt-1">
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: column.stage.color || "var(--primary)" }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-[13px] font-semibold uppercase tracking-wide text-foreground">
              {column.stage.name}
            </h2>
            <span className="text-[12px] font-medium text-foreground-muted">
              {column.count}
            </span>
          </div>
          <p className="caption-14 truncate text-foreground-subtle">
            {formatCurrency(column.totalAmount, column.deals[0]?.currency ?? "XOF")}
          </p>
        </div>
      </header>

      {/* Sortable deal list */}
      <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 overflow-y-auto pb-1">
          {column.deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onSelect={onSelectDeal} />
          ))}

          {column.deals.length === 0 ? (
            <div className="rounded-md border border-dashed border-border-soft bg-surface/40 p-6 text-center">
              <p className="caption-14 text-foreground-subtle">
                Aucun deal à cette étape
              </p>
            </div>
          ) : null}
        </div>
      </SortableContext>

      {/* Footer — add a deal at this stage */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full justify-start gap-2 text-foreground-muted"
        onClick={() => onAddDeal?.(column.stage.id)}
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter un deal
      </Button>
    </div>
  );
}
