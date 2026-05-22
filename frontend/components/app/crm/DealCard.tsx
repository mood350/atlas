"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Clock, GripVertical } from "lucide-react";
import type { Deal } from "@/types/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityBadge, priorityBorderClass } from "@/components/app/shared/PriorityBadge";
import { RelativeTime } from "@/components/app/shared/RelativeTime";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { daysSince } from "@/lib/format";

interface DealCardProps {
  deal: Deal;
  onSelect?: (deal: Deal) => void;
  /** When true, the card is rendered inside the DragOverlay (no listeners). */
  isOverlay?: boolean;
}

function ownerInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export function DealCard({ deal, onSelect, isOverlay = false }: DealCardProps) {
  const sortable = useSortable({
    id: deal.id,
    data: { type: "deal", stageId: deal.stageId },
    disabled: isOverlay,
  });

  const inactive = daysSince(deal.lastActivityAt) >= 3;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging && !isOverlay ? 0.4 : 1,
  };

  function handleClick(e: React.MouseEvent) {
    // Avoid opening the sheet when finishing a drag.
    if (sortable.isDragging) return;
    e.stopPropagation();
    onSelect?.(deal);
  }

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        "group/card relative cursor-grab rounded-[12px] border border-border-soft bg-surface p-3 pl-3.5 transition-shadow",
        "border-l-[3px]",
        priorityBorderClass(deal.priority),
        !isOverlay && "hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_10px_rgba(0,0,0,0.4)]",
        isOverlay && "shadow-[0_8px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.5)] cursor-grabbing rotate-[1.5deg]",
      )}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : -1}
      aria-label={`Deal ${deal.title} avec ${deal.clientName}`}
    >
      {/* Drag handle — covers the card surface */}
      {!isOverlay ? (
        <div
          {...sortable.attributes}
          {...sortable.listeners}
          className="absolute inset-0 z-0"
          aria-hidden
        />
      ) : null}

      <div className="relative z-10 space-y-2 pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground">
            {deal.title}
          </h3>
          <GripVertical
            className="h-3.5 w-3.5 shrink-0 text-foreground-subtle opacity-0 transition-opacity group-hover/card:opacity-100"
            aria-hidden
          />
        </div>

        <p className="caption-14 truncate text-foreground-muted">
          {deal.clientName}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-semibold tracking-tight text-foreground">
            {formatCurrency(deal.amount, deal.currency)}
          </span>
          <PriorityBadge priority={deal.priority} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {deal.ownerName ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                {deal.ownerAvatarUrl ? (
                  <AvatarImage src={deal.ownerAvatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                  {ownerInitials(deal.ownerName)}
                </AvatarFallback>
              </Avatar>
              <span className="caption-14 truncate text-foreground-subtle">
                {deal.ownerName}
              </span>
            </div>
          ) : (
            <span className="caption-14 text-foreground-subtle">Non assigné</span>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              inactive
                ? "bg-danger-bg text-danger"
                : "bg-background-muted text-foreground-muted",
            )}
            title={`Dernière activité ${new Date(deal.lastActivityAt).toLocaleString(
              "fr-FR",
            )}`}
          >
            <Clock className="h-2.5 w-2.5" />
            <RelativeTime date={deal.lastActivityAt} />
          </span>
        </div>
      </div>
    </div>
  );
}
