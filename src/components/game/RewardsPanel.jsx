import React from "react";
import { motion } from "framer-motion";
import { Gift, HeartPulse, Ticket, Activity } from "lucide-react";
import { useGameStore } from "../../store/gameStore";
import toast from "react-hot-toast";

const RewardsPanel = () => {
  const { rewards, user, redeemReward } = useGameStore();

  // Icon mapping
  const getIcon = (iconName) => {
    switch (iconName) {
      case "stethoscope":
        return <HeartPulse className="w-5 h-5 text-rose-500" />;
      case "ticket":
        return <Ticket className="w-5 h-5 text-blue-500" />;
      case "activity":
        return <Activity className="w-5 h-5 text-emerald-500" />;
      default:
        return <Gift className="w-5 h-5 text-purple-500" />;
    }
  };

  const handleRedeem = (reward) => {
    if (user.cumulativePoints >= reward.pointsRequired) {
      redeemReward(reward.id);
      toast.success(`Redeemed ${reward.title}!`);
    } else {
      toast.error(
        `Start walking! You need ${reward.pointsRequired - user.cumulativePoints} more points.`,
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Gift className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Rewards Store</h3>
      </div>

      <div className="space-y-4">
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            whileHover={{ scale: 1.02 }}
            className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {getIcon(reward.icon)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{reward.title}</h4>
                  <span className="text-xs text-gray-500">
                    {reward.pointsRequired} Points
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleRedeem(reward)}
              disabled={user.cumulativePoints < reward.pointsRequired}
              className={`
                                w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors
                                ${
                                  user.cumulativePoints >= reward.pointsRequired
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }
                            `}>
              {user.cumulativePoints >= reward.pointsRequired
                ? "Redeem Now"
                : "Locked"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RewardsPanel;
