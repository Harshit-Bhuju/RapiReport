import { create } from "zustand";

// ─── Hex Grid Constants ────────────────────────────────────────────────
const HEX_RADIUS = 0.0018; // ~200m per hex cell
const COL_SPACING = HEX_RADIUS * 1.5;
const ROW_SPACING = HEX_RADIUS * Math.sqrt(3);

const ZONE_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#60a5fa",
  "#c084fc",
  "#2dd4bf",
];

// ─── Hex Grid Helpers ──────────────────────────────────────────────────
export const getHexVertices = (centerLat, centerLng) => {
  const vertices = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    vertices.push([
      centerLat + HEX_RADIUS * Math.sin(angle),
      centerLng + HEX_RADIUS * Math.cos(angle),
    ]);
  }
  return vertices;
};

export const getHexForPoint = (lat, lng) => {
  const col = Math.round(lng / COL_SPACING);
  const rowOffset = Math.abs(col) % 2 === 1 ? ROW_SPACING / 2 : 0;
  const row = Math.round((lat - rowOffset) / ROW_SPACING);
  return { col, row, id: `${col}_${row}` };
};

export const getHexCenter = (col, row) => {
  const rowOffset = Math.abs(col) % 2 === 1 ? ROW_SPACING / 2 : 0;
  return {
    lat: row * ROW_SPACING + rowOffset,
    lng: col * COL_SPACING,
  };
};

export const generateHexesForBounds = (north, south, east, west) => {
  const hexes = [];
  const startCol = Math.floor(west / COL_SPACING) - 1;
  const endCol = Math.ceil(east / COL_SPACING) + 1;

  for (let col = startCol; col <= endCol; col++) {
    const rowOffset = Math.abs(col) % 2 === 1 ? ROW_SPACING / 2 : 0;
    const startRow = Math.floor((south - rowOffset) / ROW_SPACING) - 1;
    const endRow = Math.ceil((north - rowOffset) / ROW_SPACING) + 1;

    for (let row = startRow; row <= endRow; row++) {
      const centerLat = row * ROW_SPACING + rowOffset;
      const centerLng = col * COL_SPACING;
      const id = `${col}_${row}`;
      const colorIdx = Math.abs((col * 7 + row * 13) % ZONE_COLORS.length);

      hexes.push({
        id,
        col,
        row,
        centerLat,
        centerLng,
        color: ZONE_COLORS[colorIdx],
      });
    }
  }
  return hexes;
};

// ─── Zustand Store ─────────────────────────────────────────────────────
export const useGameStore = create((set, get) => ({
  user: {
    name: "You",
    pointsToday: 0,
    cumulativePoints: 0,
    hexesCaptured: 0,
    distanceKm: 0,
    level: 1,
    xp: 0,
    xpToNext: 100,
  },

  currentLocation: null,
  pathHistory: [],
  visitedHexIds: new Set(), // hexes walked through in current session (for loop detection)

  // Captured hexes: { "col_row": { owner, color, timestamp } }
  capturedHexes: {},

  // Leaderboard
  leaderboard: [
    {
      rank: 1,
      name: "Ramesh T.",
      points: 1480,
      hexes: 148,
      avatar: "https://i.pravatar.cc/150?u=ramesh",
    },
    {
      rank: 2,
      name: "Sita L.",
      points: 1200,
      hexes: 120,
      avatar: "https://i.pravatar.cc/150?u=sita",
    },
    {
      rank: 3,
      name: "Hari G.",
      points: 950,
      hexes: 95,
      avatar: "https://i.pravatar.cc/150?u=hari",
    },
    {
      rank: 4,
      name: "Priya S.",
      points: 800,
      hexes: 80,
      avatar: "https://i.pravatar.cc/150?u=priya",
    },
    {
      rank: 5,
      name: "Deepak K.",
      points: 650,
      hexes: 65,
      avatar: "https://i.pravatar.cc/150?u=deepak",
    },
  ],

  rewards: [
    {
      id: 1,
      title: "Free Consultation",
      pointsRequired: 500,
      icon: "stethoscope",
    },
    { id: 2, title: "Health Voucher", pointsRequired: 300, icon: "ticket" },
    { id: 3, title: "Premium Week", pointsRequired: 200, icon: "activity" },
  ],

  // ─── Actions ───────────────────────────────────────────────────────
  fetchLeaderboard: async () => {
    try {
      const response = await fetch(
        "http://localhost/rapireport/backend/api/get_leaderboard.php",
      );
      const data = await response.json();
      if (Array.isArray(data)) set({ leaderboard: data });
    } catch (e) {
      // Use mock data on failure
    }
  },

  fetchUserStats: async () => {
    /* frontend-only for now */
  },

  updateLocation: (lat, lng) => {
    const { currentLocation, capturedHexes, user } = get();

    let pointsIncrement = 0;
    let distanceIncrement = 0;
    let xpIncrement = 0;
    const newCaptures = {};

    // Calculate distance
    if (currentLocation) {
      const R = 6371;
      const dLat = (lat - currentLocation.lat) * (Math.PI / 180);
      const dLon = (lng - currentLocation.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(currentLocation.lat * (Math.PI / 180)) *
          Math.cos(lat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceIncrement = R * c;

      // Jitter filter
      if (distanceIncrement < 0.005) return;
    }

    // Check which hex we're in
    const currentHex = getHexForPoint(lat, lng);

    if (!capturedHexes[currentHex.id]) {
      newCaptures[currentHex.id] = { owner: "You", timestamp: Date.now() };
      pointsIncrement += 10;
      xpIncrement += 5;
    }

    // Track visited hexes for this session
    set((state) => {
      const newVisited = new Set(state.visitedHexIds);
      newVisited.add(currentHex.id);

      const totalCaptured = { ...state.capturedHexes, ...newCaptures };
      const hexCount = Object.keys(totalCaptured).filter(
        (k) => totalCaptured[k].owner === "You",
      ).length;
      const newXp = state.user.xp + xpIncrement;
      const levelUp = newXp >= state.user.xpToNext;

      return {
        currentLocation: { lat, lng },
        pathHistory: [...state.pathHistory, [lat, lng]],
        visitedHexIds: newVisited,
        capturedHexes: totalCaptured,
        user: {
          ...state.user,
          pointsToday: state.user.pointsToday + pointsIncrement,
          cumulativePoints: state.user.cumulativePoints + pointsIncrement,
          hexesCaptured: hexCount,
          distanceKm: state.user.distanceKm + distanceIncrement,
          xp: levelUp ? newXp - state.user.xpToNext : newXp,
          level: levelUp ? state.user.level + 1 : state.user.level,
          xpToNext: levelUp ? state.user.xpToNext + 50 : state.user.xpToNext,
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
