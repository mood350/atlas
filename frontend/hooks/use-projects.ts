"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  getProjectStats,
  createTask,
  updateTaskStatus,
  deleteTask,
  createMilestone,
  completeMilestone,
  type ProjectListParams,
  type CreateProjectPayload,
  type CreateTaskPayload,
  type CreateMilestonePayload,
} from "@/lib/api/projects";
import { useAgencyId } from "./use-agency";
import type { ProjectStatus } from "@/types/api";

export function useProjects(params: ProjectListParams = {}) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["projects", agencyId, params],
    queryFn: () => listProjects(agencyId!, params),
    enabled: !!agencyId,
    placeholderData: keepPreviousData,
  });
}

export function useProject(projectId: number | null) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["project", agencyId, projectId],
    queryFn: () => getProject(agencyId!, projectId!),
    enabled: !!agencyId && !!projectId,
  });
}

export function useProjectStats() {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["project-stats", agencyId],
    queryFn: () => getProjectStats(agencyId!),
    enabled: !!agencyId,
    staleTime: 60_000,
  });
}

export function useCreateProject() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(agencyId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", agencyId] });
      qc.invalidateQueries({ queryKey: ["project-stats", agencyId] });
    },
  });
}

export function useUpdateProject(projectId: number) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      updateProject(agencyId!, projectId, payload),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ["projects", agencyId] });
      qc.setQueryData(["project", agencyId, project.id], project);
    },
  });
}

export function useUpdateProjectStatus() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      status,
    }: {
      projectId: number;
      status: ProjectStatus;
    }) => updateProjectStatus(agencyId!, projectId, status),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ["projects", agencyId] });
      qc.setQueryData(["project", agencyId, project.id], project);
      qc.invalidateQueries({ queryKey: ["project-stats", agencyId] });
    },
  });
}

export function useDeleteProject() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => deleteProject(agencyId!, projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", agencyId] });
      qc.invalidateQueries({ queryKey: ["project-stats", agencyId] });
    },
  });
}

export function useCreateTask(projectId: number) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      createTask(agencyId!, projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", agencyId, projectId] });
    },
  });
}

export function useUpdateTaskStatus(projectId: number) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: string }) =>
      updateTaskStatus(agencyId!, projectId, taskId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", agencyId, projectId] });
    },
  });
}

export function useDeleteTask(projectId: number) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => deleteTask(agencyId!, projectId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", agencyId, projectId] });
    },
  });
}

export function useCreateMilestone(projectId: number) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMilestonePayload) =>
      createMilestone(agencyId!, projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", agencyId, projectId] });
    },
  });
}

export function useCompleteMilestone(projectId: number) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: number) =>
      completeMilestone(agencyId!, projectId, milestoneId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", agencyId, projectId] });
    },
  });
}
