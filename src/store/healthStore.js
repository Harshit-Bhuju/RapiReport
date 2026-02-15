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
      reports: [],
      adherenceLogs: [],
      adherenceReminders: [],
      symptoms: [],
      ocrHistory: [],

      historyAnalysis: null,

      // ---------- Fetch from backend ----------
      fetchPrescriptions: async () => {
        const j = await apiGet(API.PRESCRIPTIONS_LIST);
        if (j?.status === "success") set({ prescriptions: j.data ?? [] });
      },
      fetchReports: async () => {
        const j = await apiGet(API.REPORTS_LIST);
        if (j?.status === "success") set({ reports: j.data ?? [] });
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
      fetchOcrHistory: async () => {
        const j = await apiGet(API.OCR_HISTORY_LIST);
        if (j?.status === "success") set({ ocrHistory: j.data ?? [] });
      },

      fetchHistoryAnalysis: async (memberId = null) => {
        const body = memberId ? { member_id: memberId } : {};
        const res = await apiPost(API.AI_ANALYZE_HISTORY, body);
        let json = null;
        try {
          json = await res?.json?.();
        } catch {
          json = {};
        }
        if (json?.status === "success" && json?.analysis) {
          set({ historyAnalysis: json.analysis });
          return json.analysis;
        }
        throw new Error(json?.message || "Analysis failed");
      },
      fetchHealthData: async () => {
        const g = get();
        await Promise.all([
          g.fetchPrescriptions(),
          g.fetchReports(),
          g.fetchSymptoms(),
          g.fetchOcrHistory(),
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

      // ---------- Reports ----------
      addReport: async (report) => {
        let res;
        if (report instanceof FormData) {
          res = await fetch(API.REPORTS_CREATE, {
            method: "POST",
            credentials: "include",
            body: report,
          });
        } else {
          res = await apiPost(API.REPORTS_CREATE, report);
        }
        if (res?.ok) {
          await get().fetchReports();
          const json = await res.json();
          return json?.id ?? null;
        }
        return null;
      },
      removeReport: async (id) => {
        const res = await apiPost(API.REPORTS_DELETE, { id });
        if (res?.ok) await get().fetchReports();
        else
          set((state) => ({
            reports: state.reports.filter((r) => r.id !== id),
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
              l.id === logId ? { ...l, taken } : l,
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
              r.id === id ? { ...r, enabled: !r.enabled } : r,
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
            adherenceReminders: state.adherenceReminders.filter(
              (r) => r.id !== id,
            ),
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
    }),
    { name: "health-storage" },
  ),
);
