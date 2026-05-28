"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listInvoices,
  getInvoice,
  createInvoice,
  sendInvoice,
  recordPayment,
  deleteInvoice,
  getInvoiceStats,
  type InvoiceListParams,
  type CreateInvoicePayload,
} from "@/lib/api/invoices";
import { useAgencyId } from "./use-agency";

export function useInvoices(params: InvoiceListParams = {}) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["invoices", agencyId, params],
    queryFn: () => listInvoices(agencyId!, params),
    enabled: !!agencyId,
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(invoiceId: number | null) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["invoice", agencyId, invoiceId],
    queryFn: () => getInvoice(agencyId!, invoiceId!),
    enabled: !!agencyId && !!invoiceId,
  });
}

export function useInvoiceStats() {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["invoice-stats", agencyId],
    queryFn: () => getInvoiceStats(agencyId!),
    enabled: !!agencyId,
    staleTime: 60_000,
  });
}

/** Invalide toutes les vues qui dépendent de l'argent encaissé/facturé. */
function invalidateFinancialViews(qc: ReturnType<typeof useQueryClient>, agencyId: number | null) {
  qc.invalidateQueries({ queryKey: ["invoices", agencyId] });
  qc.invalidateQueries({ queryKey: ["invoice-stats", agencyId] });
  qc.invalidateQueries({ queryKey: ["analytics-dashboard", agencyId] });
  qc.invalidateQueries({ queryKey: ["analytics-revenue", agencyId] });
  qc.invalidateQueries({ queryKey: ["clients", agencyId] });
  qc.invalidateQueries({ queryKey: ["client", agencyId] });
}

export function useCreateInvoice() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(agencyId!, payload),
    onSuccess: () => invalidateFinancialViews(qc, agencyId),
  });
}

export function useSendInvoice() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => sendInvoice(agencyId!, invoiceId),
    onSuccess: (invoice) => {
      invalidateFinancialViews(qc, agencyId);
      qc.setQueryData(["invoice", agencyId, invoice.id], invoice);
    },
  });
}

export function useRecordPayment() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      amount,
      transactionId,
    }: {
      invoiceId: number;
      amount: number;
      transactionId?: string;
    }) => recordPayment(agencyId!, invoiceId, amount, transactionId),
    onSuccess: (invoice) => {
      invalidateFinancialViews(qc, agencyId);
      qc.setQueryData(["invoice", agencyId, invoice.id], invoice);
    },
  });
}

export function useDeleteInvoice() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => deleteInvoice(agencyId!, invoiceId),
    onSuccess: () => invalidateFinancialViews(qc, agencyId),
  });
}
