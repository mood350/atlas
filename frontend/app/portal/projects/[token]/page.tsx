"use client";

import { use, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  overdue: boolean;
  completedAt?: string;
}

interface Milestone {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  billable: boolean;
  amount?: number;
  overdue: boolean;
  completedAt?: string;
}

interface ProjectPortal {
  id: number;
  projectNumber: string;
  name: string;
  description?: string;
  clientName: string;
  status: string;
  priority: string;
  startDate?: string;
  deadline?: string;
  overdue: boolean;
  progressPercent: number;
  budget?: number;
  estimatedHours?: number;
  loggedHours?: number;
  tasks: Task[];
  milestones: Milestone[];
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PLANNING:    { label: "Planification",   color: "#71717a" },
  IN_PROGRESS: { label: "En cours",        color: "#2563eb" },
  ON_HOLD:     { label: "En pause",        color: "#d97706" },
  REVIEW:      { label: "En révision",     color: "#7c3aed" },
  DONE:        { label: "Terminé",         color: "#16a34a" },
  CANCELLED:   { label: "Annulé",          color: "#71717a" },
};

const taskStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  TODO:        { label: "À faire",         color: "#71717a", icon: <Circle className="h-4 w-4" /> },
  IN_PROGRESS: { label: "En cours",        color: "#2563eb", icon: <Clock className="h-4 w-4" /> },
  IN_REVIEW:   { label: "En révision",     color: "#7c3aed", icon: <AlertCircle className="h-4 w-4" /> },
  DONE:        { label: "Terminée",        color: "#16a34a", icon: <CheckCircle2 className="h-4 w-4" /> },
  BLOCKED:     { label: "Bloquée",         color: "#dc2626", icon: <AlertCircle className="h-4 w-4" /> },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW:    { label: "Faible",   color: "#71717a" },
  MEDIUM: { label: "Moyenne",  color: "#d97706" },
  HIGH:   { label: "Haute",    color: "#dc2626" },
  URGENT: { label: "Urgente",  color: "#7c3aed" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function ProjectPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [project, setProject] = useState<ProjectPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<ProjectPortal>(`${API_URL}/api/portal/projects/${token}`)
      .then((res) => setProject(res.data))
      .catch(() => setError("Projet introuvable ou lien expiré."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#71717a]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-[16px] font-semibold text-[#dc2626]">Lien invalide</p>
          <p className="mt-2 text-[14px] text-[#71717a]">
            {error ?? "Ce projet n'existe pas."}
          </p>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[project.status] ?? statusConfig.PLANNING;
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const totalTasks = project.tasks.length;

  const pendingMilestones = project.milestones.filter((m) => m.status !== "COMPLETED");
  const doneMilestones = project.milestones.filter((m) => m.status === "COMPLETED");

  return (
    <div className="min-h-screen p-4 py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#71717a]">{project.projectNumber}</p>
              <h1 className="mt-0.5 text-[20px] font-bold text-[#18181b]">{project.name}</h1>
              <p className="mt-1 text-[14px] text-[#71717a]">Client : {project.clientName}</p>
            </div>
            <div
              className="shrink-0 rounded-full px-3 py-1 text-[13px] font-medium"
              style={{ color: cfg.color, backgroundColor: cfg.color + "18" }}
            >
              {cfg.label}
            </div>
          </div>

          {project.description ? (
            <p className="mt-3 text-[14px] text-[#3f3f46] whitespace-pre-wrap">
              {project.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-[#71717a]">
            {project.startDate ? (
              <p>Début : <strong className="text-[#18181b]">{fmt(project.startDate)}</strong></p>
            ) : null}
            {project.deadline ? (
              <p>
                Livraison :{" "}
                <strong className={project.overdue ? "text-[#dc2626]" : "text-[#18181b]"}>
                  {fmt(project.deadline)}
                  {project.overdue ? " (retard)" : ""}
                </strong>
              </p>
            ) : null}
            {project.budget ? (
              <p>
                Budget :{" "}
                <strong className="text-[#18181b]">
                  {new Intl.NumberFormat("fr-FR").format(project.budget)} XOF
                </strong>
              </p>
            ) : null}
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-[#18181b]">Avancement</h2>
            <span className="text-[20px] font-bold text-[#18181b]">
              {project.progressPercent}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#f4f4f5]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${project.progressPercent}%`,
                backgroundColor:
                  project.progressPercent === 100
                    ? "#16a34a"
                    : project.progressPercent >= 50
                    ? "#2563eb"
                    : "#d97706",
              }}
            />
          </div>
          <p className="mt-2 text-[13px] text-[#71717a]">
            {doneTasks} tâche{doneTasks !== 1 ? "s" : ""} terminée{doneTasks !== 1 ? "s" : ""} sur {totalTasks}
          </p>

          {project.estimatedHours && Number(project.estimatedHours) > 0 ? (
            <div className="mt-4 flex items-center gap-6 text-[13px] text-[#71717a]">
              <p>
                Estimé :{" "}
                <strong className="text-[#18181b]">{project.estimatedHours}h</strong>
              </p>
              {project.loggedHours && Number(project.loggedHours) > 0 ? (
                <p>
                  Réalisé :{" "}
                  <strong className="text-[#18181b]">{project.loggedHours}h</strong>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Milestones */}
        {project.milestones.length > 0 ? (
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f4f4f5]">
              <h2 className="text-[15px] font-semibold text-[#18181b]">Jalons</h2>
            </div>
            <div className="divide-y divide-[#f4f4f5]">
              {project.milestones.map((m) => {
                const isDone = m.status === "COMPLETED";
                return (
                  <div key={m.id} className="flex items-start gap-3 px-6 py-4">
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle className="h-4 w-4 text-[#16a34a]" />
                      ) : m.overdue ? (
                        <AlertCircle className="h-4 w-4 text-[#dc2626]" />
                      ) : (
                        <Flag className="h-4 w-4 text-[#d97706]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-medium"
                        style={{ color: isDone ? "#16a34a" : m.overdue ? "#dc2626" : "#18181b" }}
                      >
                        {m.title}
                      </p>
                      {m.description ? (
                        <p className="mt-0.5 text-[12px] text-[#71717a]">{m.description}</p>
                      ) : null}
                      <p className="mt-0.5 text-[12px] text-[#a1a1aa]">
                        {isDone
                          ? `Complété le ${m.completedAt ? fmtShort(m.completedAt) : "—"}`
                          : `Échéance : ${fmtShort(m.dueDate)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Tasks */}
        {project.tasks.length > 0 ? (
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f4f4f5]">
              <h2 className="text-[15px] font-semibold text-[#18181b]">Tâches</h2>
              <span className="text-[13px] text-[#71717a]">
                {doneTasks}/{totalTasks}
              </span>
            </div>
            <div className="divide-y divide-[#f4f4f5]">
              {project.tasks.map((task) => {
                const tCfg = taskStatusConfig[task.status] ?? taskStatusConfig.TODO;
                const pCfg = priorityConfig[task.priority] ?? priorityConfig.MEDIUM;
                const isDone = task.status === "DONE";
                return (
                  <div key={task.id} className="flex items-start gap-3 px-6 py-4">
                    <div
                      className="mt-0.5 shrink-0"
                      style={{ color: tCfg.color }}
                    >
                      {tCfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-medium"
                        style={{ color: isDone ? "#a1a1aa" : "#18181b", textDecoration: isDone ? "line-through" : "none" }}
                      >
                        {task.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px]">
                        <span style={{ color: tCfg.color }}>{tCfg.label}</span>
                        <span
                          className="rounded px-1.5 py-0.5"
                          style={{ color: pCfg.color, backgroundColor: pCfg.color + "18" }}
                        >
                          {pCfg.label}
                        </span>
                        {task.dueDate ? (
                          <span
                            className={task.overdue && !isDone ? "text-[#dc2626]" : "text-[#a1a1aa]"}
                          >
                            {fmtShort(task.dueDate)}
                            {task.overdue && !isDone ? " ⚠" : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Done state */}
        {project.status === "DONE" ? (
          <div className="rounded-2xl bg-[#f0fdf4] p-6 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-[#16a34a]" />
            <h2 className="text-[17px] font-bold text-[#166534]">Projet terminé</h2>
            <p className="mt-1 text-[13px] text-[#16a34a]">
              Toutes les livrables ont été complétés.
            </p>
          </div>
        ) : null}

        <p className="text-center text-[12px] text-[#a1a1aa]">
          <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
          Suivi de projet · AtlasCRM
        </p>
      </div>
    </div>
  );
}
