import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { createWorker } from "tesseract.js";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import {
  Camera,
  FileText,
  ScanLine,
  Save,
  Trash2,
  History,
  Clock,
  Image as ImageIcon,
  Pill,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthStore } from "@/store/healthStore";
import { useAuthStore } from "@/store/authStore";
import API from "@/Configs/ApiEndpoints";

function parsePrescriptionText(text) {
  const cleaned = (text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const meds = [];

  for (const line of cleaned) {
    const doseMatch = line.match(/(\d+\s?(mg|mcg|g|ml))/i);
    const freqMatch =
      line.match(/(\b\d-\d-\d\b)/) ||
      line.match(/\b(once|twice|thrice)\b/i) ||
      line.match(/\b(daily|bd|tid|qid)\b/i);
    const daysMatch = line.match(/(\d+)\s*(day|days|week|weeks)/i);

    const name = line
      .split(/(\d)/)[0]
      .replace(/[:\-•]+/g, " ")
      .trim();

    if (!doseMatch && !freqMatch && name.length < 3) continue;

    meds.push({
      name: name || line,
      dose: doseMatch?.[0] || "",
      frequency: freqMatch?.[0] || "",
      duration: daysMatch?.[0] || "",
      raw: line,
    });
  }

  return { lines: cleaned, meds };
}

const PrescriptionScan = () => {
  const { user } = useAuthStore();
  const {
    addPrescription,
    prescriptions,
    removePrescription,
    fetchPrescriptions,
  } = useHealthStore();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [rawText, setRawText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [note, setNote] = useState("");
  const [ocrHistory, setOcrHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const parsed = useMemo(() => parsePrescriptionText(rawText), [rawText]);

  const onPickFile = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageFile(file);
    setRawText("");
    toast.success("Image loaded. Click Scan to extract text.");
  };

  const fetchOcrHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await axios.get(API.OCR_HISTORY_LIST, {
        withCredentials: true,
      });
      if (response.data?.status === "success") {
        setOcrHistory(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch OCR history", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchOcrHistory();
  }, [fetchPrescriptions]);

  const handleDeleteHistory = async (id) => {
    try {
      const response = await axios.post(
        API.OCR_HISTORY_DELETE,
        { id },
        { withCredentials: true },
      );
      if (response.data?.status === "success") {
        toast.success("Deleted.");
        setOcrHistory((prev) => prev.filter((h) => h.id !== id));
      } else {
        toast.error(response.data?.message || "Delete failed.");
      }
    } catch (err) {
      toast.error("Error deleting history.");
    }
  };

  const handleScan = async () => {
    if (!imageUrl) {
      toast.error("Upload a prescription image first.");
      return;
    }
    setIsScanning(true);
    try {
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(imageUrl);
      await worker.terminate();
      const t = (text || "").trim();
      setRawText(t);
      if (!t) toast.error("OCR returned empty text. Try a clearer image.");
      else toast.success("Scan complete. Review below.");
    } catch (e) {
      console.error(e);
      toast.error("OCR failed. Try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = () => {
    if (!rawText.trim()) {
      toast.error("No extracted text to save.");
      return;
    }
    addPrescription({ note: note.trim(), rawText, meds: parsed.meds });
    toast.success("Prescription saved.");
    setNote("");
    fetchOcrHistory();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Prescription Scan
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Upload, scan, and manage your prescriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Upload + Save ── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload Card */}
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Upload & Scan
              </p>

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                />
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-primary-300 transition-colors cursor-pointer bg-white">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 mx-auto flex items-center justify-center text-primary-600 mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    Click to upload
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG / PNG recommended
                  </p>
                </div>
              </label>

              {imageUrl && (
                <div className="mt-4">
                  <img
                    src={imageUrl}
                    alt="Prescription"
                    className="w-full rounded-2xl border border-gray-100"
                  />
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <Button
                  onClick={handleScan}
                  loading={isScanning}
                  className="gap-2 flex-1">
                  <ScanLine className="w-4 h-4" />
                  Scan
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setImageUrl(null);
                    setImageFile(null);
                    setRawText("");
                    toast.success("Cleared.");
                  }}
                  className="gap-2">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Save Card */}
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <Input
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. OPD visit, Dr. name…"
              />
              <div className="mt-4">
                <Button onClick={handleSave} className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  Save prescription
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                OCR + parsing is best-effort, always verify.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* ── Right Column: Results + History ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Extracted Text */}
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Extracted text
                  </h2>
                </div>
                <span
                  className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full border",
                    parsed.meds.length
                      ? "bg-success-50 text-success-700 border-success-100"
                      : "bg-gray-50 text-gray-600 border-gray-100",
                  )}>
                  {parsed.meds.length} medicines found
                </span>
              </div>

              <textarea
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 transition-all min-h-[180px] resize-none text-sm"
                placeholder="OCR text will appear here… (you can also edit manually)"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />

              {/* Inline parsed medicines */}
              {parsed.meds.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Detected medicines
                  </p>
                  {parsed.meds.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {m.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.dose && (
                          <span className="px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold">
                            {m.dose}
                          </span>
                        )}
                        {m.frequency && (
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                            {m.frequency}
                          </span>
                        )}
                        {m.duration && (
                          <span className="px-2.5 py-0.5 rounded-full bg-warning-50 text-warning-700 text-xs font-bold">
                            {m.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* ── Full History Section ── */}
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">History</h2>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchOcrHistory}
                  loading={isHistoryLoading}
                  className="gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              </div>

              {ocrHistory.length === 0 && prescriptions.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium text-center py-8">
                  No history yet. Scan a prescription to get started.
                </p>
              ) : (
                <div className="space-y-5">
                  {/* OCR History Items — full cards with image + medicines */}
                  {ocrHistory.map((item) => {
                    const histMeds = parsePrescriptionText(
                      item.raw_text || "",
                    ).meds;
                    return (
                      <div
                        key={`ocr-${item.id}`}
                        className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                        {/* Header row */}
                        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">
                              OCR Scan
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setRawText(item.raw_text || "");
                                toast.success("Loaded into editor.");
                              }}
                              className="text-[10px] font-bold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors">
                              Load
                            </button>
                            <button
                              onClick={() => handleDeleteHistory(item.id)}
                              className="p-1.5 text-gray-400 hover:text-error-600 transition-colors rounded-lg hover:bg-error-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content: Image + Medicines side-by-side */}
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Image thumbnail */}
                            <div className="rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                              {item.image_path ? (
                                <img
                                  src={item.image_path}
                                  alt="Scanned prescription"
                                  className="w-full h-40 object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className={cn(
                                  "h-40 flex-col items-center justify-center gap-2 text-gray-400",
                                  item.image_path ? "hidden" : "flex",
                                )}>
                                <ImageIcon className="w-8 h-8" />
                                <span className="text-xs font-medium">
                                  No image saved
                                </span>
                              </div>
                            </div>

                            {/* Medicines list */}
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Pill className="w-3.5 h-3.5 text-gray-400" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  Medicines ({histMeds.length})
                                </p>
                              </div>
                              {histMeds.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">
                                  No medicines detected from this scan.
                                </p>
                              ) : (
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                  {histMeds.map((m, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50/80">
                                      <span className="text-xs font-bold text-gray-800 truncate">
                                        {m.name}
                                      </span>
                                      <div className="flex gap-1 shrink-0">
                                        {m.dose && (
                                          <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold">
                                            {m.dose}
                                          </span>
                                        )}
                                        {m.frequency && (
                                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                                            {m.frequency}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Raw text preview */}
                          <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                            {item.raw_text || "No text extracted"}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Saved Prescriptions */}
                  {prescriptions.slice(0, 5).map((p) => (
                    <div
                      key={`rx-${p.id}`}
                      className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-success-50 text-success-600">
                            Saved
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(p.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => removePrescription(p.id)}
                          className="p-1.5 text-gray-400 hover:text-error-600 transition-colors rounded-lg hover:bg-error-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="px-4 pb-4">
                        <p className="text-sm font-bold text-gray-900">
                          {p.meds?.length || 0} medicines
                          {p.note ? ` · ${p.note}` : ""}
                        </p>
                        {p.meds?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {p.meds.map((m, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50/80">
                                <span className="text-xs font-bold text-gray-800 truncate">
                                  {m.name}
                                </span>
                                <div className="flex gap-1 shrink-0">
                                  {m.dose && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold">
                                      {m.dose}
                                    </span>
                                  )}
                                  {m.frequency && (
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                                      {m.frequency}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScan;
