import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AgencyIdentity, User } from "@/types/api";
import { clearTokens } from "@/lib/auth";

interface AuthState {
  user: User | null;
  agency: AgencyIdentity | null;
  hydrated: boolean;
  setSession: (user: User) => void;
  setAgency: (agency: AgencyIdentity) => void;
  patchUser: (patch: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
}

/**
 * Derive the lightweight agency identity from a User payload.
 * The backend's `/api/me` returns `agencyId` + `agencyName` flat —
 * we promote that to a small struct the rest of the app can consume.
 */
function deriveAgency(user: User): AgencyIdentity | null {
  if (!user.agencyId) return null;
  return {
    id: user.agencyId,
    name: user.agencyName ?? "",
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      agency: null,
      hydrated: false,

      setSession: (user) =>
        set({ user, agency: deriveAgency(user) }),

      setAgency: (agency) => set({ agency }),

      patchUser: (patch) => {
        const current = get().user;
        if (!current) return;
        const next = { ...current, ...patch };
        set({ user: next, agency: deriveAgency(next) });
      },

      logout: () => {
        clearTokens();
        set({ user: null, agency: null });
      },

      isAuthenticated: () => Boolean(get().user),

      hasRole: (role) => Boolean(get().user?.roles.includes(role)),
    }),
    {
      name: "atlas-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, agency: state.agency }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
