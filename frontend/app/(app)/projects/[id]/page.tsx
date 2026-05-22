"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { PriorityBadge } from "@/components/app/shared/PriorityBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  useProject,
  useUpdateTaskStatus,
  useDeleteTask,
  useCompleteMilestone,
} from "@/hooks/use-projects";
import { formatDate, formatCurrency } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { ProjectTask, ProjectTaskStatus } from "@/types/api";

const taskStatusOrder: ProjectTaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const taskStatusLabels: Record<ProjectTaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  REVIEW: "En révision",
  DONE: "Terminé",
  CANCELLED: "Annulé",
};

function ProgressRing({ value }: { value: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" strokeWidth="6" className="stroke-background-muted" />
      <circle
        cx="35"
        cy="35"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        className="stroke-primary transition-all"
        strokeDasharray={`${dash} ${circ}`}
      />
    </svg>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projectId = Number(id);
  const router = useRouter();

  const { data: project, isLoading, isError } = useProject(projectId);
  usePageTitle(
    project ? project.name : "Projet",
    project ? project.clientName : undefined,
  );

  const updateTaskStatus = useUpdateTaskStatus(projectId);
  const deleteTask = useDeleteTask(projectId);
  const completeMilestone = useCompleteMilestone(projectId);

  const [taskFilter, setTaskFilter] = useState<ProjectTaskStatus | "ALL">("ALL");

  async function handleTaskStatus(task: ProjectTask, status: ProjectTaskStatus) {
    try {
      await updateTaskStatus.mutateAsync({ taskId: task.id, status });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDeleteTask(task: ProjectTask) {
    if (!confirm(`Supprimer la tâche "${task.title}" ?`)) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Tâche supprimée");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleCompleteMilestone(milestoneId: number) {
    try {
      await completeMilestone.mutateAsync(milestoneId);
      toast.success("Jalon marqué comme terminé");
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

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-foreground-muted">Projet introuvable.</p>
        <Button variant="outline" onClick={() => router.push("/projects")}>
          Retour aux projets
        </Button>
      </div>
    );
  }

  const filteredTasks =
    taskFilter === "ALL"
      ? project.tasks
      : project.tasks.filter((t) => t.status === taskFilter);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/projects")}
            className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-semibold text-foreground">{project.name}</h1>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT"} />
              {project.overdue ? (
                <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-medium text-danger">
                  En retard
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[13px] text-foreground-muted">{project.clientName}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border-soft sm:col-span-1 flex items-center justify-center py-4">
          <CardContent className="flex flex-col items-center gap-1 pt-0">
            <div className="relative flex items-center justify-center">
              <ProgressRing value={project.progressPercent} />
              <span className="absolute text-[14px] font-semibold text-foreground">
                {project.progressPercent}%
              </span>
            </div>
            <p className="caption-14 text-foreground-muted">Avancement</p>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Tâches</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">
              {project.tasks.filter((t) => t.status === "DONE").length}
              <span className="text-[14px] text-foreground-muted"> / {project.tasks.length}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Deadline</p>
            <p className={cn("mt-1 font-medium", project.overdue ? "text-danger" : "text-foreground")}>
              {project.deadline ? formatDate(project.deadline) : "—"}
            </p>
            {project.startDate ? (
              <p className="text-[12px] text-foreground-muted">
                Début : {formatDate(project.startDate)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Budget</p>
            <p className="mt-1 font-medium text-foreground">
              {project.budget ? formatCurrency(project.budget, "XOF") : "—"}
            </p>
            {project.estimatedHours ? (
              <p className="text-[12px] text-foreground-muted">
                {project.loggedHours ?? 0}h / {project.estimatedHours}h estimées
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card className="border-border-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[16px]">Tâches</CardTitle>
            <div className="flex flex-wrap gap-1">
              {(["ALL", ...taskStatusOrder] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setTaskFilter(s)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                    taskFilter === s
                      ? "bg-foreground text-background"
                      : "text-foreground-muted hover:bg-background-muted",
                  )}
                >
                  {s === "ALL" ? "Toutes" : taskStatusLabels[s]}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <p className="py-6 text-center caption-14 text-foreground-muted">
              Aucune tâche dans cette catégorie.
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-background-muted/40 transition-colors"
                >
                  <button
                    onClick={() =>
                      handleTaskStatus(
                        task,
                        task.status === "DONE" ? "TODO" : "DONE",
                      )
                    }
                    className="shrink-0 text-foreground-muted hover:text-success transition-colors"
                  >
                    {task.status === "DONE" ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "truncate text-[14px] font-medium",
                          task.status === "DONE"
                            ? "text-foreground-subtle line-through"
                            : "text-foreground",
                        )}
                      >
                        {task.title}
                      </span>
                      {task.overdue && task.status !== "DONE" ? (
                        <span className="shrink-0 rounded-full bg-danger-bg px-1.5 py-0.5 text-[10px] font-medium text-danger">
                          En retard
                        </span>
                      ) : null}
                    </div>
                    {task.assignedToName ? (
                      <p className="text-[12px] text-foreground-muted">
                        {task.assignedToName}
                        {task.dueDate ? ` · ${formatDate(task.dueDate)}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={task.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT"} />
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {taskStatusOrder.filter((s) => s !== task.status).map((s) => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() => handleTaskStatus(task, s)}
                          >
                            → {taskStatusLabels[s]}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem
                          className="text-danger"
                          onClick={() => handleDeleteTask(task)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      {project.milestones.length > 0 ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-[16px]">Jalons</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {project.milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <button
                    onClick={() =>
                      m.status !== "COMPLETED" ? handleCompleteMilestone(m.id) : undefined
                    }
                    disabled={m.status === "COMPLETED"}
                    className={cn(
                      "mt-0.5 shrink-0 transition-colors",
                      m.status === "COMPLETED"
                        ? "text-success cursor-default"
                        : "text-foreground-muted hover:text-success",
                    )}
                  >
                    {m.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-medium",
                          m.status === "COMPLETED"
                            ? "text-foreground-subtle line-through"
                            : "text-foreground",
                        )}
                      >
                        {m.title}
                      </span>
                      {m.overdue && m.status !== "COMPLETED" ? (
                        <span className="rounded-full bg-danger-bg px-1.5 py-0.5 text-[10px] font-medium text-danger">
                          En retard
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[12px] text-foreground-muted">
                      Échéance : {formatDate(m.dueDate)}
                      {m.billable && m.amount
                        ? ` · ${formatCurrency(m.amount, "XOF")}`
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Description */}
      {project.description ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-[14px] text-foreground">
              {project.description}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
