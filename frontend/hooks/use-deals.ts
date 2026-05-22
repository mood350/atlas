"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDeal,
  getDeal,
  markDealLost,
  markDealWon,
  reopenDeal,
  updateDeal,
  type CreateDealPayload,
  type UpdateDealPayload,
} from "@/lib/api/deals";
import { useAgencyId } from "./use-agency";

export function useDeal(dealId: number | null) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["deal", agencyId, dealId],
    queryFn: () => getDeal(agencyId!, dealId!),
    enabled: !!agencyId && !!dealId,
  });
}

export function useCreateDeal() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDealPayload) => createDeal(agencyId!, payload),
    onSuccess: (deal) => {
      qc.invalidateQueries({ queryKey: ["kanban", agencyId, deal.pipelineId] });
      qc.invalidateQueries({ queryKey: ["deals", agencyId] });
    },
  });
}

export function useUpdateDeal(dealId: number | null) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDealPayload) =>
      updateDeal(agencyId!, dealId!, payload),
    onSuccess: (deal) => {
      qc.invalidateQueries({ queryKey: ["deal", agencyId, deal.id] });
      qc.invalidateQueries({ queryKey: ["kanban", agencyId, deal.pipelineId] });
    },
  });
}

export function useMarkDealWon(dealId: number | null) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markDealWon(agencyId!, dealId!),
    onSuccess: (deal) => {
      qc.invalidateQueries({ queryKey: ["deal", agencyId, deal.id] });
      qc.invalidateQueries({ queryKey: ["kanban", agencyId, deal.pipelineId] });
    },
  });
}

export function useMarkDealLost(dealId: number | null) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => markDealLost(agencyId!, dealId!, reason),
    onSuccess: (deal) => {
      qc.invalidateQueries({ queryKey: ["deal", agencyId, deal.id] });
      qc.invalidateQueries({ queryKey: ["kanban", agencyId, deal.pipelineId] });
    },
  });
}

export function useReopenDeal(dealId: number | null) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => reopenDeal(agencyId!, dealId!),
    onSuccess: (deal) => {
      qc.invalidateQueries({ queryKey: ["deal", agencyId, deal.id] });
      qc.invalidateQueries({ queryKey: ["kanban", agencyId, deal.pipelineId] });
    },
  });
}
