import { create } from "zustand";

// Distance in meters between two lat/lng points (Haversine)
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

// Quest pool: place (go to X) and walk (walk Y meters). Tagged by age & health.
// ageGroup: "any" | "young" (<25) | "adult" (25-55) | "senior" (55+)
// fitnessLevel: "light" | "moderate" | "active" — affects suggested difficulty & reward
// healthConsideration: "any" | "heart" | "diabetes" | "bp" | "thyroid" | "general"
const QUEST_POOL = [
  // —— Place quests (go to this place) ——
  {
    id: "p1",
    type: "place",
    title: "Central Park",
    description: "Visit the main park for a short stroll",
    lat: 27.7172,
    lng: 85.324,
    radiusMeters: 80,
    points: 40,
    icon: "park",
    ageGroup: "any",
    fitnessLevel: "light",
    healthConsideration: "any",
  },
  {
    id: "p2",
    type: "place",
    title: "Health Post North",
    description: "Reach the health post",
    lat: 27.72,
    lng: 85.33,
    radiusMeters: 60,
    points: 50,
    icon: "health",
    ageGroup: "any",
    fitnessLevel: "light",
    healthConsideration: "heart",
  },
  {
    id: "p3",
    type: "place",
    title: "Community Center",
    description: "Find the community center",
    lat: 27.71,
    lng: 85.31,
    radiusMeters: 70,
    points: 45,
    icon: "community",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
  },
  {
    id: "p4",
    type: "place",
    title: "Temple Square",
    description: "Walk to the temple square",
    lat: 27.714,
    lng: 85.318,
    radiusMeters: 70,
    points: 35,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "light",
    healthConsideration: "general",
  },
  {
    id: "p5",
    type: "place",
    title: "Local Clinic",
    description: "Visit the local clinic area",
    lat: 27.722,
    lng: 85.327,
    radiusMeters: 65,
    points: 55,
    icon: "health",
    ageGroup: "adult",
    fitnessLevel: "moderate",
    healthConsideration: "any",
  },
  {
    id: "p6",
    type: "place",
    title: "Green Garden",
    description: "Reach the green garden",
    lat: 27.719,
    lng: 85.322,
    radiusMeters: 75,
    points: 30,
    icon: "park",
    ageGroup: "senior",
    fitnessLevel: "light",
    healthConsideration: "diabetes",
  },
  {
    id: "p7",
    type: "place",
    title: "Youth Park",
    description: "Go to the youth park",
    lat: 27.715,
    lng: 85.335,
    radiusMeters: 80,
    points: 60,
    icon: "park",
    ageGroup: "young",
    fitnessLevel: "active",
    healthConsideration: "any",
  },
  {
    id: "p8",
    type: "place",
    title: "BP Check Point",
    description: "Walk to the blood pressure check point",
    lat: 27.718,
    lng: 85.329,
    radiusMeters: 60,
    points: 50,
    icon: "health",
    ageGroup: "adult",
    fitnessLevel: "light",
    healthConsideration: "bp",
  },
  // —— Walk quests (walk this much) ——
  {
    id: "w1",
    type: "walk",
    title: "Short stroll",
    description: "Walk 200 meters",
    targetMeters: 200,
    points: 25,
    ageGroup: "any",
    fitnessLevel: "light",
    healthConsideration: "any",
  },
  {
    id: "w2",
    type: "walk",
    title: "Gentle walk",
    description: "Walk 400 meters",
    targetMeters: 400,
    points: 40,
    ageGroup: "any",
    fitnessLevel: "light",
    healthConsideration: "heart",
  },
  {
    id: "w3",
    type: "walk",
    title: "Park loop",
    description: "Walk 600 meters",
    targetMeters: 600,
    points: 50,
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
  },
  {
    id: "w4",
    type: "walk",
    title: "Morning walk",
    description: "Walk 800 meters",
    targetMeters: 800,
    points: 60,
    ageGroup: "adult",
    fitnessLevel: "moderate",
    healthConsideration: "diabetes",
  },
  {
    id: "w5",
    type: "walk",
    title: "Healthy distance",
    description: "Walk 1 km",
    targetMeters: 1000,
    points: 75,
    ageGroup: "adult",
    fitnessLevel: "moderate",
    healthConsideration: "any",
  },
  {
    id: "w6",
    type: "walk",
    title: "Senior stroll",
    description: "Walk 300 meters at your pace",
    targetMeters: 300,
    points: 35,
    ageGroup: "senior",
    fitnessLevel: "light",
    healthConsideration: "general",
  },
  {
    id: "w7",
    type: "walk",
    title: "Active walk",
    description: "Walk 1.5 km",
    targetMeters: 1500,
    points: 90,
    ageGroup: "young",
    fitnessLevel: "active",
    healthConsideration: "any",
  },
  {
    id: "w8",
    type: "walk",
    title: "Cardio goal",
    description: "Walk 2 km",
    targetMeters: 2000,
    points: 110,
    ageGroup: "adult",
    fitnessLevel: "active",
    healthConsideration: "heart",
  },
  {
    id: "w9",
    type: "walk",
    title: "Quick 500 m",
    description: "Walk 500 meters",
    targetMeters: 500,
    points: 45,
    ageGroup: "any",
    fitnessLevel: "light",
    healthConsideration: "bp",
  },
];

