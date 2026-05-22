"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSignature, MoreHorizontal, Send, Trash2 } from "lucide-react";
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
  useContracts,
  useContractStats,
  useSendContract,
  useCancelContract,
} from "@/hooks/use-contracts";
import { requireAgencyId } from "@/hooks/use-agency";
import { downloadContractPdf } from "@/lib/api/contracts";
import { formatDate } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { ContractSummary, ContractStatus } from "@/types/api";

const statusTabs: { value: ContractStatus | null; label: string }[] = [
  { value: null,       label: "Tous" },
  { value: "DRAFT",    label: "Brouillons" },
  { value: "SENT",     label: "Envoyés" },
  { value: "SIGNED",   label: "Signés" },
  { value: "EXPIRED",  label: "Expirés" },
  { value: "CANCELLED", label: "Annulés" },
];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="caption-14 text-foreground-muted">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function ContractsPage() {
  usePageTitle("Contrats", "Gérez vos contrats clients");

  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<ContractStatus | null>(null);
  const [page, setPage] = useState(0);

  const params = useMemo(
    () => ({ page, size: 20, status: statusFilter ?? undefined }),
    [page, statusFilter],
  );

  const { data, isLoading, isError } = useContracts(params);
  const { data: stats } = useContractStats();
  const sendContract = useSendContract();
  const cancelContract = useCancelContract();

  const rows = data?.content ?? [];

  async function handleSend(c: ContractSummary) {
    try {
      await sendContract.mutateAsync(c.id);
      toast.success(`Contrat ${c.contractNumber} envoyé au client`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDownload(c: ContractSummary) {
    try {
      const agencyId = requireAgencyId();
      const blob = await downloadContractPdf(agencyId, c.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${c.contractNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleCancel(c: ContractSummary) {
    if (!confirm(`Annuler le contrat ${c.contractNumber} ?`)) return;
    try {
      await cancelContract.mutateAsync({ contractId: c.id });
      toast.success("Contrat annulé");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const columns: DataTableColumn<ContractSummary>[] = [
    {
      id: "number",
      header: "Numéro",
      cell: (c) => (
        <span className="font-mono text-[13px] font-medium text-foreground">
          {c.contractNumber}
        </span>
      ),
    },
    {
      id: "title",
      header: "Titre",
      cell: (c) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{c.title}</div>
          <div className="truncate text-[12px] text-foreground-subtle">{c.clientName}</div>
        </div>
      ),
    },
    {
      id: "signedAt",
      header: "Signé le",
      hideOnMobile: true,
      cell: (c) => (
        <span className="text-[13px] tabular-nums text-foreground-muted">
          {c.signedAt ? formatDate(c.signedAt) : "—"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Créé le",
      hideOnMobile: true,
      cell: (c) => (
        <span className="text-[13px] tabular-nums text-foreground-muted">
          {formatDate(c.createdAt)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted hover:text-foreground"
            aria-label="Actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => router.push(`/contracts/${c.id}`)}>
              Voir le contrat
            </DropdownMenuItem>
            {c.status === "DRAFT" ? (
              <DropdownMenuItem onClick={() => handleSend(c)}>
                <Send className="mr-2 h-3.5 w-3.5" />
                Envoyer au client
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => handleDownload(c)}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Télécharger PDF
            </DropdownMenuItem>
            {c.status !== "CANCELLED" && c.status !== "SIGNED" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-danger"
                  onClick={() => handleCancel(c)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Annuler
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
          <StatCard label="Total" value={stats.totalContracts} />
          <StatCard label="Signés" value={stats.signed} />
          <StatCard label="En attente" value={stats.sent} />
          <StatCard label="Brouillons" value={stats.drafts} />
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
        rowKey={(c) => c.id}
        onRowClick={(c) => router.push(`/contracts/${c.id}`)}
        isLoading={isLoading}
        isError={isError}
        empty={{
          icon: FileSignature,
          title: "Aucun contrat",
          description: "Les contrats apparaîtront ici une fois créés depuis un devis accepté.",
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
