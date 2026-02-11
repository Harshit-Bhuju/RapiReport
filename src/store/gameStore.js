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
  fetchLeaderboard: async () => {
    try {
      const response = await fetch(
        "http://localhost/rapireport/backend/api/get_leaderboard.php",
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        set({ leaderboard: data });
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  },

  updateLocation: async (lat, lng, userId = 1, username = "Explorer") => {
    const { currentLocation, user } = get();

    // Calculate distance if we have a previous location
    let distanceKm = 0;
    let areaIncrement = 0;
    let pointsIncrement = 0;

    if (currentLocation) {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat - currentLocation.lat) * (Math.PI / 180);
      const dLon = (lng - currentLocation.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(currentLocation.lat * (Math.PI / 180)) *
          Math.cos(lat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = R * c;

      // "Accurate" Capture Logic:
      // Assume capturing a path 10 meters (0.01 km) wide.
      // Area = Distance * Width
      if (distanceKm > 0.005) {
        // Only count if moved > 5 meters to reduce GPS jitter
        areaIncrement = distanceKm * 0.01; // 0.01 km width
        pointsIncrement = Math.round(distanceKm * 100); // 100 points per km
      }
    } else {
      // First fix, no distance yet
      pointsIncrement = 1; // Bonus for starting
    }

    if (areaIncrement === 0 && pointsIncrement === 0 && currentLocation) {
      return; // No significant movement
    }

    // 1. Update local state for immediate feedback
    set((state) => {
      const newPath = [...state.pathHistory, [lat, lng]];
      return {
        currentLocation: { lat, lng },
        pathHistory: newPath,
      };
    });

    // 2. Send to Backend
    try {
      const response = await fetch(
        "http://localhost/rapireport/backend/api/update_location.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            username,
            lat,
            lng,
            area_added: areaIncrement,
            points_added: pointsIncrement,
          }),
        },
      );

      const result = await response.json();

      if (result.status === "success") {
        set((state) => ({
          user: {
            ...state.user,
            areaCapturedKm2: parseFloat(result.data.area_captured_km2),
            pointsToday: parseInt(result.data.points_today),
            cumulativePoints: parseInt(result.data.cumulative_points),
          },
        }));
      }
    } catch (error) {
      console.error("Failed to update location:", error);
    }
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
