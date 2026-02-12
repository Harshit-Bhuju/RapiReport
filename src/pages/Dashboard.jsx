import React from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useOffline } from "@/hooks/useOffline";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate, cn } from "@/lib/utils";
import { HealthInsightCard } from "@/components/ui/HealthInsightCard";
import ChatInterface from "@/components/features/ChatInterface";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isOffline } = useOffline();

  const stats = [
    {
      label: t("dashboardPage.bloodTests"),
      value: "12",
      bg: "bg-primary-50",
    },
    {
      label: t("dashboardPage.healthScore"),
      value: "88%",
      icon: TrendingUp,
      color: "text-success-600",
      bg: "bg-success-50",
    },
    {
      label: t("dashboardPage.aiScore"),
      value: "High",
      icon: Zap,
      color: "text-warning-600",
      bg: "bg-warning-50",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            {t("dashboardPage.greeting", {
              name: user?.name?.split(" ")[0] || "User",
            })}
          </h1>
          <p className="text-gray-500 font-bold mt-2">
            {t("dashboardPage.summary")}
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => navigate("/results/new")}
          className="rounded-2xl shadow-xl shadow-primary-100">
          {t("dashboardPage.analyzeNew")}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Card
            key={idx}
            className="border-none shadow-sm h-full group hover:bg-white/50 transition-colors">
            <CardBody className="flex items-center gap-5 p-6">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  stat.bg,
                )}>
                <stat.icon className={cn("w-7 h-7", stat.color)} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {stat.value}
                </p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Main Grid: Insights & Latest Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                {t("dashboardPage.latestInsight")}
              </h2>
              <button
                onClick={() => navigate("/consultation")}
                className="text-xs font-black text-primary-600 hover:underline uppercase tracking-widest">
                {t("dashboardPage.askAI")}
              </button>
            </div>
            <HealthInsightCard
              type="warning"
              insights={[
                {
                  en: "Your last report shows low Hemoglobin. Focus on iron-rich activities in your daily planner.",
                  ne: "तपाईंको पछिल्लो रिपोर्टले कम हेमोग्लोबिन देखाउँछ। आफ्नो दैनिक योजनामा आइरनयुक्त गतिविधिहरू समावेश गर्नुहोस्।",
                },
              ]}
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-error-600" />
                {t("dashboardPage.vitalTrends")}
              </h2>
            </div>
            <Card className="shadow-sm h-64 flex items-center justify-center bg-white/50 border-dashed border-2 border-gray-100">
              <div className="text-center">
                <p className="text-sm font-bold text-gray-400">
                  {t("dashboardPage.graphPlaceholder")}
                </p>
                <p className="text-xs text-gray-300 mt-2 font-medium italic">
                  {t("dashboardPage.graphComing")}
                </p>
              </div>
            </Card>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              {t("dashboardPage.recent")}
            </h2>
            <Card
              className="border-none shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => navigate("/reports")}>
              <CardBody className="p-0">
                <div className="p-6 bg-indigo-50/50">
                  <Badge variant="error" className="mb-3">
                    {t("dashboardPage.abnormal")}
                  </Badge>
                  <h3 className="text-lg font-black text-gray-900">
                    {t("dashboardPage.thyroidPanel")}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                    Alka Hospital Lab • Jan 10
                  </p>
                </div>
                <div className="p-6 bg-white border-t border-gray-50">
                  <div className="flex items-center justify-between text-xs font-black text-indigo-600 uppercase tracking-widest">
                    <span>{t("dashboardPage.viewAnalysis")}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>

          <Card className="border-none shadow-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white overflow-hidden">
            <CardBody className="p-6 sm:p-8">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black mb-2">
                {t("dashboardPage.geneticWellness")}
              </h3>
              <p className="text-sm font-bold text-primary-100/80 leading-relaxed mb-8">
                {t("dashboardPage.geneticDesc")}
              </p>
              <Button
                className="w-full bg-white text-primary-600 hover:bg-primary-50 border-none font-black rounded-2xl py-4 flex items-center justify-center gap-2"
                onClick={() => navigate("/prevention")}>
                {t("dashboardPage.viewRisk")}
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
