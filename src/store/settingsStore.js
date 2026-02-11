import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettingsStore = create(
  persist(
    (set) => ({
      language: localStorage.getItem("language") || "ne",
      theme: "light",
      currency: "NPR",

      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme: theme }),
      setCurrency: (currency) => set({ currency: currency }),
    }),
    {
      name: "settings-storage",
    },
  ),
);
