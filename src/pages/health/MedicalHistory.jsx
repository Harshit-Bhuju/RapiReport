import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";
import { useHealthStore } from "@/store/healthStore";
import {
  FileText,
  AlertTriangle,
  Pill,
  Heart,
  History,
  ShieldAlert,
  Sparkles,
  BrainCircuit,
  Loader2,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Button from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MedicalHistory = () => {
  const { user } = useAuthStore();
  const {
    prescriptions,
    fetchPrescriptions,
    symptoms,
    historyAnalysis,
    fetchHistoryAnalysis,
  } = useHealthStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

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
    const p = user?.parental_history;
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
  }, [user?.parental_history]);

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
            {conditions.length ? (
              <ul className="space-y-1">
                {conditions.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {typeof item === "string"
                      ? item
                      : (item?.label ?? JSON.stringify(item))}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                None recorded. Update in Profile.
              </p>
            )}
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
            {parentalHistory.length ? (
              <ul className="space-y-1">
                {parentalHistory.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {typeof item === "string"
                      ? item
                      : (item?.label ?? JSON.stringify(item))}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                None recorded. Update in Profile.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-black text-gray-900">
              Past prescriptions
            </h2>
          </div>
          {recentPrescriptions.length ? (
            <ul className="space-y-3">
              {recentPrescriptions.map((rx) => (
                <li
                  key={rx.id}
                  className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <span className="text-gray-500">
                    {rx.createdAt
                      ? format(new Date(rx.createdAt), "MMM d, yyyy")
                      : "—"}
                  </span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {(rx.meds || [])
                      .map((m) => m.name)
                      .filter(Boolean)
                      .join(", ") || "No medicines listed"}
                  </p>
                  {rx.note && <p className="text-gray-500 mt-0.5">{rx.note}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              No prescriptions saved yet. Use Prescription Scan to add.
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
    </div>
  );
};

export default MedicalHistory;
