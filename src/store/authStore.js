import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      role: "patient", // 'patient' | 'lab' | 'admin'

      login: (userData, authToken) => {
        localStorage.setItem("auth_token", authToken);
        set({
          user: userData,
          token: authToken,
          isAuthenticated: true,
          role: userData.role || "patient",
        });
      },

      logout: () => {
        localStorage.removeItem("auth_token");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          role: "patient",
        });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    },
  ),
);
