import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../lib/i18n";

export const useSettingsStore = create(
  persist(
    (set) => ({
      language: "ne",
      theme: "light",
      ageMode: "normal", // 'normal' | 'elderly'

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },

      setTheme: (theme) => {
        // Here you could add logic to toggle dark mode class on html
        set({ theme });
      },

      setAgeMode: (mode) => set({ ageMode: mode }),
      toggleAgeMode: () =>
        set((state) => ({
          ageMode: state.ageMode === "normal" ? "elderly" : "normal",
        })),
    }),
    {
      name: "settings-storage",
    },
  ),
);
