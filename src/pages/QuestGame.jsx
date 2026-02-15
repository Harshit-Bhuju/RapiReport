import React, { useState, useEffect } from "react";
import { useGameStore, distanceMeters } from "../store/gameStore";
import { useAuthStore } from "../store/authStore";
import QuestMap from "../components/game/QuestMap";
import Leaderboard from "../components/game/Leaderboard";
import RewardsPanel from "../components/game/RewardsPanel";
import AITracker from "../components/game/AITracker";
import {
  Trophy,
  Gift,
  MapPin,
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
  } = useGameStore();

  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastQuestDone, setLastQuestDone] = useState(null);
  const [aiReps, setAiReps] = useState(0);

  useEffect(() => {
    setAuthUserId(authUser?.id ?? null);
    setQuestProfile({
      age: authUser?.age,
      conditions: authUser?.conditions,
    });
  }, [authUser?.id, authUser?.age, authUser?.conditions, setAuthUserId, setQuestProfile]);

  useEffect(() => {
    fetchUserStats();
    fetchLeaderboard();
    fetchRewards();
    fetchQuests();

    const interval = setInterval(() => {
      fetchUserStats();
      fetchLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUserStats, fetchQuests, fetchLeaderboard, fetchRewards]);

  useEffect(() => {
    if (currentLocation && !anchored) {
      anchorQuestsToLocation(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation, anchored, anchorQuestsToLocation]);

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
                      if (!isLocked) {
                        setViewingQuestId(q.id);
                        setSelectedQuest(q.id);
                      }
                    }}
                    disabled={isLocked}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${isLocked
                      ? "bg-gray-50 border-gray-100 cursor-not-allowed opacity-60"
                      : isCurrent
                        ? viewingQuestId === q.id ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200" : "border-gray-200 bg-white hover:border-indigo-300"
                        : isCompleted ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-gray-100"
                      }`}>
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[8px] font-black px-1 py-0.5 rounded shrink-0 ${isCompleted ? "bg-emerald-100 text-emerald-700" : isLocked ? "bg-gray-200 text-gray-500" : "bg-indigo-600 text-white"}`}>
                          #{idx + 1}
                        </span>
                        {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                        <h4 className={`font-bold text-[11px] truncate ${isLocked ? "text-gray-400" : "text-gray-900"}`}>{q.title}</h4>
                      </div>
                      {!isLocked && !isCompleted && <span className="text-[9px] font-black text-indigo-600 shrink-0">+{q.points}P</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quest Detail Popup (when quest clicked) ─── */}
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
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Selected</span>
                    {currentLocation && viewingQuest.lat && (
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {Math.round(distanceMeters(currentLocation.lat, currentLocation.lng, viewingQuest.lat, viewingQuest.lng))}m away
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight">{viewingQuest.title}</h2>
                </div>
                <button onClick={() => setViewingQuestId(null)} className="p-2 hover:bg-gray-100 rounded-full shrink-0">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">{viewingQuest.description}</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase">Completion</p>
                  <p className="font-black text-emerald-700">+{viewingQuest.points} P</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <p className="text-[9px] font-black text-rose-600 uppercase">Skip</p>
                  <p className="font-black text-rose-700">-5 P</p>
                </div>
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
                        <p className="font-bold text-gray-900">Skip this quest? You&apos;ll lose 5 points.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              skipQuest(viewingQuest.id);
                              setViewingQuestId(null);
                              toast.dismiss(t.id);
                            }}
                            className="px-4 py-2 bg-rose-500 text-white rounded-lg font-bold text-sm">
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
              <p className="text-[9px] text-gray-400 font-bold uppercase text-center mt-3">Skip uses one daily slot</p>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex flex-col p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-white font-black uppercase text-sm tracking-widest">{engagedQuest.title}</h2>
                  <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-tight">Active Objective</p>
                </div>
              </div>
              <button
                onClick={() => setEngagedQuest(null)}
                className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full gap-8">
              {!isAITracking ? (
                <div className="bg-white rounded-[3rem] p-10 text-center shadow-2xl">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl mx-auto mb-8 flex items-center justify-center text-indigo-600">
                    <Video className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight leading-tight">
                    Start Video Verification
                  </h3>
                  <p className="text-gray-500 font-bold text-sm mb-10 leading-relaxed">
                    Position your phone where the AI can see your full body. Need {engagedQuest.targetReps} reps!
                  </p>
                  <button
                    onClick={startAITracker}
                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all text-sm">
                    Open AI Tracker
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-[9/16] md:aspect-video bg-black rounded-[2.5rem] overflow-hidden border-4 border-indigo-500/30 relative">
                  <AITracker
                    targetReps={engagedQuest.targetReps || 20}
                    onRepCount={(count) => setAiReps(count)}
                    onTargetReached={handleQuestComplete}
                    onClose={() => setIsAITracking(false)}
                  />
                </div>
              )}
            </div>
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
              <p className="text-gray-500 font-bold text-sm mb-8 leading-relaxed">
                You've earned <span className="text-indigo-600">+{lastQuestDone.points} Points</span> towards your rewards!
              </p>
              <button
                onClick={handleNextQuest}
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all">
                Proceed
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestGame;
