"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPipelines,
  createPipeline,
  createStage,
  type CreatePipelinePayload,
  type CreateStagePayload,
} from "@/lib/api/pipeline";
import { useAgencyId } from "./use-agency";
import { requireAgencyId } from "./use-agency";

export function usePipelines() {
  const agencyId = useAgencyId();

  return useQuery({
    queryKey: ["pipelines", agencyId],
    queryFn: () => listPipelines(agencyId!),
    enabled: !!agencyId,
    staleTime: 5 * 60_000,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePipelinePayload) => {
      const agencyId = requireAgencyId();
      return createPipeline(agencyId, payload);
    },
    onSuccess: (_, __, _ctx) => {
      const agencyId = requireAgencyId();
      queryClient.invalidateQueries({ queryKey: ["pipelines", agencyId] });
    },
  });
}

export function useCreateStage(pipelineId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStagePayload) => {
      const agencyId = requireAgencyId();
      if (pipelineId === null) throw new Error("Aucun pipeline sélectionné");
      return createStage(agencyId, pipelineId, payload);
    },
    onSuccess: () => {
      const agencyId = requireAgencyId();
      queryClient.invalidateQueries({ queryKey: ["pipelines", agencyId] });
      queryClient.invalidateQueries({ queryKey: ["kanban", agencyId, pipelineId] });
    },
  });
}
