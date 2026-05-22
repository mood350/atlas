"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, MoreHorizontal, Receipt, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/app/shared/DataTable";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  useInvoices,
  useInvoiceStats,
  useSendInvoice,
  useDeleteInvoice,
} from "@/hooks/use-invoices";
import { requireAgencyId } from "@/hooks/use-agency";
import { downloadInvoicePdf } from "@/lib/api/invoices";
import { formatCurrency, formatDate } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { InvoiceSummary, InvoiceStatus } from "@/types/api";

const statusTabs: { value: InvoiceStatus | null; label: string }[] = [
  { value: null,       label: "Toutes" },
  { value: "DRAFT",    label: "Brouillons" },
  { value: "SENT",     label: "Envoyées" },
  { value: "PARTIAL",  label: "Partielles" },
  { value: "PAID",     label: "Payées" },
  { value: "OVERDUE",  label: "En retard" },
];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="caption-14 text-foreground-muted">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function InvoicesPage() {
  usePageTitle("Factures", "Suivez vos paiements et encaissements");

  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | null>(null);
  const [page, setPage] = useState(0);

  const params = useMemo(
    () => ({ page, size: 20, status: statusFilter ?? undefined }),
    [page, statusFilter],
  );

  const { data, isLoading, isError } = useInvoices(params);
  const { data: stats } = useInvoiceStats();
  const sendInvoice = useSendInvoice();
  const deleteInvoice = useDeleteInvoice();

  const rows = data?.content ?? [];

  async function handleSend(inv: InvoiceSummary) {
    try {
      await sendInvoice.mutateAsync(inv.id);
      toast.success(`Facture ${inv.invoiceNumber} envoyée`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDownload(inv: InvoiceSummary) {
    try {
      const agencyId = requireAgencyId();
      const blob = await downloadInvoicePdf(agencyId, inv.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDelete(inv: InvoiceSummary) {
    if (!confirm(`Supprimer la facture ${inv.invoiceNumber} ?`)) return;
    try {
      await deleteInvoice.mutateAsync(inv.id);
      toast.success("Facture supprimée");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const columns: DataTableColumn<InvoiceSummary>[] = [
    {
      id: "number",
      header: "Numéro",
      cell: (inv) => (
        <span className="font-mono text-[13px] font-medium text-foreground">
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: (inv) => (
        <span className="font-medium text-foreground">{inv.clientName}</span>
      ),
    },
    {
      id: "amount",
      header: "Montant",
      align: "right",
      cell: (inv) => (
        <span className="font-medium tabular-nums text-foreground">
          {formatCurrency(inv.totalAmount, inv.currency)}
        </span>
      ),
    },
    {
      id: "paid",
      header: "Encaissé",
      align: "right",
      hideOnMobile: true,
      cell: (inv) => (
        <span className="tabular-nums text-foreground-muted">
          {formatCurrency(inv.paidAmount, inv.currency)}
        </span>
      ),
    },
    {
      id: "dueDate",
      header: "Échéance",
      hideOnMobile: true,
      cell: (inv) => {
        const overdue =
          inv.dueDate &&
          inv.status !== "PAID" &&
          new Date(inv.dueDate) < new Date();
        return (
          <span
            className={cn(
              "text-[13px] tabular-nums",
              overdue ? "text-danger" : "text-foreground-muted",
            )}
          >
            {inv.dueDate ? formatDate(inv.dueDate) : "—"}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Statut",
      cell: (inv) => <StatusBadge status={inv.status} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (inv) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted hover:text-foreground"
            aria-label="Actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => router.push(`/invoices/${inv.id}`)}>
              Voir la facture
            </DropdownMenuItem>
            {inv.status === "DRAFT" ? (
              <DropdownMenuItem onClick={() => handleSend(inv)}>
                <Send className="mr-2 h-3.5 w-3.5" />
                Envoyer
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => handleDownload(inv)}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Télécharger PDF
            </DropdownMenuItem>
            {inv.status === "DRAFT" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-danger"
                  onClick={() => handleDelete(inv)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Supprimer
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total factures" value={stats.totalInvoices} />
          <StatCard label="Payées" value={stats.paid} />
          <StatCard label="En retard" value={stats.overdue} />
          <StatCard
            label="Total encaissé"
            value={formatCurrency(stats.totalPaidAmount, "XOF")}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => { setStatusFilter(tab.value); setPage(0); }}
              className={cn(
                "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-foreground text-background"
                  : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(inv) => inv.id}
        onRowClick={(inv) => router.push(`/invoices/${inv.id}`)}
        isLoading={isLoading}
        isError={isError}
        empty={{
          icon: Receipt,
          title: "Aucune facture",
          description: "Les factures sont générées depuis les contrats ou les devis.",
        }}
        pagination={
          data
            ? {
                page: data.number,
                size: data.size,
                totalPages: data.totalPages,
                totalElements: data.totalElements,
              }
            : undefined
        }
        onPageChange={setPage}
      />
    </div>
  );
}
