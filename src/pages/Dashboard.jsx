import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  FileText,
  Calendar,
  ChevronRight,
  Activity,
  TrendingUp,
  Clock,
  Filter,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useOffline } from "@/hooks/useOffline";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageWrapper from "@/components/layout/PageWrapper";
import { formatDate, cn } from "@/lib/utils";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOffline = useOffline();
  const [searchQuery, setSearchQuery] = useState("");

  const stats = [
    {
      label: "Blood Tests",
      value: "12",
      icon: Activity,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Health Score",
      value: "88%",
      icon: TrendingUp,
      color: "text-success-600",
      bg: "bg-success-50",
    },
    {
      label: "Pending AI",
      value: "1",
      icon: Clock,
      color: "text-warning-600",
      bg: "bg-warning-50",
    },
  ];

  const recentReports = [
    {
      id: "1",
      type: "Blood Analysis",
      date: "2025-01-15",
      lab: "Kathmandu Diagnostic Center",
      status: "normal",
    },
    {
      id: "2",
      type: "Thyroid Panel",
      date: "2025-01-10",
      lab: "Alka Hospital Lab",
      status: "abnormal",
    },
    {
      id: "3",
      type: "General Checkup",
      date: "2024-12-28",
      lab: "Teaching Hospital",
      status: "normal",
    },
  ];

  return (
    <PageWrapper
      title={`${t("dashboard.welcome")}, ${user?.name || "User"}`}
      subtitle="Track your health diagnostic journey in one place.">
      {isOffline && (
        <div className="mb-8 p-4 bg-warning-50 border-l-4 border-warning-500 rounded-r-xl flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-warning-700" />
          <p className="text-sm font-bold text-warning-800">
            {t("offline.message")}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm h-full">
            <CardBody className="flex items-center gap-5 p-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  stat.bg,
                )}>
                <stat.icon className={cn("w-7 h-7", stat.color)} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">
                  {stat.value}
                </p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Main Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports by lab or test name..."
            className="input pl-12 h-14"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          size="lg"
          className="w-full md:w-auto h-14 px-8 rounded-2xl shadow-lg shadow-primary-200"
          onClick={() => navigate("/results/new")}>
          <Plus className="mr-2 w-5 h-5" />
          {t("dashboard.upload")}
        </Button>
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {t("dashboard.recent")}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-600 font-bold">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {recentReports.map((report) => (
            <Card
              key={report.id}
              hover
              className="border-gray-50 hover:border-primary-100 group"
              onClick={() => navigate(`/results/${report.id}`)}>
              <CardBody className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {report.type}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="font-medium">{report.lab}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="flex items-center gap-1 font-bold">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.date, "PP")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <Badge
                    variant={report.status === "normal" ? "success" : "error"}>
                    {report.status.toUpperCase()}
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-600 transition-colors" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty State Mock */}
      {recentReports.length === 0 && (
        <Card className="border-dashed border-2 p-12 text-center bg-transparent">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No health reports yet
          </h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Upload your first diagnostic report to unlock AI health insights and
            tracking.
          </p>
          <Button onClick={() => navigate("/results/new")}>
            Upload Your First Report
          </Button>
        </Card>
      )}
    </PageWrapper>
  );
};

export default Dashboard;
