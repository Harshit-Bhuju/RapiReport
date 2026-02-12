import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import api from "@/lib/api";
import API from "@/Configs/ApiEndpoints";

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

      updateProfile: async (profileData) => {
        try {
          const response = await api.post(API.UPDATE_PROFILE, profileData);

          if (response.data.status === "success") {
            const userData = response.data.user;
            set({
              user: userData,
              isProfileComplete: !!userData?.profileComplete,
            });
            return { success: true };
          }
          return { success: false, message: response.data.message };
        } catch (error) {
          console.error("Update Profile Error:", error);
          return { success: false, message: "Network error" };
        }
      },

      updateUser: (userData) =>
        set({
          user: userData,
          isProfileComplete: !!userData?.profileComplete,
        }),

      checkAuth: async () => {
        try {
          const response = await api.get(API.GET_CURRENT_USER);
          if (response.data.status === "success" && response.data.user) {
            const userData = response.data.user;
            set({
              user: userData,
              isAuthenticated: true,
              isProfileComplete: !!userData.profileComplete,
            });
            return true;
          }
          return false;
        } catch (error) {
          if (error.response?.status === 401) {
            localStorage.removeItem("auth_token");
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isProfileComplete: false,
            });
          }
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isProfileComplete: state.isProfileComplete,
      }),
    },
  ),
);
