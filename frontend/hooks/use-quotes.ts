"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listQuotes,
  getQuote,
  createQuote,
  updateQuote,
  sendQuote,
  deleteQuote,
  getQuoteStats,
  type QuoteListParams,
  type CreateQuotePayload,
} from "@/lib/api/quotes";
import { useAgencyId } from "./use-agency";

export function useQuotes(params: QuoteListParams = {}) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["quotes", agencyId, params],
    queryFn: () => listQuotes(agencyId!, params),
    enabled: !!agencyId,
    placeholderData: keepPreviousData,
  });
}

export function useQuote(quoteId: number | null) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["quote", agencyId, quoteId],
    queryFn: () => getQuote(agencyId!, quoteId!),
    enabled: !!agencyId && !!quoteId,
  });
}

export function useQuoteStats() {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["quote-stats", agencyId],
    queryFn: () => getQuoteStats(agencyId!),
    enabled: !!agencyId,
    staleTime: 60_000,
  });
}

export function useCreateQuote() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuotePayload) => createQuote(agencyId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes", agencyId] });
      qc.invalidateQueries({ queryKey: ["quote-stats", agencyId] });
    },
  });
}

export function useUpdateQuote(quoteId: number) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuotePayload) =>
      updateQuote(agencyId!, quoteId, payload),
    onSuccess: (quote) => {
      qc.invalidateQueries({ queryKey: ["quotes", agencyId] });
      qc.setQueryData(["quote", agencyId, quote.id], quote);
    },
  });
}

export function useSendQuote() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: number) => sendQuote(agencyId!, quoteId),
    onSuccess: (quote) => {
      qc.invalidateQueries({ queryKey: ["quotes", agencyId] });
      qc.setQueryData(["quote", agencyId, quote.id], quote);
      qc.invalidateQueries({ queryKey: ["quote-stats", agencyId] });
    },
  });
}

export function useDeleteQuote() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: number) => deleteQuote(agencyId!, quoteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes", agencyId] });
      qc.invalidateQueries({ queryKey: ["quote-stats", agencyId] });
    },
  });
}