function getAgeGroup(age) {
  if (age == null || age === "") return "adult";
  const a = Number(age);
  if (a < 25) return "young";
  if (a > 55) return "senior";
  return "adult";
}

function questMatchesProfile(q, profile) {
  const hasCondition = (key) =>
    Array.isArray(profile?.conditions) && profile.conditions.includes(key);
  if (!profile || (profile.age == null && !profile.conditions?.length)) {
    return q.ageGroup === "any" && (q.healthConsideration === "any" || q.healthConsideration === "general");
  }
  const ageGroup = getAgeGroup(profile.age);
  if (q.ageGroup !== "any" && q.ageGroup !== ageGroup) return false;
  if (q.healthConsideration === "any" || q.healthConsideration === "general") return true;
  return hasCondition(q.healthConsideration);
}

export const useGameStore = create((set, get) => ({
  user: {
    name: "You",
    pointsToday: 0,
    cumulativePoints: 0,
    questsCompleted: 0,
  },

  currentLocation: null,
  pathHistory: [],
  distanceWalkedMeters: 0,

  // Profile from auth (age, conditions) — used to filter quests
  questProfile: null,

  // Active quests (place + walk) with progress. Derived from pool + profile.
  quests: QUEST_POOL.filter((q) => questMatchesProfile(q, null)).map((q) => ({
    ...q,
    completed: false,
    progressMeters: q.type === "walk" ? 0 : undefined,
  })),

  leaderboard: [
    { rank: 1, name: "Alpha", points: 2500 },
    { rank: 2, name: "Bravo", points: 1800 },
    { rank: 3, name: "Charlie", points: 1200 },
  ],

  rewards: [
    { id: 1, title: "Free AI Consultation", pointsRequired: 500, icon: "stethoscope" },
    { id: 2, title: "Lab Test Voucher", pointsRequired: 300, icon: "ticket" },
    { id: 3, title: "Premium Access (1 Week)", pointsRequired: 200, icon: "activity" },
    { id: 4, title: "Health Kit Bundle", pointsRequired: 1000, icon: "gift" },
  ],

  setQuestProfile: (profile) => {
    const matches = QUEST_POOL.filter((q) => questMatchesProfile(q, profile));
    set((s) => {
      const existingById = Object.fromEntries(s.quests.map((q) => [q.id, q]));
      const dist = s.distanceWalkedMeters;
      const withProgress = matches.map((q) => {
        const existing = existingById[q.id];
        const completed = existing?.completed ?? false;
        const progressMeters =
          q.type === "walk"
            ? (completed ? q.targetMeters : Math.min(Math.round(dist), q.targetMeters))
            : undefined;
        return {
          ...q,
          completed,
          progressMeters,
        };
      });
      return { questProfile: profile, quests: withProgress };
    });
  },

  updateLocation: (lat, lng) => {
    const { currentLocation, pathHistory, quests, distanceWalkedMeters } = get();
    const newPoint = [lat, lng];
    const newPath = currentLocation
      ? [...pathHistory.slice(-300), newPoint]
      : [newPoint];
    const addedMeters = pathHistory.length >= 1
      ? distanceMeters(
          pathHistory[pathHistory.length - 1][0],
          pathHistory[pathHistory.length - 1][1],
          lat,
          lng,
        )
      : 0;
    const totalWalked = distanceWalkedMeters + addedMeters;

    let updatedQuests = quests;
    let pointsEarned = 0;
    let newlyCompleted = 0;

    quests.forEach((q) => {
      if (q.completed) return;
      if (q.type === "place") {
        const dist = distanceMeters(lat, lng, q.lat, q.lng);
        if (dist <= q.radiusMeters) {
          pointsEarned += q.points;
          newlyCompleted += 1;
          updatedQuests = updatedQuests.map((x) =>
            x.id === q.id ? { ...x, completed: true } : x,
          );
        }
      } else if (q.type === "walk") {
        if (totalWalked >= q.targetMeters) {
          pointsEarned += q.points;
          newlyCompleted += 1;
          updatedQuests = updatedQuests.map((x) =>
            x.id === q.id ? { ...x, completed: true, progressMeters: q.targetMeters } : x,
          );
        } else {
          updatedQuests = updatedQuests.map((x) =>
            x.id === q.id ? { ...x, progressMeters: Math.round(totalWalked) } : x,
          );
        }
      }
    });

    set({
      currentLocation: { lat, lng },
      pathHistory: newPath,
      distanceWalkedMeters: totalWalked,
      quests: updatedQuests,
      user: {
        ...get().user,
        pointsToday: get().user.pointsToday + pointsEarned,
        cumulativePoints: get().user.cumulativePoints + pointsEarned,
        questsCompleted: get().user.questsCompleted + newlyCompleted,
      },
    });
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
