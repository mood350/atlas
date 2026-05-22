import { api } from "../axios";
import type { Quote, QuoteSummary, QuoteStats, QuoteStatus, PageResponse } from "@/types/api";

export interface QuoteListParams {
  page?: number;
  size?: number;
  status?: QuoteStatus;
}

export interface QuoteItemPayload {
  designation: string;
  description?: string;
  type?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  position: number;
}

export interface CreateQuotePayload {
  clientId: number;
  dealId?: number;
  title: string;
  description?: string;
  items: QuoteItemPayload[];
  discountPercent?: number;
  taxRate?: number;
  validUntil?: string;
  paymentTerms?: string;
  clientNotes?: string;
  internalNotes?: string;
}

export async function listQuotes(
  agencyId: number,
  params: QuoteListParams = {},
): Promise<PageResponse<QuoteSummary>> {
  const { data } = await api.get<PageResponse<QuoteSummary>>(
    `/api/agencies/${agencyId}/quotes`,
    { params },
  );
  return data;
}

export async function getQuote(agencyId: number, quoteId: number): Promise<Quote> {
  const { data } = await api.get<Quote>(
    `/api/agencies/${agencyId}/quotes/${quoteId}`,
  );
  return data;
}

export async function createQuote(
  agencyId: number,
  payload: CreateQuotePayload,
): Promise<Quote> {
  const { data } = await api.post<Quote>(
    `/api/agencies/${agencyId}/quotes`,
    payload,
  );
  return data;
}

export async function updateQuote(
  agencyId: number,
  quoteId: number,
  payload: CreateQuotePayload,
): Promise<Quote> {
  const { data } = await api.put<Quote>(
    `/api/agencies/${agencyId}/quotes/${quoteId}`,
    payload,
  );
  return data;
}

export async function sendQuote(agencyId: number, quoteId: number): Promise<Quote> {
  const { data } = await api.post<Quote>(
    `/api/agencies/${agencyId}/quotes/${quoteId}/send`,
  );
  return data;
}

export async function deleteQuote(agencyId: number, quoteId: number): Promise<void> {
  await api.delete(`/api/agencies/${agencyId}/quotes/${quoteId}`);
}

export async function downloadQuotePdf(
  agencyId: number,
  quoteId: number,
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/api/agencies/${agencyId}/quotes/${quoteId}/pdf`,
    { responseType: "blob" },
  );
  return data;
}

export async function getQuoteStats(agencyId: number): Promise<QuoteStats> {
  const { data } = await api.get<QuoteStats>(
    `/api/agencies/${agencyId}/quotes/stats`,
  );
  return data;
}
