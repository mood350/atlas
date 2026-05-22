"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Download,
  Loader2,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  useInvoice,
  useSendInvoice,
  useDeleteInvoice,
  useRecordPayment,
} from "@/hooks/use-invoices";
import { requireAgencyId } from "@/hooks/use-agency";
import { downloadInvoicePdf } from "@/lib/api/invoices";
import { formatCurrency, formatDate } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const invoiceId = Number(id);
  const router = useRouter();

  const { data: invoice, isLoading, isError } = useInvoice(invoiceId);
  usePageTitle(
    invoice ? `Facture ${invoice.invoiceNumber}` : "Facture",
    invoice ? invoice.title : undefined,
  );

  const sendInvoice = useSendInvoice();
  const deleteInvoice = useDeleteInvoice();
  const recordPayment = useRecordPayment();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  async function handleSend() {
    if (!invoice) return;
    try {
      await sendInvoice.mutateAsync(invoice.id);
      toast.success(`Facture envoyée à ${invoice.clientName}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDownload() {
    if (!invoice) return;
    try {
      const agencyId = requireAgencyId();
      const blob = await downloadInvoicePdf(agencyId, invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    if (!confirm(`Supprimer la facture ${invoice.invoiceNumber} ?`)) return;
    try {
      await deleteInvoice.mutateAsync(invoice.id);
      toast.success("Facture supprimée");
      router.push("/invoices");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleRecordPayment() {
    if (!invoice) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    try {
      await recordPayment.mutateAsync({
        invoiceId: invoice.id,
        amount,
        transactionId: paymentRef || undefined,
      });
      toast.success("Paiement enregistré");
      setPaymentOpen(false);
      setPaymentAmount("");
      setPaymentRef("");
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

  if (isError || !invoice) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-foreground-muted">Facture introuvable.</p>
        <Button variant="outline" onClick={() => router.push("/invoices")}>
          Retour aux factures
        </Button>
      </div>
    );
  }

  const canSend = invoice.status === "DRAFT";
  const canDelete = invoice.status === "DRAFT";
  const canRecordPayment = invoice.status === "SENT" || invoice.status === "PARTIAL" || invoice.status === "OVERDUE";
  const isOverdue =
    invoice.dueDate &&
    invoice.status !== "PAID" &&
    new Date(invoice.dueDate) < new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/invoices")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[15px] font-semibold text-foreground">
                {invoice.invoiceNumber}
              </span>
              <StatusBadge status={invoice.status} />
              {isOverdue ? (
                <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-medium text-danger">
                  En retard
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[13px] text-foreground-muted">{invoice.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canRecordPayment ? (
            <Button
              onClick={() => setPaymentOpen(true)}
              className="rounded-full active:scale-95 transition-transform"
            >
              <Banknote className="mr-2 h-4 w-4" />
              Encaisser
            </Button>
          ) : null}

          {canSend ? (
            <Button
              variant="outline"
              onClick={handleSend}
              disabled={sendInvoice.isPending}
              className="rounded-full active:scale-95 transition-transform"
            >
              {sendInvoice.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Envoyer
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

          {canDelete ? (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleteInvoice.isPending}
              className="rounded-full text-danger hover:bg-danger-bg hover:text-danger active:scale-95 transition-transform"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          ) : null}
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
              <p className="font-medium text-foreground">{invoice.clientName}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Échéance</p>
            <p className={cn("mt-1 font-medium", isOverdue ? "text-danger" : "text-foreground")}>
              {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
            </p>
            {invoice.sentAt ? (
              <p className="text-[12px] text-foreground-muted">
                Envoyée le {formatDate(invoice.sentAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Paiement</p>
            <p className="mt-1 font-medium text-foreground">
              {formatCurrency(invoice.paidAmount, invoice.currency)}
              {" / "}
              {formatCurrency(invoice.totalAmount, invoice.currency)}
            </p>
            <p className="text-[12px] text-foreground-muted">
              Reste : {formatCurrency(invoice.remainingAmount, invoice.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items table */}
      <Card className="border-border-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-[16px]">Lignes de facturation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-foreground-muted">
                  <th className="pb-2 pr-4 font-medium">Désignation</th>
                  <th className="pb-2 pr-4 text-right font-medium">Qté</th>
                  <th className="pb-2 pr-4 text-right font-medium">PU HT</th>
                  <th className="pb-2 pr-4 text-right font-medium">Remise</th>
                  <th className="pb-2 text-right font-medium">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-foreground">{item.designation}</div>
                      {item.description ? (
                        <div className="text-[12px] text-foreground-muted">{item.description}</div>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-foreground-muted">
                      {item.discountPercent > 0 ? `${item.discountPercent} %` : "—"}
                    </td>
                    <td className="py-2.5 text-right tabular-nums font-medium">
                      {formatCurrency(item.lineTotal, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-6 w-72 space-y-2 rounded-xl bg-background-muted p-4 text-[13px]">
            <div className="flex justify-between text-foreground-muted">
              <span>Sous-total HT</span>
              <span className="tabular-nums">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.discountAmount > 0 ? (
              <div className="flex justify-between text-foreground-muted">
                <span>Remise ({invoice.discountPercent} %)</span>
                <span className="tabular-nums text-danger">
                  - {formatCurrency(invoice.discountAmount, invoice.currency)}
                </span>
              </div>
            ) : null}
            {invoice.taxRate && invoice.taxRate > 0 ? (
              <div className="flex justify-between text-foreground-muted">
                <span>TVA ({invoice.taxRate} %)</span>
                <span className="tabular-nums">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
              <span>Total TTC</span>
              <span className="tabular-nums text-[15px]">
                {formatCurrency(invoice.totalAmount, invoice.currency)}
              </span>
            </div>
            {invoice.paidAmount > 0 ? (
              <div className="flex justify-between text-success">
                <span>Encaissé</span>
                <span className="tabular-nums">
                  {formatCurrency(invoice.paidAmount, invoice.currency)}
                </span>
              </div>
            ) : null}
            {invoice.remainingAmount > 0 ? (
              <div className="flex justify-between font-medium text-foreground">
                <span>Reste à payer</span>
                <span className="tabular-nums">
                  {formatCurrency(invoice.remainingAmount, invoice.currency)}
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Record payment dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant ({invoice.currency})</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder={String(invoice.remainingAmount)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref">Référence de transaction (optionnel)</Label>
              <Input
                id="ref"
                placeholder="ID transaction Mobile Money…"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={recordPayment.isPending}
            >
              {recordPayment.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
