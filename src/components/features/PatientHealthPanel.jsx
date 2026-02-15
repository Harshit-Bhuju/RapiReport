import React, { useState, useEffect } from "react";
import axios from "axios";
import API from "@/Configs/ApiEndpoints";
import {
  FileText,
  Pill,
  Activity,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Loader2,
  User,
  X,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Modal from "@/components/ui/Modal";

const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-bold text-gray-900"
      >
        {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        <Icon className="w-5 h-5 text-primary-600" />
        {title}
      </button>
      {open && <div className="p-4 border-t border-gray-100">{children}</div>}
    </div>
  );
};

const PatientHealthPanel = ({ patientId, patientName, onClose, isOpen }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("summary"); // "summary" | "detailed"
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    if (!patientId || !isOpen) return;
    setLoading(true);
    setError(null);
    axios
      .get(API.GET_PATIENT_HEALTH_SUMMARY, {
        params: { patient_id: patientId },
        withCredentials: true,
      })
      .then((res) => {
        if (res.data?.status === "success") setData(res.data.data);
        else setError(res.data?.message || "Failed to load");
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Could not load patient health");
      })
      .finally(() => setLoading(false));
  }, [patientId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-full max-w-lg bg-gray-50 border-l border-gray-200 shadow-2xl z-50 flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-gray-900">Patient file</h2>
            <p className="text-sm font-medium text-gray-500">{patientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView(view === "summary" ? "detailed" : "summary")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {view === "summary" ? "Detailed" : "Summary"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 font-medium text-sm">
            {error}
          </div>
        )}
        {!loading && !error && data && (
          <>
            {/* One-line summary */}
            {data.summaryText && (
              <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
                <p className="text-xs font-bold uppercase text-primary-600 tracking-wider mb-1">Summary</p>
                <p className="text-sm font-medium text-primary-900">{data.summaryText}</p>
              </div>
            )}

            {/* Profile / Medical history */}
            {data.profile && (
              <Section title="Profile & medical history" icon={ClipboardList} defaultOpen={view === "detailed"}>
                <div className="space-y-2 text-sm">
                  {data.profile.username && <p><span className="font-bold text-gray-500">Name:</span> {data.profile.username}</p>}
                  {data.profile.age != null && <p><span className="font-bold text-gray-500">Age:</span> {data.profile.age}</p>}
                  {data.profile.gender && <p><span className="font-bold text-gray-500">Gender:</span> {data.profile.gender}</p>}
                  {data.profile.bloodGroup && <p><span className="font-bold text-gray-500">Blood group:</span> {data.profile.bloodGroup}</p>}
                  {data.profile.conditions && <p><span className="font-bold text-gray-500">Conditions:</span> {data.profile.conditions}</p>}
                  {data.profile.customParentalHistory && <p><span className="font-bold text-gray-500">Family history:</span> {data.profile.customParentalHistory}</p>}
                </div>
              </Section>
            )}

            {/* Symptoms */}
            <Section title={`Symptoms (${data.symptoms?.length ?? 0})`} icon={Activity}>
              {!data.symptoms?.length ? (
                <p className="text-sm text-gray-500">No symptoms logged.</p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {(view === "summary" ? data.symptoms.slice(0, 5) : data.symptoms).map((s) => (
                    <li key={s.id} className="flex justify-between gap-2 text-sm border-b border-gray-50 pb-2 last:border-0">
                      <span className="font-medium text-gray-900">{s.text}</span>
                      <span
                        className={cn(
                          "shrink-0 px-2 py-0.5 rounded-full text-xs font-bold",
                          s.severity === "severe" && "bg-red-100 text-red-700",
                          s.severity === "moderate" && "bg-amber-100 text-amber-700",
                          s.severity === "mild" && "bg-green-100 text-green-700",
                        )}
                      >
                        {s.severity}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {view === "summary" && data.symptoms?.length > 5 && (
                <p className="text-xs text-gray-500 mt-2">+ {data.symptoms.length - 5} more (switch to Detailed)</p>
              )}
            </Section>

            {/* Prescriptions - click to view full image & details */}
            <Section title={`Prescriptions (${data.prescriptions?.length ?? 0})`} icon={Pill}>
              {!data.prescriptions?.length ? (
                <p className="text-sm text-gray-500">No prescriptions on file.</p>
              ) : (
                <ul className="space-y-4 max-h-72 overflow-y-auto">
                  {(view === "summary" ? data.prescriptions.slice(0, 3) : data.prescriptions).map((rx) => (
                    <li key={rx.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPrescription(rx)}
                        className="w-full text-left border border-gray-100 rounded-lg p-3 bg-gray-50/50 hover:border-primary-200 hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex gap-3">
                          {rx.imagePath ? (
                            <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={API.PRESCRIPTION_IMAGE(rx.imagePath)}
                                alt="Prescription"
                                className="w-full h-full object-cover"
                                crossOrigin="use-credentials"
                              />
                            </div>
                          ) : (
                            <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ShieldAlert className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-500 mb-1">{rx.createdAt && format(new Date(rx.createdAt), "MMM d, yyyy")}</p>
                            {rx.note && <p className="text-sm text-gray-700 line-clamp-2 mb-1">{rx.note}</p>}
                            <p className="text-xs text-primary-600 font-bold">Click to view full prescription & image</p>
                          </div>
                        </div>
                        <ul className="text-sm space-y-1 mt-2 flex flex-wrap gap-1">
                          {rx.meds?.slice(0, 3).map((m, i) => (
                            <li key={i} className="font-medium text-gray-900 text-xs">
                              {m.name}{m.dose && ` (${m.dose})`}
                            </li>
                          ))}
                          {rx.meds?.length > 3 && <li className="text-xs text-gray-500">+{rx.meds.length - 3} more</li>}
                        </ul>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {view === "summary" && data.prescriptions?.length > 3 && (
                <p className="text-xs text-gray-500 mt-2">+ {data.prescriptions.length - 3} more (switch to Detailed)</p>
              )}
            </Section>

            {/* Reports - click to view full report with image */}
            <Section title={`Reports (${data.reports?.length ?? 0})`} icon={FileText}>
              {!data.reports?.length ? (
                <p className="text-sm text-gray-500">No reports on file.</p>
              ) : (
                <ul className="space-y-4 max-h-72 overflow-y-auto">
                  {(view === "summary" ? data.reports.slice(0, 3) : data.reports).map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedReport(r)}
                        className="w-full text-left border border-gray-100 rounded-lg p-3 bg-gray-50/50 hover:border-primary-200 hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="text-sm font-bold text-gray-900">{r.type || r.lab}</p>
                          <span className="text-xs font-medium text-gray-500">{r.date}</span>
                        </div>
                        {r.summary && <p className="text-sm text-gray-700 line-clamp-2 mb-2">{r.summary}</p>}
                        <span className="text-xs font-bold text-primary-600">Click to view full report & image</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {view === "summary" && data.reports?.length > 3 && (
                <p className="text-xs text-gray-500 mt-2">+ {data.reports.length - 3} more (switch to Detailed)</p>
              )}
            </Section>
          </>
        )}
      </div>

      {/* Report Detail Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport ? `${selectedReport.lab || "Report"} - ${selectedReport.type || "Lab"}` : ""}
        size="lg">
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{selectedReport.date && format(new Date(selectedReport.date), "MMM d, yyyy")}</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-xs font-bold",
                  selectedReport.status === "Critical"
                    ? "bg-red-100 text-red-700"
                    : selectedReport.status === "Abnormal"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700",
                )}>
                {selectedReport.status || "Normal"}
              </span>
            </div>

            {selectedReport.imagePath && (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <a
                  href={API.REPORT_IMAGE(selectedReport.imagePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block">
                  <img
                    src={API.REPORT_IMAGE(selectedReport.imagePath)}
                    alt="Report"
                    className="w-full max-h-[400px] object-contain bg-gray-50"
                    crossOrigin="use-credentials"
                  />
                </a>
              </div>
            )}

            {selectedReport.summary && (
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">AI Summary</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedReport.summary}</p>
              </div>
            )}

            {selectedReport.tests?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">Tests</h4>
                <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
                  {selectedReport.tests.map((t, i) => (
                    <li key={i} className="border-b border-gray-50 pb-1">
                      {t.name}: {t.result} {t.unit && t.unit}
                      {t.range && ` (ref: ${t.range})`} {t.status && `[${t.status}]`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedReport.rawText && (
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">Full Report</h4>
                <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded-xl overflow-auto max-h-64 whitespace-pre-wrap font-sans">
                  {selectedReport.rawText}
                </pre>
              </div>
            )}

            {!selectedReport.summary && !selectedReport.rawText && !selectedReport.imagePath && (!selectedReport.tests?.length) && (
              <p className="text-sm text-gray-500 italic">No additional details available.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Prescription Detail Modal */}
      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title="Prescription Details"
        size="lg">
        {selectedPrescription && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              {selectedPrescription.createdAt && format(new Date(selectedPrescription.createdAt), "MMM d, yyyy")}
            </div>

            {selectedPrescription.imagePath && (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <a
                  href={API.PRESCRIPTION_IMAGE(selectedPrescription.imagePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block">
                  <img
                    src={API.PRESCRIPTION_IMAGE(selectedPrescription.imagePath)}
                    alt="Prescription"
                    className="w-full max-h-[500px] object-contain"
                    crossOrigin="use-credentials"
                  />
                </a>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-2">Medicines</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPrescription.meds?.map((m, idx) => (
                  <span
                    key={idx}
                    className="text-sm font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {m.name} {m.dose && `(${m.dose})`}
                    {m.frequency && ` - ${m.frequency}`}
                    {m.duration && ` - ${m.duration}`}
                  </span>
                ))}
                {(!selectedPrescription.meds || selectedPrescription.meds.length === 0) && (
                  <span className="text-sm text-gray-500">No medicines listed</span>
                )}
              </div>
            </div>

            {(selectedPrescription.note || selectedPrescription.rawText) && (
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">Notes</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedPrescription.note || selectedPrescription.rawText}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatientHealthPanel;
