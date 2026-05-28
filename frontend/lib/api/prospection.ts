import { api } from "../axios";

export interface Lead {
  placeId: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  lat?: number;
  lng?: number;
}

export interface SearchResponse {
  leads: Lead[];
  nextPageToken?: string;
}

export interface ImportResponse {
  imported: number;
  skipped: number;
}

export async function searchProspection(
  agencyId: number,
  query: string,
  location?: string,
): Promise<SearchResponse> {
  const params: Record<string, string> = { query };
  if (location) params.location = location;
  const { data } = await api.get<SearchResponse>(
    `/api/agencies/${agencyId}/prospection/search`,
    { params },
  );
  return data;
}

export async function exportProspectionXlsx(
  agencyId: number,
  leads: Lead[],
  filename?: string,
): Promise<Blob> {
  const { data } = await api.post(
    `/api/agencies/${agencyId}/prospection/export/xlsx`,
    { leads, filename },
    { responseType: "blob" },
  );
  return data as Blob;
}

export async function importProspectionLeads(
  agencyId: number,
  leads: Lead[],
): Promise<ImportResponse> {
  const { data } = await api.post<ImportResponse>(
    `/api/agencies/${agencyId}/prospection/import`,
    { leads },
  );
  return data;
}
