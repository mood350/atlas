import { api } from "../axios";
import type { Contract, ContractSummary, ContractStats, ContractStatus, PageResponse } from "@/types/api";

export interface ContractListParams {
  page?: number;
  size?: number;
  status?: ContractStatus;
}

export interface CreateContractPayload {
  title: string;
  content?: string;
  validUntil?: string;
  clientId: number;
  quoteId?: number;
}

export async function listContracts(
  agencyId: number,
  params: ContractListParams = {},
): Promise<PageResponse<ContractSummary>> {
  const { data } = await api.get<PageResponse<ContractSummary>>(
    `/api/agencies/${agencyId}/contracts`,
    { params },
  );
  return data;
}

export async function getContract(agencyId: number, contractId: number): Promise<Contract> {
  const { data } = await api.get<Contract>(
    `/api/agencies/${agencyId}/contracts/${contractId}`,
  );
  return data;
}

export async function createContract(
  agencyId: number,
  payload: CreateContractPayload,
): Promise<Contract> {
  const { data } = await api.post<Contract>(
    `/api/agencies/${agencyId}/contracts`,
    payload,
  );
  return data;
}

export async function convertFromQuote(
  agencyId: number,
  quoteId: number,
): Promise<Contract> {
  const { data } = await api.post<Contract>(
    `/api/agencies/${agencyId}/contracts/from-quote/${quoteId}`,
  );
  return data;
}

export async function sendContract(agencyId: number, contractId: number): Promise<Contract> {
  const { data } = await api.post<Contract>(
    `/api/agencies/${agencyId}/contracts/${contractId}/send`,
  );
  return data;
}

export async function cancelContract(
  agencyId: number,
  contractId: number,
  reason?: string,
): Promise<void> {
  await api.delete(`/api/agencies/${agencyId}/contracts/${contractId}`, {
    params: reason ? { reason } : undefined,
  });
}

export async function downloadContractPdf(
  agencyId: number,
  contractId: number,
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/api/agencies/${agencyId}/contracts/${contractId}/pdf`,
    { responseType: "blob" },
  );
  return data;
}

export async function getContractStats(agencyId: number): Promise<ContractStats> {
  const { data } = await api.get<ContractStats>(
    `/api/agencies/${agencyId}/contracts/stats`,
  );
  return data;
}
