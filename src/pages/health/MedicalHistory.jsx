import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";
import { useHealthStore } from "@/store/healthStore";
import { useConfirmStore } from "@/store/confirmStore";
import {
  FileText,
  AlertTriangle,
  Pill,
  Heart,
  History,
  ShieldAlert,
  Sparkles,
  BrainCircuit,
  Brain,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import API from "@/Configs/ApiEndpoints";

const MedicalHistory = () => {
  const { t } = useTranslation();
  const openConfirm = useConfirmStore((s) => s.openConfirm);
  const { user } = useAuthStore();
  const {
    prescriptions,
    fetchPrescriptions,
    reports,
    fetchReports,
    symptoms,
    ocrHistory,
    historyAnalysis,
    fetchHistoryAnalysis,
    fetchSymptoms,
    fetchHealthData,
  } = useHealthStore();
  const { updateProfile } = useAuthStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyHealthData, setFamilyHealthData] = useState({});
  const [isFetchingFamily, setIsFetchingFamily] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);

  useEffect(() => {
    fetchHealthData();
    fetchFamilyHealth();
  }, [fetchHealthData]);

  const fetchFamilyHealth = async () => {
    setIsFetchingFamily(true);
    try {
      const listRes = await axios.get(API.FAMILY_LIST, { withCredentials: true });
      if (listRes.data?.status === "success") {
        const accepted = (listRes.data.members || []).filter(m => m.status === "accepted");
        setFamilyMembers(accepted);
        const healthObj = {};
        for (const m of accepted) {
          try {
            const hRes = await axios.get(API.FAMILY_MEMBER_HEALTH, {
              params: { member_id: m.member_id },
              withCredentials: true,
            });
            if (hRes.data?.status === "success") {
              healthObj[m.member_id] = hRes.data.data;
            }
          } catch { /* skip */ }
        }
        setFamilyHealthData(healthObj);
      }
    } catch (err) {
      console.error("Failed to fetch family health", err);
    } finally {
      setIsFetchingFamily(false);
    }
  };

  const handleAnalyzeHistory = async () => {
    setIsAnalyzing(true);
    try {
      await fetchHistoryAnalysis();
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const conditions = useMemo(() => {
    const c = user?.conditions;
    if (!c) return [];
    if (typeof c === "string") {
      try {
        const arr = JSON.parse(c);
        return Array.isArray(arr) ? arr : [c];
      } catch {
        return c ? [c] : [];
      }
    }
    return Array.isArray(c) ? c : [];
  }, [user?.conditions]);

  const parentalHistory = useMemo(() => {
    const p = user?.parentalHistory || user?.parental_history;
    if (!p) return [];
    if (typeof p === "string") {
      try {
        const arr = JSON.parse(p);
        return Array.isArray(arr) ? arr : [p];
      } catch {
        return p ? [p] : [];
      }
    }
    return Array.isArray(p) ? p : [];
  }, [user?.parentalHistory, user?.parental_history]);

  // No longer needed as editing is handled in Profile

  const recentSymptoms = useMemo(
    () =>
      symptoms
        .slice(0, 10)
        .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [symptoms],
  );

  const recentPrescriptions = useMemo(
    () => prescriptions.slice(0, 10),
    [prescriptions],
  );

  const recentReports = useMemo(
    () => reports.slice(0, 10).sort((a, b) => (b.date || b.createdAt || "").localeCompare(a.date || a.createdAt || "")),
    [reports],
  );

  const recentOcrItems = useMemo(
    () => ocrHistory.slice(0, 10),
    [ocrHistory],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Medical history
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Past prescriptions, conditions, and family history.
          </p>
        </div>
        <Button
          onClick={handleAnalyzeHistory}
          loading={isAnalyzing}
          className="gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 shadow-lg shadow-primary-200">
          <Brain className="w-4 h-4" />
          Analyze All History
        </Button>
      </div>

      {/* AI Analysis Result Section */}
      {(historyAnalysis || isAnalyzing) && (
        <Card className="border-none shadow-2xl shadow-indigo-100 overflow-hidden bg-white border border-indigo-50 ring-1 ring-indigo-50">
          <CardBody className="p-0">
            <div className="bg-gradient-to-r from-indigo-600 to-primary-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Health Intelligence</h2>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-widest mt-0.5">
                    Gemini Clinical Summary
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {isAnalyzing ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                  <p className="text-lg font-bold text-gray-900">
                    Scanning your health history...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Compiling prescriptions, symptoms, and medical background
                  </p>
                </div>
              ) : (
                <div className="prose prose-sm prose-primary max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-indigo-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {historyAnalysis}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            {!isAnalyzing && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-2 text-primary-600">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    AI Insights are for guidance only.
                  </span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-black text-gray-900">Conditions</h2>
            </div>
            <div className="space-y-4">
              {conditions.length ? (
                <ul className="space-y-2">
                  {conditions.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 flex items-center justify-between group bg-gray-50/50 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                        {typeof item === "string"
                          ? item
                          : (item?.label ?? JSON.stringify(item))}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No conditions recorded.</p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-black text-gray-900">
                Family history
              </h2>
            </div>
            <div className="space-y-4">
              {parentalHistory.length ? (
                <ul className="space-y-2">
                  {parentalHistory.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 flex items-center justify-between group bg-gray-50/50 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                        {typeof item === "string"
                          ? item
                          : (item?.label ?? JSON.stringify(item))}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No family history recorded.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-black text-gray-900">
                {t("family.labReports") || "Lab reports"}
              </h2>
            </div>
            {recentReports.length ? (
              <div className="space-y-3">
                {recentReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/results/${r.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-400 group-hover:text-primary-600 shadow-sm border border-gray-100">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">
                          {r.type || "Lab Report"}
                        </p>
                        <p className="text-[10px] font-medium text-gray-400">
                          {r.lab} • {format(new Date(r.date || r.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={r.status === "normal" ? "success" : "error"}
                      className="text-[9px] px-2 py-0.5">
                      {(r.status || "normal").toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {t("family.noLabReports") || "No reports recorded."}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-black text-gray-900">
              Scanned documents
            </h2>
          </div>
          {recentOcrItems.length ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentOcrItems.map((ocr) => (
                <li
                  key={ocr.id}
                  className="group relative bg-gray-50/50 p-4 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-primary-100/50 border border-transparent hover:border-primary-100 transition-all duration-300">
                  <div className="flex gap-4">
                    {ocr.image_path && (
                      <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <img
                          src={API.OCR_IMAGE(ocr.image_path)}
                          alt="Document Scan"
                          className="w-full h-full object-cover"
                          crossOrigin="use-credentials"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">
                        {format(new Date(ocr.created_at), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                        {ocr.refined_text || ocr.raw_text || "No text content"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No scanned documents found.
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-black text-gray-900">
              Recent symptom logs
            </h2>
          </div>
          {recentSymptoms.length ? (
            <ul className="space-y-2">
              {recentSymptoms.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{s.text}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold capitalize",
                      s.severity === "severe" && "bg-error-50 text-error-700",
                      s.severity === "moderate" &&
                      "bg-warning-50 text-warning-700",
                      s.severity === "mild" && "bg-success-50 text-success-700",
                    )}>
                    {s.severity || "mild"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              No symptoms logged. Use Symptoms page to add.
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="border-none shadow-xl shadow-gray-100/50 bg-primary-50/50 border border-primary-100">
        <CardBody className="p-6 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-gray-900">AI cross-check</h3>
            <p className="text-sm text-gray-600 mt-1">
              When you scan a new prescription, we check it against your
              conditions, allergies, and history. Warnings for repeated meds,
              interactions, or contraindications appear before you save.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Family Members' Health Section */}
      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-black text-gray-900">
              Family members' health
            </h2>
            {isFetchingFamily && (
              <Loader2 className="w-4 h-4 text-primary-500 animate-spin ml-2" />
            )}
          </div>

          {familyMembers.length > 0 ? (
            <div className="space-y-3">
              {familyMembers.map((m) => {
                const health = familyHealthData[m.member_id];
                const isExpanded = expandedMember === m.member_id;
                return (
                  <div
                    key={m.member_id}
                    className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button
                      onClick={() => setExpandedMember(isExpanded ? null : m.member_id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                          {(m.member_name || m.member_email)?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {m.member_name || m.member_email}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {m.relation || "Family"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {health?.profile?.conditions && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-warning-50 text-warning-700 border border-warning-100 hidden sm:inline">
                            Has conditions
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && health && (
                      <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <div className="bg-gray-50/70 p-3 rounded-lg">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                              Conditions
                            </p>
                            <p className="text-sm text-gray-700">
                              {health.profile?.conditions || "None listed"}
                            </p>
                          </div>
                          <div className="bg-gray-50/70 p-3 rounded-lg">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                              Allergies
                            </p>
                            <p className="text-sm text-gray-700">
                              {health.profile?.allergies || "None listed"}
                            </p>
                          </div>
                        </div>

                        {health.symptoms && health.symptoms.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                              Recent symptoms
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {health.symptoms.slice(0, 5).map((s) => (
                                <span
                                  key={s.id}
                                  className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-md",
                                    s.severity === "severe"
                                      ? "bg-error-50 text-error-700"
                                      : s.severity === "moderate"
                                        ? "bg-warning-50 text-warning-700"
                                        : "bg-success-50 text-success-700",
                                  )}>
                                  {s.text}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {health.prescriptions && health.prescriptions.length > 0 && (
                          <p className="text-xs text-gray-500">
                            <span className="font-bold text-gray-700">{health.prescriptions.length}</span> recent prescriptions on record
                          </p>
                        )}

                        {health.reports && health.reports.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                              Lab Reports
                            </p>
                            <div className="space-y-1.5">
                              {health.reports.slice(0, 2).map((r) => (
                                <div key={r.id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText className="w-3 h-3 text-gray-400" />
                                    <span className="text-[11px] font-medium text-gray-700 truncate">{r.type}</span>
                                  </div>
                                  <span className={cn(
                                    "text-[9px] font-black px-1.5 py-0.5 rounded uppercase",
                                    r.status === "normal" ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700"
                                  )}>
                                    {r.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isExpanded && !health && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                        <p className="text-xs text-gray-400 italic">No health data available.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {isFetchingFamily
                ? "Loading family members..."
                : "No accepted family members. Add family members from the Family page."}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default MedicalHistory;
