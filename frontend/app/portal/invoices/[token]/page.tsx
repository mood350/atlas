"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

interface InvoiceItem {
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

interface InvoicePortal {
  id: number;
  invoiceNumber: string;
  title: string;
  clientName: string;
  status: string;
  type: string;
  items: InvoiceItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:          { label: "Brouillon",        color: "#71717a", icon: <Clock className="h-4 w-4" /> },
  SENT:           { label: "En attente",        color: "#d97706", icon: <Clock className="h-4 w-4" /> },
  PARTIALLY_PAID: { label: "Partiellement payée", color: "#2563eb", icon: <Clock className="h-4 w-4" /> },
  PAID:           { label: "Payée",             color: "#16a34a", icon: <CheckCircle className="h-4 w-4" /> },
  OVERDUE:        { label: "En retard",         color: "#dc2626", icon: <XCircle className="h-4 w-4" /> },
  CANCELLED:      { label: "Annulée",           color: "#71717a", icon: <XCircle className="h-4 w-4" /> },
};

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

export default function InvoicePortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [invoice, setInvoice] = useState<InvoicePortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<InvoicePortal>(`${API_URL}/api/portal/invoices/${token}`)
      .then((res) => setInvoice(res.data))
      .catch(() => setError("Facture introuvable ou lien expiré."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#71717a]" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-[16px] font-semibold text-[#dc2626]">Lien invalide</p>
          <p className="mt-2 text-[14px] text-[#71717a]">
            {error ?? "Cette facture n'existe pas."}
          </p>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[invoice.status] ?? statusConfig.SENT;
  const isPaid = invoice.status === "PAID";

  return (
    <div className="min-h-screen p-4 py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#71717a]">{invoice.invoiceNumber}</p>
              <h1 className="mt-0.5 text-[20px] font-bold text-[#18181b]">{invoice.title}</h1>
              <p className="mt-1 text-[14px] text-[#71717a]">Client : {invoice.clientName}</p>
            </div>
            <div
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium"
              style={{ color: cfg.color, backgroundColor: cfg.color + "18" }}
            >
              {cfg.icon}
              {cfg.label}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#71717a]">
            {invoice.dueDate ? (
              <p>Échéance : <strong className="text-[#18181b]">{fmt(invoice.dueDate)}</strong></p>
            ) : null}
            {invoice.paidAt ? (
              <p>Payée le : <strong className="text-[#18181b]">{fmt(invoice.paidAt)}</strong></p>
            ) : null}
            <p>Émise le : <strong className="text-[#18181b]">{fmt(invoice.createdAt)}</strong></p>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f4f4f5]">
            <h2 className="text-[15px] font-semibold text-[#18181b]">Détail des prestations</h2>
          </div>
          <div className="divide-y divide-[#f4f4f5]">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[14px] text-[#18181b]">{item.designation}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-[12px] text-[#71717a]">{item.description}</p>
                  ) : null}
                  <p className="mt-0.5 text-[12px] text-[#a1a1aa]">
                    {item.quantity} {item.unit || "×"} {money(item.unitPrice, invoice.currency)}
                    {item.discountPercent > 0
                      ? ` − ${item.discountPercent}%`
                      : ""}
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-medium text-[#18181b]">
                  {money(item.lineTotal, invoice.currency)}
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
              <span>{money(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.discountAmount > 0 ? (
              <div className="flex justify-between text-[#71717a]">
                <span>Remise ({invoice.discountPercent}%)</span>
                <span>− {money(invoice.discountAmount, invoice.currency)}</span>
              </div>
            ) : null}
            {invoice.taxAmount != null && invoice.taxAmount > 0 ? (
              <div className="flex justify-between text-[#71717a]">
                <span>TVA ({invoice.taxRate}%)</span>
                <span>{money(invoice.taxAmount, invoice.currency)}</span>
              </div>
            ) : null}
            <div className="border-t border-[#f4f4f5] pt-2 flex justify-between text-[16px] font-bold text-[#18181b]">
              <span>Total</span>
              <span>{money(invoice.totalAmount, invoice.currency)}</span>
            </div>
            {invoice.paidAmount > 0 && !isPaid ? (
              <>
                <div className="flex justify-between text-[#16a34a]">
                  <span>Déjà réglé</span>
                  <span>− {money(invoice.paidAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-[15px] font-semibold text-[#18181b]">
                  <span>Reste à payer</span>
                  <span>{money(invoice.remainingAmount, invoice.currency)}</span>
                </div>
              </>
            ) : null}
          </div>

          {isPaid ? (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#f0fdf4] px-4 py-3 text-[14px] font-medium text-[#16a34a]">
              <CheckCircle className="h-4 w-4" />
              Facture entièrement réglée
            </div>
          ) : null}
        </div>

        <p className="text-center text-[12px] text-[#a1a1aa]">
          <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
          Facture sécurisée · AtlasCRM
        </p>
      </div>
    </div>
  );
}
