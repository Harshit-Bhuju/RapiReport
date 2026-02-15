import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  ChevronRight,
  Filter,
  Upload,
  Zap,
  Loader2,
  Sparkles,
  Trash2,
  Microscope,
  BarChart3,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate, cn } from "@/lib/utils";
import { useHealthStore } from "@/store/healthStore";
import { useConfirmStore } from "@/store/confirmStore";
import API from "@/Configs/ApiEndpoints";
import toast from "react-hot-toast";

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (e) => reject(e);
  });
};


const Reports = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reports, fetchReports, addReport, removeReport } = useHealthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = reports.filter(
    (r) =>
      (r.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.lab || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onPickFile = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("reports.errorImage"));
      return;
    }
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setShowUpload(true);
  };

  const triggerFilePick = () => fileInputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setPreviewImage(URL.createObjectURL(file));
      setShowUpload(true);
    } else {
      toast.error(t("reports.errorDrop"));
    }
  };
  const handleDragOver = (e) => e.preventDefault();

  const clearUpload = () => {
    setImageFile(null);
    setImageUrl(null);
    setShowUpload(false);
  };

  const handleAnalyzeAndSave = async () => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    try {
      const base64 = await fileToBase64(imageFile);
      const res = await axios.post(
        API.GEMINI_ANALYZE_REPORT,
        { image: base64, mimeType: imageFile.type },
        { withCredentials: true },
      );

      if (res.data?.status !== "success") {
        toast.error(res.data?.message || t("reports.errorAnalysis"));
        return;
      }

      const data = res.data;
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("labName", data.labName || "");
      formData.append("reportType", data.reportType || "Lab Report");
      formData.append("reportDate", data.reportDate || "");
      formData.append("rawText", data.rawText || "");
      formData.append("aiSummaryEn", data.aiSummaryEn || "");
      formData.append("aiSummaryNe", data.aiSummaryNe || "");
      formData.append("overallStatus", data.overallStatus || "normal");
      formData.append("tests", JSON.stringify(data.tests || []));

      const newId = await addReport(formData);
      toast.success(t("reports.uploadSuccess"));
      clearUpload();
      fetchReports();
      if (newId) navigate(`/results/${newId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t("reports.errorSave"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stats = {
    total: reports.length,
    normal: reports.filter((r) => r.status === "normal").length,
    abnormal: reports.filter((r) => r.status === "abnormal").length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickFile}
        />
        <Button
          size="lg"
          className="rounded-2xl shadow-xl shadow-primary-100"
          onClick={triggerFilePick}>
          <Plus className="mr-2 w-5 h-5" />
          {t("reports.uploadNew")}
        </Button>
      </div>

      {/* Always-visible upload drop zone (when no file selected) */}
      {!showUpload && !imageFile && (
        <Card
          className="border-2 border-dashed border-gray-200 hover:border-primary-300 transition-colors cursor-pointer"
          onClick={triggerFilePick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}>
          <CardBody className="py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4 text-primary-600">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">
              {t("reports.dropZone")}
            </p>
            <p className="text-sm text-gray-500">{t("reports.browse")}</p>
          </CardBody>
        </Card>
      )}

      {/* Upload / Analyze card (after file selected) */}
      {showUpload && imageFile && (
        <Card className="border-2 border-primary-200 bg-primary-50/30">
          <CardBody className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  {t("reports.aiAnalysis")}
                </p>
                <p className="text-gray-600 text-sm">
                  {t("reports.aiAnalysisDesc")}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={clearUpload}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <img
                src={imageUrl}
                alt="Report"
                className="max-h-40 rounded-xl border border-gray-200 object-contain"
              />
              <div className="flex-1 flex flex-col justify-center gap-3">
                <p className="text-sm font-bold text-gray-600">
                  {imageFile.name}
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleAnalyzeAndSave}
                    loading={isAnalyzing}
                    className="gap-2 shadow-lg">
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {isAnalyzing
                      ? t("reports.analyzing")
                      : t("reports.analyzeSave")}
                  </Button>
                  <Button variant="secondary" onClick={clearUpload}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.total}</p>
              <p className="text-sm font-bold text-gray-500">
                {t("reports.totalReports")}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success-50 flex items-center justify-center text-success-600">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                {stats.normal}
              </p>
              <p className="text-sm font-bold text-gray-500">
                {t("reports.normal")}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-warning-50 flex items-center justify-center text-warning-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                {stats.abnormal}
              </p>
              <p className="text-sm font-bold text-gray-500">
                {t("reports.needsAttention")}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
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
      </div>

      {/* Report List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            const imageUrl = report.imagePath ? API.REPORT_IMAGE(report.imagePath) : null;
            return (
              <Card
                key={report.id}
                hover
                className="border-gray-50 hover:border-primary-100 group transition-all duration-300"
                onClick={() => navigate(`/results/${report.id}`)}>
                <CardBody className="flex items-center justify-between p-4 sm:p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Report"
                          className="w-full h-full object-cover cursor-pointer"
                          crossOrigin="use-credentials"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(imageUrl);
                          }}
                        />
                      ) : (
                        <FileText className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 group-hover:text-primary-600 transition-colors">
                        {report.type || "Lab Report"}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="font-bold">{report.lab || "—"}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                        <span className="flex items-center gap-1 font-bold">
                          <Calendar className="w-4 h-4 opacity-50" />
                          {report.date
                            ? formatDate(report.date, "PP")
                            : report.createdAt
                              ? formatDate(report.createdAt, "PP")
                              : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <Badge
                      variant={report.status === "normal" ? "success" : "error"}
                      className="px-4 py-1.5 text-[10px]">
                      {report.status === "normal"
                        ? t("reports.normal").toUpperCase()
                        : t("reports.needsAttention").toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          useConfirmStore.getState().openConfirm({
                            title: t("confirm.delete") + " report?",
                            message: t("confirm.removeReport"),
                            confirmLabel: t("confirm.delete"),
                            cancelLabel: t("confirm.cancel"),
                            variant: "danger",
                            onConfirm: async () => {
                              await removeReport(report.id);
                              toast.success(t("reports.removeSuccess"));
                            },
                          });
                        }}
                        className="p-2 text-gray-300 hover:text-error-600 rounded-xl hover:bg-error-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-10 h-10 rounded-full border border-gray-50 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        ) : (
          <Card className="border-dashed border-2 border-gray-200">
            <CardBody className="py-16 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold text-lg mb-2">
                {t("reports.noReports")}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {t("reports.noReportsDesc")}
              </p>
              <Button className="gap-2" onClick={triggerFilePick}>
                <Upload className="w-4 h-4" />
                {t("reports.uploadNew")}
              </Button>
            </CardBody>
          </Card>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}>
          <div
            className="relative max-w-5xl max-h-full w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 rounded-full bg-black/70 text-white p-2 hover:bg-black focus:outline-none focus:ring-2 focus:ring-white">
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Report preview"
              className="max-h-[90vh] w-auto rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
