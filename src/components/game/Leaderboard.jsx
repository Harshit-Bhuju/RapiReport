import React from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useGameStore } from "../../store/gameStore";

const Leaderboard = () => {
  const { leaderboard } = useGameStore();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Trophy className="w-5 h-5 text-yellow-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Weekly Top Explorers</h3>
      </div>

      <div className="space-y-4">
        {leaderboard.map((user, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : index === 1
                                      ? "bg-gray-200 text-gray-700"
                                      : "bg-orange-100 text-orange-700"
                                }
                            `}>
                #{user.rank}
              </div>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {user.name?.charAt(0) || "#"}
                </div>
              )}
              <span className="font-medium text-gray-700">{user.name}</span>
            </div>
            <span className="font-bold text-gray-900">{user.points} pts</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
