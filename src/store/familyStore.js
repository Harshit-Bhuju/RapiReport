import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFamilyStore = create(
  persist(
    (set) => ({
      members: [
        {
          id: "1",
          name: "Father",
          relation: "Father",
          age: 72,
          healthStatus: "Stable",
        },
        {
          id: "2",
          name: "Mother",
          relation: "Mother",
          age: 68,
          healthStatus: "Needs Checkup",
        },
      ],

      addMember: (member) =>
        set((state) => ({
          members: [...state.members, { ...member, id: Date.now().toString() }],
        })),

      removeMember: (id) =>
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        })),

      updateMemberStatus: (id, status) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, healthStatus: status } : m,
          ),
        })),
    }),
    {
      name: "family-storage",
    },
  ),
);
