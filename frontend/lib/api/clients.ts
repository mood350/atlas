import { api } from "../axios";
import type {
  Client,
  ClientStatus,
  ClientType,
  PageResponse,
} from "@/types/api";

export interface ClientListParams {
  page?: number;
  size?: number;
  type?: ClientType;
  status?: ClientStatus;
  q?: string;
}

export async function listClients(
  agencyId: number,
  params: ClientListParams = {},
): Promise<PageResponse<Client>> {
  const { data } = await api.get<PageResponse<Client>>(
    `/api/agencies/${agencyId}/clients`,
    { params },
  );
  return data;
}

export async function searchClients(
  agencyId: number,
  query: string,
  size: number = 10,
): Promise<Client[]> {
  if (!query || query.length < 2) return [];
  const { data } = await api.get<PageResponse<Client>>(
    `/api/agencies/${agencyId}/clients`,
    { params: { q: query, size } },
  );
  return data.content;
}

export async function getClient(
  agencyId: number,
  clientId: number,
): Promise<Client> {
  const { data } = await api.get<Client>(
    `/api/agencies/${agencyId}/clients/${clientId}`,
  );
  return data;
}

export interface CreateClientPayload {
  name: string;
  contactFirstName?: string;
  contactLastName?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  type: ClientType;
  status?: ClientStatus;
  industry?: string;
  city?: string;
  country?: string;
  websiteUrl?: string;
  notes?: string;
}

export async function createClient(
  agencyId: number,
  payload: CreateClientPayload,
): Promise<Client> {
  const { data } = await api.post<Client>(
    `/api/agencies/${agencyId}/clients`,
    payload,
  );
  return data;
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {}

export async function updateClient(
  agencyId: number,
  clientId: number,
  payload: UpdateClientPayload,
): Promise<Client> {
  const { data } = await api.put<Client>(
    `/api/agencies/${agencyId}/clients/${clientId}`,
    payload,
  );
  return data;
}

export async function deleteClient(
  agencyId: number,
  clientId: number,
): Promise<void> {
  await api.delete(`/api/agencies/${agencyId}/clients/${clientId}`);
}
