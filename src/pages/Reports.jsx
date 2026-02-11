import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

const Reports = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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
    {
      id: "4",
      type: "Vitamin D Test",
      date: "2024-12-15",
      lab: "Central Lab",
      status: "normal",
    },
    {
      id: "5",
      type: "Liver Profile",
      date: "2024-12-01",
      lab: "Global Hospital",
      status: "abnormal",
    },
  ];

  const filteredReports = recentReports.filter(
    (r) =>
      r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lab.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary-600" />
            {t("reports.title")}
          </h1>
          <p className="text-gray-500 font-bold mt-2">
            {t("reports.subtitle")}
          </p>
        </div>
        <Button
          size="lg"
          className="rounded-2xl shadow-xl shadow-primary-100"
          onClick={() => navigate("/results/new")}>
          <Plus className="mr-2 w-5 h-5" />
          {t("reports.uploadNew")}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("reports.searchPlaceholder")}
            className="input pl-12 h-14 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="h-14 px-6 rounded-2xl gap-2 text-gray-400 border-gray-100">
          <Filter className="w-5 h-5" />
          {t("reports.sortFilter")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <Card
              key={report.id}
              hover
              className="border-gray-50 hover:border-primary-100 group transition-all duration-300"
              onClick={() => navigate(`/results/${report.id}`)}>
              <CardBody className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-primary-600 transition-colors">
                      {report.type}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="font-bold">{report.lab}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                      <span className="flex items-center gap-1 font-bold">
                        <Calendar className="w-4 h-4 opacity-50" />
                        {formatDate(report.date, "PP")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <Badge
                    variant={report.status === "normal" ? "success" : "error"}
                    className="px-4 py-1.5 text-[10px]">
                    {report.status.toUpperCase()}
                  </Badge>
                  <div className="w-10 h-10 rounded-full border border-gray-50 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-400 font-bold">{t("reports.noResults")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
