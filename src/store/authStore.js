import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: localStorage.getItem("auth_token"),
      isAuthenticated: !!localStorage.getItem("auth_token"),
      isProfileComplete: false,

      login: (userData, authToken) => {
        localStorage.setItem("auth_token", authToken);
        set({
          user: userData,
          token: authToken,
          isAuthenticated: true,
          isProfileComplete: !!userData?.profileComplete,
        });
      },

      logout: () => {
        localStorage.removeItem("auth_token");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isProfileComplete: false,
        });
      },

      updateProfile: (profileData) => {
        set((state) => ({
          user: { ...state.user, ...profileData, profileComplete: true },
          isProfileComplete: true,
        }));
      },

      updateUser: (userData) =>
        set({
          user: userData,
          isProfileComplete: !!userData?.profileComplete,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
