"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/app/shared/DataTable";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { ClientFormDialog } from "@/components/app/clients/ClientFormDialog";
import { useClients, useDeleteClient } from "@/hooks/use-clients";
import { usePageTitle } from "@/hooks/use-page-title";
import { formatCurrency, formatNumber } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import type { Client, ClientStatus, ClientType } from "@/types/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeLabels: Record<ClientType, string> = {
  SME: "PME",
  NGO: "ONG",
  PUBLIC: "Public",
  STARTUP: "Startup",
  INDIVIDUAL: "Particulier",
};

const typeChipClasses: Record<ClientType, string> = {
  SME: "bg-info-bg text-info",
  NGO: "bg-warning-bg text-warning",
  PUBLIC: "bg-background-muted text-foreground-muted",
  STARTUP: "bg-success-bg text-success",
  INDIVIDUAL: "bg-background-muted text-foreground-muted",
};

const statusLabels: Record<ClientStatus, string> = {
  PROSPECT: "Prospects",
  ACTIVE: "Actifs",
  INACTIVE: "Inactifs",
};

function clientInitials(client: Client): string {
  return client.name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export default function ClientsPage() {
  usePageTitle("Clients", "Toute votre base contacts au même endroit");

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClientType | null>(null);
  const [statusFilter, setStatusFilter] = useState<ClientStatus | null>(null);
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const params = useMemo(
    () => ({
      page,
      size: 20,
      q: search.trim() || undefined,
      type: typeFilter ?? undefined,
      status: statusFilter ?? undefined,
    }),
    [page, search, typeFilter, statusFilter],
  );

  const { data, isLoading, isError } = useClients(params);
  const deleteClient = useDeleteClient();

  const rows = data?.content ?? [];
  const hasFilter = !!search || !!typeFilter || !!statusFilter;

  function clearFilters() {
    setSearch("");
    setTypeFilter(null);
    setStatusFilter(null);
    setPage(0);
  }

  async function handleDelete(client: Client) {
    if (!confirm(`Supprimer ${client.name} ? Cette action est définitive.`)) return;
    try {
      await deleteClient.mutateAsync(client.id);
      toast.success("Client supprimé");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const columns: DataTableColumn<Client>[] = [
    {
      id: "name",
      header: "Client",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
              {clientInitials(c)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{c.name}</div>
            {c.contactFirstName || c.contactLastName ? (
              <div className="truncate text-[12px] text-foreground-subtle">
                {[c.contactFirstName, c.contactLastName].filter(Boolean).join(" ")}
              </div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      hideOnMobile: true,
      cell: (c) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
            typeChipClasses[c.type],
          )}
        >
          {typeLabels[c.type]}
        </span>
      ),
    },
    {
      id: "city",
      header: "Localisation",
      hideOnMobile: true,
      cell: (c) =>
        c.city || c.country ? (
          <span className="text-[13px] text-foreground-muted">
            {[c.city, c.country].filter(Boolean).join(", ")}
          </span>
        ) : (
          <span className="text-[13px] text-foreground-subtle">—</span>
        ),
    },
    {
      id: "revenue",
      header: "CA total",
      align: "right",
      hideOnMobile: true,
      cell: (c) => (
        <span className="font-medium tabular-nums text-foreground">
          {formatCurrency(c.totalRevenue ?? 0, "XOF")}
        </span>
      ),
    },
    {
      id: "deals",
      header: "Deals",
      align: "right",
      hideOnMobile: true,
      cell: (c) => (
        <span className="tabular-nums text-foreground-muted">
          {formatNumber(c.dealsCount ?? 0)}
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
            <DropdownMenuItem onClick={() => router.push(`/clients/${c.id}`)}>
              Voir la fiche
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingClient(c)}>
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/pipeline?clientId=${c.id}`)}
            >
              Créer un deal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger"
              onClick={() => handleDelete(c)}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Rechercher par nom, email, ville..."
              className="h-9 w-full pl-9 sm:w-72"
            />
          </div>

          {/* Type filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px]",
                "transition-colors hover:bg-background-muted",
                typeFilter
                  ? "border-primary text-primary"
                  : "text-foreground-muted",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {typeFilter ? typeLabels[typeFilter] : "Type"}
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Type de client</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(typeLabels) as ClientType[]).map((t) => (
                <DropdownMenuItem
                  key={t}
                  onClick={() => {
                    setTypeFilter(t);
                    setPage(0);
                  }}
                >
                  {typeLabels[t]}
                </DropdownMenuItem>
              ))}
              {typeFilter ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setTypeFilter(null);
                      setPage(0);
                    }}
                  >
                    Effacer
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px]",
                "transition-colors hover:bg-background-muted",
                statusFilter
                  ? "border-primary text-primary"
                  : "text-foreground-muted",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {statusFilter ? statusLabels[statusFilter] : "Statut"}
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Statut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(statusLabels) as ClientStatus[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(0);
                  }}
                >
                  {statusLabels[s]}
                </DropdownMenuItem>
              ))}
              {statusFilter ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter(null);
                      setPage(0);
                    }}
                  >
                    Effacer
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasFilter ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground-muted"
              onClick={clearFilters}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          ) : null}
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-full active:scale-95 transition-transform"
        >
          <Plus className="mr-1 h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        onRowClick={(c) => router.push(`/clients/${c.id}`)}
        isLoading={isLoading}
        isError={isError}
        empty={
          hasFilter
            ? {
                icon: Search,
                title: "Aucun client trouvé",
                description: "Modifiez ou réinitialisez vos filtres pour voir des résultats.",
                action: (
                  <Button variant="outline" onClick={clearFilters} className="rounded-full">
                    Réinitialiser les filtres
                  </Button>
                ),
              }
            : {
                icon: Users,
                title: "Aucun client pour l'instant",
                description: "Ajoutez votre premier client pour commencer à suivre vos deals.",
                action: (
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className="rounded-full active:scale-95 transition-transform"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Ajouter un client
                  </Button>
                ),
              }
        }
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

      <ClientFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ClientFormDialog
        open={!!editingClient}
        onOpenChange={(o) => !o && setEditingClient(null)}
        initial={editingClient}
      />
    </div>
  );
}
