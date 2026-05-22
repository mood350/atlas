"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listAppointments,
  getAppointment,
  createAppointment,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  addMeetingNotes,
  deleteAppointment,
  getAppointmentStats,
  type AppointmentListParams,
  type CreateAppointmentPayload,
} from "@/lib/api/appointments";
import { useAgencyId } from "./use-agency";

export function useAppointments(params: AppointmentListParams = {}) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["appointments", agencyId, params],
    queryFn: () => listAppointments(agencyId!, params),
    enabled: !!agencyId,
    placeholderData: keepPreviousData,
  });
}

export function useAppointment(appointmentId: number | null) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["appointment", agencyId, appointmentId],
    queryFn: () => getAppointment(agencyId!, appointmentId!),
    enabled: !!agencyId && !!appointmentId,
  });
}

export function useAppointmentStats() {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["appointment-stats", agencyId],
    queryFn: () => getAppointmentStats(agencyId!),
    enabled: !!agencyId,
    staleTime: 60_000,
  });
}

export function useCreateAppointment() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) =>
      createAppointment(agencyId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments", agencyId] });
      qc.invalidateQueries({ queryKey: ["appointment-stats", agencyId] });
    },
  });
}

export function useConfirmAppointment() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: number) => confirmAppointment(agencyId!, appointmentId),
    onSuccess: (appt) => {
      qc.invalidateQueries({ queryKey: ["appointments", agencyId] });
      qc.setQueryData(["appointment", agencyId, appt.id], appt);
    },
  });
}

export function useCancelAppointment() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      reason,
    }: {
      appointmentId: number;
      reason?: string;
    }) => cancelAppointment(agencyId!, appointmentId, reason),
    onSuccess: (appt) => {
      qc.invalidateQueries({ queryKey: ["appointments", agencyId] });
      qc.setQueryData(["appointment", agencyId, appt.id], appt);
      qc.invalidateQueries({ queryKey: ["appointment-stats", agencyId] });
    },
  });
}

export function useCompleteAppointment() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: number) => completeAppointment(agencyId!, appointmentId),
    onSuccess: (appt) => {
      qc.invalidateQueries({ queryKey: ["appointments", agencyId] });
      qc.setQueryData(["appointment", agencyId, appt.id], appt);
      qc.invalidateQueries({ queryKey: ["appointment-stats", agencyId] });
    },
  });
}

export function useAddMeetingNotes(appointmentId: number) {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes: string) => addMeetingNotes(agencyId!, appointmentId, notes),
    onSuccess: (appt) => {
      qc.setQueryData(["appointment", agencyId, appt.id], appt);
    },
  });
}

export function useDeleteAppointment() {
  const agencyId = useAgencyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: number) => deleteAppointment(agencyId!, appointmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments", agencyId] });
      qc.invalidateQueries({ queryKey: ["appointment-stats", agencyId] });
    },
  });
}
