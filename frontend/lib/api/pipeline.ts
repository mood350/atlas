import { api } from "../axios";
import type { Pipeline } from "@/types/api";

export async function listPipelines(agencyId: number): Promise<Pipeline[]> {
  const { data } = await api.get<Pipeline[]>(
    `/api/agencies/${agencyId}/pipelines`,
  );
  return data;
}

export interface CreatePipelinePayload {
  name: string;
  description?: string;
  isDefault: boolean;
}

export async function createPipeline(
  agencyId: number,
  payload: CreatePipelinePayload,
): Promise<Pipeline> {
  const { data } = await api.post<Pipeline>(
    `/api/agencies/${agencyId}/pipelines`,
    payload,
  );
  return data;
}

export async function getPipeline(
  agencyId: number,
  pipelineId: number,
): Promise<Pipeline> {
  const { data } = await api.get<Pipeline>(
    `/api/agencies/${agencyId}/pipelines/${pipelineId}`,
  );
  return data;
}

export interface CreateStagePayload {
  name: string;
  position: number;
  color: string;
  probability: number;
}

export async function createStage(
  agencyId: number,
  pipelineId: number,
  payload: CreateStagePayload,
): Promise<Pipeline> {
  const { data } = await api.post<Pipeline>(
    `/api/agencies/${agencyId}/pipelines/${pipelineId}/stages`,
    payload,
  );
  return data;
}
