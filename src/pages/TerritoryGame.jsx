import React, { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import TerritoryMap from "../components/game/TerritoryMap";
import Leaderboard from "../components/game/Leaderboard";
import RewardsPanel from "../components/game/RewardsPanel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Gift,
  ChevronDown,
  Hexagon,
  Zap,
  MapPin,
  Route,
} from "lucide-react";

const TerritoryGame = () => {
  const { user, fetchLeaderboard, fetchUserStats } = useGameStore();
  const [activeTab, setActiveTab] = useState("map");

  useEffect(() => {
    fetchUserStats();
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, fetchUserStats]);

  const xpPercent = Math.min((user.xp / user.xpToNext) * 100, 100);

  return (
    <div className="min-h-full">
      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden lg:block space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Territory Conquest
            </h1>
            <p className="text-gray-500 font-bold text-sm">
              Run. Capture. Conquer.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl flex items-center gap-3">
              <Hexagon className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase">
                  Hexes
                </p>
                <p className="font-black text-lg leading-none">
                  {user.hexesCaptured}
                </p>
              </div>
            </div>
            <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase">
                  Points
                </p>
                <p className="font-black text-lg leading-none">
                  {user.pointsToday}
                </p>
              </div>
            </div>
            <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl flex items-center gap-3">
              <Route className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase">
                  Distance
                </p>
                <p className="font-black text-lg leading-none">
                  {user.distanceKm.toFixed(2)} km
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-[600px] rounded-[2rem] overflow-hidden shadow-2xl border-2 border-gray-800">
            <TerritoryMap />
          </div>
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <Leaderboard />
            <RewardsPanel />
          </div>
        </div>
      </div>

      {/* ─── MOBILE VIEW (INTVL Style) ─── */}
      <div className="lg:hidden fixed inset-0 z-[40] bg-gray-950 overflow-hidden flex flex-col">
        {/* Full-Screen Map */}
        <div className="relative flex-grow h-full w-full">
          <TerritoryMap />

          {/* Top HUD Bar */}
          <div className="absolute top-0 left-0 right-0 z-[1001] pointer-events-none">
            {/* Level & XP Bar */}
            <div className="bg-gradient-to-b from-gray-950/90 via-gray-950/60 to-transparent pt-12 pb-8 px-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-cyan-500/20 border-2 border-cyan-400 rounded-xl flex items-center justify-center">
                    <span className="text-cyan-400 font-black text-xs">
                      {user.level}
                    </span>
                  </div>
                  <span className="text-white/80 text-[11px] font-black uppercase tracking-widest">
                    Level {user.level}
                  </span>
                </div>
                <span className="text-white/40 text-[10px] font-bold">
                  {user.xp}/{user.xpToNext} XP
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-[1001] pointer-events-none">
            <div className="bg-gradient-to-t from-gray-950/95 via-gray-950/70 to-transparent pt-10 pb-6 px-5">
              {/* Stats Row */}
              <div className="flex justify-between items-end mb-5 pointer-events-auto">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white leading-none">
                      {user.hexesCaptured}
                    </p>
                    <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.15em] mt-1">
                      HEXES
                    </p>
                  </div>
                  <div className="w-px bg-gray-700 self-stretch" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-white leading-none">
                      {user.distanceKm.toFixed(1)}
                    </p>
                    <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.15em] mt-1">
                      KM
                    </p>
                  </div>
                  <div className="w-px bg-gray-700 self-stretch" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-white leading-none">
                      {user.pointsToday}
                    </p>
                    <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.15em] mt-1">
                      PTS
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="flex justify-center gap-3 pointer-events-auto">
                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className="flex-1 max-w-[160px] py-3 bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Ranks
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("rewards")}
                  className="flex-1 max-w-[160px] py-3 bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <Gift className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Rewards
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Drawer */}
        <AnimatePresence>
          {activeTab !== "map" && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveTab("map")}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1002]"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 h-[80vh] z-[1003] bg-gray-900 rounded-t-[2.5rem] border-t border-gray-700 flex flex-col">
                <div className="flex flex-col items-center pt-3 pb-4 shrink-0">
                  <div className="w-12 h-1.5 bg-gray-700 rounded-full mb-4" />
                  <div className="w-full px-8 flex items-center justify-between">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      {activeTab}
                    </h2>
                    <button
                      onClick={() => setActiveTab("map")}
                      className="p-2.5 bg-gray-800 rounded-xl text-gray-400 active:bg-gray-700">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-grow overflow-y-auto px-6 pb-12">
                  {activeTab === "leaderboard" && <Leaderboard />}
                  {activeTab === "rewards" && <RewardsPanel />}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TerritoryGame;
