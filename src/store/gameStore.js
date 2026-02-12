import { create } from "zustand";
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

// Quest pool: Only PUSHUP exercises for simplicity
// All 10 daily quests will be pushups at different locations
// Relative offsets in degrees (approximate for small distances)
// 0.00001 degrees is roughly 1.1 meters
const QUEST_POOL = [
  {
    id: "pushup_1",
    type: "place",
    title: "Pushup Challenge 1",
    description: "Complete 20 Pushups at this location",
    offsetLat: 0.00001,
    offsetLng: 0.00001,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  },
  {
    id: "pushup_2",
    type: "place",
    title: "Pushup Challenge 2",
    description: "Complete 20 Pushups at this location",
    offsetLat: -0.00001,
    offsetLng: 0.00001,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  },
  {
    id: "pushup_3",
    type: "place",
    title: "Pushup Challenge 3",
    description: "Complete 20 Pushups at this location",
    offsetLat: 0.00001,
    offsetLng: -0.00001,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  },
  {
    id: "pushup_4",
    type: "place",
    title: "Pushup Challenge 4",
    description: "Complete 20 Pushups at this location",
    offsetLat: -0.00001,
    offsetLng: -0.00001,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  },
  {
    id: "pushup_5",
    type: "place",
    title: "Pushup Challenge 5",
    description: "Complete 20 Pushups at this location",
    offsetLat: 0.000015,
    offsetLng: 0,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  },
  {
    id: "pushup_6",
    type: "place",
    title: "Pushup Challenge 6",
    description: "Complete 20 Pushups at this location",
    offsetLat: -0.000015,
    offsetLng: 0,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  },
  {
    id: "pushup_7",
    type: "place",
    title: "Pushup Challenge 7",
    description: "Complete 20 Pushups at this location",
    offsetLat: 0,
    offsetLng: 0.000015,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  },
  {
    id: "pushup_8",
    type: "place",
    title: "Pushup Challenge 8",
    description: "Complete 20 Pushups at this location",
    offsetLat: 0,
    offsetLng: -0.000015,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  },
  {
    id: "pushup_9",
    type: "place",
    title: "Pushup Challenge 9",
    description: "Complete 20 Pushups at this location",
    offsetLat: 0.00002,
    offsetLng: 0.00002,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  },
  {
    id: "pushup_10",
    type: "place",
    title: "Pushup Challenge 10",
    description: "Complete 20 Pushups at this location",
    offsetLat: -0.00002,
    offsetLng: -0.00002,
    radiusMeters: 10,
    points: 100,
    icon: "pin",
    ageGroup: "any",
    fitnessLevel: "moderate",
    healthConsideration: "any",
    videoVerification: true,
    exercise: "Pushups",
    targetReps: 20
  }
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
    weeklyPoints: 0,
    cumulativePoints: 0,
    dailyEarnings: [], // [{date: '2026-02-12', points: 100}, ...]
    questsCompleted: 0,
    questsToday: 0,
    lastRefreshDate: new Date().toISOString().split('T')[0],
  },
  engagedQuest: null,
  setEngagedQuest: (quest) => set({ engagedQuest: quest }),
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
    { id: 5, title: "Fitness Band Discount", pointsRequired: 800, icon: "activity" },
    { id: 6, title: "Doctor Consult Credit", pointsRequired: 600, icon: "stethoscope" },
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
    const today = new Date().toISOString().split('T')[0];
    let currentQuestsToday = user.questsToday ?? 0;
    if (user.lastRefreshDate !== today) {
      currentQuestsToday = 0;
    }

    if (currentQuestsToday >= 10) {
      alert("Daily limit of 10 quests reached! Come back tomorrow.");
      return false;
    }

    const quest = quests.find((q) => q.id === questId);
    if (quest && !quest.completed) {
      const updatedQuests = quests.map((q) =>
        q.id === questId ? { ...q, completed: true } : q
      );

      // Sync with backend
      try {
        await fetch(`${getAPIBaseUrl()}/complete_quest.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: 1, // In a real app, this comes from authStore
            quest_id: questId,
            points: quest.points
          })
        });
      } catch (e) {
        console.error("Failed to sync quest:", e);
      }

      set({
        quests: updatedQuests,
        user: {
          ...user,
          pointsToday: (user.lastRefreshDate === today ? user.pointsToday : 0) + (quest.points || 0),
          cumulativePoints: user.cumulativePoints + (quest.points || 0),
          questsCompleted: (user.questsCompleted || 0) + 1,
          questsToday: currentQuestsToday + 1,
          lastRefreshDate: today
        },
      });
      return true;
    }
    return false;
  },

  skipQuest: async (questId) => {
    const { quests, user } = get();

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    let currentQuestsToday = user.questsToday ?? 0;
    if (user.lastRefreshDate !== today) {
      currentQuestsToday = 0;
    }

    if (currentQuestsToday >= 10) {
      alert("Daily limit of 10 quests reached! Come back tomorrow.");
      return false;
    }

    const quest = quests.find((q) => q.id === questId);
    if (quest && !quest.completed) {
      const updatedQuests = quests.map((q) =>
        q.id === questId ? { ...q, completed: true, skipped: true } : q
      );

      // Sync with backend (0 points for skip)
      try {
        await fetch(`${getAPIBaseUrl()}/complete_quest.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: 1,
            quest_id: questId,
            points: 0,
            skipped: true
          })
        });
      } catch (e) {
        console.error("Failed to sync skipped quest:", e);
      }

      set({
        quests: updatedQuests,
        engagedQuest: null, // Close interaction modal
        anchored: false,    // Force re-anchor for next quest
        user: {
          ...user,
          questsCompleted: (user.questsCompleted || 0), // Don't count as "completed" for stats if we want strictness, or do if we count "attempts"
          questsToday: currentQuestsToday + 1,
          lastRefreshDate: today
        },
      });

      // Immediately load next quest
      get().anchorQuestsToLocation(get().currentLocation.lat, get().currentLocation.lng);
      return true;
    }
    return false;
  },

  selectedQuestId: null,

  setSelectedQuest: (id) => set({ selectedQuestId: id }),

  fetchUserStats: async () => {
    try {
      const res = await fetch(`${getAPIBaseUrl()}/get_user_stats.php`);
      const json = await res.json();
      if (json.status === "success") {
        set((s) => ({
          user: {
            ...s.user,
            pointsToday: parseInt(json.data.points_today),
            weeklyPoints: parseInt(json.data.weekly_points || 0),
            dailyEarnings: json.data.daily_earnings || [],
            cumulativePoints: parseInt(json.data.cumulative_points),
            questsToday: parseInt(json.data.quests_today),
          }
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
      if (json.status === "success") {
        set({ leaderboard: json.data });
      }
    } catch (e) {
      console.error("Leaderboard fetch error:", e);
    }
  },

  anchored: false,

  anchorQuestsToLocation: (lat, lng) => {
    const { user, anchored } = get();
    // Re-anchor if not anchored or if we want to refresh for next quest
    // For now, let's keep it simple: anchor once for the day
    if (anchored && get().quests.length > 0) return;

    const questIndex = (user.questsToday || 0) % QUEST_POOL.length;
    const poolItem = QUEST_POOL[questIndex];
    if (!poolItem) return;

    const finalLat = lat + (poolItem.offsetLat || 0);
    const finalLng = lng + (poolItem.offsetLng || 0);
    let finalPath = undefined;
    if (poolItem.targetPath) {
      finalPath = poolItem.targetPath.map(([oLat, oLng]) => [lat + oLat, lng + oLng]);
    }

    const activeQuest = {
      ...poolItem,
      lat: finalLat,
      lng: finalLng,
      targetPath: finalPath,
      completed: false,
      progressMeters: poolItem.type === "walk" ? 0 : undefined
    };

    set({
      anchored: true,
      quests: [activeQuest] // Only one active quest at a time
    });
  },

  fetchQuests: async () => {
    try {
      const res = await fetch(`${getAPIBaseUrl()}/get_quest_status.php`);
      const json = await res.json();
      if (json.status === "success") {
        const { user, currentLocation } = get();
        // If we have a location, we can anchor the quest based on how many are completed
        if (currentLocation) {
          set({ anchored: false });
          get().anchorQuestsToLocation(currentLocation.lat, currentLocation.lng);
        }
      }
    } catch (e) {
      console.error("Quest status fetch error:", e);
    }

  },

  // Fetch leaderboard from backend
  fetchLeaderboard: async () => {
    try {
      const response = await fetch(getAPIBaseUrl() + '/api/get_leaderboard.php');
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        set({ leaderboard: data.data });
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  },

  // Fetch rewards from backend
  fetchRewards: async () => {
    try {
      const response = await fetch(getAPIBaseUrl() + '/health/rewards_list.php', {
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
      const response = await fetch(getAPIBaseUrl() + '/health/rewards_redeem.php', {
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
