"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import type { Deal, KanbanColumn as KColumn } from "@/types/api";
import { useMoveDeal } from "@/hooks/use-kanban";
import { extractErrorMessage } from "@/lib/axios";
import { DealCard } from "./DealCard";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  pipelineId: number;
  columns: KColumn[];
  onSelectDeal?: (deal: Deal) => void;
  onAddDeal?: (stageId: number) => void;
}

/**
 * Top-level Kanban — wires DnD context, sensors, and the optimistic
 * move mutation. Cross-column moves call the backend; in-column
 * reorders also persist a position update.
 */
export function KanbanBoard({
  pipelineId,
  columns,
  onSelectDeal,
  onAddDeal,
}: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const moveMutation = useMoveDeal(pipelineId);

  const sensors = useSensors(
    // 6px before activating — gives Click a chance to win on simple taps.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function findDeal(id: number): { deal: Deal; column: KColumn } | null {
    for (const column of columns) {
      const deal = column.deals.find((d) => d.id === id);
      if (deal) return { deal, column };
    }
    return null;
  }

  function handleDragStart(e: DragStartEvent) {
    const id = e.active.id;
    if (typeof id !== "number") return;
    const found = findDeal(id);
    if (found) setActiveDeal(found.deal);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id;
    if (typeof activeId !== "number") return;
    const found = findDeal(activeId);
    if (!found) return;

    // Resolve the target stage from either an over-card or an over-column.
    const overData = over.data.current as
      | { type: "deal"; stageId: number }
      | { type: "column"; stageId: number }
      | undefined;
    if (!overData) return;

    let targetStageId = overData.stageId;
    let targetPosition = 0;

    const targetColumn = columns.find((c) => c.stage.id === targetStageId);
    if (!targetColumn) return;

    if (overData.type === "deal") {
      const overIdx = targetColumn.deals.findIndex((d) => d.id === over.id);
      targetPosition = overIdx >= 0 ? overIdx : targetColumn.deals.length;
    } else {
      // Dropped on the column body itself — append to the end.
      targetPosition = targetColumn.deals.length;
    }

    // No-op when dropped on its current slot.
    const sourceColumn = found.column;
    const sourceIdx = sourceColumn.deals.findIndex((d) => d.id === activeId);
    if (sourceColumn.stage.id === targetStageId && sourceIdx === targetPosition) {
      return;
    }

    moveMutation.mutate(
      { dealId: activeId, payload: { stageId: targetStageId, position: targetPosition } },
      {
        onError: (err) => {
          toast.error(extractErrorMessage(err));
        },
      },
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDeal(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.stage.id}
            column={column}
            onSelectDeal={onSelectDeal}
            onAddDeal={onAddDeal}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDeal ? <DealCard deal={activeDeal} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
