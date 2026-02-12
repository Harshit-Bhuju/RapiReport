import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useHealthStore } from "@/store/healthStore";
import { Flame, Bell, Pill, Plus, Check, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const SLOTS = [
  { key: "morning", label: "Morning" },
  { key: "noon", label: "Noon" },
  { key: "evening", label: "Evening" },
];

const Adherence = () => {
  const {
    adherenceLogs,
    adherenceReminders,
    addAdherenceLog,
    setAdherenceTaken,
    addReminder,
    removeReminder,
    getAdherenceStreak,
    getAdherencePointsToday,
    prescriptions,
    fetchAdherenceLogs,
    fetchAdherenceReminders,
    fetchPrescriptions,
  } = useHealthStore();

  useEffect(() => {
    fetchAdherenceLogs();
    fetchAdherenceReminders();
    fetchPrescriptions();
  }, [fetchAdherenceLogs, fetchAdherenceReminders, fetchPrescriptions]);

  const [newMed, setNewMed] = useState("");
  const [newSlot, setNewSlot] = useState("morning");
  const [newTime, setNewTime] = useState("08:00");

  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = adherenceLogs.filter((l) => l.date === today);
  const streak = getAdherenceStreak();
  const pointsToday = getAdherencePointsToday();

  const medsFromRx = prescriptions.flatMap((p) =>
    (p.meds || []).map((m) => m.name || "Medicine"),
  );
  const uniqueMeds = [...new Set(medsFromRx)].filter(Boolean);
  const medsForLog = uniqueMeds.length > 0 ? uniqueMeds : adherenceReminders.map((r) => r.medicineName);

  const handleAddReminder = () => {
    const name = newMed.trim() || "Medicine";
    addReminder({ medicineName: name, slot: newSlot, time: newTime });
    setNewMed("");
    toast.success("Reminder added.");
  };

  const handleLogTaken = (medicineName, slot) => {
    addAdherenceLog({ medicineName, slot, taken: true });
    toast.success("Logged as taken!");
  };

  const todayTotal = adherenceLogs.filter((l) => l.date === today).length || 1;
  const todayTaken = adherenceLogs.filter((l) => l.date === today && l.taken).length;

  const missions = [
    { id: "streak7", title: "7-day adherence streak", target: 7, current: Math.min(streak, 7), points: 50 },
    { id: "today", title: "Take all doses today", target: 1, current: todayTotal > 0 && todayTaken >= todayTotal ? 1 : 0, points: 10 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Adherence
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Track medicines, set reminders, earn points and streaks.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg shadow-gray-100/50">
          <CardBody className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center text-warning-600">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{streak}</p>
                <p className="text-xs font-bold text-gray-500">Day streak</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-lg shadow-gray-100/50">
          <CardBody className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{pointsToday}</p>
                <p className="text-xs font-bold text-gray-500">Points today</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-black text-gray-900">Gamified health missions</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Complete missions tied to adherence to earn bonus points.
          </p>
          <div className="space-y-3">
            {missions.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-warning-500" />
                  <div>
                    <p className="font-bold text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-500">{m.current}/{m.target} • +{m.points} pts</p>
                  </div>
                </div>
                <div className="w-20 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Reminders</h2>
            </div>
            <div className="space-y-3 mb-6">
              {adherenceReminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white"
                >
                  <div>
                    <p className="font-bold text-gray-900">{r.medicineName}</p>
                    <p className="text-xs text-gray-500">
                      {r.slot} • {r.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        r.enabled ? "bg-success-50 text-success-700" : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {r.enabled ? "On" : "Off"}
                    </span>
                    <button
                      onClick={() => removeReminder(r.id)}
                      className="text-xs font-bold text-error-600 hover:bg-error-50 px-2 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <Input
                label="Medicine name"
                value={newMed}
                onChange={(e) => setNewMed(e.target.value)}
                placeholder="e.g. Paracetamol"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Slot</label>
                  <select
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    className="input"
                  >
                    {SLOTS.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <Button onClick={handleAddReminder} className="gap-2 w-full">
                <Plus className="w-4 h-4" /> Add reminder
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
                <Check className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Today&apos;s log</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Mark when you take your medicine to build your streak.
            </p>
            <div className="space-y-3">
              {SLOTS.map((slot) => (
                <div key={slot.key} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    {slot.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {medsForLog.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Add a prescription or reminder above to track here.
                      </p>
                    ) : (
                    medsForLog.map((med) => {
                      const alreadyTaken = todayLogs.some(
                        (l) => l.medicineName === med && l.slot === slot.key && l.taken,
                      );
                      return (
                        <button
                          key={`${med}-${slot.key}`}
                          onClick={() => !alreadyTaken && handleLogTaken(med, slot.key)}
                          disabled={alreadyTaken}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                            alreadyTaken
                              ? "bg-success-50 border-success-200 text-success-700"
                              : "bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50",
                          )}
                        >
                          {alreadyTaken ? "✓ " : ""}{med}
                        </button>
                      );
                    })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Adherence;
