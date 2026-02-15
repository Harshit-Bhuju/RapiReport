import React, { useState, useEffect } from "react";
import { useGameStore, distanceMeters, ARRIVED_RADIUS_METERS } from "../store/gameStore";
import { useAuthStore } from "../store/authStore";
import QuestMap from "../components/game/QuestMap";
import Leaderboard from "../components/game/Leaderboard";
import RewardsPanel from "../components/game/RewardsPanel";
import AITracker from "../components/game/AITracker";
import {
  Trophy,
  Gift,
  Zap,
  Target,
  CheckCircle2,
  Footprints,
  Video,
  X,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { getAIBaseUrl } from "../config";

const QuestGame = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const {
    quests,
    selectedQuestId,
    setSelectedQuest,
    completeQuest,
    currentLocation,
    user,
    fetchQuests,
    fetchUserStats,
    anchored,
    anchorQuestsToLocation,
    setQuestProfile,
    setAuthUserId,
    engagedQuest,
    setEngagedQuest,
    isAITracking,
    setIsAITracking,
    skipQuest,
    fetchLeaderboard,
    fetchRewards,
    viewingQuestId,
    setViewingQuestId,
    cancelQuest,
  } = useGameStore();

  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastQuestDone, setLastQuestDone] = useState(null);
  const [aiReps, setAiReps] = useState(0);

  useEffect(() => {
    setAuthUserId(authUser?.user_id ?? authUser?.id ?? null);
    setQuestProfile({
      age: authUser?.age,
      conditions: authUser?.conditions,
    });
  }, [authUser?.id, authUser?.age, authUser?.conditions, setAuthUserId, setQuestProfile]);

  // Show daily objectives immediately (anchor with default center so list is never empty)
  const DEFAULT_QUEST_LAT = 27.7172;
  const DEFAULT_QUEST_LNG = 85.324;

  useEffect(() => {
    anchorQuestsToLocation(DEFAULT_QUEST_LAT, DEFAULT_QUEST_LNG);
    fetchUserStats();
    fetchLeaderboard();
    fetchRewards();
    fetchQuests();

    const interval = setInterval(() => {
      fetchUserStats();
      fetchLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUserStats, fetchQuests, fetchLeaderboard, fetchRewards, anchorQuestsToLocation]);

  // When auth user becomes available, refetch so points/leaderboard come from DB
  useEffect(() => {
    if (authUser?.id) {
      fetchUserStats();
      fetchLeaderboard();
      fetchQuests();
    }
  }, [authUser?.id, fetchUserStats, fetchLeaderboard, fetchQuests]);

  // When real location is available, anchor quests. 
  // We allow re-anchoring ONCE if the previous anchor was the default one (27.7...) 
  // or if we haven't anchored at all.
  useEffect(() => {
    if (!currentLocation) return;

    // Check if we are still on default anchor or not anchored
    const isDefaultAnchor = quests.length > 0 && quests[0].lat === DEFAULT_QUEST_LAT + (QUEST_POOL[0].offsetLat || 0);

    if (!anchored || isDefaultAnchor) {
      anchorQuestsToLocation(currentLocation.lat, currentLocation.lng, true);
      fetchQuests();
    }
  }, [currentLocation?.lat, currentLocation?.lng, anchored, quests, anchorQuestsToLocation, fetchQuests]);

  // AUTO-OPEN NEXT QUEST: When questsToday increments, find and open the next available quest
  useEffect(() => {
    const nextIdx = user.questsToday ?? 0;
    if (nextIdx < quests.length) {
      const nextQuest = quests[nextIdx];
      if (nextQuest && !nextQuest.completed && !nextQuest.skipped) {
        // Delay slightly to allow success animation or skip transition to feel natural
        const timer = setTimeout(() => {
          setViewingQuestId(nextQuest.id);
          setSelectedQuest(nextQuest.id);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user.questsToday, quests.length]); // quests.length check ensures we don't trigger too early

  const viewingQuest = quests.find(q => q.id === viewingQuestId);

  const handleQuestComplete = async () => {
    if (engagedQuest) {
      const success = await completeQuest(engagedQuest.id);
      if (success) {
        setLastQuestDone(engagedQuest);
        setEngagedQuest(null);
        setViewingQuestId(null);
        setShowSuccess(true);
        setIsAITracking(false);
        fetchUserStats();
        fetchLeaderboard();
        fetchQuests();
      } else {
        toast.error("Quest completion failed. Please try again.");
        setIsAITracking(false); // Close the tracker so user isn't stuck
      }
    }
  };

  const startAITracker = () => {
    setIsAITracking(true);
    setAiReps(0);
  };

  const handleNextQuest = () => {
    setShowSuccess(false);
    if (currentLocation) {
      useGameStore.setState({ anchored: false });
      anchorQuestsToLocation(currentLocation.lat, currentLocation.lng);
    }
  };

  return (
    <div className="min-h-full pb-8">
      {/* ─── HEADER: Title + Points + Leaderboard (popup) + Rewards link ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 md:mb-4 px-4 md:px-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase truncate">
            {t("quest.title")}
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-xs md:text-sm truncate">
            {t("hero.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap">
          <div className="bg-white text-gray-900 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border border-gray-100 flex items-center gap-1.5 sm:gap-2 shadow-sm min-w-0">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] text-gray-400 font-black uppercase leading-tight">Daily</p>
              <p className="font-black text-xs sm:text-sm leading-none tabular-nums">{user.questsToday ?? 0}/10</p>
            </div>
          </div>
          <div className="bg-white text-gray-900 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border border-gray-100 flex items-center gap-1.5 sm:gap-2 shadow-sm min-w-0">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] text-gray-400 font-black uppercase leading-tight">Points</p>
              <p className="font-black text-xs sm:text-sm leading-none tabular-nums">{user.pointsToday ?? 0}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLeaderboardPopup(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100 transition-colors"
            aria-label="Open leaderboard">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="font-bold text-[10px] sm:text-sm sm:inline hidden">Leaderboard</span>
          </button>
          <Link
            to="/marketplace"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-purple-50 border border-purple-100 text-purple-700 hover:bg-purple-100 transition-colors"
            aria-label="Rewards marketplace">
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="font-bold text-[10px] sm:text-sm sm:inline hidden">Rewards</span>
          </Link>
        </div>
      </div>

      {/* ─── RESPONSIVE LAYOUT: Map + compact objectives (minimal scroll) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="lg:col-span-2 order-1">
          <div className="h-[32vh] sm:h-[38vh] md:h-[400px] lg:h-[520px] rounded-xl md:rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            <QuestMap />
          </div>
        </div>

        {/* Daily Objectives: compact grid, minimal vertical scroll */}
        <div className="px-4 lg:px-0 order-2">
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest">Daily Objectives</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 max-h-[28vh] sm:max-h-[36vh] lg:max-h-[460px] overflow-y-auto overflow-x-hidden scrollbar-thin">
              {quests.map((q, idx) => {
                const isLocked = idx > (user.questsToday ?? 0);
                const isCurrent = idx === (user.questsToday ?? 0);
                const isCompleted = q.completed || q.skipped;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      if (!isLocked && !isCompleted) {
                        setViewingQuestId(q.id);
                        setSelectedQuest(q.id);
                      }
                    }}
                    disabled={isLocked || isCompleted}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${isLocked
                      ? "bg-gray-50 border-gray-100 cursor-not-allowed opacity-60"
                      : isCompleted
                        ? q.skipped
                          ? "bg-red-50/50 border-red-100 opacity-80 cursor-default"
                          : "bg-emerald-50/50 border-emerald-100 opacity-80 cursor-default"
                        : isCurrent
                          ? viewingQuestId === q.id ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200" : "border-gray-200 bg-white hover:border-indigo-300"
                          : "bg-white border-gray-100"
                      }`}>
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[8px] font-black px-1 py-0.5 rounded shrink-0 ${q.skipped ? "bg-red-100 text-red-700" : isCompleted ? "bg-emerald-100 text-emerald-700" : isLocked ? "bg-gray-200 text-gray-500" : "bg-indigo-600 text-white"}`}>
                          #{idx + 1}
                        </span>
                        {isCompleted && !q.skipped && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                        {q.skipped && <X className="w-3 h-3 text-red-500 shrink-0" />}
                        <h4 className={`font-bold text-[11px] truncate ${isLocked ? "text-gray-400" : "text-gray-900"}`}>{q.title}</h4>
                      </div>
                      {!isLocked && !isCompleted && <span className="text-[9px] font-black text-indigo-600 shrink-0">+{q.points}P</span>}
                      {q.skipped && <span className="text-[8px] font-black text-red-600 uppercase tracking-tighter shrink-0">Skipped</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quest Detail Popup (when quest clicked) – no "reached destination" here; that shows after Start Quest ─── */}
      <AnimatePresence>
        {viewingQuest && !engagedQuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setViewingQuestId(null)}>
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6">
              {/* Manual Close Button for Quest Detail */}
              <button
                onClick={() => setViewingQuestId(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-black text-gray-900 leading-tight flex-1 pr-10">{viewingQuest.title}</h2>
                <button type="button" onClick={() => setViewingQuestId(null)} className="p-2 hover:bg-gray-100 rounded-full shrink-0 -m-2">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">{viewingQuest.description}</p>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 mb-4">
                <p className="text-[9px] font-black text-emerald-600 uppercase">Completion</p>
                <p className="font-black text-emerald-700">+{viewingQuest.points} P</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEngagedQuest(viewingQuest)}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">
                  Start Quest
                </button>
                <button
                  onClick={() => {
                    toast((t) => (
                      <div className="flex flex-col gap-3">
                        <p className="font-bold text-gray-900">Skip this quest?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              skipQuest(viewingQuest.id);
                              setViewingQuestId(null);
                              fetchQuests();
                              toast.dismiss(t.id);
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-bold text-sm hover:bg-gray-700">
                            Skip
                          </button>
                          <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ), { duration: Infinity });
                  }}
                  className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase">
                  Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Leaderboard Popup (mobile + laptop) ─── */}
      <AnimatePresence>
        {showLeaderboardPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLeaderboardPopup(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm max-h-[85vh] sm:max-h-[80vh] overflow-hidden bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 shrink-0">
                <h3 className="font-black text-gray-900 text-base sm:text-lg">Weekly Leaderboard</h3>
                <button type="button" onClick={() => setShowLeaderboardPopup(false)} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Close">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-3 sm:p-4 overflow-y-auto min-h-0 flex-1">
                <Leaderboard compact />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODALS & OVERLAYS ─── */}
      <AnimatePresence>
        {engagedQuest && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 lg:p-8 flex justify-center">
            <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/50 ring-1 ring-black/5">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-gray-900 font-black uppercase text-sm tracking-widest">{engagedQuest.title}</h2>
                    <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-tight">Move to destination · {engagedQuest.targetReps ?? 5} {engagedQuest.exercise || "push-ups"}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEngagedQuest(null);
                    setViewingQuestId(null);
                  }}
                  className="p-2 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200 transition-all">
                  <X size={18} />
                </button>
              </div>

              {!isAITracking && (() => {
                const distM = currentLocation && engagedQuest.lat != null
                  ? distanceMeters(currentLocation.lat, currentLocation.lng, engagedQuest.lat, engagedQuest.lng)
                  : null;
                const reachedDestination = distM != null && distM <= ARRIVED_RADIUS_METERS;
                const distDisplay = distM != null ? (distM < 1 ? distM.toFixed(1) : Math.round(distM)) : "—";

                if (!reachedDestination) {
                  return (
                    <div className="text-center">
                      <div className="mb-6 p-6 rounded-3xl bg-slate-50/50 border-2 border-slate-100/50 text-left backdrop-blur-md">
                        <p className="font-bold text-slate-800 text-base leading-relaxed">
                          {distM != null ? (
                            <>You are <span className="font-black text-indigo-600 tabular-nums">{distDisplay}m</span> from the quest point. Move within <span className="text-indigo-600">1m</span> to unlock live tracking.</>
                          ) : (
                            "Syncing GPS satellites..."
                          )}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-indigo-500/60">
                          <Activity className="w-4 h-4 animate-pulse" />
                          <p className="text-[10px] font-black uppercase tracking-widest leading-none">Goal: Within 1m · {engagedQuest.targetReps ?? 5} {engagedQuest.exercise || "push-ups"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            skipQuest(engagedQuest.id);
                            setEngagedQuest(null);
                            setViewingQuestId(null);
                          }}
                          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors">
                          Skip this quest
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            cancelQuest();
                            setViewingQuestId(null);
                          }}
                          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                          Cancel & Exit
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="mb-6 p-6 rounded-3xl bg-emerald-50/80 border-2 border-emerald-100/80 text-left backdrop-blur-md">
                      <p className="font-black text-emerald-800 text-lg uppercase tracking-tight flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                        Destination Reached
                      </p>
                      <p className="text-emerald-700 text-sm font-bold mt-3 leading-relaxed">
                        You're within <span className="text-emerald-900 font-black">1m</span>. Now complete <span className="font-black text-indigo-600">{engagedQuest.targetReps ?? 5}</span> {engagedQuest.exercise || "push-ups"} with AI tracker to finish.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={startAITracker}
                        className="w-full py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]">
                        Start Video Tracking
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            skipQuest(engagedQuest.id);
                            setEngagedQuest(null);
                            setViewingQuestId(null);
                          }}
                          className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-red-50 text-red-600 border border-red-100">
                          Skip
                        </button>
                        <button
                          onClick={() => {
                            cancelQuest();
                            setViewingQuestId(null);
                          }}
                          className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-100 text-slate-500">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* AI Tracking Full-screen Overlay */}
        {isAITracking && engagedQuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black">
            <AITracker
              targetReps={engagedQuest.targetReps ?? 5}
              onRepCount={(count) => setAiReps(count)}
              onTargetReached={handleQuestComplete}
              onClose={() => setIsAITracking(false)}
            />
          </motion.div>
        )}

        {showSuccess && lastQuestDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-indigo-600/90 backdrop-blur-xl">
            <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl">
              <div className="w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center text-green-600 mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
                Objective Cleared!
              </h2>
              <p className="text-gray-500 font-bold text-sm mb-4 leading-relaxed">
                You've earned <span className="text-indigo-600">+{lastQuestDone.points} Points</span> towards your rewards!
              </p>
              {lastQuestDone.type === "place" && (
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-6">
                  Quest zone: {lastQuestDone.radiusMeters ?? 1}m
                </p>
              )}
              <button
                onClick={handleNextQuest}
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all">
                Proceed
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default QuestGame;
