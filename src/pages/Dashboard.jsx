import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Plus,
  FileText,
  Pill,
  MessageSquare,
  ChevronRight,
  ClipboardList,
  Stethoscope,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useHealthStore } from "@/store/healthStore";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { HealthInsightCard } from "@/components/ui/HealthInsightCard";
import ChatInterface from "@/components/features/ChatInterface";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const QuickAction = ({ icon: Icon, label, onClick, colorClass, bgClass }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 group">
    <div
      className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
        bgClass,
        "group-hover:bg-opacity-80",
      )}>
      <Icon className={cn("w-6 h-6", colorClass)} />
    </div>
    <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">
      {label}
    </span>
  </button>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reports, fetchReports, adherenceLogs, fetchAdherenceLogs } =
    useHealthStore();

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin");
      return;
    }
    if (user?.role === "doctor") {
      navigate("/doctor-dashboard");
      return;
    }
    fetchReports();
  }, [fetchReports, fetchAdherenceLogs, user, navigate]);

  // Calculate adherence stats for the chart
  const adherenceData = useMemo(() => {
    // Mock data for demonstration if no real logs exist
    if (!adherenceLogs || adherenceLogs.length === 0) {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const todayIndex = new Date().getDay();
      const rotatedDays = [
        ...days.slice(todayIndex),
        ...days.slice(0, todayIndex),
      ];
      return rotatedDays.map((day) => ({
        name: day,
        score: Math.floor(Math.random() * (100 - 60 + 1)) + 60, // Random score between 60 and 100
      }));
    }

    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const logs = adherenceLogs.filter((l) => l.date === dateStr);
      const taken = logs.filter((l) => l.taken).length;
      const total = logs.length || 1; // Avoid division by zero, though 0/1 is 0
      const percentage = logs.length > 0 ? (taken / total) * 100 : 0;
      data.push({
        name: d.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        score: Math.round(percentage),
      });
    }
    return data;
  }, [adherenceLogs]);

  const displayReport =
    reports.length > 0
      ? reports[0]
      : {
          id: "mock-report",
          type: "General Blood Panel",
          date: new Date().toISOString(),
          lab: "MediCare Labs",
          status: "normal",
        };

  const currentHour = new Date().getHours();
  let greetingKey = "dashboardPage.greetingMorning";
  if (currentHour >= 12 && currentHour < 17) {
    greetingKey = "dashboardPage.greetingAfternoon";
  } else if (currentHour >= 17 || currentHour < 5) {
    greetingKey = "dashboardPage.greetingEvening";
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            {t(greetingKey, {
              name: user?.name?.split(" ")[0] || "User",
            })}
            <span className="text-primary-600">.</span>
          </h1>
          <p className="text-gray-500 font-medium mt-2 text-lg">
            {t("dashboardPage.summary")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/profile")}
            className="hidden sm:flex rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50">
            {t("dashboardPage.viewProfile")}
          </Button>
          <Button
            size="lg"
            onClick={() => navigate("/reports")}
            className="rounded-xl shadow-lg shadow-primary-200/50 hover:shadow-primary-300/50 transition-all">
            <Plus className="w-5 h-5 mr-2" />
            {t("dashboardPage.analyzeNew")}
          </Button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction
          icon={FileText}
          label={t("dashboardPage.uploadReport")}
          onClick={() => navigate("/reports")}
          bgClass="bg-blue-50"
          colorClass="text-blue-600"
        />
        <QuickAction
          icon={Activity}
          label={t("dashboardPage.logSymptoms")}
          onClick={() => navigate("/symptoms")}
          bgClass="bg-red-50"
          colorClass="text-red-600"
        />
        <QuickAction
          icon={MessageSquare}
          label={t("dashboardPage.askAI")}
          onClick={() => navigate("/consultation")}
          bgClass="bg-violet-50"
          colorClass="text-violet-600"
        />
      </div>

      {/* Main Grid: Insights & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Insight */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {t("dashboardPage.latestInsight")}
              </h2>
            </div>
            <HealthInsightCard
              type="info"
              insights={[
                {
                  en: t("dashboardPage.insightExample", { lng: "en" }),
                  ne: t("dashboardPage.insightExample", { lng: "ne" }),
                },
              ]}
              className="border-l-4 border-l-amber-400 bg-amber-50/50"
            />
          </section>

          {/* Adherence Chart */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                {t("dashboardPage.adherenceTitle")}
              </h2>
              <select className="text-xs font-bold bg-transparent border-none text-gray-500 cursor-pointer focus:ring-0">
                <option>{t("dashboardPage.last7Days")}</option>
                <option>{t("dashboardPage.last30Days")}</option>
              </select>
            </div>
            <Card className="shadow-sm border-none bg-white">
              <CardBody className="p-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={adherenceData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient
                        id="colorScore"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1">
                        <stop
                          offset="5%"
                          stopColor="#4f46e5"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#4f46e5"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </section>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">
          {/* Latest Report Card */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                {t("dashboardPage.recent")}
              </h2>
              <button
                onClick={() => navigate("/reports")}
                className="text-xs font-bold text-primary-600 hover:text-primary-700">
                {t("dashboardPage.viewAll")}
              </button>
            </div>

            <Card
              className="border-none shadow-lg shadow-gray-100 group cursor-pointer overflow-hidden relative"
              onClick={() =>
                displayReport.id !== "mock-report"
                  ? navigate(`/results/${displayReport.id}`)
                  : navigate("/reports")
              }>
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500" />
              <CardBody className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <Badge
                    variant={
                      displayReport.status === "normal" ? "success" : "error"
                    }>
                    {displayReport.status === "normal"
                      ? t("dashboardPage.statusNormal")
                      : t("dashboardPage.statusAttention")}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                  {displayReport.type || "Lab Report"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {displayReport.lab || "Unknown Lab"} •{" "}
                  {displayReport.date
                    ? new Date(displayReport.date).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                      })
                    : "No Date"}
                </p>

                <div className="flex items-center text-primary-600 font-bold text-sm mt-2 group-hover:translate-x-1 transition-transform">
                  {t("dashboardPage.viewDetails")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardBody>
            </Card>
          </section>

          {/* Consult a Specialist */}
          <Card className="border-none shadow-xl bg-white border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardBody className="p-6 sm:p-8">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Stethoscope className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-black mb-2 text-gray-900">
                {t("dashboardPage.consultSpecialist")}
              </h3>
              <p className="text-sm font-bold text-gray-500 leading-relaxed mb-8">
                {t("dashboardPage.consultDesc")}
              </p>
              <Button
                className="w-full bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-100 font-black rounded-2xl py-4 flex items-center justify-center gap-2"
                onClick={() => navigate("/consultants")}>
                {t("dashboardPage.findDoctor")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
      <ChatInterface />
    </div>
  );
};

export default Dashboard;
