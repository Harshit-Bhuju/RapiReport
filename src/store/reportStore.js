import { create } from "zustand";

// Mock data for initial demo
const MOCK_REPORTS = [
  {
    id: "1",
    date: "2025-01-15",
    title: "Complete Blood Count",
    type: "Blood",
    doctor: "Dr. Ram Sharma",
    lab: "Nepal Mediciti Lab",
    status: "Ready",
    summary: "Hemoglobin low. Iron supplement recommended.",
    isAbnormal: true,
    fileUrl: "#",
  },
  {
    id: "2",
    date: "2024-12-10",
    title: "Chest X-Ray",
    type: "Radiology",
    doctor: "Dr. Sita Karki",
    lab: "Bir Hospital",
    status: "Ready",
    summary: "Normal chest X-ray. No issues found.",
    isAbnormal: false,
    fileUrl: "#",
  },
];

export const useReportStore = create((set) => ({
  reports: MOCK_REPORTS,
  loading: false,
  error: null,

  fetchReports: async () => {
    set({ loading: true });
    // Simulate API call
    setTimeout(() => {
      set({ loading: false });
    }, 1000);
  },

  addReport: (report) =>
    set((state) => ({
      reports: [report, ...state.reports],
    })),

  getReportById: (id) => {
    // access state via get() if needed, but in simple actions we rely on selectors or passing ID
    return MOCK_REPORTS.find((r) => r.id === id);
  },
}));
