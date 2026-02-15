import { create } from "zustand";
import toast from "react-hot-toast";
import { getAPIBaseUrl } from "../config";

// Distance in meters between two lat/lng points (Haversine)
export const distanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Radius of the earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Delta in meters
};

// Quest pool: 100m range per quest. 0.0009 degrees ≈ 100m at mid-latitudes.
// Mix of walk and place quests with a nice path.
const QUEST_POOL = [
  {
    id: "pushup_1",
    type: "place",
    title: "Morning Strength",
    description: "Complete 5 Pushups to kickstart your day",
    offsetLat: 0.000005,
    offsetLng: 0,
    radiusMeters: 1,
    points: 100,
    icon: "health",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 5,
  },
  {
    id: "pushup_2",
    type: "place",
    title: "Core Booster",
    description: "Complete 8 Pushups for core stability",
    offsetLat: 0.000005,
    offsetLng: 0.000005,
    radiusMeters: 1,
    points: 120,
    icon: "activity",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 8,
  },
  {
    id: "pushup_3",
    type: "place",
    title: "Midday Power",
    description: "Complete 10 Pushups for energy",
    offsetLat: -0.000005,
    offsetLng: 0.000005,
    radiusMeters: 1,
    points: 150,
    icon: "zap",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 10,
  },
  {
    id: "pushup_4",
    type: "place",
    title: "Park Challenge",
    description: "Complete 12 Pushups in the fresh air",
    offsetLat: -0.000005,
    offsetLng: -0.000005,
    radiusMeters: 1,
    points: 180,
    icon: "park",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 12,
  },
  {
    id: "pushup_5",
    type: "place",
    title: "Stamina Test",
    description: "Complete 15 Pushups for endurance",
    offsetLat: 0,
    offsetLng: -0.000005,
    radiusMeters: 1,
    points: 200,
    icon: "activity",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 15,
  },
  {
    id: "pushup_6",
    type: "place",
    title: "Endurance Pro",
    description: "Complete 18 Pushups to level up",
    offsetLat: 0.00001, // ~1.1m
    offsetLng: 0,
    radiusMeters: 1,
    points: 250,
    icon: "trophy",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 18,
  },
  {
    id: "pushup_7",
    type: "place",
    title: "Focus Master",
    description: "Complete 20 Pushups with perfect form",
    offsetLat: 0,
    offsetLng: 0.00002,
    radiusMeters: 1,
    points: 300,
    icon: "target",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20,
  },
  {
    id: "pushup_8",
    type: "place",
    title: "Elite Strength",
    description: "Complete 22 Pushups for elite status",
    offsetLat: -0.00002,
    offsetLng: 0,
    radiusMeters: 1,
    points: 350,
    icon: "zap",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 22,
  },
  {
    id: "pushup_9",
    type: "place",
    title: "Ultimate Warrior",
    description: "Complete 25 Pushups to finish the set",
    offsetLat: 0,
    offsetLng: -0.00002,
    radiusMeters: 1,
    points: 400,
    icon: "health",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 25,
  },
  {
    id: "pushup_10",
    type: "place",
    title: "Daily Finale",
    description: "Complete 30 Pushups for the Super Bonus!",
    offsetLat: 0.00002,
    offsetLng: 0.00002,
    radiusMeters: 1,
    points: 500,
    icon: "trophy",
    isSuperPoint: true,
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 30,
  },
];

// Within this distance (m) user sees "You have reached the destination" and can start live tracking (1m for now)
export const ARRIVED_RADIUS_METERS = 1;

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
    return (
      q.ageGroup === "any" &&
      (q.healthConsideration === "any" || q.healthConsideration === "general")
    );
  }
  const ageGroup = getAgeGroup(profile.age);
  if (q.ageGroup !== "any" && q.ageGroup !== ageGroup) return false;
  if (q.healthConsideration === "any" || q.healthConsideration === "general")
    return true;
  return hasCondition(q.healthConsideration);
}

