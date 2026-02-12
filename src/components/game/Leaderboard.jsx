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
        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-sm">No explorers yet!</p>
            <p className="text-gray-400 text-xs mt-2">Complete quests to appear on the leaderboard</p>
          </div>
        ) : (
          leaderboard.map((user, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">#{user.rank}</span>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 shadow-sm ${index === 0 ? "bg-yellow-100 text-yellow-700" :
                    index === 1 ? "bg-gray-100 text-gray-700" :
                      "bg-orange-50 text-orange-700"
                    }`}>
                    {user.profile_pic ? (
                      <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      user.name?.charAt(0).toUpperCase() || "?"
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-gray-900 block leading-none mb-1">{user.name}</span>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Global Explorer</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-indigo-600 block">{user.points}</span>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Points This Week</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
