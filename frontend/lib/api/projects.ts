import { api } from "../axios";
import type {
  Project,
  ProjectSummary,
  ProjectStats,
  ProjectStatus,
  ProjectTask,
  ProjectMilestone,
  PageResponse,
} from "@/types/api";

export interface ProjectListParams {
  page?: number;
  size?: number;
  status?: ProjectStatus;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  clientId: number;
  contractId?: number;
  priority?: string;
  startDate?: string;
  deadline?: string;
  budget?: number;
  estimatedHours?: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedToId?: number;
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  position?: number;
}

export interface CreateMilestonePayload {
  title: string;
  description?: string;
  dueDate: string;
  billable?: boolean;
  amount?: number;
}

export async function listProjects(
  agencyId: number,
  params: ProjectListParams = {},
): Promise<PageResponse<ProjectSummary>> {
  const { data } = await api.get<PageResponse<ProjectSummary>>(
    `/api/agencies/${agencyId}/projects`,
    { params },
  );
  return data;
}

export async function getProject(agencyId: number, projectId: number): Promise<Project> {
  const { data } = await api.get<Project>(
    `/api/agencies/${agencyId}/projects/${projectId}`,
  );
  return data;
}

export async function createProject(
  agencyId: number,
  payload: CreateProjectPayload,
): Promise<Project> {
  const { data } = await api.post<Project>(
    `/api/agencies/${agencyId}/projects`,
    payload,
  );
  return data;
}

export async function updateProject(
  agencyId: number,
  projectId: number,
  payload: CreateProjectPayload,
): Promise<Project> {
  const { data } = await api.put<Project>(
    `/api/agencies/${agencyId}/projects/${projectId}`,
    payload,
  );
  return data;
}

export async function updateProjectStatus(
  agencyId: number,
  projectId: number,
  status: ProjectStatus,
): Promise<Project> {
  const { data } = await api.patch<Project>(
    `/api/agencies/${agencyId}/projects/${projectId}/status`,
    null,
    { params: { status } },
  );
  return data;
}

export async function deleteProject(agencyId: number, projectId: number): Promise<void> {
  await api.delete(`/api/agencies/${agencyId}/projects/${projectId}`);
}

export async function getProjectStats(agencyId: number): Promise<ProjectStats> {
  const { data } = await api.get<ProjectStats>(
    `/api/agencies/${agencyId}/projects/stats`,
  );
  return data;
}

export async function createTask(
  agencyId: number,
  projectId: number,
  payload: CreateTaskPayload,
): Promise<ProjectTask> {
  const { data } = await api.post<ProjectTask>(
    `/api/agencies/${agencyId}/projects/${projectId}/tasks`,
    payload,
  );
  return data;
}

export async function updateTaskStatus(
  agencyId: number,
  projectId: number,
  taskId: number,
  status: string,
): Promise<ProjectTask> {
  const { data } = await api.patch<ProjectTask>(
    `/api/agencies/${agencyId}/projects/${projectId}/tasks/${taskId}/status`,
    null,
    { params: { status } },
  );
  return data;
}

export async function deleteTask(
  agencyId: number,
  projectId: number,
  taskId: number,
): Promise<void> {
  await api.delete(
    `/api/agencies/${agencyId}/projects/${projectId}/tasks/${taskId}`,
  );
}

export async function createMilestone(
  agencyId: number,
  projectId: number,
  payload: CreateMilestonePayload,
): Promise<ProjectMilestone> {
  const { data } = await api.post<ProjectMilestone>(
    `/api/agencies/${agencyId}/projects/${projectId}/milestones`,
    payload,
  );
  return data;
}

export async function completeMilestone(
  agencyId: number,
  projectId: number,
  milestoneId: number,
): Promise<ProjectMilestone> {
  const { data } = await api.post<ProjectMilestone>(
    `/api/agencies/${agencyId}/projects/${projectId}/milestones/${milestoneId}/complete`,
  );
  return data;
}
