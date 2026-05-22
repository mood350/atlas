"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  searchClients,
  updateClient,
  type ClientListParams,
  type CreateClientPayload,
  type UpdateClientPayload,
} from "@/lib/api/clients";
import { useAgencyId } from "./use-agency";

export function useClients(params: ClientListParams = {}) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["clients", agencyId, params],
    queryFn: () => listClients(agencyId!, params),
    enabled: !!agencyId,
    placeholderData: keepPreviousData,
  });
}

export function useClientSearch(query: string) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["clients-search", agencyId, query],
    queryFn: () => searchClients(agencyId!, query),
    enabled: !!agencyId && query.length >= 2,
    staleTime: 30_000,
  });
}

export function useClient(clientId: number | null) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["client", agencyId, clientId],
    queryFn: () => getClient(agencyId!, clientId!),
    enabled: !!agencyId && !!clientId,
  });
}

export function useCreateClient() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClientPayload) =>
      createClient(agencyId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", agencyId] });
      qc.invalidateQueries({ queryKey: ["clients-search", agencyId] });
    },
  });
}

export function useUpdateClient(clientId: number | null) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateClientPayload) =>
      updateClient(agencyId!, clientId!, payload),
    onSuccess: (client) => {
      qc.invalidateQueries({ queryKey: ["clients", agencyId] });
      qc.invalidateQueries({ queryKey: ["client", agencyId, client.id] });
    },
  });
}

export function useDeleteClient() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number) => deleteClient(agencyId!, clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", agencyId] });
    },
  });
}
