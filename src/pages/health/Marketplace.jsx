import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Gift,
  HeartPulse,
  Ticket,
  Activity,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import API from "@/Configs/ApiEndpoints";

const Marketplace = () => {
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const r = await axios.get(API.REWARDS_LIST, { withCredentials: true });
        if (r.data?.status === "success") {
          setRewards(r.data.data ?? []);
          setUserPoints(r.data.userPoints ?? 0);
        }
      } catch (e) {
        console.warn("Rewards fetch failed", e);
        toast.error("Could not load rewards.");
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  const getIcon = (iconName) => {
    switch (iconName) {
      case "stethoscope":
        return <HeartPulse className="w-6 h-6 text-primary-600" />;
      case "ticket":
        return <Ticket className="w-6 h-6 text-blue-500" />;
      default:
        return <Gift className="w-6 h-6 text-warning-600" />;
    }
  };

  const list =
    filter === "all" ? rewards : rewards.filter((r) => r.category === filter);
  const categories = [
    "all",
    ...new Set(rewards.map((r) => r.category).filter(Boolean)),
  ];

  const handleRedeem = async (reward) => {
    if (userPoints < reward.pointsRequired) {
      toast.error(`Need ${reward.pointsRequired - userPoints} more points.`);
      return;
    }
    setRedeeming(reward.id);
    try {
      const r = await axios.post(
        API.REWARDS_REDEEM,
        { reward_id: reward.id },
        { withCredentials: true },
      );
      if (r.data?.status === "success") {
        setUserPoints((p) =>
          Math.max(0, p - (r.data.pointsSpent ?? reward.pointsRequired)),
        );
        toast.success(`Redeemed: ${reward.title}`);
      } else {
        toast.error(r.data?.message || "Redemption failed.");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Redemption failed.");
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Reward marketplace
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Redeem points for health-related products and services.
          </p>
        </div>
        <Card className="border-none shadow-lg shadow-gray-100/50 shrink-0">
          <CardBody className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Your points
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {userPoints}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "px-4 py-2 rounded-xl border-2 text-sm font-bold capitalize transition-all",
              filter === c
                ? "bg-primary-50 border-primary-600 text-primary-700"
                : "border-gray-100 text-gray-500 hover:bg-gray-50",
            )}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((reward) => {
          const canRedeem = userPoints >= reward.pointsRequired;
          const busy = redeeming === reward.id;
          return (
            <Card
              key={reward.id}
              className="border-none shadow-xl shadow-gray-100/50 overflow-hidden">
              <CardBody className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                    {getIcon(reward.icon)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {reward.category}
                    </p>
                    <h3 className="text-lg font-black text-gray-900 mt-0.5">
                      {reward.title}
                    </h3>
                    <p className="text-sm font-bold text-primary-600 mt-1">
                      {reward.pointsRequired} points
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canRedeem || busy}
                  className={cn(
                    "w-full gap-2",
                    (!canRedeem || busy) && "opacity-60 cursor-not-allowed",
                  )}>
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="w-4 h-4" />
                  )}
                  {busy
                    ? "Redeeming…"
                    : canRedeem
                      ? "Redeem"
                      : "Not enough points"}
                </Button>
              </CardBody>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 text-center">
        Earn points from Quest Game and campaigns.
      </p>
    </div>
  );
};

export default Marketplace;
