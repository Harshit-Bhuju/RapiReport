import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Clock,
  Activity,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Loader2,
  User,
  X,
  ShieldAlert,
  Heart,
  Thermometer,
  Calendar,
  Droplets,
  Mail,
  Users,
  Brain,
  BrainCircuit,
  Sparkles,
  RefreshCw,
  Pill,
  FileDown,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import API from "@/Configs/ApiEndpoints";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-hot-toast";

const PatientHealthPanel = ({ patientId, patientName, onClose, isOpen }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [historyAnalysis, setHistoryAnalysis] = useState(null);

  const fetchHealthData = useCallback(async () => {
    if (!patientId || !isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API.GET_PATIENT_HEALTH_SUMMARY, {
        params: { patient_id: patientId },
        withCredentials: true,
      });
      if (res.data?.status === "success") {
        setData(res.data.data);
      } else {
        setError(res.data?.message || "Failed to load health history");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load patient health");
    } finally {
      setLoading(false);
    }
  }, [patientId, isOpen]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  const handleAnalyzeHistory = async () => {
    if (!patientId || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await axios.post(
        API.AI_ANALYZE_HISTORY,
        { member_id: patientId },
        { withCredentials: true },
      );
      if (res.data?.status === "success" && res.data.analysis) {
        setHistoryAnalysis(res.data.analysis);
      } else {
        toast.error(res.data?.message || "AI Analysis failed");
      }
    } catch (err) {
      toast.error("Failed to connect to AI Service");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (!isOpen) return null;

  const profile = data?.profile;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patientName ? `${patientName}'s Health File` : "Patient Medical File"}
      size="lg"
    >
      {loading && !data ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-3" />
          <p className="text-sm font-black uppercase tracking-widest text-gray-500">
            Syncing Clinical Records...
          </p>
        </div>
      ) : error ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-500 px-4">
          <ShieldAlert className="w-12 h-12 text-error-400 mb-4 opacity-50" />
          <p className="text-sm font-bold">{error}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4 font-black uppercase tracking-widest"
            onClick={fetchHealthData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header / Profile Summary */}
          <div className="flex items-center gap-4 bg-primary-50 px-5 py-5 rounded-3xl border border-primary-100">
            <div className="w-16 h-16 rounded-2xl bg-white border border-primary-100 flex items-center justify-center text-primary-500 shadow-sm shrink-0 overflow-hidden">
              {profile?.profilePic ? (
                <img
                  src={profile.profilePic}
                  alt={patientName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-gray-900 leading-tight">
                {patientName}
              </h3>
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-0.5">
                Verified Patient Account
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile?.age && (
                  <span className="text-[10px] font-black text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100 uppercase tracking-tighter shadow-sm">
                    {profile.age} Years
                  </span>
                )}
                {profile?.gender && (
                  <span className="text-[10px] font-black text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100 uppercase tracking-tighter shadow-sm">
                    {profile.gender}
                  </span>
                )}
                {profile?.bloodGroup && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-error-600 bg-error-50 px-2 py-1 rounded-lg border border-error-100 uppercase tracking-tighter shadow-sm">
                    <Droplets className="w-3 h-3" />
                    {profile.bloodGroup}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-gray-900 font-black">
                <Brain className="w-4 h-4 text-indigo-500" />
                AI Health Intelligence
              </div>
              {!historyAnalysis && !isAnalyzing && (
                <Button
                  size="sm"
                  onClick={handleAnalyzeHistory}
                  className="h-8 text-[10px] gap-1.5 bg-gradient-to-r from-indigo-600 to-primary-600 shadow-md font-black uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  Analyze Entire History
                </Button>
              )}
              {historyAnalysis && !isAnalyzing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintPdf}
                  className="h-8 text-[10px] gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-black uppercase tracking-widest">
                  <FileDown className="w-3 h-3" />
                  Save PDF
                </Button>
              )}
            </div>

            {(historyAnalysis || isAnalyzing) && (
              <div className="border border-indigo-50 bg-indigo-50/30 rounded-3xl overflow-hidden ring-1 ring-indigo-50 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-gradient-to-r from-indigo-600/10 to-primary-600/10 p-3.5 flex items-center gap-2 border-b border-indigo-50">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                    Clinical Analysis Insight
                  </span>
                </div>
                <div className="p-5">
                  {isAnalyzing ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                        Analyzing Records...
                      </p>
                    </div>
                  ) : (
                    <div className="prose prose-xs prose-indigo max-w-none text-gray-700 leading-relaxed font-medium">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {historyAnalysis}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Conditions Section */}
          <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-black text-sm uppercase tracking-tight">
              <Heart className="w-4 h-4 text-primary-500" />
              Medical Conditions
            </div>
            {profile?.conditions ? (
              <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
                {profile.conditions}
              </p>
            ) : (
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic opacity-50">
                No chronic conditions reported
              </p>
            )}
          </div>

          {/* Recent Symptoms */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 text-gray-900 font-black text-sm uppercase tracking-tight">
                <Thermometer className="w-4 h-4 text-error-500" />
                Symptom History
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Last {data?.symptoms?.length || 0} Entries
              </span>
            </div>

            {data?.symptoms && data.symptoms.length > 0 ? (
              <div className="space-y-3">
                {data.symptoms.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="bg-white border border-gray-100 p-4 rounded-2xl flex items-start justify-between shadow-sm hover:border-error-100 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {s.text}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={cn(
                            "text-[9px] uppercase font-black px-2 py-0.5 rounded-full border tracking-tighter",
                            s.severity === "severe"
                              ? "bg-error-50 text-error-600 border-error-100"
                              : s.severity === "moderate"
                                ? "bg-warning-50 text-warning-600 border-warning-100"
                                : "bg-success-50 text-success-600 border-success-100",
                          )}>
                          {s.severity}
                        </span>
                        {s.vitals && s.vitals.temp && (
                          <span className="text-[9px] font-black text-gray-500 flex items-center gap-1 uppercase tracking-tighter">
                            <Thermometer className="w-3 h-3" />
                            {s.vitals.temp}°C
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <Thermometer className="w-6 h-6 text-gray-300 mx-auto mb-2 opacity-30" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  No symptoms logged
                </p>
              </div>
            )}
          </div>

          {/* Diagnostic Reports */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 text-gray-900 font-black text-sm uppercase tracking-tight">
                <FileText className="w-4 h-4 text-blue-500" />
                Diagnostic Reports
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Last {data?.reports?.length || 0} entries
              </span>
            </div>

            {data?.reports && data.reports.length > 0 ? (
              <div className="space-y-3">
                {data.reports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReport(r)}
                    className="w-full text-left bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-black text-gray-800 group-hover:text-primary-600 transition-colors">
                          {r.lab}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                          {r.type}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {new Date(r.date).toLocaleDateString()}
                      </span>
                    </div>

                    {r.summary && (
                      <div className="bg-primary-50/50 p-3 rounded-xl border border-primary-100/50 mb-3">
                        <p className="text-[11px] text-gray-600 line-clamp-2 font-medium leading-relaxed">
                          {r.summary}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                          r.status === "Critical"
                            ? "bg-error-100 text-error-700"
                            : r.status === "Abnormal"
                              ? "bg-warning-100 text-warning-700"
                              : "bg-success-100 text-success-700",
                        )}>
                        {r.status || "Normal"}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Click to expand file
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <FileText className="w-6 h-6 text-gray-300 mx-auto mb-2 opacity-30" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  No reports available
                </p>
              </div>
            )}
          </div>

          {/* Past Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 text-gray-900 font-black text-sm uppercase tracking-tight">
                <Pill className="w-4 h-4 text-indigo-500" />
                Prescription History
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Last {data?.prescriptions?.length || 0} Entries
              </span>
            </div>

            {data?.prescriptions && data.prescriptions.length > 0 ? (
              <div className="space-y-3">
                {data.prescriptions.map((rx) => (
                  <button
                    key={rx.id}
                    type="button"
                    onClick={() => setSelectedPrescription(rx)}
                    className="w-full text-left bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex gap-4 items-start mb-3">
                      {rx.imagePath ? (
                        <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-gray-100 group-hover:border-indigo-100 transition-colors">
                          <img
                            src={API.OCR_IMAGE(rx.imagePath)}
                            alt="Prescription"
                            className="w-full h-full object-cover"
                            crossOrigin="use-credentials"
                          />
                        </div>
                      ) : (
                        <div className="shrink-0 w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                          <ShieldAlert className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {rx.meds?.map((m) => m.name).join(", ") ||
                            "Medication Summary"}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                          {rx.note || rx.rawText || "Electronic medical record detail."}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                        {new Date(rx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-50">
                      {rx.meds?.slice(0, 3).map((m, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-widest">
                          {m.name}
                        </span>
                      ))}
                      {rx.meds?.length > 3 && (
                        <span className="text-[9px] font-black text-gray-400 self-center">
                          + {rx.meds.length - 3} MORE
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <Pill className="w-6 h-6 text-gray-300 mx-auto mb-2 opacity-30" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  No prescriptions found
                </p>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-gray-50 rounded-2xl text-[9px] font-bold text-gray-400 text-center leading-relaxed italic uppercase tracking-widest">
            Note: This file is provided for clinical reference. Please verify all information with the patient.
          </div>

          {/* Detail Modals for Reports and Prescriptions */}
          <Modal
            isOpen={!!selectedReport}
            onClose={() => setSelectedReport(null)}
            title={selectedReport ? `${selectedReport.lab} - ${selectedReport.type}` : ""}
            size="lg"
          >
            {selectedReport && (
              <div className="space-y-6">
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>{new Date(selectedReport.date).toLocaleDateString()}</span>
                  <span className={cn(
                    "px-3 py-1 rounded-full",
                    selectedReport.status === 'Critical' ? "bg-error-50 text-error-600" : "bg-success-50 text-success-600"
                  )}>
                    {selectedReport.status || 'Normal'}
                  </span>
                </div>

                {selectedReport.imagePath && (
                  <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-xl">
                    <a href={API.REPORT_IMAGE(selectedReport.imagePath)} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                      <img src={API.REPORT_IMAGE(selectedReport.imagePath)} alt="Report" className="w-full h-auto max-h-[500px] object-contain bg-gray-50" crossOrigin="use-credentials" />
                    </a>
                  </div>
                )}

                {selectedReport.summary && (
                  <div className="bg-primary-50 px-6 py-5 rounded-3xl border border-primary-100">
                    <h4 className="text-sm font-black text-primary-900 mb-2 flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4" /> AI Summary
                    </h4>
                    <p className="text-sm text-primary-800 leading-relaxed font-medium">{selectedReport.summary}</p>
                  </div>
                )}

                {selectedReport.rawText && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest px-1">Raw Report Content</h4>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-6 rounded-3xl overflow-auto max-h-64 whitespace-pre-wrap font-sans leading-relaxed border border-gray-100">
                      {selectedReport.rawText}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Modal>

          <Modal
            isOpen={!!selectedPrescription}
            onClose={() => setSelectedPrescription(null)}
            title="Prescription Details"
            size="lg"
          >
            {selectedPrescription && (
              <div className="space-y-6">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                </div>

                {selectedPrescription.imagePath && (
                  <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-xl bg-gray-50">
                    <a href={API.OCR_IMAGE(selectedPrescription.imagePath)} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                      <img src={API.OCR_IMAGE(selectedPrescription.imagePath)} alt="Scan" className="w-full h-auto max-h-[600px] object-contain" crossOrigin="use-credentials" />
                    </a>
                  </div>
                )}

                {selectedPrescription.meds?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest px-1">Detected Medications</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedPrescription.meds.map((m, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-black text-indigo-900">{m.name}</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                              {m.dose} {m.frequency && `• ${m.frequency}`} {m.duration && `• ${m.duration}`}
                            </p>
                          </div>
                          <Pill className="w-5 h-5 text-indigo-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedPrescription.note || selectedPrescription.rawText) && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest px-1">Clinical Notes</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-6 rounded-3xl border border-gray-100 leading-relaxed font-medium">
                      {selectedPrescription.note || selectedPrescription.rawText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </div>
      )}

      {/* Hidden Print-only Template */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b-2 border-primary-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
                <BrainCircuit className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Health Intelligence Report</h1>
                <p className="text-sm font-bold text-primary-600 uppercase tracking-widest">RapiReport Clinical Analysis</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Generated On</p>
              <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Name</p>
              <p className="font-bold text-lg text-gray-900">{patientName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {profile?.age && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Age</p>
                  <p className="font-bold text-gray-900">{profile.age} Years</p>
                </div>
              )}
              {profile?.bloodGroup && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Blood Group</p>
                  <p className="font-bold text-error-600">{profile.bloodGroup}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Clinical Summary & Insights
            </h2>
            <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-medium">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {historyAnalysis || ""}
              </ReactMarkdown>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mt-10">
            <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl">
              <ShieldAlert className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                DISCLAIMER: This AI-generated clinical insight is based on the available medical history provided within RapiReport.
                It is intended for guidance only and does NOT substitute professional clinical judgment, diagnosis, or treatment.
                Always consult with a qualified healthcare professional.
              </p>
            </div>
            <p className="text-[10px] font-black text-gray-300 text-center mt-8 uppercase tracking-[0.2em]">
              RapiReport Digital Health Intelligence • Confidential Patient Record
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PatientHealthPanel;
