import { api } from "../axios";
import type { Deal, DealPriority, KanbanColumn, PageResponse } from "@/types/api";

export async function fetchKanban(
  agencyId: number,
  pipelineId: number,
): Promise<KanbanColumn[]> {
  const { data } = await api.get<KanbanColumn[]>(
    `/api/agencies/${agencyId}/deals/kanban`,
    { params: { pipelineId } },
  );
  return data;
}

export interface DealListParams {
  page?: number;
  size?: number;
  status?: string;
  ownerId?: number;
  q?: string;
}

export async function listDeals(
  agencyId: number,
  params: DealListParams = {},
): Promise<PageResponse<Deal>> {
  const { data } = await api.get<PageResponse<Deal>>(
    `/api/agencies/${agencyId}/deals`,
    { params },
  );
  return data;
}

export async function getDeal(agencyId: number, dealId: number): Promise<Deal> {
  const { data } = await api.get<Deal>(
    `/api/agencies/${agencyId}/deals/${dealId}`,
  );
  return data;
}

export interface CreateDealPayload {
  title: string;
  description?: string;
  clientId: number;
  pipelineId: number;
  stageId: number;
  amount: number;
  currency?: string;
  priority?: DealPriority;
  expectedCloseDate?: string;
  ownerId?: number;
}

export async function createDeal(
  agencyId: number,
  payload: CreateDealPayload,
): Promise<Deal> {
  const { data } = await api.post<Deal>(
    `/api/agencies/${agencyId}/deals`,
    payload,
  );
  return data;
}

export interface UpdateDealPayload {
  title?: string;
  description?: string;
  amount?: number;
  priority?: DealPriority;
  expectedCloseDate?: string;
  ownerId?: number;
}

export async function updateDeal(
  agencyId: number,
  dealId: number,
  payload: UpdateDealPayload,
): Promise<Deal> {
  const { data } = await api.put<Deal>(
    `/api/agencies/${agencyId}/deals/${dealId}`,
    payload,
  );
  return data;
}

export interface MoveDealPayload {
  stageId: number;
  position: number;
}

export async function moveDeal(
  agencyId: number,
  dealId: number,
  payload: MoveDealPayload,
): Promise<Deal> {
  const { data } = await api.patch<Deal>(
    `/api/agencies/${agencyId}/deals/${dealId}/move`,
    payload,
  );
  return data;
}

export async function markDealWon(
  agencyId: number,
  dealId: number,
): Promise<Deal> {
  const { data } = await api.patch<Deal>(
    `/api/agencies/${agencyId}/deals/${dealId}/won`,
  );
  return data;
}

export async function markDealLost(
  agencyId: number,
  dealId: number,
  reason?: string,
): Promise<Deal> {
  const { data } = await api.patch<Deal>(
    `/api/agencies/${agencyId}/deals/${dealId}/lost`,
    { reason },
  );
  return data;
}

export async function reopenDeal(
  agencyId: number,
  dealId: number,
): Promise<Deal> {
  const { data } = await api.patch<Deal>(
    `/api/agencies/${agencyId}/deals/${dealId}/reopen`,
  );
  return data;
}
