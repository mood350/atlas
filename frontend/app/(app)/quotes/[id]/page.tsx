"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSignature,
  Loader2,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  useQuote,
  useSendQuote,
  useDeleteQuote,
  useMarkQuoteNegotiating,
  useMarkQuoteAccepted,
  useMarkQuoteRejected,
} from "@/hooks/use-quotes";
import { useConvertFromQuote } from "@/hooks/use-contracts";
import { requireAgencyId } from "@/hooks/use-agency";
import { downloadQuotePdf } from "@/lib/api/quotes";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

const itemTypeLabels: Record<string, string> = {
  SERVICE:     "Service",
  DEVELOPMENT: "Développement",
  DESIGN:      "Design",
  HOSTING:     "Hébergement",
  MAINTENANCE: "Maintenance",
  TRAINING:    "Formation",
  LICENSE:     "Licence",
  OTHER:       "Autre",
};

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const quoteId = Number(id);
  const router = useRouter();

  const { data: quote, isLoading, isError } = useQuote(quoteId);
  usePageTitle(
    quote ? `Devis ${quote.quoteNumber}` : "Devis",
    quote ? quote.title : undefined,
  );

  const sendQuote         = useSendQuote();
  const deleteQuote       = useDeleteQuote();
  const markNegotiating   = useMarkQuoteNegotiating();
  const markAccepted      = useMarkQuoteAccepted();
  const markRejected      = useMarkQuoteRejected();
  const convertToContract = useConvertFromQuote();

  async function handleSend() {
    if (!quote) return;
    try {
      await sendQuote.mutateAsync(quote.id);
      toast.success(`Devis envoyé à ${quote.clientName}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDownload() {
    if (!quote) return;
    try {
      const agencyId = requireAgencyId();
      const blob = await downloadQuotePdf(agencyId, quote.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quote.quoteNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleMarkNegotiating() {
    if (!quote) return;
    try {
      await markNegotiating.mutateAsync(quote.id);
      toast.success("Devis passé en négociation");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleMarkAccepted() {
    if (!quote) return;
    if (!confirm(`Marquer le devis ${quote.quoteNumber} comme accepté ?`)) return;
    try {
      await markAccepted.mutateAsync(quote.id);
      toast.success("Devis marqué comme accepté");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleConvertToContract() {
    if (!quote) return;
    if (!confirm(`Convertir le devis ${quote.quoteNumber} en contrat ?`)) return;
    try {
      const contract = await convertToContract.mutateAsync(quote.id);
      toast.success("Contrat créé depuis ce devis");
      router.push(`/contracts/${contract.id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleMarkRejected() {
    if (!quote) return;
    const reason = window.prompt("Motif du refus (optionnel) :") ?? undefined;
    if (reason === null) return;
    try {
      await markRejected.mutateAsync({ quoteId: quote.id, reason: reason || undefined });
      toast.success("Devis marqué comme refusé");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!quote) return;
    if (!confirm(`Supprimer le devis ${quote.quoteNumber} ? Cette action est définitive.`)) return;
    try {
      await deleteQuote.mutateAsync(quote.id);
      toast.success("Devis supprimé");
      router.push("/quotes");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-foreground-muted">Devis introuvable.</p>
        <Button variant="outline" onClick={() => router.push("/quotes")}>
          Retour aux devis
        </Button>
      </div>
    );
  }

  const canSend = ["DRAFT", "SENT", "VIEWED", "NEGOTIATING", "REJECTED"].includes(quote.status);
  const isSentAlready = ["SENT", "VIEWED", "NEGOTIATING"].includes(quote.status);
  const canTransition = ["SENT", "VIEWED", "NEGOTIATING"].includes(quote.status);
  const canConvert = (quote.status === "ACCEPTED" || quote.status === "NEGOTIATING") && !quote.expired;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/quotes")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[15px] font-semibold text-foreground">
                {quote.quoteNumber}
              </span>
              <StatusBadge status={quote.status} />
              {quote.expired ? (
                <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-medium text-danger">
                  Expiré
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[13px] text-foreground-muted">{quote.title}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canTransition ? (
            <>
              {quote.status !== "NEGOTIATING" ? (
                <Button
                  variant="outline"
                  onClick={handleMarkNegotiating}
                  disabled={markNegotiating.isPending}
                  className="rounded-full border-warning text-warning hover:bg-warning-bg active:scale-95 transition-transform"
                >
                  {markNegotiating.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  En négociation
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={handleMarkAccepted}
                disabled={markAccepted.isPending}
                className="rounded-full border-success text-success hover:bg-success-bg active:scale-95 transition-transform"
              >
                {markAccepted.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Marquer accepté
              </Button>
              <Button
                variant="outline"
                onClick={handleMarkRejected}
                disabled={markRejected.isPending}
                className="rounded-full text-danger hover:bg-danger-bg hover:text-danger active:scale-95 transition-transform"
              >
                {markRejected.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Marquer refusé
              </Button>
            </>
          ) : null}

          {canConvert ? (
            <Button
              onClick={handleConvertToContract}
              disabled={convertToContract.isPending}
              className="rounded-full active:scale-95 transition-transform"
            >
              {convertToContract.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSignature className="mr-2 h-4 w-4" />
              )}
              Convertir en contrat
            </Button>
          ) : null}

          {canSend ? (
            <Button
              onClick={handleSend}
              disabled={sendQuote.isPending}
              className="rounded-full active:scale-95 transition-transform"
            >
              {sendQuote.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSentAlready ? "Ré-envoyer" : "Envoyer"}
            </Button>
          ) : null}

          <Button
            variant="outline"
            onClick={handleDownload}
            className="rounded-full active:scale-95 transition-transform"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>

          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteQuote.isPending}
            className="rounded-full text-danger hover:bg-danger-bg hover:text-danger active:scale-95 transition-transform"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Info row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Client</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{quote.clientName}</p>
                {quote.clientCity ? (
                  <p className="text-[12px] text-foreground-muted">{quote.clientCity}</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Validité</p>
            <p
              className={cn(
                "mt-1 font-medium",
                quote.expired ? "text-danger" : "text-foreground",
              )}
            >
              {quote.validUntil ? formatDate(quote.validUntil) : "Indéfinie"}
            </p>
            {quote.sentAt ? (
              <p className="text-[12px] text-foreground-muted">
                Envoyé le {formatDate(quote.sentAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Créé par</p>
            <p className="mt-1 font-medium text-foreground">
              {quote.createdByName ?? "—"}
            </p>
            <p className="text-[12px] text-foreground-muted">
              {formatDateTime(quote.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items table */}
      <Card className="border-border-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-[16px]">Lignes du devis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-foreground-muted">
                  <th className="pb-2 pr-4 font-medium">Désignation</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 text-right font-medium">Qté</th>
                  <th className="pb-2 pr-4 font-medium">Unité</th>
                  <th className="pb-2 pr-4 text-right font-medium">PU HT</th>
                  <th className="pb-2 pr-4 text-right font-medium">Remise</th>
                  <th className="pb-2 text-right font-medium">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-foreground">{item.designation}</div>
                      {item.description ? (
                        <div className="text-[12px] text-foreground-muted">{item.description}</div>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-4 text-foreground-muted">
                      {itemTypeLabels[item.type] ?? item.type}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 pr-4 text-foreground-muted">{item.unit ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {formatCurrency(item.unitPrice, quote.currency)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-foreground-muted">
                      {item.discountPercent > 0 ? `${item.discountPercent} %` : "—"}
                    </td>
                    <td className="py-2.5 text-right tabular-nums font-medium">
                      {formatCurrency(item.lineTotal, quote.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto mt-6 w-72 space-y-2 rounded-xl bg-background-muted p-4 text-[13px]">
            <div className="flex justify-between text-foreground-muted">
              <span>Sous-total HT</span>
              <span className="tabular-nums">{formatCurrency(quote.subtotal, quote.currency)}</span>
            </div>
            {quote.discountAmount > 0 ? (
              <div className="flex justify-between text-foreground-muted">
                <span>Remise ({quote.discountPercent} %)</span>
                <span className="tabular-nums text-danger">
                  - {formatCurrency(quote.discountAmount, quote.currency)}
                </span>
              </div>
            ) : null}
            {quote.taxRate && quote.taxRate > 0 ? (
              <div className="flex justify-between text-foreground-muted">
                <span>TVA ({quote.taxRate} %)</span>
                <span className="tabular-nums">{formatCurrency(quote.taxAmount, quote.currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
              <span>Total TTC</span>
              <span className="tabular-nums text-[15px]">
                {formatCurrency(quote.totalAmount, quote.currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {(quote.clientNotes || quote.rejectionReason || quote.paymentTerms) ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-[16px]">Notes & conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quote.paymentTerms ? (
              <div>
                <p className="caption-14 text-foreground-muted">Conditions de paiement</p>
                <p className="mt-1 text-[14px]">{quote.paymentTerms}</p>
              </div>
            ) : null}
            {quote.clientNotes ? (
              <div>
                <p className="caption-14 text-foreground-muted">Notes client</p>
                <p className="mt-1 text-[14px]">{quote.clientNotes}</p>
              </div>
            ) : null}
            {quote.rejectionReason ? (
              <div>
                <p className="caption-14 text-danger">Motif de refus</p>
                <p className="mt-1 text-[14px] text-foreground">{quote.rejectionReason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Timeline */}
      {(quote.sentAt || quote.viewedAt || quote.respondedAt) ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-[16px]">Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-[13px]">
              <li className="flex gap-3 text-foreground-muted">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-foreground-subtle" />
                <span>
                  Créé le {formatDateTime(quote.createdAt)}
                  {quote.createdByName ? ` par ${quote.createdByName}` : ""}
                </span>
              </li>
              {quote.sentAt ? (
                <li className="flex gap-3 text-foreground-muted">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-info" />
                  <span>Envoyé le {formatDateTime(quote.sentAt)}</span>
                </li>
              ) : null}
              {quote.viewedAt ? (
                <li className="flex gap-3 text-foreground-muted">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-info" />
                  <span>Vu par le client le {formatDateTime(quote.viewedAt)}</span>
                </li>
              ) : null}
              {quote.respondedAt ? (
                <li className="flex gap-3 text-foreground-muted">
                  <span
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 rounded-full",
                      quote.status === "ACCEPTED" ? "bg-success" : "bg-danger",
                    )}
                  />
                  <span>
                    {quote.status === "ACCEPTED" ? "Accepté" : "Refusé"} le{" "}
                    {formatDateTime(quote.respondedAt)}
                  </span>
                </li>
              ) : null}
              {quote.status === "NEGOTIATING" ? (
                <li className="flex gap-3 text-foreground-muted">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-warning" />
                  <span>En cours de négociation</span>
                </li>
              ) : null}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
