import React from "react";
import { useGameStore } from "../store/gameStore";
import TerritoryMap from "../components/game/TerritoryMap";
import Leaderboard from "../components/game/Leaderboard";
import RewardsPanel from "../components/game/RewardsPanel";
import { motion } from "framer-motion";
import { MapPin, Trophy, TrendingUp } from "lucide-react";

const TerritoryGame = () => {
  const { user } = useGameStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Territory Conquest
          </h1>
          <p className="text-gray-500">
            Walk around to capture territory and earn rewards!
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Area Captured</p>
              <p className="font-bold text-gray-900">
                {user.areaCapturedKm2} km²
              </p>
            </div>
          </div>

          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Points Today</p>
              <p className="font-bold text-gray-900">{user.pointsToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">
              {user.pointsToday > 0
                ? "Excellent work! / राम्रो काम!"
                : "Start your journey! / यात्रा सुरु गर्नुहोस्!"}
            </h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              {user.pointsToday > 0
                ? `You captured ${user.areaCapturedKm2.toFixed(4)} km² today and earned ${user.pointsToday} points. Keep it up! \n तपाईंले आज ${user.areaCapturedKm2.toFixed(4)} km² क्षेत्र क्याप्चर गर्नुभयो र ${user.pointsToday} अंक कमाउनुभयो।`
                : "Walk around your neighborhood to capture territory and climb the leaderboard! \n आफ्नो क्षेत्र क्याप्चर गर्न र लिडरबोर्डमा चढ्न आफ्नो छिमेकमा हिंड्नुहोस्!"}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Map Section - Takes up 2 columns */}
        <div className="lg:col-span-2 h-full">
          <TerritoryMap />
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          <Leaderboard />
          <RewardsPanel />
        </div>
      </div>
    </div>
  );
};

export default TerritoryGame;
