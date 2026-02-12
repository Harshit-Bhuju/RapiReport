import React from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { CalendarCheck, Clock, Coffee, Moon, Sun } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { DailyRoutineCard } from "@/components/ui/HealthInsightCard";
import { FamilyMemberCard } from "@/components/ui/FamilyMemberCard";
import { getDailyActivities } from "@/lib/aiProcessor";

const HealthPlanner = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Initialize activities with 'pending' status
  const [activities, setActivities] = React.useState(() => {
    const initialActivities = getDailyActivities(user || { age: 28 });
    return initialActivities.map((act) => ({ ...act, status: "pending" }));
  });

  const handleVerify = (id) => {
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, status: "verified" } : act)),
    );
  };

  // Calculate progress
  const completedCount = activities.filter(
    (a) => a.status === "verified",
  ).length;
  const progress =
    activities.length > 0
      ? Math.round((completedCount / activities.length) * 100)
      : 0;

  // Calculate dash array for progress circle (circumference is ~100)
  const circumference = 100;
  const dashOffset = circumference - (progress / 100) * circumference;

  const timeSlots = [
    {
      label: t("planner.morning"),
      icon: Sun,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: t("planner.daytime"),
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: t("planner.evening"),
      icon: Moon,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
  ];

  const [familyMembers, setFamilyMembers] = React.useState([
    {
      id: 1,
      name: "Mom",
      relation: "Mother",
      healthScore: 85,
      completedTasks: 4,
      totalTasks: 5,
      alerts: [],
    },
    {
      id: 2,
      name: "Dad",
      relation: "Father",
      healthScore: 72,
      completedTasks: 2,
      totalTasks: 5,
      alerts: ["Missed BP Check"],
    },
  ]);
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [newMemberName, setNewMemberName] = React.useState("");
  const [newMemberRelation, setNewMemberRelation] = React.useState("");

  const handleAddMember = (e) => {
    e.preventDefault();
    if (newMemberName && newMemberRelation) {
      setFamilyMembers([
        ...familyMembers,
        {
          id: Date.now(),
          name: newMemberName,
          relation: newMemberRelation,
          healthScore: 100, // Start with perfect score
          completedTasks: 0,
          totalTasks: 5,
          alerts: [],
        },
      ]);
      setNewMemberName("");
      setNewMemberRelation("");
      setShowAddMember(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-success-600" />
            {t("planner.title")}
          </h1>
          <p className="text-gray-500 font-bold mt-2">
            {t("planner.subtitle")}
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm self-start">
          {[t("planner.today"), t("planner.next7")].map((tab, idx) => (
            <button
              key={tab}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${idx === 0 ? "bg-primary-600 text-white shadow-lg" : "text-gray-400"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Routine List */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">
                {t("planner.routine")}
              </h2>
            </div>
            <Card className="border-none shadow-sm">
              <CardBody className="p-8">
                <DailyRoutineCard
                  activities={activities}
                  onVerify={handleVerify}
                />
              </CardBody>
            </Card>
          </section>

          {/* Family Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {t("planner.familyCircle")}
                </h2>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  {t("planner.monitor")}
                </p>
              </div>
              <button
                onClick={() => setShowAddMember(true)}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-black shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                + {t("family.addMember")}
              </button>
            </div>

            {showAddMember && (
              <Card className="mb-8 border-primary-100 bg-primary-50/50 rounded-[2rem]">
                <CardBody className="p-8">
                  <form
                    onSubmit={handleAddMember}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        {t("planner.addMember.nameLabel")}
                      </label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all font-bold text-sm"
                        placeholder={t("planner.addMember.placeholderName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        {t("planner.addMember.relationLabel")}
                      </label>
                      <input
                        type="text"
                        value={newMemberRelation}
                        onChange={(e) => setNewMemberRelation(e.target.value)}
                        className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all font-bold text-sm"
                        placeholder={t("planner.addMember.placeholderRelation")}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-primary-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-1 transition-all">
                        {t("planner.addMember.save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddMember(false)}
                        className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 text-sm">
                        {t("planner.addMember.cancel")}
                      </button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {familyMembers.map((member) => (
                <FamilyMemberCard key={member.id} member={member} />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {timeSlots.map((slot) => (
              <Card key={slot.label} className="border-none shadow-sm h-full">
                <CardBody className="p-6">
                  <div
                    className={`w-10 h-10 ${slot.bg} ${slot.color} rounded-xl flex items-center justify-center mb-4`}>
                    <slot.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-gray-900 text-sm mb-1">
                    {slot.label}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {
                      activities.filter((a) =>
                        a.time.includes(slot.label.split(" ")[0]),
                      ).length
                    }{" "}
                    {t("planner.tasks")}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Planner Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="h-2 bg-primary-600" />
            <CardBody className="p-8">
              <h3 className="text-lg font-black text-gray-900 mb-4">
                {t("planner.todaysProgress")}
              </h3>
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    strokeDasharray="100, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="3"
                  />
                  <path
                    className="text-primary-600 transition-all duration-1000 ease-out"
                    strokeDasharray={`${progress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-900">
                    {progress}%
                  </span>
                </div>
              </div>
              <p className="text-center text-xs font-bold text-gray-500">
                {t("planner.activitiesCompleted")}
              </p>
            </CardBody>
          </Card>

          <Card className="border-none shadow-sm bg-success-50">
            <CardBody className="p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-success-600 shadow-sm shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-success-900 text-sm">
                    {t("planner.healthTip")}
                  </h4>
                  <p className="text-xs font-bold text-success-700/70 mt-1 leading-relaxed italic">
                    {t("planner.tipText")}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HealthPlanner;
