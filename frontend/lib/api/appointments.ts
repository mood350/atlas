import { api } from "../axios";
import type {
  Appointment,
  AppointmentSummary,
  AppointmentStats,
  AppointmentStatus,
  PageResponse,
} from "@/types/api";

export interface AppointmentListParams {
  page?: number;
  size?: number;
  status?: AppointmentStatus;
}

export interface CreateAppointmentPayload {
  memberId: number;
  clientId?: number;
  title: string;
  description?: string;
  type: string;
  meetingProvider: string;
  startTime: string;
  endTime: string;
  location?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export async function listAppointments(
  agencyId: number,
  params: AppointmentListParams = {},
): Promise<PageResponse<AppointmentSummary>> {
  const { data } = await api.get<PageResponse<AppointmentSummary>>(
    `/api/agencies/${agencyId}/appointments`,
    { params },
  );
  return data;
}

export async function getAppointment(
  agencyId: number,
  appointmentId: number,
): Promise<Appointment> {
  const { data } = await api.get<Appointment>(
    `/api/agencies/${agencyId}/appointments/${appointmentId}`,
  );
  return data;
}

export async function createAppointment(
  agencyId: number,
  payload: CreateAppointmentPayload,
): Promise<Appointment> {
  const { data } = await api.post<Appointment>(
    `/api/agencies/${agencyId}/appointments`,
    payload,
  );
  return data;
}

export async function confirmAppointment(
  agencyId: number,
  appointmentId: number,
): Promise<Appointment> {
  const { data } = await api.post<Appointment>(
    `/api/agencies/${agencyId}/appointments/${appointmentId}/confirm`,
  );
  return data;
}

export async function cancelAppointment(
  agencyId: number,
  appointmentId: number,
  reason?: string,
): Promise<Appointment> {
  const { data } = await api.post<Appointment>(
    `/api/agencies/${agencyId}/appointments/${appointmentId}/cancel`,
    null,
    { params: reason ? { reason } : undefined },
  );
  return data;
}

export async function completeAppointment(
  agencyId: number,
  appointmentId: number,
): Promise<Appointment> {
  const { data } = await api.post<Appointment>(
    `/api/agencies/${agencyId}/appointments/${appointmentId}/complete`,
  );
  return data;
}

export async function deleteAppointment(
  agencyId: number,
  appointmentId: number,
): Promise<void> {
  await api.delete(`/api/agencies/${agencyId}/appointments/${appointmentId}`);
}

export async function getAppointmentStats(
  agencyId: number,
): Promise<AppointmentStats> {
  const { data } = await api.get<AppointmentStats>(
    `/api/agencies/${agencyId}/appointments/stats`,
  );
  return data;
}
