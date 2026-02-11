import { create } from "zustand";

export const useGameStore = create((set, get) => ({
  // User Stats
  user: {
    name: "You",
    pointsToday: 0,
    cumulativePoints: 320,
    areaCapturedKm2: 0,
  },

  // Geolocation
  currentLocation: null, // { lat, lng }
  pathHistory: [], // Array of [lat, lng]

  // Game Data
  capturedTerritories: [], // Array of polygons/circles

  // Leaderboard (Mock Data)
  leaderboard: [
    {
      rank: 1,
      name: "Ramesh Thapa",
      points: 480,
      avatar: "https://i.pravatar.cc/150?u=ramesh",
    },
    {
      rank: 2,
      name: "Sita Lama",
      points: 400,
      avatar: "https://i.pravatar.cc/150?u=sita",
    },
    {
      rank: 3,
      name: "Hari Gurung",
      points: 350,
      avatar: "https://i.pravatar.cc/150?u=hari",
    },
  ],

  // Rewards
  rewards: [
    {
      id: 1,
      title: "Doctor Consultation",
      pointsRequired: 300,
      icon: "stethoscope",
    },
    { id: 2, title: "Health Voucher", pointsRequired: 200, icon: "ticket" },
    { id: 3, title: "Yoga Session", pointsRequired: 150, icon: "activity" },
  ],

  // Actions
  updateLocation: (lat, lng) => {
    set((state) => {
      const newPath = [...state.pathHistory, [lat, lng]];
      // Simplified "Area" calculation: +0.001 km2 per movement update for demo
      const newArea = state.user.areaCapturedKm2 + 0.0001;
      const points = state.user.pointsToday + 5; // 5 points per update

      return {
        currentLocation: { lat, lng },
        pathHistory: newPath,
        user: {
          ...state.user,
          areaCapturedKm2: parseFloat(newArea.toFixed(4)),
          pointsToday: points,
          cumulativePoints: state.user.cumulativePoints + 5,
        },
      };
    });
  },

  redeemReward: (rewardId) => {
    const reward = get().rewards.find((r) => r.id === rewardId);
    if (!reward) return;

    set((state) => {
      if (state.user.cumulativePoints >= reward.pointsRequired) {
        return {
          user: {
            ...state.user,
            cumulativePoints:
              state.user.cumulativePoints - reward.pointsRequired,
          },
        };
      }
      return {};
    });
  },
}));
