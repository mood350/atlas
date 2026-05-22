import { api } from "../axios";
import type { Invoice, InvoiceSummary, InvoiceStats, InvoiceStatus, PageResponse } from "@/types/api";

export interface InvoiceListParams {
  page?: number;
  size?: number;
  status?: InvoiceStatus;
}

export interface InvoiceItemPayload {
  designation: string;
  description?: string;
  type?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  position: number;
}

export interface CreateInvoicePayload {
  clientId: number;
  contractId?: number;
  quoteId?: number;
  title: string;
  items: InvoiceItemPayload[];
  discountPercent?: number;
  taxRate?: number;
  dueDate?: string;
}

export async function listInvoices(
  agencyId: number,
  params: InvoiceListParams = {},
): Promise<PageResponse<InvoiceSummary>> {
  const { data } = await api.get<PageResponse<InvoiceSummary>>(
    `/api/agencies/${agencyId}/invoices`,
    { params },
  );
  return data;
}

export async function getInvoice(agencyId: number, invoiceId: number): Promise<Invoice> {
  const { data } = await api.get<Invoice>(
    `/api/agencies/${agencyId}/invoices/${invoiceId}`,
  );
  return data;
}

export async function createInvoice(
  agencyId: number,
  payload: CreateInvoicePayload,
): Promise<Invoice> {
  const { data } = await api.post<Invoice>(
    `/api/agencies/${agencyId}/invoices`,
    payload,
  );
  return data;
}

export async function generateDepositInvoice(
  agencyId: number,
  contractId: number,
  percent: number,
): Promise<Invoice> {
  const { data } = await api.post<Invoice>(
    `/api/agencies/${agencyId}/invoices/deposit/${contractId}`,
    null,
    { params: { percent } },
  );
  return data;
}

export async function generateFromContract(
  agencyId: number,
  contractId: number,
): Promise<Invoice> {
  const { data } = await api.post<Invoice>(
    `/api/agencies/${agencyId}/invoices/from-contract/${contractId}`,
  );
  return data;
}

export async function sendInvoice(agencyId: number, invoiceId: number): Promise<Invoice> {
  const { data } = await api.post<Invoice>(
    `/api/agencies/${agencyId}/invoices/${invoiceId}/send`,
  );
  return data;
}

export async function recordPayment(
  agencyId: number,
  invoiceId: number,
  amount: number,
  transactionId?: string,
): Promise<Invoice> {
  const { data } = await api.post<Invoice>(
    `/api/agencies/${agencyId}/invoices/${invoiceId}/record-payment`,
    { amount, transactionId },
  );
  return data;
}

export async function deleteInvoice(agencyId: number, invoiceId: number): Promise<void> {
  await api.delete(`/api/agencies/${agencyId}/invoices/${invoiceId}`);
}

export async function downloadInvoicePdf(
  agencyId: number,
  invoiceId: number,
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/api/agencies/${agencyId}/invoices/${invoiceId}/pdf`,
    { responseType: "blob" },
  );
  return data;
}

export async function getInvoiceStats(agencyId: number): Promise<InvoiceStats> {
  const { data } = await api.get<InvoiceStats>(
    `/api/agencies/${agencyId}/invoices/stats`,
  );
  return data;
}
