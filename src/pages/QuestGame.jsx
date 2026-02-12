import React, { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { useAuthStore } from "../store/authStore";
import QuestMap from "../components/game/QuestMap";
import Leaderboard from "../components/game/Leaderboard";
import RewardsPanel from "../components/game/RewardsPanel";
import {
  Trophy,
  Gift,
  MapPin,
  Zap,
  Target,
  CheckCircle2,
  Footprints,
} from "lucide-react";

const QuestGame = () => {
  const authUser = useAuthStore((s) => s.user);
  const { user, quests, setQuestProfile, fetchLeaderboard, fetchUserStats, distanceWalkedMeters } =
    useGameStore();
  const [activeTab, setActiveTab] = useState("map");

  useEffect(() => {
    setQuestProfile({
      age: authUser?.age,
      conditions: authUser?.conditions,
    });
  }, [authUser?.age, authUser?.conditions, setQuestProfile]);

  useEffect(() => {
    fetchUserStats();
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, fetchUserStats]);

  const completedCount = quests.filter((q) => q.completed).length;
  const placeQuests = quests.filter((q) => q.type === "place");
  const walkQuests = quests.filter((q) => q.type === "walk");

  return (
    <div className="min-h-full">
      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden lg:block space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
              Quest Game
            </h1>
            <p className="text-gray-500 font-bold text-sm">
              Go to places or walk to earn points. Quests are tailored to your age & health for safe rewards.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white text-gray-900 px-5 py-3 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <Target className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  Quests
                </p>
                <p className="font-black text-xl leading-none">
                  {completedCount}/{quests.length}
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
            <div className="bg-white text-gray-900 px-5 py-3 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <Footprints className="w-6 h-6 text-emerald-500" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  Walked
                </p>
                <p className="font-black text-xl leading-none">
                  {(distanceWalkedMeters / 1000).toFixed(2)} km
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-[650px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100">
            <QuestMap />
          </div>
          <div className="space-y-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Go to this place</h3>
              </div>
              <div className="space-y-3">
                {placeQuests.map((q) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border ${
                      q.completed
                        ? "bg-green-50 border-green-100"
                        : "bg-gray-50 border-gray-100"
                    }`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {q.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {q.description}
                        </p>
                      </div>
                      {q.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <span className="text-xs font-bold text-indigo-600 shrink-0">
                          +{q.points} pts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Footprints className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Walk to this distance</h3>
              </div>
              <div className="space-y-3">
                {walkQuests.map((q) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border ${
                      q.completed
                        ? "bg-green-50 border-green-100"
                        : "bg-gray-50 border-gray-100"
                    }`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {q.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {q.description}
                        </p>
                      </div>
                      {q.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <span className="text-xs font-bold text-indigo-600 shrink-0">
                          +{q.points} pts
                        </span>
                      )}
                    </div>
                    {q.type === "walk" && !q.completed && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                100,
                                ((q.progressMeters || 0) / q.targetMeters) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 font-medium">
                          {q.progressMeters ?? 0} / {q.targetMeters} m
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Leaderboard />
            <RewardsPanel />
          </div>
        </div>
      </div>

      {/* ─── MOBILE VIEW ─── */}
      <div className="lg:hidden flex flex-col gap-6">
        <div className="relative h-[55vh] rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100">
          <QuestMap />
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
          <div className="flex justify-around items-center flex-wrap gap-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Quests
              </p>
              <p className="text-3xl font-black text-gray-900 leading-none">
                {completedCount}/{quests.length}
              </p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                Points
              </p>
              <p className="text-3xl font-black text-indigo-600 leading-none">
                {user.pointsToday}
              </p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                Walked
              </p>
              <p className="text-2xl font-black text-emerald-600 leading-none">
                {(distanceWalkedMeters / 1000).toFixed(2)} km
              </p>
            </div>
          </div>

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Go to this place
          </p>
          <div className="space-y-3">
            {placeQuests.map((q) => (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  q.completed
                    ? "bg-green-50 border-green-100"
                    : "bg-gray-50 border-gray-100"
                }`}>
                <div>
                  <p className="font-bold text-gray-900">{q.title}</p>
                  <p className="text-xs text-gray-500">{q.description}</p>
                </div>
                {q.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <span className="text-xs font-bold text-indigo-600">
                    +{q.points}
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Walk to this distance
          </p>
          <div className="space-y-3">
            {walkQuests.map((q) => (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border ${
                  q.completed
                    ? "bg-green-50 border-green-100"
                    : "bg-gray-50 border-gray-100"
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{q.title}</p>
                    <p className="text-xs text-gray-500">{q.description}</p>
                  </div>
                  {q.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <span className="text-xs font-bold text-indigo-600">
                      +{q.points}
                    </span>
                  )}
                </div>
                {q.type === "walk" && !q.completed && (
                  <>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((q.progressMeters || 0) / q.targetMeters) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {q.progressMeters ?? 0} / {q.targetMeters} m
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className="py-5 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 flex flex-col items-center gap-2">
              <Trophy className="w-6 h-6" />
              <span className="font-black text-[10px] uppercase tracking-widest text-center">
                Leaderboard
              </span>
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className="py-5 bg-white text-gray-900 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
              <Gift className="w-6 h-6 text-purple-600" />
              <span className="font-black text-[10px] uppercase tracking-widest text-center text-gray-400">
                Rewards
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === "leaderboard" && <Leaderboard />}
          {activeTab === "rewards" && <RewardsPanel />}
        </div>
      </div>
    </div>
  );
};

export default QuestGame;
