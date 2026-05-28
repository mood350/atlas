"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle, Loader2, ShieldCheck, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

interface QuoteItem {
  id: number;
  position: number;
  designation: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
}

interface QuotePortal {
  id: number;
  quoteNumber: string;
  title: string;
  description?: string;
  clientName: string;
  clientNotes?: string;
  status: string;
  items: QuoteItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  currency: string;
  validUntil?: string;
  paymentTerms?: string;
  expired: boolean;
  createdAt: string;
  respondedAt?: string;
  rejectionReason?: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function QuotePortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [quote, setQuote] = useState<QuotePortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<QuotePortal>(`${API_URL}/api/portal/quotes/${token}`)
      .then((res) => setQuote(res.data))
      .catch(() => setError("Devis introuvable ou lien expiré."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await axios.post<QuotePortal>(`${API_URL}/api/portal/quotes/${token}/accept`);
      setQuote(res.data);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActionError(axiosErr?.response?.data?.message ?? "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await axios.post<QuotePortal>(
        `${API_URL}/api/portal/quotes/${token}/reject`,
        { reason: rejectReason.trim() || undefined },
      );
      setQuote(res.data);
      setShowRejectForm(false);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActionError(axiosErr?.response?.data?.message ?? "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#71717a]" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-[16px] font-semibold text-[#dc2626]">Lien invalide</p>
          <p className="mt-2 text-[14px] text-[#71717a]">
            {error ?? "Ce devis n'existe pas."}
          </p>
        </div>
      </div>
    );
  }

  const isAccepted = quote.status === "ACCEPTED";
  const isRejected = quote.status === "REJECTED";
  const canAct = (quote.status === "SENT" || quote.status === "VIEWED" || quote.status === "NEGOTIATING") && !quote.expired;

  return (
    <div className="min-h-screen p-4 py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#71717a]">{quote.quoteNumber}</p>
              <h1 className="mt-0.5 text-[20px] font-bold text-[#18181b]">{quote.title}</h1>
              <p className="mt-1 text-[14px] text-[#71717a]">Client : {quote.clientName}</p>
            </div>
            {isAccepted ? (
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#f0fdf4] px-3 py-1 text-[13px] font-medium text-[#16a34a]">
                <CheckCircle className="h-3.5 w-3.5" />
                Accepté
              </div>
            ) : isRejected ? (
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#fef2f2] px-3 py-1 text-[13px] font-medium text-[#dc2626]">
                <XCircle className="h-3.5 w-3.5" />
                Refusé
              </div>
            ) : quote.expired ? (
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#f4f4f5] px-3 py-1 text-[13px] font-medium text-[#71717a]">
                Expiré
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#71717a]">
            {quote.validUntil ? (
              <p>
                Valide jusqu&apos;au{" "}
                <strong className="text-[#18181b]">{fmt(quote.validUntil)}</strong>
              </p>
            ) : null}
            <p>
              Émis le{" "}
              <strong className="text-[#18181b]">{fmt(quote.createdAt)}</strong>
            </p>
          </div>
        </div>

        {/* Description */}
        {quote.description ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-[15px] font-semibold text-[#18181b]">Description</h2>
            <p className="whitespace-pre-wrap text-[14px] text-[#3f3f46]">{quote.description}</p>
          </div>
        ) : null}

        {/* Items */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f4f4f5]">
            <h2 className="text-[15px] font-semibold text-[#18181b]">Détail des prestations</h2>
          </div>
          <div className="divide-y divide-[#f4f4f5]">
            {quote.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[14px] text-[#18181b]">{item.designation}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-[12px] text-[#71717a]">{item.description}</p>
                  ) : null}
                  <p className="mt-0.5 text-[12px] text-[#a1a1aa]">
                    {item.quantity} {item.unit || "×"} {money(item.unitPrice, quote.currency)}
                    {item.discountPercent > 0 ? ` − ${item.discountPercent}%` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-medium text-[#18181b]">
                  {money(item.lineTotal, quote.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="space-y-2 text-[14px]">
            <div className="flex justify-between text-[#71717a]">
              <span>Sous-total</span>
              <span>{money(quote.subtotal, quote.currency)}</span>
            </div>
            {quote.discountAmount > 0 ? (
              <div className="flex justify-between text-[#71717a]">
                <span>Remise ({quote.discountPercent}%)</span>
                <span>− {money(quote.discountAmount, quote.currency)}</span>
              </div>
            ) : null}
            {quote.taxAmount != null && quote.taxAmount > 0 ? (
              <div className="flex justify-between text-[#71717a]">
                <span>TVA ({quote.taxRate}%)</span>
                <span>{money(quote.taxAmount, quote.currency)}</span>
              </div>
            ) : null}
            <div className="border-t border-[#f4f4f5] pt-2 flex justify-between text-[16px] font-bold text-[#18181b]">
              <span>Total</span>
              <span>{money(quote.totalAmount, quote.currency)}</span>
            </div>
          </div>

          {quote.paymentTerms ? (
            <p className="mt-4 text-[13px] text-[#71717a]">
              Conditions de paiement : <strong className="text-[#18181b]">{quote.paymentTerms}</strong>
            </p>
          ) : null}
        </div>

        {/* Client notes */}
        {quote.clientNotes ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-[15px] font-semibold text-[#18181b]">Note de l&apos;agence</h2>
            <p className="whitespace-pre-wrap text-[14px] text-[#3f3f46]">{quote.clientNotes}</p>
          </div>
        ) : null}

        {/* Accepted banner */}
        {isAccepted ? (
          <div className="rounded-2xl bg-[#f0fdf4] p-6 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-[#16a34a]" />
            <h2 className="text-[17px] font-bold text-[#166534]">Devis accepté</h2>
            {quote.respondedAt ? (
              <p className="mt-1 text-[13px] text-[#16a34a]">
                Accepté le {fmt(quote.respondedAt)}
              </p>
            ) : null}
            <p className="mt-2 text-[13px] text-[#166534]">
              L&apos;agence va vous contacter prochainement pour la suite.
            </p>
          </div>
        ) : null}

        {/* Rejected banner */}
        {isRejected ? (
          <div className="rounded-2xl bg-[#fef2f2] p-6 text-center shadow-sm">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-[#dc2626]" />
            <h2 className="text-[17px] font-bold text-[#991b1b]">Devis refusé</h2>
            {quote.rejectionReason ? (
              <p className="mt-2 text-[13px] text-[#991b1b] italic">{quote.rejectionReason}</p>
            ) : null}
          </div>
        ) : null}

        {/* Expired banner */}
        {quote.expired && !isAccepted && !isRejected ? (
          <div className="rounded-2xl bg-[#f4f4f5] p-5 text-center shadow-sm">
            <p className="text-[14px] font-medium text-[#71717a]">
              Ce devis a expiré. Veuillez contacter l&apos;agence pour un nouveau devis.
            </p>
          </div>
        ) : null}

        {/* Action buttons */}
        {canAct ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-[15px] font-semibold text-[#18181b]">Votre réponse</h2>

            {actionError ? (
              <p className="rounded-lg bg-[#fef2f2] px-3 py-2 text-[13px] text-[#dc2626]">
                {actionError}
              </p>
            ) : null}

            {showRejectForm ? (
              <form onSubmit={handleReject} className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#3f3f46]">
                    Motif du refus (optionnel)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Dites-nous pourquoi vous refusez ce devis…"
                    rows={3}
                    className="w-full rounded-lg border border-[#e4e4e7] bg-white px-3 py-2 text-[14px] text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#18181b] focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 rounded-full border border-[#e4e4e7] py-2.5 text-[14px] font-medium text-[#71717a] hover:bg-[#f4f4f5] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#dc2626] py-2.5 text-[14px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Confirmer le refus
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#18181b] py-2.5 text-[14px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  Accepter le devis
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#e4e4e7] py-2.5 text-[14px] font-medium text-[#71717a] hover:bg-[#f4f4f5] transition-colors disabled:opacity-50"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Refuser
                </button>
              </div>
            )}
          </div>
        ) : null}

        <p className="text-center text-[12px] text-[#a1a1aa]">
          <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
          Document sécurisé · AtlasCRM
        </p>
      </div>
    </div>
  );
}
