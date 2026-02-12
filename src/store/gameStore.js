import { create } from "zustand";

// Distance in meters between two lat/lng points (Haversine approx)
const distanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useGameStore = create((set, get) => ({
  user: {
    name: "You",
    pointsToday: 0,
    cumulativePoints: 0,
    questsCompleted: 0,
  },

  currentLocation: null,
  pathHistory: [],

  // Quests: go to a place within radius to complete (icon: park | health | community | pin)
  quests: [
    {
      id: "q1",
      title: "Central Park",
      description: "Visit the main park",
      lat: 27.7172,
      lng: 85.324,
      radiusMeters: 80,
      points: 50,
      icon: "park",
      completed: false,
    },
    {
      id: "q2",
      title: "Health Post North",
      description: "Reach the health post",
      lat: 27.72,
      lng: 85.33,
      radiusMeters: 60,
      points: 30,
      icon: "health",
      completed: false,
    },
    {
      id: "q3",
      title: "Community Center",
      description: "Find the community center",
      lat: 27.71,
      lng: 85.31,
      radiusMeters: 70,
      points: 40,
      icon: "community",
      completed: false,
    },
  ],

  leaderboard: [
    { rank: 1, name: "Alpha", points: 2500 },
    { rank: 2, name: "Bravo", points: 1800 },
    { rank: 3, name: "Charlie", points: 1200 },
  ],

  rewards: [
    {
      id: 1,
      title: "Free AI Consultation",
      pointsRequired: 500,
      icon: "stethoscope",
    },
    { id: 2, title: "Lab Test Voucher", pointsRequired: 300, icon: "ticket" },
    {
      id: 3,
      title: "Premium Access (1 Week)",
      pointsRequired: 200,
      icon: "activity",
    },
    { id: 4, title: "Health Kit Bundle", pointsRequired: 1000, icon: "gift" },
  ],

  updateLocation: (lat, lng) => {
    const { currentLocation, pathHistory, quests } = get();
    const newPoint = [lat, lng];

    // Check quest completion: within radius of any incomplete quest
    let updatedQuests = quests;
    let pointsEarned = 0;
    let newlyCompleted = 0;
    quests.forEach((q) => {
      if (q.completed) return;
      const dist = distanceMeters(lat, lng, q.lat, q.lng);
      if (dist <= q.radiusMeters) {
        pointsEarned += q.points;
        newlyCompleted += 1;
        updatedQuests = updatedQuests.map((x) =>
          x.id === q.id ? { ...x, completed: true } : x,
        );
      }
    });

    set((s) => ({
      currentLocation: { lat, lng },
      pathHistory: currentLocation
        ? [...s.pathHistory.slice(-200), newPoint]
        : [newPoint],
      quests: updatedQuests,
      user: {
        ...s.user,
        pointsToday: s.user.pointsToday + pointsEarned,
        cumulativePoints: s.user.cumulativePoints + pointsEarned,
        questsCompleted: s.user.questsCompleted + newlyCompleted,
      },
    }));
  },

  redeemReward: (rewardId) => {
    const { rewards, user } = get();
    const reward = rewards.find((r) => r.id === rewardId);
    if (reward && user.cumulativePoints >= reward.pointsRequired) {
      set((s) => ({
        user: {
          ...s.user,
          cumulativePoints: s.user.cumulativePoints - reward.pointsRequired,
        },
      }));
    }
  },

  fetchLeaderboard: async () => {},
  fetchUserStats: async () => {},
}));
