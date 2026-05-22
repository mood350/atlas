"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { useQuotes, useQuoteStats, useSendQuote, useDeleteQuote } from "@/hooks/use-quotes";
import { requireAgencyId } from "@/hooks/use-agency";
import { downloadQuotePdf } from "@/lib/api/quotes";
import { formatCurrency, formatDate } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import type { QuoteSummary, QuoteStatus } from "@/types/api";
import { cn } from "@/lib/utils";

const statusTabs: { value: QuoteStatus | null; label: string }[] = [
  { value: null,       label: "Tous" },
  { value: "DRAFT",    label: "Brouillons" },
  { value: "SENT",     label: "Envoyés" },
  { value: "VIEWED",   label: "Vus" },
  { value: "ACCEPTED", label: "Acceptés" },
  { value: "REJECTED", label: "Refusés" },
  { value: "EXPIRED",  label: "Expirés" },
];

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="caption-14 text-foreground-muted">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

export default function QuotesPage() {
  usePageTitle("Devis", "Gérez vos propositions commerciales");

  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | null>(null);
  const [page, setPage] = useState(0);

  const params = useMemo(
    () => ({ page, size: 20, status: statusFilter ?? undefined }),
    [page, statusFilter],
  );

  const { data, isLoading, isError } = useQuotes(params);
  const { data: stats } = useQuoteStats();
  const sendQuote = useSendQuote();
  const deleteQuote = useDeleteQuote();

  const rows = data?.content ?? [];

  async function handleSend(quote: QuoteSummary) {
    try {
      await sendQuote.mutateAsync(quote.id);
      toast.success(`Devis ${quote.quoteNumber} envoyé au client`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDownload(quote: QuoteSummary) {
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

  async function handleDelete(quote: QuoteSummary) {
    if (!confirm(`Supprimer le devis ${quote.quoteNumber} ? Cette action est définitive.`)) return;
    try {
      await deleteQuote.mutateAsync(quote.id);
      toast.success("Devis supprimé");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const columns: DataTableColumn<QuoteSummary>[] = [
    {
      id: "number",
      header: "Numéro",
      cell: (q) => (
        <span className="font-mono text-[13px] font-medium text-foreground">
          {q.quoteNumber}
        </span>
      ),
    },
    {
      id: "title",
      header: "Titre",
      cell: (q) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{q.title}</div>
          <div className="truncate text-[12px] text-foreground-subtle">{q.clientName}</div>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Montant",
      align: "right",
      cell: (q) => (
        <span className="font-medium tabular-nums text-foreground">
          {formatCurrency(q.totalAmount, q.currency)}
        </span>
      ),
    },
    {
      id: "validUntil",
      header: "Validité",
      hideOnMobile: true,
      cell: (q) => (
        <span
          className={cn(
            "text-[13px] tabular-nums",
            q.expired ? "text-danger" : "text-foreground-muted",
          )}
        >
          {q.validUntil ? formatDate(q.validUntil) : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (q) => <StatusBadge status={q.status} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (q) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted hover:text-foreground"
            aria-label="Actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => router.push(`/quotes/${q.id}`)}>
              Voir le devis
            </DropdownMenuItem>
            {(q.status === "DRAFT" || q.status === "REJECTED") ? (
              <DropdownMenuItem onClick={() => handleSend(q)}>
                <Send className="mr-2 h-3.5 w-3.5" />
                Envoyer au client
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => handleDownload(q)}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Télécharger PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger"
              onClick={() => handleDelete(q)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total devis" value={stats.totalQuotes} />
          <StatCard label="Acceptés" value={stats.accepted} />
          <StatCard
            label="CA accepté"
            value={formatCurrency(stats.totalAcceptedAmount, "XOF")}
          />
          <StatCard
            label="Taux d'acceptation"
            value={`${stats.acceptanceRate.toFixed(0)} %`}
          />
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(0);
              }}
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

        <Button
          onClick={() => router.push("/quotes/new")}
          className="rounded-full active:scale-95 transition-transform"
        >
          <Plus className="mr-1 h-4 w-4" />
          Nouveau devis
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(q) => q.id}
        onRowClick={(q) => router.push(`/quotes/${q.id}`)}
        isLoading={isLoading}
        isError={isError}
        empty={{
          icon: FileText,
          title: "Aucun devis",
          description: "Créez votre premier devis pour commencer à convertir vos prospects.",
          action: (
            <Button
              onClick={() => router.push("/quotes/new")}
              className="rounded-full active:scale-95 transition-transform"
            >
              <Plus className="mr-1 h-4 w-4" />
              Nouveau devis
            </Button>
          ),
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
