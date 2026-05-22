import { api } from "../axios";
import type { User } from "@/types/api";

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  timezone?: string;
  preferredLanguage?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface NotificationPrefsPayload {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  whatsappNotificationsEnabled: boolean;
}

export async function getMyProfile(): Promise<User> {
  const { data } = await api.get<User>("/api/me");
  return data;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.put<User>("/api/me", payload);
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.patch("/api/me/password", payload);
}

export async function updateNotificationPrefs(
  payload: NotificationPrefsPayload,
): Promise<User> {
  const { data } = await api.patch<User>("/api/me/notifications", payload);
  return data;
}
