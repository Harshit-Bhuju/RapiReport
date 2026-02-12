import React, { useState, useEffect, Fragment } from "react";
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
  Search,
  Filter,
  History,
  X,
  CreditCard,
  Clock,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import API from "@/Configs/ApiEndpoints";
import { format } from "date-fns";
import { Dialog, Transition } from "@headlessui/react";

const Marketplace = () => {
  const [activeTab, setActiveTab] = useState("browse"); // 'browse' | 'history'
  const [rewards, setRewards] = useState([]);
  const [history, setHistory] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("points_asc"); // 'points_asc' | 'points_desc'
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

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

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await axios.get(API.REWARDS_HISTORY, { withCredentials: true });
      if (r.data?.status === "success") {
        setHistory(r.data.data ?? []);
      }
    } catch (e) {
      console.warn("History fetch failed", e);
      // toast.error("Could not load history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const getIcon = (iconName, className = "w-6 h-6") => {
    switch (iconName) {
      case "stethoscope":
        return <HeartPulse className={cn("text-primary-600", className)} />;
      case "ticket":
        return <Ticket className={cn("text-blue-500", className)} />;
      case "activity":
        return <Activity className={cn("text-green-500", className)} />;
      default:
        return <Gift className={cn("text-warning-600", className)} />;
    }
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;
    const reward = selectedReward;

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
        setSelectedReward(null); // Close modal
        fetchHistory(); // Refresh history if needed later
      } else {
        toast.error(r.data?.message || "Redemption failed.");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Redemption failed.");
    } finally {
      setRedeeming(null);
    }
  };

  // Filter and Sort Logic
  const filteredRewards = rewards
    .filter((r) => {
      const matchesCategory = filter === "all" || r.category === filter;
      const matchesSearch = r.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "points_asc") {
        return a.pointsRequired - b.pointsRequired;
      } else {
        return b.pointsRequired - a.pointsRequired;
      }
    });

  const categories = [
    "all",
    ...new Set(rewards.map((r) => r.category).filter(Boolean)),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Marketplace
          </h1>
          <p className="text-lg text-gray-500 font-medium mt-2 max-w-2xl">
            Redeem your hard-earned points for exclusive health rewards,
            discounts, and services.
          </p>
        </div>

        <Card className="border-none shadow-xl shadow-gray-100/50 bg-gradient-to-br from-primary-500 to-indigo-600 text-white shrink-0 w-full lg:w-auto min-w-[260px]">
          <CardBody className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-primary-100 text-sm font-semibold uppercase tracking-wider">
                  Available Balance
                </p>
                <p className="text-4xl font-black mt-1">{userPoints}</p>
                <p className="text-primary-200 text-sm mt-1">Points</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Gift className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-1">
        <div className="flex gap-6 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("browse")}
            className={cn(
              "pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
              activeTab === "browse"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-400 hover:text-gray-600",
            )}>
            Browse Rewards
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
              activeTab === "history"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-400 hover:text-gray-600",
            )}>
            Redemption History
          </button>
        </div>
      </div>

      {activeTab === "browse" && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-2 justify-between items-center bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Filters Group */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl shrink-0">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                      filter === c
                        ? "bg-white text-primary-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700",
                    )}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden md:block" />

              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-gray-50 text-gray-600 text-sm font-bold py-2.5 pl-4 pr-10 rounded-xl border-none focus:ring-2 focus:ring-primary-500 cursor-pointer outline-none">
                  <option value="points_asc">Points: Low to High</option>
                  <option value="points_desc">Points: High to Low</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredRewards.length > 0 ? (
              filteredRewards.map((reward) => {
                const canRedeem = userPoints >= reward.pointsRequired;
                return (
                  <div
                    key={reward.id}
                    className="group bg-white rounded-2xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary-100 flex flex-col h-full cursor-pointer"
                    onClick={() => setSelectedReward(reward)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        {getIcon(reward.icon, "w-8 h-8")}
                      </div>
                      <div
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                          canRedeem
                            ? "bg-primary-50 text-primary-600"
                            : "bg-gray-100 text-gray-400",
                        )}>
                        {reward.pointsRequired} PTS
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {reward.category}
                      </p>
                      <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {reward.title}
                      </h3>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-bold flex items-center gap-1",
                          canRedeem ? "text-primary-600" : "text-gray-400",
                        )}>
                        {canRedeem ? "Redeem Now" : "Not Enough Points"}
                        {canRedeem && <ArrowRight className="w-4 h-4" />}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  No rewards found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          {historyLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : history.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      {getIcon(h.rewardIcon)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {h.rewardTitle}
                      </h4>
                      <p className="text-sm text-gray-400 font-medium">
                        {format(new Date(h.date), "PPP p")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                      -{h.pointsSpent} PTS
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100 uppercase tracking-wider">
                      Redeemed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                No redemption history
              </h3>
              <p className="text-gray-500">
                You haven't redeemed any rewards yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Redemption Modal */}
      <Transition show={!!selectedReward} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setSelectedReward(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-0 text-left align-middle shadow-2xl transition-all">
                  {selectedReward && (
                    <>
                      <div className="relative h-40 bg-gradient-to-br from-primary-50 to-indigo-50 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center">
                          {getIcon(selectedReward.icon, "w-12 h-12")}
                        </div>
                        <button
                          onClick={() => setSelectedReward(null)}
                          className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors cursor-pointer focus:outline-none">
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>

                      <div className="p-8">
                        <div className="text-center mb-8">
                          <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
                            {selectedReward.category}
                          </span>
                          <Dialog.Title
                            as="h3"
                            className="text-2xl font-black text-gray-900 leading-tight mb-2">
                            {selectedReward.title}
                          </Dialog.Title>
                          <p className="text-gray-500">
                            Redeem this reward using your points.
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex items-center justify-between border border-gray-100">
                          <span className="text-sm font-bold text-gray-500">
                            Cost
                          </span>
                          <span className="text-xl font-black text-primary-600">
                            {selectedReward.pointsRequired} Points
                          </span>
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={handleRedeem}
                            disabled={
                              userPoints < selectedReward.pointsRequired ||
                              redeeming
                            }
                            className={cn(
                              "w-full py-4 text-base rounded-xl shadow-lg shadow-primary-500/25",
                              userPoints < selectedReward.pointsRequired
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:shadow-primary-500/40 hover:-translate-y-0.5",
                            )}>
                            {redeeming ? (
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                              <Gift className="w-5 h-5 mr-2" />
                            )}
                            {redeeming ? "Processing..." : "Confirm Redemption"}
                          </Button>
                          {userPoints < selectedReward.pointsRequired && (
                            <p className="text-center text-xs font-bold text-red-500">
                              Insufficient points. You need{" "}
                              {selectedReward.pointsRequired - userPoints} more.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Marketplace;
