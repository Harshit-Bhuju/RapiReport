import { create } from "zustand";
import { persist } from "zustand/middleware";
import API from "../Configs/ApiEndpoints";

const todayKey = () => new Date().toISOString().slice(0, 10);

const apiGet = async (url) => {
  try {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
};

const apiPost = async (url, body) => {
  try {
    return await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    return { ok: false };
  }
};

// Health store: persisted locally, synced with backend when logged in
export const useHealthStore = create(
  persist(
    (set, get) => ({
      prescriptions: [],
      symptoms: [],
      dietLogs: [],

      // ---------- Fetch from backend ----------
      fetchPrescriptions: async () => {
        const j = await apiGet(API.PRESCRIPTIONS_LIST);
        if (j?.status === "success") set({ prescriptions: j.data ?? [] });
      },
      fetchSymptoms: async () => {
        const j = await apiGet(API.SYMPTOMS_LIST);
        if (j?.status === "success") set({ symptoms: j.data ?? [] });
      },
      fetchDietLogs: async () => {
        const j = await apiGet(API.DIET_LIST);
        if (j?.status === "success") set({ dietLogs: j.data ?? [] });
      },
      fetchHealthData: async () => {
        const g = get();
        await Promise.all([
          g.fetchPrescriptions(),
          g.fetchSymptoms(),
          g.fetchDietLogs(),
        ]);
      },

      // ---------- Prescriptions ----------
      addPrescription: async (rx) => {
        let res;

        // Check if rx is FormData (contains image)
        if (rx instanceof FormData) {
          res = await fetch(API.PRESCRIPTIONS_CREATE, {
            method: "POST",
            credentials: "include",
            body: rx, // Don't set Content-Type, browser will set it with boundary
          });
        } else {
          // JSON fallback (no image)
          res = await apiPost(API.PRESCRIPTIONS_CREATE, {
            note: rx.note ?? "",
            rawText: rx.rawText ?? rx.raw_text ?? "",
            meds: rx.meds ?? [],
          });
        }

        if (res?.ok) await get().fetchPrescriptions();
        else
          set((state) => ({
            prescriptions: [
              {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                ...rx,
              },
              ...state.prescriptions,
            ],
          }));
      },
      removePrescription: async (id) => {
        const res = await apiPost(API.PRESCRIPTIONS_DELETE, { id });
        if (res?.ok) await get().fetchPrescriptions();
        else
          set((state) => ({
            prescriptions: state.prescriptions.filter((p) => p.id !== id),
          }));
      },

      // ---------- Symptoms ----------
      addSymptom: async (entry) => {
        const res = await apiPost(API.SYMPTOMS_LIST, {
          date: entry.date ?? todayKey(),
          text: entry.text ?? "",
          severity: entry.severity ?? "mild",
          vitals: entry.vitals ?? null,
        });
        if (res?.ok) await get().fetchSymptoms();
        else
          set((state) => ({
            symptoms: [
              {
                id: crypto.randomUUID(),
                date: todayKey(),
                severity: "mild",
                ...entry,
              },
              ...state.symptoms,
            ],
          }));
      },
      removeSymptom: async (id) => {
        const res = await apiPost(API.SYMPTOMS_LIST, {
          delete_id: parseInt(id, 10),
        });
        if (res?.ok) await get().fetchSymptoms();
        else
          set((state) => ({
            symptoms: state.symptoms.filter((s) => s.id !== id),
          }));
      },

      // ---------- Diet ----------
      addDietLog: async (entry) => {
        const res = await apiPost(API.DIET_LIST, {
          date: entry.date ?? todayKey(),
          mealType: entry.mealType ?? entry.meal_type ?? "breakfast",
          items: entry.items ?? "",
          note: entry.note ?? "",
        });
        if (res?.ok) await get().fetchDietLogs();
        else
          set((state) => ({
            dietLogs: [
              {
                id: crypto.randomUUID(),
                date: todayKey(),
                mealType: "breakfast",
                ...entry,
              },
              ...state.dietLogs,
            ],
          }));
      },
      removeDietLog: async (id) => {
        const res = await apiPost(API.DIET_LIST, {
          delete_id: parseInt(id, 10),
        });
        if (res?.ok) await get().fetchDietLogs();
        else
          set((state) => ({
            dietLogs: state.dietLogs.filter((d) => d.id !== id),
          }));
      },
    }),
    { name: "health-storage" },
  ),
);
