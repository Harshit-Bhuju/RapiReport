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
  Map,
  Zap,
  Boxes,
  ShieldAlert,
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

  return (
    <div className="min-h-full">
      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden lg:block space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
              Area Conquest
            </h1>
            <p className="text-gray-500 font-bold text-sm">
              Enclose areas to capture. Steal from others.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white text-gray-900 px-5 py-3 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <Boxes className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  Areas
                </p>
                <p className="font-black text-xl leading-none">
                  {user.areasCaptured}
                </p>
              </div>
            </div>
            <div className="bg-white text-gray-900 px-5 py-3 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <Zap className="w-6 h-6 text-orange-500" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  Points
                </p>
                <p className="font-black text-xl leading-none">
                  {user.pointsToday}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-[650px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100">
            <TerritoryMap />
          </div>
          <div className="space-y-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
            <Leaderboard />
            <RewardsPanel />
          </div>
        </div>
      </div>

      {/* ─── MOBILE VIEW ─── */}
      <div className="lg:hidden flex flex-col gap-6">
        <div className="relative h-[60vh] rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100">
          <TerritoryMap />
        </div>

        {/* Mobile Stats & Actions Card */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">
                Areas
              </p>
              <p className="text-3xl font-black text-gray-900 leading-none">
                {user.areasCaptured}
              </p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 text-center">
                Points
              </p>
              <p className="text-3xl font-black text-indigo-600 leading-none">
                {user.pointsToday}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className="py-5 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 flex flex-col items-center gap-2">
              <Trophy className="w-6 h-6" />
              <span className="font-black text-[10px] uppercase tracking-widest text-center">
                LEADERBOARD
              </span>
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className="py-5 bg-white text-gray-900 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
              <Gift className="w-6 h-6 text-purple-600" />
              <span className="font-black text-[10px] uppercase tracking-widest text-center text-gray-400">
                REWARDS
              </span>
            </button>
          </div>
        </div>

        {/* Embedded Panels instead of Drawer for better responsiveness */}
        <div className="space-y-6">
          {activeTab === "leaderboard" && <Leaderboard />}
          {activeTab === "rewards" && <RewardsPanel />}
        </div>
      </div>
    </div>
  );
};

export default TerritoryGame;
