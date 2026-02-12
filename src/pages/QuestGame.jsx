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
import { getAIBaseUrl } from "../config";

const QuestGame = () => {
  const authUser = useAuthStore((s) => s.user);
  const {
    quests,
    selectedQuestId,
    setSelectedQuest,
    completeQuest,
    currentLocation,
    distanceWalkedMeters,
    user,
    fetchQuests,
    fetchUserStats,
    fetchQuestStatus,
    anchored,
    anchorQuestsToLocation,
    setQuestProfile,
    engagedQuest,
    setEngagedQuest,
    isAITracking,
    setIsAITracking,
    skipQuest,
    fetchLeaderboard,
    fetchRewards
  } = useGameStore();

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastQuestDone, setLastQuestDone] = useState(null);
  const [aiReps, setAiReps] = useState(0);
  const [activeTab, setActiveTab] = useState("map");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    setQuestProfile({
      age: authUser?.age,
      conditions: authUser?.conditions,
    });
  }, [authUser?.age, authUser?.conditions, setQuestProfile]);

  useEffect(() => {
    fetchUserStats();
    fetchLeaderboard();
    fetchRewards();
    fetchQuests();

    // Refresh leaderboard and rewards every 30 seconds
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

  const completedCount = quests.filter((q) => q.completed).length;
  const placeQuests = quests.filter((q) => q.type === "place");
  const walkQuests = quests.filter((q) => q.type === "walk");

  // Helper to check if user is near a quest
  const isNear = (q) => {
    if (!currentLocation || !q.lat || !q.lng) return false;
    const R = 6371000;
    const dLat = ((q.lat - currentLocation.lat) * Math.PI) / 180;
    const dLng = ((q.lng - currentLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((currentLocation.lat * Math.PI) / 180) *
      Math.cos((q.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c <= (q.radiusMeters || 10);
  };

  const currentAvailableQuest = placeQuests.find(q => !q.completed && isNear(q));

  // Auto-engage (autocomplete arrival) when within range
  useEffect(() => {
    if (currentAvailableQuest && !engagedQuest) {
      setEngagedQuest(currentAvailableQuest);
    }
  }, [currentAvailableQuest, engagedQuest, setEngagedQuest]);

  const handleQuestComplete = async () => {
    if (engagedQuest) {
      const success = await completeQuest(engagedQuest.id);
      if (success) {
        setLastQuestDone(engagedQuest);
        setEngagedQuest(null);
        setShowSuccess(true);
        setIsAITracking(false);
        fetchUserStats();
      }
    }
  };

  const startAITracker = () => {
    // No Python server needed - AITracker handles everything client-side
    setIsAITracking(true);
    setAiReps(0);
  };

  // No polling needed - AITracker component handles rep counting via callbacks

  const handleNextQuest = () => {
    setShowSuccess(false);
    if (currentLocation) {
      // Logic in store handles anchoring the NEXT one now
      useGameStore.setState({ anchored: false });
      anchorQuestsToLocation(currentLocation.lat, currentLocation.lng);
    }
  };

  return (
    <div className="min-h-full">
      {/* Quest Success Overlay */}
      {showSuccess && lastQuestDone && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full relative">
            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-gray-900 mb-2">Quest Complete!</h2>
            <p className="text-gray-600 mb-4">You earned <span className="font-bold text-emerald-600">+{lastQuestDone.points} points</span> for completing "{lastQuestDone.title}".</p>
            <button
              onClick={handleNextQuest}
              className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Next Quest
            </button>
          </div>
        </div>
      )}

      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden lg:block space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
              Quest Game
            </h1>
            <p className="text-gray-500 font-bold text-sm">
              Tailored fitness challenges & location-based rewards.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white text-gray-900 px-5 py-3 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <Target className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-tight">Today's Quests</p>
                <p className="font-black text-xl leading-none">{user.questsToday || 0}/10</p>
              </div>
            </div>
            <div className="bg-white text-gray-900 px-5 py-3 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <Zap className="w-6 h-6 text-orange-500" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-tight">Points</p>
                <p className="font-black text-xl leading-none">{user.pointsToday || 0}</p>
              </div>
            </div>
            <div className="bg-white text-gray-900 px-5 py-3 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <Footprints className="w-6 h-6 text-emerald-500" />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-tight">Walked</p>
                <p className="font-black text-xl leading-none">{(distanceWalkedMeters / 1000).toFixed(2)} km</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-[650px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100">
            <QuestMap />
          </div>
          <div className="space-y-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
            {/* Personal Analytics Section */}
            <div className="bg-indigo-900 rounded-3xl p-6 shadow-xl text-white">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-indigo-300" />
                <h3 className="font-black uppercase text-xs tracking-widest">My Progress</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-indigo-300 uppercase">Weekly Points</p>
                  <p className="text-xl font-black">{user.weeklyPoints || 0}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-indigo-300 uppercase">Today's Cap</p>
                  <p className="text-xl font-black">{user.questsToday}/10</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[9px] font-black text-indigo-300 uppercase mb-2">Daily Earnings (Last 7 Days)</p>
                {user.dailyEarnings && user.dailyEarnings.length > 0 ? (
                  user.dailyEarnings.map((day, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-indigo-200 font-bold">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <div className="flex-1 mx-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, (day.points / 500) * 100)}%` }} />
                      </div>
                      <span className="font-black">{day.points} P</span>
                    </div>
                  ))
                ) : (
                  <p className="text-indigo-400 text-[10px] font-bold">No points earned recently.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Active Objective</h3>
              </div>
              <div className="space-y-4">
                {quests.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuest(q.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedQuestId === q.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-50 bg-white hover:border-indigo-100'
                      } ${q.completed ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${q.completed ? "bg-green-100 text-green-600" : "bg-indigo-50 text-indigo-600"}`}>
                        {q.completed ? "DONE" : `NEXT OBJECTIVE (+${q.points} PTS)`}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 leading-tight">{q.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1">{q.description}</p>
                    {currentLocation && q.lat && (
                      <p className="text-[9px] font-black text-indigo-500 uppercase mt-2">
                        Direction: {Math.round(distanceMeters(currentLocation.lat, currentLocation.lng, q.lat, q.lng))}m away
                      </p>
                    )}
                    {q.type === "walk" && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase text-gray-400">
                          <span>Progress</span>
                          <span>{Math.round(distanceWalkedMeters)} / {q.targetMeters}m</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all duration-700"
                            style={{ width: `${Math.min(100, (distanceWalkedMeters / q.targetMeters) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
                {quests.length === 0 && (
                  <p className="text-gray-400 font-bold text-xs text-center py-4">No objective active. Check back tomorrow!</p>
                )}
              </div>
            </div>
            <Leaderboard />
            <RewardsPanel />
          </div>
        </div>
      </div>

      {/* ─── MOBILE VIEW ─── */}
      <div className="lg:hidden flex flex-col gap-6 pb-24">
        {/* Mobile Header */}
        <div className="px-4 pt-4">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
            Quest Game
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Complete pushup challenges
          </p>
        </div>

        {/* Mobile Map - Improved height */}
        <div className="relative h-[40vh] min-h-[300px] rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 mx-4">
          <QuestMap />
        </div>

        {/* Mobile Stats - Touch-friendly */}
        <div className="bg-white rounded-[2.5rem] p-5 mx-4 border border-gray-100 shadow-sm">
          <div className="flex justify-around items-center bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl gap-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quests</p>
              <p className="text-3xl font-black text-gray-900">{user.questsToday || 0}/10</p>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Points</p>
              <p className="text-3xl font-black text-indigo-600">{user.pointsToday || 0}</p>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Walked</p>
              <p className="text-2xl font-black text-emerald-600">{(distanceWalkedMeters / 1000).toFixed(1)}km</p>
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher - Touch-optimized */}
        <div className="px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {["quests", "leaderboard", "rewards"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-gray-100 text-gray-400 active:scale-95"
                  }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "quests" && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Places to Visit</p>
              <div className="grid gap-3">
                {placeQuests.map(q => (
                  <button
                    key={q.id}
                    onClick={() => { setSelectedQuest(q.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`p-5 rounded-[2rem] border-2 text-left transition-all ${selectedQuestId === q.id ? "border-indigo-600 bg-indigo-50/50" : "border-gray-50 bg-white"
                      }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-gray-900">{q.title}</h4>
                      <span className="text-[8px] font-black text-indigo-600 px-2 py-1 bg-indigo-50 rounded-lg">+{q.points} P</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mb-2">{q.description}</p>
                    {currentLocation && q.lat && (
                      <p className="text-[9px] font-black text-indigo-500 uppercase">
                        {Math.round(distanceMeters(currentLocation.lat, currentLocation.lng, q.lat, q.lng))}m away
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Walk Progress</p>
              <div className="grid gap-3">
                {walkQuests.map(q => (
                  <button
                    key={q.id}
                    onClick={() => { setSelectedQuest(q.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`p-6 rounded-[2rem] border-2 text-left transition-all ${selectedQuestId === q.id ? "border-indigo-600 bg-indigo-50/50" : "border-gray-50 bg-white"
                      }`}>
                    <h4 className="font-black text-gray-900 mb-4">{q.title}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase text-indigo-600">
                        <span>{Math.round(distanceWalkedMeters)}m covered</span>
                        <span>Target: {q.targetMeters}m</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (distanceWalkedMeters / q.targetMeters) * 100)}%` }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && <Leaderboard />}
        {activeTab === "rewards" && <RewardsPanel />}
      </div>

      {/* QUEST INTERACTION OVERLAY ─── */}
      {currentAvailableQuest && !engagedQuest && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setEngagedQuest(currentAvailableQuest)}
            className="flex flex-col items-center bg-indigo-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl animate-bounce border-4 border-white">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 animate-pulse" />
              <span className="font-black text-lg tracking-tight uppercase">Arrived at {currentAvailableQuest.title}</span>
            </div>
            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-1">Click to Start Objective</p>
          </button>
        </div>
      )
      }

      {/* QUEST ENGAGEMENT MODAL */}
      {engagedQuest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative border-4 border-indigo-100">
            <button
              onClick={() => setEngagedQuest(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={28} />
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl shadow-indigo-200">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                {engagedQuest.title}
              </h2>
              <p className="text-gray-600 font-medium text-lg mb-4">
                {engagedQuest.description}
              </p>

              {/* PROMINENT POINTS DISPLAY */}
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 px-8 py-4 rounded-full border-2 border-emerald-200 shadow-lg shadow-emerald-100">
                <Zap className="w-6 h-6 text-emerald-600" />
                <div className="text-left">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Points Reward</p>
                  <p className="text-3xl font-black text-emerald-700">+{engagedQuest.points}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* SKIP BUTTON - SHOWN FIRST, ALWAYS VISIBLE */}
              <button
                onClick={() => {
                  if (window.confirm(`Skip this quest? You'll get 0 points but it will count toward your daily limit (${user.questsToday + 1}/10).`)) {
                    skipQuest(engagedQuest.id);
                  }
                }}
                className="w-full py-4 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-[2rem] font-bold uppercase text-sm tracking-widest transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2">
                <X className="w-5 h-5" />
                ⏭️ Skip This Quest (0 Points)
              </button>

              {/* AI TRACKING BUTTON */}
              {engagedQuest.videoVerification && !isAITracking && (
                <button
                  onClick={startAITracker}
                  className="w-full group relative flex items-center justify-center gap-4 py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-200">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-orange-600 px-4 py-1.5 rounded-full text-xs border-2 border-orange-200 font-black uppercase">✨ Recommended</div>
                  <Video className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Start AI Tracking</span>
                </button>
              )}

              {isAITracking && (
                <div className="rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-orange-500 aspect-[9/16] md:aspect-video relative">
                  {/* Client-Side AI Tracker */}
                  <AITracker
                    targetReps={engagedQuest.targetReps || 20}
                    onRepCount={(count) => setAiReps(count)}
                    onTargetReached={() => {
                      setAiReps(engagedQuest.targetReps || 20);
                      handleQuestComplete();
                    }}
                    onClose={() => setIsAITracking(false)}
                  />
                </div>
              )}
            </div>

            <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest mt-6">
              Quest {(user.questsToday || 0) + 1} of 10 Today
            </p>
          </div>
        </div>
      )}

      {/* QUEST SUCCESS OVERLAY ─── */}
      {showSuccess && lastQuestDone && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-indigo-600/90 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl">
            <div className="w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center text-green-600 mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Objective Cleared!</h2>
            <p className="text-gray-500 font-bold text-sm mb-8">You've successfully completed the {lastQuestDone.exercise || 'objective'} and earned <span className="text-indigo-600">+{lastQuestDone.points} Points</span>!</p>

            <div className="bg-gray-50 p-6 rounded-3xl mb-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Weekly Validity</p>
              <p className="text-xs font-bold text-gray-600 leading-relaxed">Your points are valid until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}.</p>
            </div>

            <button
              onClick={handleNextQuest}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3">
              <span>Proceed to Next Objective</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )
      }
    </div >
  );
};

export default QuestGame;
