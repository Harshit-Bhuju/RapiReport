import React, { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import TerritoryMap from "../components/game/TerritoryMap";
import Leaderboard from "../components/game/Leaderboard";
import RewardsPanel from "../components/game/RewardsPanel";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Trophy, TrendingUp, Gift, X } from "lucide-react";

const TerritoryGame = () => {
  const { user, fetchLeaderboard } = useGameStore();
  const [activeTab, setActiveTab] = useState("map"); // 'map', 'leaderboard', 'rewards'
  const [showMotivation, setShowMotivation] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] md:h-[calc(100vh-theme(spacing.32))] bg-gray-50 overflow-hidden relative">
      {/* Top Stats Bar - Compact & Floating on Mobile */}
      <div className="bg-white/90 backdrop-blur-md z-20 shadow-sm border-b border-gray-100 p-3 flex items-center justify-between shrink-0 rounded-b-2xl mx-2 mt-2 md:mx-0 md:mt-0 md:rounded-none">
        <div>
          <h1 className="text-lg font-bold text-gray-900 hidden md:block">
            Territory Conquest
          </h1>
          <p className="text-xs text-gray-500 font-medium md:hidden">
            My Stats
          </p>
        </div>

        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold text-gray-900">
              {user.areaCapturedKm2.toFixed(3)}{" "}
              <span className="text-[10px] text-gray-500 font-normal">km²</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold text-gray-900">
              {user.pointsToday}{" "}
              <span className="text-[10px] text-gray-500 font-normal">pts</span>
            </span>
          </div>
        </div>
      </div>

      {/* Motivational Toast */}
      <AnimatePresence>
        {showMotivation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-16 left-4 right-4 md:left-auto md:right-8 md:w-96 z-30 pointer-events-none">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-xl pointer-events-auto flex items-start gap-3">
              <Trophy className="w-5 h-5 shrink-0 mt-0.5 text-yellow-300" />
              <div className="flex-grow">
                <p className="font-semibold text-sm">
                  {user.pointsToday > 0
                    ? "Great job! / राम्रो काम!"
                    : "Start walking! / हिंड्न सुरु गर्नुहोस्!"}
                </p>
                <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                  {user.pointsToday > 0
                    ? `You've earned ${user.pointsToday} points today.`
                    : "Capture territory to verify your location."}
                </p>
              </div>
              <button
                onClick={() => setShowMotivation(false)}
                className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col md:flex-row gap-4 p-2 md:p-6 overflow-hidden relative">
        {/* Map Container */}
        <div
          className={`
            transition-all duration-300 ease-in-out relative rounded-2xl overflow-hidden shadow-inner border border-gray-200
            ${activeTab === "map" ? "flex-grow h-full" : "hidden md:flex md:flex-grow md:h-full"}
        `}>
          <TerritoryMap />

          {/* Mobile Controls Overlay */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 md:hidden z-[400]">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className="bg-white p-3 rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-indigo-600 active:scale-95 transition-transform">
              <Trophy className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className="bg-white p-3 rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-purple-600 active:scale-95 transition-transform">
              <Gift className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Desktop Sidebar / Mobile Modal Views */}
        <div
          className={`
            md:w-80 md:flex flex-col gap-4 overflow-y-auto custom-scrollbar transition-all
            ${activeTab === "map" ? "hidden" : "flex-grow h-full bg-white rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4"}
        `}>
          {/* Mobile Back Button */}
          <div className="md:hidden flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg text-gray-800">
              {activeTab === "leaderboard" ? "Leaderboard" : "Rewards"}
            </h2>
            <button
              onClick={() => setActiveTab("map")}
              className="p-2 bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {(activeTab === "leaderboard" || window.innerWidth >= 768) && (
            <Leaderboard />
          )}
          {(activeTab === "rewards" || window.innerWidth >= 768) && (
            <RewardsPanel />
          )}
        </div>
      </div>
    </div>
  );
};

export default TerritoryGame;