export const useGameStore = create((set, get) => ({
  // Set from QuestGame so API calls use logged-in user
  authUserId: null,
  setAuthUserId: (id) => set({ authUserId: id }),

  user: {
    name: "You",
    pointsToday: 0,
    weeklyPoints: 0,
    cumulativePoints: 0,
    dailyEarnings: [], // [{date: '2026-02-12', points: 100}, ...]
    questsCompleted: 0,
    questsToday: 0,
    lastRefreshDate: new Date().toISOString().split("T")[0],
  },
  engagedQuest: null,
  setEngagedQuest: (quest) => set({ engagedQuest: quest }),
  cancelQuest: () => set({ engagedQuest: null }),
  isAITracking: false,
  setIsAITracking: (isTracking) => set({ isAITracking: isTracking }),
  quests: [],
  currentLocation: null,
  pathHistory: [],
  distanceWalkedMeters: 0,

  // Profile from auth (age, conditions) — used to filter quests
  questProfile: null,

  // Active quests: only show ONE quest at a time (sequential)
  quests: [], // Will be populated in anchorQuestsToLocation or fetchQuests

  sequenceIndex: 0, // 0 to 9 for the day

  leaderboard: [],

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
    {
      id: 5,
      title: "Fitness Band Discount",
      pointsRequired: 800,
      icon: "activity",
    },
    {
      id: 6,
      title: "Doctor Consult Credit",
      pointsRequired: 600,
      icon: "stethoscope",
    },
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
            ? completed
              ? q.targetMeters
              : Math.min(Math.round(dist), q.targetMeters)
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
    const { currentLocation, pathHistory, quests, distanceWalkedMeters } =
      get();
    const newPoint = [lat, lng];
    const newPath = currentLocation
      ? [...pathHistory.slice(-300), newPoint]
      : [newPoint];
    const addedMeters =
      pathHistory.length >= 1
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
            x.id === q.id
              ? { ...x, completed: true, progressMeters: q.targetMeters }
              : x,
          );
        } else {
          updatedQuests = updatedQuests.map((x) =>
            x.id === q.id
              ? { ...x, progressMeters: Math.round(totalWalked) }
              : x,
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
    if (reward && (user.weeklyPoints || 0) >= reward.pointsRequired) {
      set((s) => ({
        user: {
          ...s.user,
          weeklyPoints: s.user.weeklyPoints - reward.pointsRequired,
          cumulativePoints: s.user.cumulativePoints - reward.pointsRequired,
        },
      }));
    }
  },

  completeQuest: async (questId) => {
    const { quests, user } = get();

    // Check daily limit
    const today = new Date().toISOString().split("T")[0];
    let currentQuestsToday = user.questsToday ?? 0;
    if (user.lastRefreshDate !== today) {
      currentQuestsToday = 0;
    }

    if (currentQuestsToday >= 10) {
      toast.error("Daily limit of 10 quests reached! Come back tomorrow.");
      return false;
    }

    const quest = quests.find((q) => q.id === questId);
    if (quest && !quest.completed) {
      const updatedQuests = quests.map((q) =>
        q.id === questId ? { ...q, completed: true } : q,
      );

      // Sync with backend - WAIT for response before updating state to ensure persistence
      const userId = get().authUserId ?? 1;
      try {
        const res = await fetch(`${getAPIBaseUrl()}/complete_quest.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            quest_id: questId,
            points: quest.points,
          }),
        });
        const json = await res.json();

        if (json.status !== "success") {
          console.error("Backend failed:", json.message);
          return false;
        }
      } catch (e) {
        console.error("Failed to sync quest:", e);
        return false;
      }

      set({
        quests: updatedQuests,
        user: {
          ...user,
          pointsToday:
            (user.lastRefreshDate === today ? user.pointsToday : 0) +
            (quest.points || 0),
          cumulativePoints: user.cumulativePoints + (quest.points || 0),
          questsCompleted: (user.questsCompleted || 0) + 1,
          questsToday: currentQuestsToday + 1,
          lastRefreshDate: today,
        },
      });
      return true;
    }
    return false;
  },

  skipQuest: async (questId) => {
    const { quests, user } = get();

    // Check daily limit
    const today = new Date().toISOString().split("T")[0];
    let currentQuestsToday = user.questsToday ?? 0;
    if (user.lastRefreshDate !== today) {
      currentQuestsToday = 0;
    }

    if (currentQuestsToday >= 10) {
      toast.error("Daily limit of 10 quests reached! Come back tomorrow.");
      return false;
    }

    const quest = quests.find((q) => q.id === questId);
    if (quest && !quest.completed) {
      const updatedQuests = quests.map((q) =>
        q.id === questId ? { ...q, completed: true, skipped: true } : q,
      );

      // Sync with backend - WAIT for response
      const userId = get().authUserId ?? 1;
      try {
        const res = await fetch(`${getAPIBaseUrl()}/complete_quest.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            quest_id: questId,
            points: 0,
            skipped: true,
          }),
        });
        const json = await res.json();

        if (json.status !== "success") {
          console.error("Backend skip failed:", json.message);
          return false;
        }
      } catch (e) {
        console.error("Failed to sync skipped quest:", e);
        return false;
      }

      set({
        quests: updatedQuests,
        engagedQuest: null,
        user: {
          ...user,
          questsToday: currentQuestsToday + 1,
          lastRefreshDate: today,
        },
      });

      // Immediately load next quest
      get().anchorQuestsToLocation(
        get().currentLocation.lat,
        get().currentLocation.lng,
      );
      return true;
    }
    return false;
  },

  selectedQuestId: null,
  viewingQuestId: null,

  setSelectedQuest: (id) => set({ selectedQuestId: id }),
  setViewingQuestId: (id) => set({ viewingQuestId: id }),

  fetchUserStats: async () => {
    const userId = get().authUserId ?? 1;
    try {
      const res = await fetch(`${getAPIBaseUrl()}/get_user_stats.php?user_id=${encodeURIComponent(userId)}`);
      const json = await res.json();
      if (json.status === "success" && json.data) {
        const d = json.data;
        set((s) => ({
          user: {
            ...s.user,
            pointsToday: parseInt(d.points_today, 10) || 0,
            weeklyPoints: parseInt(d.weekly_points, 10) || 0,
            yearlySuperPoints: parseInt(d.yearly_super_points, 10) || 0,
            dailyEarnings: d.daily_earnings || [],
            cumulativePoints: parseInt(d.cumulative_points, 10) || 0,
            questsToday: parseInt(d.quests_today, 10) || 0,
            lastRefreshDate: d.last_refresh_date || s.user.lastRefreshDate,
          },
        }));
      }
    } catch (e) {
      console.error("Stats fetch error:", e);
    }
  },

  fetchLeaderboard: async () => {
    try {
      const res = await fetch(`${getAPIBaseUrl()}/get_leaderboard.php`);
      const json = await res.json();
      if (json.status === "success" && json.data) {
        set({ leaderboard: json.data });
      }
    } catch (e) {
      console.error("Leaderboard fetch error:", e);
    }
  },

  anchored: false,

  anchorQuestsToLocation: (lat, lng, force = false) => {
    const { anchored, quests } = get();
    if (!force && anchored && quests.length > 0) return;

    // Generate all 10 quests based on the user's location
    const allQuests = QUEST_POOL.map((poolItem, index) => {
      const finalLat = lat + (poolItem.offsetLat || 0);
      const finalLng = lng + (poolItem.offsetLng || 0);
      let finalPath = undefined;
      if (poolItem.targetPath) {
        finalPath = poolItem.targetPath.map(([oLat, oLng]) => [
          lat + oLat,
          lng + oLng,
        ]);
      }

      return {
        ...poolItem,
        lat: finalLat,
        lng: finalLng,
        targetPath: finalPath,
        completed: false,
        skipped: false,
        isSuperPoint: index === 9,
        title: index === 9 ? "Yearly Super Points" : poolItem.title,
        progressMeters: poolItem.type === "walk" ? 0 : undefined,
      };
    });

    set({
      anchored: true,
      quests: allQuests,
    });
  },

  fetchQuests: async () => {
    const userId = get().authUserId ?? 1;
    try {
      const res = await fetch(`${getAPIBaseUrl()}/get_quest_status.php?user_id=${encodeURIComponent(userId)}`);
      const json = await res.json();
      if (json.status === "success") {
        const { currentLocation } = get();
        const completedIds = json.completed_ids || [];
        const skippedIds = json.skipped_ids || [];
        if (currentLocation) {
          set({ anchored: false });
          get().anchorQuestsToLocation(currentLocation.lat, currentLocation.lng);
        }
        set((s) => ({
          quests: s.quests.map((q) => {
            if (completedIds.includes(q.id)) return { ...q, completed: true, skipped: false };
            if (skippedIds.includes(q.id)) return { ...q, completed: true, skipped: true };
            return q;
          }),
        }));
      }
    } catch (e) {
      console.error("Quest status fetch error:", e);
    }
  },


  fetchRewards: async () => {
    try {
      const apiRoot = getAPIBaseUrl().replace('/api', '');
      const response = await fetch(apiRoot + '/health/rewards_list.php', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        set({
          rewards: data.data,
          user: { ...get().user, cumulativePoints: data.userPoints || 0 }
        });
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    }
  },

  // Redeem a reward
  redeemReward: async (rewardId) => {
    try {
      const apiRoot = getAPIBaseUrl().replace('/api', '');
      const response = await fetch(apiRoot + '/health/rewards_redeem.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reward_id: rewardId })
      });
      const data = await response.json();

      if (data.status === 'success') {
        // Refresh rewards list to update user points
        get().fetchRewards();
        get().fetchUserStats();
        return { success: true, message: data.message || 'Reward redeemed!' };
      } else {
        return { success: false, message: data.message || 'Redemption failed' };
      }
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },
}));
