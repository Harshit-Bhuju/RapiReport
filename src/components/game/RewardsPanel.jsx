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

  const pointsToUse = user.weeklyPoints ?? 0;

  const handleRedeem = (reward) => {
    if (pointsToUse >= reward.pointsRequired) {
      redeemReward(reward.id);
      toast.success(`Redeemed ${reward.title}!`);
    } else {
      toast.error(
        `Keep moving! You need ${reward.pointsRequired - pointsToUse} more valid points.`,
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Rewards Store</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Weekly Validity</p>
          <div className="flex items-center gap-2 justify-end">
            <span className="font-black text-gray-900">{pointsToUse}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
        <p className="text-[10px] text-indigo-600 font-bold leading-relaxed">
          💡 Points are valid for **7 days** from completion. Use them before they expire!
        </p>
      </div>

      <div className="space-y-4">
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            whileHover={{ y: -2 }}
            className="p-4 border border-gray-50 rounded-[2rem] hover:shadow-lg hover:shadow-indigo-50/50 transition-all bg-white relative overflow-hidden group">
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-widest ${pointsToUse >= reward.pointsRequired ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
              {pointsToUse >= reward.pointsRequired ? "Unlocked" : "Locked"}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                  {getIcon(reward.icon)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{reward.title}</h4>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    Cost: {reward.pointsRequired} P
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleRedeem(reward)}
              disabled={pointsToUse < reward.pointsRequired}
              className={`
                                w-full py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
                                ${pointsToUse >= reward.pointsRequired
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
                            `}>
              {pointsToUse >= reward.pointsRequired
                ? "Claim Reward"
                : `${reward.pointsRequired - pointsToUse} more points needed`}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RewardsPanel;
