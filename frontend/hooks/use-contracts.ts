"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listContracts,
  getContract,
  createContract,
  sendContract,
  cancelContract,
  getContractStats,
  type ContractListParams,
  type CreateContractPayload,
} from "@/lib/api/contracts";
import { useAgencyId } from "./use-agency";

export function useContracts(params: ContractListParams = {}) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["contracts", agencyId, params],
    queryFn: () => listContracts(agencyId!, params),
    enabled: !!agencyId,
    placeholderData: keepPreviousData,
  });
}

export function useContract(contractId: number | null) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["contract", agencyId, contractId],
    queryFn: () => getContract(agencyId!, contractId!),
    enabled: !!agencyId && !!contractId,
  });
}

export function useContractStats() {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["contract-stats", agencyId],
    queryFn: () => getContractStats(agencyId!),
    enabled: !!agencyId,
    staleTime: 60_000,
  });
}

export function useCreateContract() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContractPayload) => createContract(agencyId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts", agencyId] });
      qc.invalidateQueries({ queryKey: ["contract-stats", agencyId] });
    },
  });
}

export function useSendContract() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contractId: number) => sendContract(agencyId!, contractId),
    onSuccess: (contract) => {
      qc.invalidateQueries({ queryKey: ["contracts", agencyId] });
      qc.setQueryData(["contract", agencyId, contract.id], contract);
      qc.invalidateQueries({ queryKey: ["contract-stats", agencyId] });
    },
  });
}

export function useCancelContract() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, reason }: { contractId: number; reason?: string }) =>
      cancelContract(agencyId!, contractId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts", agencyId] });
      qc.invalidateQueries({ queryKey: ["contract-stats", agencyId] });
    },
  });
}
