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
      adherenceLogs: [],
      adherenceReminders: [],
      symptoms: [],
      activityLogs: [],
      dietLogs: [],

      // ---------- Fetch from backend ----------
      fetchPrescriptions: async () => {
        const j = await apiGet(API.PRESCRIPTIONS_LIST);
        if (j?.status === "success") set({ prescriptions: j.data ?? [] });
      },
      fetchAdherenceLogs: async () => {
        const j = await apiGet(API.ADHERENCE_LOGS);
        if (j?.status === "success") set({ adherenceLogs: j.data ?? [] });
      },
      fetchAdherenceReminders: async () => {
        const j = await apiGet(API.ADHERENCE_REMINDERS);
        if (j?.status === "success") set({ adherenceReminders: j.data ?? [] });
      },
      fetchSymptoms: async () => {
        const j = await apiGet(API.SYMPTOMS_LIST);
        if (j?.status === "success") set({ symptoms: j.data ?? [] });
      },
      fetchActivityLogs: async () => {
        const j = await apiGet(API.ACTIVITY_LIST);
        if (j?.status === "success") set({ activityLogs: j.data ?? [] });
      },
      fetchDietLogs: async () => {
        const j = await apiGet(API.DIET_LIST);
        if (j?.status === "success") set({ dietLogs: j.data ?? [] });
      },
      fetchHealthData: async () => {
        const g = get();
        await Promise.all([
          g.fetchPrescriptions(),
          g.fetchAdherenceLogs(),
          g.fetchAdherenceReminders(),
          g.fetchSymptoms(),
          g.fetchActivityLogs(),
          g.fetchDietLogs(),
        ]);
      },

      // ---------- Prescriptions ----------
      addPrescription: async (rx) => {
        const res = await apiPost(API.PRESCRIPTIONS_CREATE, {
          note: rx.note ?? "",
          rawText: rx.rawText ?? rx.raw_text ?? "",
          meds: rx.meds ?? [],
        });
        if (res?.ok) await get().fetchPrescriptions();
        else
          set((state) => ({
            prescriptions: [
              { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...rx },
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

      // ---------- Adherence ----------
      addAdherenceLog: async (entry) => {
        const res = await apiPost(API.ADHERENCE_LOGS, {
          date: entry.date ?? todayKey(),
          medicineName: entry.medicineName ?? entry.medicine_name,
          slot: entry.slot ?? "morning",
          taken: !!entry.taken,
        });
        if (res?.ok) await get().fetchAdherenceLogs();
        else
          set((state) => ({
            adherenceLogs: [
              { id: crypto.randomUUID(), date: todayKey(), ...entry },
              ...state.adherenceLogs,
            ],
          }));
      },
      setAdherenceTaken: async (logId, taken) => {
        const res = await apiPost(API.ADHERENCE_LOGS, {
          update_id: parseInt(logId, 10),
          taken,
        });
        if (res?.ok) await get().fetchAdherenceLogs();
        else
          set((state) => ({
            adherenceLogs: state.adherenceLogs.map((l) =>
              l.id === logId ? { ...l, taken } : l
            ),
          }));
      },
      addReminder: async (reminder) => {
        const res = await apiPost(API.ADHERENCE_REMINDERS, {
          medicineName: reminder.medicineName ?? reminder.medicine_name,
          slot: reminder.slot ?? "morning",
          time: reminder.time ?? "08:00",
        });
        if (res?.ok) await get().fetchAdherenceReminders();
        else
          set((state) => ({
            adherenceReminders: [
              ...state.adherenceReminders,
              { id: crypto.randomUUID(), enabled: true, ...reminder },
            ],
          }));
      },
      toggleReminder: async (id) => {
        const res = await apiPost(API.ADHERENCE_REMINDERS, {
          toggle_id: parseInt(id, 10),
        });
        if (res?.ok) await get().fetchAdherenceReminders();
        else
          set((state) => ({
            adherenceReminders: state.adherenceReminders.map((r) =>
              r.id === id ? { ...r, enabled: !r.enabled } : r
            ),
          }));
      },
      removeReminder: async (id) => {
        const res = await apiPost(API.ADHERENCE_REMINDERS, {
          delete_id: parseInt(id, 10),
        });
        if (res?.ok) await get().fetchAdherenceReminders();
        else
          set((state) => ({
            adherenceReminders: state.adherenceReminders.filter((r) => r.id !== id),
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

      // ---------- Activity ----------
      addActivity: async (entry) => {
        const res = await apiPost(API.ACTIVITY_LIST, {
          date: entry.date ?? todayKey(),
          type: entry.type ?? "steps",
          value: entry.value ?? 0,
          unit: entry.unit ?? "",
          note: entry.note ?? "",
        });
        if (res?.ok) await get().fetchActivityLogs();
        else
          set((state) => ({
            activityLogs: [
              { id: crypto.randomUUID(), date: todayKey(), ...entry },
              ...state.activityLogs,
            ],
          }));
      },
      removeActivity: async (id) => {
        const res = await apiPost(API.ACTIVITY_LIST, {
          delete_id: parseInt(id, 10),
        });
        if (res?.ok) await get().fetchActivityLogs();
        else
          set((state) => ({
            activityLogs: state.activityLogs.filter((a) => a.id !== id),
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

      getAdherenceStreak: () => {
        const logs = get().adherenceLogs;
        const takenByDate = new Set();
        logs.filter((l) => l.taken).forEach((l) => takenByDate.add(l.date));
        const sortedDates = [...takenByDate].sort().reverse();
        let streak = 0;
        const today = todayKey();
        for (let i = 0; i < sortedDates.length; i++) {
          const expected = new Date(today);
          expected.setDate(expected.getDate() - i);
          const key = expected.toISOString().slice(0, 10);
          if (sortedDates[i] === key) streak++;
          else break;
        }
        return streak;
      },
      getAdherencePointsToday: () => {
        const today = todayKey();
        return (
          get().adherenceLogs.filter((l) => l.date === today && l.taken).length *
          10
        );
      },
    }),
    { name: "health-storage" }
  )
);
