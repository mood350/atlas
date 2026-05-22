"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, MoreHorizontal, Plus, Trash2 } from "lucide-react";
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
import { PriorityBadge } from "@/components/app/shared/PriorityBadge";
import { usePageTitle } from "@/hooks/use-page-title";
import { useProjects, useProjectStats, useDeleteProject } from "@/hooks/use-projects";
import { formatDate } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { ProjectSummary, ProjectStatus } from "@/types/api";

const statusTabs: { value: ProjectStatus | null; label: string }[] = [
  { value: null,          label: "Tous" },
  { value: "PLANNING",    label: "Planification" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "ON_HOLD",     label: "En pause" },
  { value: "REVIEW",      label: "En révision" },
  { value: "DONE",        label: "Terminés" },
];

function StatCard({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="caption-14 text-foreground-muted">{label}</p>
      <p className={cn("mt-1 text-[22px] font-semibold tabular-nums", danger ? "text-danger" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-background-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[12px] tabular-nums text-foreground-muted">{value} %</span>
    </div>
  );
}

export default function ProjectsPage() {
  usePageTitle("Projets", "Suivez l'avancement de vos projets clients");

  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null);
  const [page, setPage] = useState(0);

  const params = useMemo(
    () => ({ page, size: 20, status: statusFilter ?? undefined }),
    [page, statusFilter],
  );

  const { data, isLoading, isError } = useProjects(params);
  const { data: stats } = useProjectStats();
  const deleteProject = useDeleteProject();

  const rows = data?.content ?? [];

  async function handleDelete(p: ProjectSummary) {
    if (!confirm(`Supprimer le projet "${p.name}" ?`)) return;
    try {
      await deleteProject.mutateAsync(p.id);
      toast.success("Projet supprimé");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const columns: DataTableColumn<ProjectSummary>[] = [
    {
      id: "number",
      header: "N°",
      cell: (p) => (
        <span className="font-mono text-[12px] text-foreground-muted">
          {p.projectNumber}
        </span>
      ),
    },
    {
      id: "name",
      header: "Projet",
      cell: (p) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-foreground">{p.name}</span>
            {p.overdue ? (
              <span className="shrink-0 rounded-full bg-danger-bg px-1.5 py-0.5 text-[10px] font-medium text-danger">
                En retard
              </span>
            ) : null}
          </div>
          <div className="truncate text-[12px] text-foreground-subtle">{p.clientName}</div>
        </div>
      ),
    },
    {
      id: "priority",
      header: "Priorité",
      hideOnMobile: true,
      cell: (p) => <PriorityBadge priority={p.priority} />,
    },
    {
      id: "progress",
      header: "Avancement",
      hideOnMobile: true,
      cell: (p) => <ProgressBar value={p.progressPercent} />,
    },
    {
      id: "tasks",
      header: "Tâches",
      hideOnMobile: true,
      cell: (p) => (
        <span className="text-[13px] tabular-nums text-foreground-muted">
          {p.doneTasks} / {p.totalTasks}
        </span>
      ),
    },
    {
      id: "deadline",
      header: "Deadline",
      hideOnMobile: true,
      cell: (p) => (
        <span
          className={cn(
            "text-[13px] tabular-nums",
            p.overdue ? "text-danger" : "text-foreground-muted",
          )}
        >
          {p.deadline ? formatDate(p.deadline) : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted hover:text-foreground"
            aria-label="Actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => router.push(`/projects/${p.id}`)}>
              Voir le projet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger"
              onClick={() => handleDelete(p)}
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
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={stats.totalProjects} />
          <StatCard label="En cours" value={stats.inProgress} />
          <StatCard label="En retard" value={stats.overdueProjects} danger />
          <StatCard label="Terminés" value={stats.done} />
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

        <button
          onClick={() => router.push("/projects/new")}
          className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouveau projet
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => router.push(`/projects/${p.id}`)}
        isLoading={isLoading}
        isError={isError}
        empty={{
          icon: FolderKanban,
          title: "Aucun projet",
          description: "Les projets sont créés depuis les contrats signés.",
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
