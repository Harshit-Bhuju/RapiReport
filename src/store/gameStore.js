import { create } from "zustand";

// ─── Constants ────────────────────────────────────────────────────────
const SQUARE_SIZE = 0.0001; // ~10m (0.0001 degrees)
const RENDER_RADIUS = 0.005; // ~500m radius for generating grid content

// ─── Helpers ──────────────────────────────────────────────────────────
export const getSquareId = (lat, lng) => {
  const col = Math.round(lng / SQUARE_SIZE);
  const row = Math.round(lat / SQUARE_SIZE);
  return `${col}_${row}`;
};

export const getSquareVertices = (lat, lng) => {
  const half = SQUARE_SIZE / 2;
  return [
    [lat + half, lng - half],
    [lat + half, lng + half],
    [lat - half, lng + half],
    [lat - half, lng - half],
  ];
};

// Point-in-polygon check for loop capture
const isPointInPoly = (point, polygon) => {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// ─── Store ────────────────────────────────────────────────────────────
export const useGameStore = create((set, get) => ({
  user: {
    name: "You",
    pointsToday: 0,
    cumulativePoints: 0,
    areasCaptured: 0,
    distanceKm: 0,
  },

  currentLocation: null,
  pathHistory: [],
  capturedSquares: {}, // Squares owned by the user
  enemySquares: {}, // Squares pre-populated with enemies

  leaderboard: [
    { rank: 1, name: "Alpha", points: 2500, areas: 50 },
    { rank: 2, name: "Bravo", points: 1800, areas: 35 },
    { rank: 3, name: "Charlie", points: 1200, areas: 20 },
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

  // ─── Procedural Grid Content ───
  // We populate a local area with enemies to ensure no gaps.
  generateTiledWorld: (lat, lng) => {
    const enemies = {};
    const colStart = Math.round(lng / SQUARE_SIZE) - 50;
    const colEnd = colStart + 100;
    const rowStart = Math.round(lat / SQUARE_SIZE) - 50;
    const rowEnd = rowStart + 100;

    for (let c = colStart; c <= colEnd; c++) {
      for (let r = rowStart; r <= rowEnd; r++) {
        // Randomly assign ~15% of the world to enemies
        if (Math.random() > 0.85) {
          enemies[`${c}_${r}`] = {
            owner: Math.random() > 0.5 ? "Alpha" : "Bravo",
            pointsVal: 20,
          };
        }
      }
    }
    set({ enemySquares: enemies });
  },

  updateLocation: (lat, lng) => {
    const { currentLocation, pathHistory, capturedSquares, enemySquares } =
      get();
    const newPoint = [lat, lng];
    const sqId = getSquareId(lat, lng);

    if (!currentLocation) {
      get().generateTiledWorld(lat, lng);
      set({ currentLocation: { lat, lng }, pathHistory: [newPoint] });
      return;
    }

    // Loop Detection
    let loopClosed = false;
    let loopStartIndex = -1;
    if (pathHistory.length > 10) {
      for (let i = 0; i < pathHistory.length - 10; i++) {
        const hPoint = pathHistory[i];
        const dist = Math.sqrt(
          Math.pow(lat - hPoint[0], 2) + Math.pow(lng - hPoint[1], 2),
        );
        if (dist < 0.00015) {
          loopClosed = true;
          loopStartIndex = i;
          break;
        }
      }
    }

    if (loopClosed) {
      const loopPolygon = pathHistory.slice(loopStartIndex);
      let minLat = 90,
        maxLat = -90,
        minLng = 180,
        maxLng = -180;
      loopPolygon.forEach(([la, ln]) => {
        minLat = Math.min(minLat, la);
        maxLat = Math.max(maxLat, la);
        minLng = Math.min(minLng, ln);
        maxLng = Math.max(maxLng, ln);
      });

      const filledCaptures = {};
      let loopPoints = 0;

      const colS = Math.floor(minLng / SQUARE_SIZE);
      const colE = Math.ceil(maxLng / SQUARE_SIZE);
      const rowS = Math.floor(minLat / SQUARE_SIZE);
      const rowE = Math.ceil(maxLat / SQUARE_SIZE);

      for (let c = colS; c <= colE; c++) {
        for (let r = rowS; r <= rowE; r++) {
          const sLat = r * SQUARE_SIZE;
          const sLng = c * SQUARE_SIZE;
          if (isPointInPoly([sLat, sLng], loopPolygon)) {
            const id = `${c}_${r}`;
            if (!capturedSquares[id]) {
              const wasEnemy = enemySquares[id];
              filledCaptures[id] = { owner: "You", timestamp: Date.now() };
              loopPoints += wasEnemy ? 25 : 10;
            }
          }
        }
      }

      set((s) => ({
        user: {
          ...s.user,
          pointsToday: s.user.pointsToday + loopPoints + 100,
          areasCaptured: s.user.areasCaptured + 1,
        },
        capturedSquares: { ...s.capturedSquares, ...filledCaptures },
        pathHistory: [],
      }));
    }

    // Walking Capture
    if (!capturedSquares[sqId]) {
      const wasEnemy = enemySquares[sqId];
      set((s) => ({
        capturedSquares: {
          ...s.capturedSquares,
          [sqId]: { owner: "You", timestamp: Date.now() },
        },
        user: {
          ...s.user,
          pointsToday: s.user.pointsToday + (wasEnemy ? 15 : 5),
        },
      }));
    }

    set((s) => ({
      currentLocation: { lat, lng },
      pathHistory: [...s.pathHistory, newPoint],
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
