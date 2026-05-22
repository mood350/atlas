"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { PriorityBadge } from "@/components/app/shared/PriorityBadge";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  useProject,
  useUpdateProjectStatus,
  useUpdateTaskStatus,
  useDeleteTask,
  useCreateTask,
  useCompleteMilestone,
  useCreateMilestone,
} from "@/hooks/use-projects";
import { formatDate, formatCurrency } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { ProjectTask, ProjectTaskStatus, ProjectStatus } from "@/types/api";

const taskStatusOrder: ProjectTaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const taskStatusLabels: Record<ProjectTaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  REVIEW: "En révision",
  DONE: "Terminé",
  CANCELLED: "Annulé",
};

const projectStatusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "PLANNING",    label: "Planification" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "ON_HOLD",     label: "En pause" },
  { value: "REVIEW",      label: "En révision" },
  { value: "DONE",        label: "Terminé" },
  { value: "DELIVERED",   label: "Livré" },
  { value: "CANCELLED",   label: "Annulé" },
];

const priorityOptions = [
  { value: "LOW",    label: "Basse" },
  { value: "MEDIUM", label: "Normale" },
  { value: "HIGH",   label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

function ProgressRing({ value }: { value: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" strokeWidth="6" className="stroke-background-muted" />
      <circle
        cx="35" cy="35" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
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

  const updateStatus    = useUpdateProjectStatus();
  const updateTaskStatus = useUpdateTaskStatus(projectId);
  const deleteTask      = useDeleteTask(projectId);
  const createTask      = useCreateTask(projectId);
  const completeMilestone = useCompleteMilestone(projectId);
  const createMilestone = useCreateMilestone(projectId);

  const [taskFilter, setTaskFilter] = useState<ProjectTaskStatus | "ALL">("ALL");

  // Task dialog
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDesc, setTaskDesc] = useState("");

  // Milestone dialog
  const [msOpen, setMsOpen] = useState(false);
  const [msTitle, setMsTitle] = useState("");
  const [msDueDate, setMsDueDate] = useState("");
  const [msBillable, setMsBillable] = useState(false);
  const [msAmount, setMsAmount] = useState("");
  const [msDesc, setMsDesc] = useState("");

  async function handleStatusChange(status: ProjectStatus) {
    try {
      await updateStatus.mutateAsync({ projectId, status });
      toast.success("Statut mis à jour");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

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

  async function handleAddTask() {
    if (!taskTitle.trim()) return;
    try {
      await createTask.mutateAsync({
        title: taskTitle.trim(),
        description: taskDesc || undefined,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
      });
      toast.success("Tâche ajoutée");
      setTaskOpen(false);
      setTaskTitle(""); setTaskPriority("MEDIUM"); setTaskDueDate(""); setTaskDesc("");
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

  async function handleAddMilestone() {
    if (!msTitle.trim() || !msDueDate) return;
    try {
      await createMilestone.mutateAsync({
        title: msTitle.trim(),
        description: msDesc || undefined,
        dueDate: msDueDate,
        billable: msBillable,
        amount: msBillable && msAmount ? Number(msAmount) : undefined,
      });
      toast.success("Jalon ajouté");
      setMsOpen(false);
      setMsTitle(""); setMsDueDate(""); setMsBillable(false); setMsAmount(""); setMsDesc("");
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
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              {project.projectNumber} · {project.clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Changer statut */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full text-[13px]" disabled={updateStatus.isPending}>
                {updateStatus.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Statut
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {projectStatusOptions.filter((o) => o.value !== project.status).map((o) => (
                <DropdownMenuItem key={o.value} onClick={() => handleStatusChange(o.value)}>
                  → {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}/edit`)}
            className="rounded-full active:scale-95 transition-transform"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
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
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-[16px]">Tâches</CardTitle>
            <div className="flex flex-wrap items-center gap-1">
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
              <button
                onClick={() => setTaskOpen(true)}
                className="ml-1 flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </button>
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
                      handleTaskStatus(task, task.status === "DONE" ? "TODO" : "DONE")
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
                    {(task.assignedToName || task.dueDate) ? (
                      <p className="text-[12px] text-foreground-muted">
                        {task.assignedToName ?? ""}
                        {task.assignedToName && task.dueDate ? " · " : ""}
                        {task.dueDate ? formatDate(task.dueDate) : ""}
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
                          <DropdownMenuItem key={s} onClick={() => handleTaskStatus(task, s)}>
                            → {taskStatusLabels[s]}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
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
      <Card className="border-border-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[16px]">Jalons</CardTitle>
            <button
              onClick={() => setMsOpen(true)}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Ajouter
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {project.milestones.length === 0 ? (
            <p className="py-6 text-center caption-14 text-foreground-muted">
              Aucun jalon pour ce projet.
            </p>
          ) : (
            <ul className="space-y-3">
              {project.milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <button
                    onClick={() => m.status !== "COMPLETED" ? handleCompleteMilestone(m.id) : undefined}
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
                      {m.billable && m.amount ? ` · ${formatCurrency(m.amount, "XOF")}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {project.description ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-[14px] text-foreground">{project.description}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Linked contract */}
      {project.contractId ? (
        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Contrat lié</p>
            <button
              onClick={() => router.push(`/contracts/${project.contractId}`)}
              className="mt-1 font-medium text-primary hover:underline"
            >
              {project.contractNumber ?? `Contrat #${project.contractId}`}
            </button>
          </CardContent>
        </Card>
      ) : null}

      {/* Add Task Dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Titre *</Label>
              <Input
                id="task-title"
                placeholder="Nom de la tâche"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Input
                id="task-desc"
                placeholder="Détails (optionnel)"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-priority">Priorité</Label>
                <select
                  id="task-priority"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  {priorityOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-due">Échéance</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>Annuler</Button>
            <Button onClick={handleAddTask} disabled={!taskTitle.trim() || createTask.isPending}>
              {createTask.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog open={msOpen} onOpenChange={setMsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un jalon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ms-title">Titre *</Label>
              <Input
                id="ms-title"
                placeholder="Nom du jalon"
                value={msTitle}
                onChange={(e) => setMsTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ms-desc">Description</Label>
              <Input
                id="ms-desc"
                placeholder="Détails (optionnel)"
                value={msDesc}
                onChange={(e) => setMsDesc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ms-due">Date d&apos;échéance *</Label>
              <Input
                id="ms-due"
                type="date"
                value={msDueDate}
                onChange={(e) => setMsDueDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ms-billable"
                type="checkbox"
                checked={msBillable}
                onChange={(e) => setMsBillable(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="ms-billable" className="cursor-pointer">Jalon facturable</Label>
            </div>
            {msBillable ? (
              <div className="space-y-1.5">
                <Label htmlFor="ms-amount">Montant (XOF)</Label>
                <Input
                  id="ms-amount"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  value={msAmount}
                  onChange={(e) => setMsAmount(e.target.value)}
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsOpen(false)}>Annuler</Button>
            <Button onClick={handleAddMilestone} disabled={!msTitle.trim() || !msDueDate || createMilestone.isPending}>
              {createMilestone.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
