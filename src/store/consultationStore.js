import { create } from 'zustand';

export const useConsultationStore = create((set) => ({
    activeCall: null, // { appointment, roomId, isCaller, status }

    setActiveCall: (call) => set({ activeCall: call }),
    updateCallStatus: (status) => set((state) => ({
        activeCall: state.activeCall ? { ...state.activeCall, status } : null
    })),
    clearActiveCall: () => set({ activeCall: null }),
}));
