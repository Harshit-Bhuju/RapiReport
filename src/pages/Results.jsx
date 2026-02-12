import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  ArrowLeft,
  Square,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Microscope,
  Stethoscope,
  Info,
  Volume2,
} from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import ChatInterface from "@/components/features/ChatInterface";
import API from "@/Configs/ApiEndpoints";

const getReportImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
};

const MedicineInsight = React.lazy(
  () => import("@/components/features/MedicineInsight"),
);

const Loading = () => {
  const { t } = useTranslation();
  return (
    <Card className="border-none shadow-sm">
      <CardBody className="p-6 text-center text-gray-500">
        {t("results.loading")}
      </CardBody>
    </Card>
  );
};

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Redirect "new" to Reports page (single upload flow)
  useEffect(() => {
    if (id === "new") navigate("/reports", { replace: true });
  }, [id, navigate]);

  // Fetch report by id
  useEffect(() => {
    if (!id || id === "new") return;
    setLoading(true);
    setError(null);
    axios
      .get(`${API.REPORTS_GET}?id=${id}`, { withCredentials: true })
      .then((res) => {
        if (res.data?.status === "success" && res.data?.data) {
          const r = res.data.data;
          setReport({
            lab: r.lab,
            type: r.type,
            date: r.date || r.createdAt,
            imageUrl: getReportImageUrl(r.imagePath),
            tests: (r.tests || []).map((t) => ({
              name: t.name,
              result: t.result,
              unit: t.unit,
              range: t.range,
              status: t.status || "normal",
            })),
            aiSummary: { en: r.aiSummaryEn || "", ne: r.aiSummaryNe || "" },
            medicines: [], // No medicines from lab reports; can be extended later
          });
        } else {
          setError("Report not found");
        }
      })
      .catch(() => setError("Failed to load report"))
      .finally(() => setLoading(false));
  }, [id]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (id === "new") return null;

  // Loading or error state
  if (loading) {
    return (
      <PageWrapper>
        <div className="py-20 text-center">
          <Loading />
        </div>
      </PageWrapper>
    );
  }
  if (error || !report) {
    return (
      <PageWrapper>
        <div className="py-20 text-center">
          <p className="text-gray-500 font-bold mb-4">{error || "Report not found"}</p>
          <Button onClick={() => navigate("/reports")}>Back to Reports</Button>
        </div>
      </PageWrapper>
    );
  }

  const getTextToSpeak = () => {
    const summary = i18n.language === "ne" ? report.aiSummary.ne : report.aiSummary.en;
    if (!summary) return "";
    let text = summary;
    if (report.tests?.length > 0) {
      text += ". Your test results: ";
      report.tests.forEach((t) => {
        text += `${t.name}: ${t.result} ${t.unit || ""}. ${t.status}. `;
      });
    }
    return text;
  };

  const toggleVoice = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      return;
    }
    const text = getTextToSpeak();
    if (!text) return;
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis not supported");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = i18n.language === "ne" ? "hi-NP" : "en-US";
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const aiText = i18n.language === "ne" ? report.aiSummary.ne : report.aiSummary.en;
  const hasSummary = !!(report.aiSummary?.en || report.aiSummary?.ne);

  return (
    <PageWrapper>
      {/* Compact header */}
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/reports")}
          className="text-gray-700 hover:text-primary-600 -ml-2">
          <ArrowLeft className="mr-1.5 w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{t("common.back")}</span>
        </Button>
        <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm">
          <Calendar className="w-3.5 h-3.5" />
          {report.date ? formatDate(report.date, "PP") : "—"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* AI Summary + Listen — prominent, less scroll */}
        <div className="lg:col-span-5 order-1">
          <Card className="border-none shadow-lg overflow-hidden bg-[#1e3a5f] text-white">
            <CardBody className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-white">AI Summary</h3>
              </div>
              <p className="text-white/95 text-sm sm:text-base leading-relaxed mb-4 min-h-[3.5rem]">
                {aiText || "No summary available."}
              </p>
              {/* Responsive Listen button */}
              <button
                type="button"
                onClick={toggleVoice}
                disabled={!hasSummary}
                className={`w-full flex items-center justify-center gap-3 sm:gap-4 py-3.5 sm:py-4 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] ${
                  isPlaying
                    ? "bg-amber-400 text-gray-900"
                    : "bg-white text-[#1e3a5f] hover:bg-amber-50"
                }`}
              >
                <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 bg-black/5">
                  {isPlaying ? (
                    <Square className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                  ) : (
                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </span>
                <span className="text-sm sm:text-base">
                  {isPlaying ? "Stop" : "Listen to Report"}
                </span>
              </button>
            </CardBody>
          </Card>

          <Card className="border border-emerald-200 bg-emerald-50/80 mt-4 sm:mt-5">
            <CardBody className="p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                  {t("results.lifestyleDesc")}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Report + Tests */}
        <div className="lg:col-span-7 order-2 space-y-4">
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-800 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center gap-2 mb-1">
                <Microscope className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">Lab Report</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white">
                {report.type}
              </h1>
              <p className="text-gray-300 text-sm mt-0.5">
                {report.lab || "—"}
              </p>
            </div>
            <CardBody className="p-3 sm:p-4">
              {report.imageUrl && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Original Report Image
                  </p>
                  <div
                    className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden cursor-pointer group"
                    onClick={() => setPreviewImage(report.imageUrl)}
                  >
                    <img
                      src={report.imageUrl}
                      alt="Original lab report"
                      className="w-full max-h-72 object-contain group-hover:opacity-95 transition-opacity"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Test Results
              </p>
              <div className="space-y-2 max-h-[280px] sm:max-h-[320px] overflow-y-auto pr-1">
                {report.tests?.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    No structured results. See AI summary.
                  </p>
                ) : (
                  report.tests?.map((test, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {test.status === "normal" ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {test.name}
                          </p>
                          <p className="text-xs text-gray-500">Ref: {test.range || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          {test.result} <span className="text-gray-500 font-normal text-xs">{test.unit}</span>
                        </p>
                        <Badge
                          variant={test.status === "normal" ? "success" : "error"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {test.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          <ChatInterface />
        </div>
      </div>

      {report.medicines?.length > 0 && (
        <div className="mt-4">
          <React.Suspense fallback={<Loading />}>
            <MedicineInsight medicines={report.medicines} />
          </React.Suspense>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-full w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 rounded-full bg-black/70 text-white p-2 hover:bg-black focus:outline-none focus:ring-2 focus:ring-white"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Report preview"
              className="max-h-[90vh] w-auto rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Results;
