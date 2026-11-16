import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthUser } from "@/types/user/AuthUser";

// start.gg login session. The access token lives here (localStorage) because
// the browser calls the start.gg API directly with it; the refresh token is
// in an HttpOnly cookie that only /api/auth can read.
interface AuthState {
  accessToken: string | null;
  // Milliseconds since epoch.
  expiresAt: number;
  user: AuthUser | null;
  setSession: (accessToken: string, expiresInSeconds: number) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      expiresAt: 0,
      user: null,
      setSession: (accessToken, expiresInSeconds) =>
        set({ accessToken, expiresAt: Date.now() + expiresInSeconds * 1000 }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, expiresAt: 0, user: null }),
    }),
    { name: "auth-store", storage: createJSONStorage(() => localStorage) },
  ),
);

export const useAuthUser = () => useAuthStore((s) => s.user);
