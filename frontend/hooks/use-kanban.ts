"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchKanban, moveDeal, type MoveDealPayload } from "@/lib/api/deals";
import type { KanbanColumn } from "@/types/api";
import { useAgencyId } from "./use-agency";

export function kanbanQueryKey(agencyId: number | null, pipelineId: number | null) {
  return ["kanban", agencyId, pipelineId] as const;
}

export function useKanban(pipelineId: number | null) {
  const agencyId = useAgencyId();

  return useQuery({
    queryKey: kanbanQueryKey(agencyId, pipelineId),
    queryFn: () => fetchKanban(agencyId!, pipelineId!),
    enabled: !!agencyId && !!pipelineId,
    staleTime: 30_000,
  });
}

interface MoveContext {
  previous?: KanbanColumn[];
}

/**
 * Optimistic move mutation — updates the local Kanban cache before
 * the backend confirms, then rolls back if the request fails.
 *
 * Why optimistic: a Kanban drag should feel instant. A 200ms latency
 * to the backend would otherwise make every card snap back briefly.
 */
export function useMoveDeal(pipelineId: number | null) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  const key = kanbanQueryKey(agencyId, pipelineId);

  return useMutation({
    mutationFn: ({ dealId, payload }: { dealId: number; payload: MoveDealPayload }) =>
      moveDeal(agencyId!, dealId, payload),

    onMutate: async ({ dealId, payload }): Promise<MoveContext> => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<KanbanColumn[]>(key);

      if (!previous) return { previous };

      // Build the next state: remove the deal from its current column,
      // insert it at the requested position in the target column.
      const next = previous.map((col) => ({ ...col, deals: [...col.deals] }));
      let removedDeal: (typeof previous)[number]["deals"][number] | undefined;

      for (const col of next) {
        const idx = col.deals.findIndex((d) => d.id === dealId);
        if (idx >= 0) {
          [removedDeal] = col.deals.splice(idx, 1);
          col.count = col.deals.length;
          col.totalAmount = col.deals.reduce((sum, d) => sum + d.amount, 0);
          break;
        }
      }

      if (!removedDeal) return { previous };

      const target = next.find((c) => c.stage.id === payload.stageId);
      if (target) {
        const updated = {
          ...removedDeal,
          stageId: target.stage.id,
          stageName: target.stage.name,
          stageColor: target.stage.color,
          lastActivityAt: new Date().toISOString(),
        };
        const insertIdx = Math.max(
          0,
          Math.min(payload.position, target.deals.length),
        );
        target.deals.splice(insertIdx, 0, updated);
        target.count = target.deals.length;
        target.totalAmount = target.deals.reduce((sum, d) => sum + d.amount, 0);
      }

      qc.setQueryData(key, next);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
