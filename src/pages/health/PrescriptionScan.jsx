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
  Wand2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthStore } from "@/store/healthStore";
import { useAuthStore } from "@/store/authStore";
import API from "@/Configs/ApiEndpoints";

function parsePrescriptionText(text) {
  // MVP heuristic parser: tries to extract lines like:
  // "Paracetamol 500mg 1-0-1 x 5 days"
  // or "Amoxicillin 500 mg twice daily"
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

    // crude "name": take words before first number/dose
    const name = line
      .split(/(\d)/)[0]
      .replace(/[:\-•]+/g, " ")
      .trim();

    // If it doesn't look like a med line, skip
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
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [note, setNote] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [ocrHistory, setOcrHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const parsed = useMemo(() => {
    if (aiResult?.meds?.length)
      return {
        lines: rawText.split("\n").filter(Boolean),
        meds: aiResult.meds,
      };
    return parsePrescriptionText(rawText);
  }, [rawText, aiResult]);

  const patientHistory = useMemo(() => {
    const conditions = user?.conditions;
    const meds = prescriptions
      .flatMap((p) => (p.meds || []).map((m) => m.name))
      .filter(Boolean);
    return {
      conditions:
        typeof conditions === "string"
          ? conditions
          : conditions
            ? JSON.stringify(conditions)
            : "",
      currentMeds: meds.slice(0, 20).join(", "),
    };
  }, [user?.conditions, prescriptions]);

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
        toast.success("History item deleted.");
        fetchOcrHistory();
      } else {
        toast.error(response.data?.message || "Delete failed.");
      }
    } catch (err) {
      toast.error("Error deleting history.");
    }
  };

  const handleScan = async () => {
    if (!imageUrl) {
      toast.error("Please upload a prescription image first.");
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
      else toast.success("OCR complete. Review and save.");
    } catch (e) {
      console.error(e);
      toast.error("OCR failed. Try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAiParse = async () => {
    if (!rawText.trim()) {
      toast.error("Enter or scan text first.");
      return;
    }
    setIsAiParsing(true);
    setAiResult(null);
    try {
      const r = await axios.post(
        API.AI_PARSE_PRESCRIPTION,
        { ocrText: rawText, patientHistory },
        { withCredentials: true },
      );
      if (r.data?.status === "success") {
        setAiResult({
          meds: r.data.meds || [],
          alternatives: r.data.alternatives || [],
          clarityScore: r.data.clarityScore ?? 0,
          warnings: r.data.warnings || [],
        });
        toast.success("AI parsing done. Review medicines and warnings.");
      } else {
        toast.error(r.data?.message || "AI parse failed.");
      }
    } catch (e) {
      toast.error("AI parse failed. Use manual parsing.");
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSave = () => {
    if (!rawText.trim()) {
      toast.error("No extracted text to save.");
      return;
    }

    addPrescription({
      note: note.trim(),
      rawText,
      meds: parsed.meds,
    });
    toast.success("Prescription saved.");
    setNote("");
    setAiResult(null);
    fetchOcrHistory();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Prescription Scan
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Scan a handwritten or digital prescription and extract medicines
          (MVP).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Upload image
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
                    JPG/PNG recommended for best OCR
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

              <div className="mt-5 flex flex-col gap-3">
                <div className="flex gap-3">
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
                      setAiResult(null);
                      toast.success("Cleared.");
                    }}
                    className="gap-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleAiParse}
                  loading={isAiParsing}
                  className="w-full gap-2">
                  {isAiParsing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Parse with AI & check history
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <Input
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. OPD visit, Dr. name, hospital..."
              />
              <div className="mt-4">
                <Button onClick={handleSave} className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  Save prescription
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                This is an MVP: OCR + parsing is best-effort, always verify.
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
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
                <div className="flex items-center gap-2 flex-wrap">
                  {typeof aiResult?.clarityScore === "number" && (
                    <span
                      className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full border",
                        aiResult.clarityScore >= 70
                          ? "bg-success-50 text-success-700 border-success-100"
                          : "bg-warning-50 text-warning-700 border-warning-100",
                      )}>
                      Clarity: {aiResult.clarityScore}%
                    </span>
                  )}
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
              </div>

              <textarea
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 transition-all min-h-[220px] resize-none text-sm"
                placeholder="OCR text will appear here… (you can also edit manually)"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </CardBody>
          </Card>

          {aiResult?.warnings?.length > 0 && (
            <Card className="border-none shadow-xl shadow-gray-100/50 border-2 border-warning-200 bg-warning-50/50">
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-warning-700" />
                  <h3 className="font-black text-warning-800">
                    Warnings (check against your history)
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-warning-800">
                  {aiResult.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          {aiResult?.alternatives?.length > 0 && (
            <Card className="border-none shadow-xl shadow-gray-100/50">
              <CardBody className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">
                  AI suggestions (unclear names)
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {aiResult.alternatives.map((a, i) => (
                    <li key={i}>
                      <strong>{a.for}</strong> → {a.suggested}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Parsed medicines {aiResult ? "(AI)" : "(MVP)"}
              </h2>
              {parsed.meds.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium">
                  Scan an image to auto-detect medicines, or paste text above.
                </p>
              ) : (
                <div className="space-y-3">
                  {parsed.meds.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{m.raw}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.dose && (
                          <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold">
                            {m.dose}
                          </span>
                        )}
                        {m.frequency && (
                          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                            {m.frequency}
                          </span>
                        )}
                        {m.duration && (
                          <span className="px-3 py-1 rounded-full bg-warning-50 text-warning-700 text-xs font-bold">
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

          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Saved prescriptions
              </h2>
              {prescriptions.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium">
                  No saved prescriptions yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-gray-100 bg-white">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-gray-900">
                            {p.meds?.length || 0} meds
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(p.createdAt).toLocaleString()}
                            {p.note ? ` • ${p.note}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => removePrescription(p.id)}
                          className="text-xs font-bold text-error-700 hover:bg-error-50 px-3 py-2 rounded-xl transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Saved to your account. Use Adherence to set reminders for these
                medicines.
              </p>
            </CardBody>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">OCR History</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchOcrHistory}
                  loading={isHistoryLoading}>
                  Refresh
                </Button>
              </div>
              {ocrHistory.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium">
                  No OCR history found.
                </p>
              ) : (
                <div className="space-y-4">
                  {ocrHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-gray-100 bg-white group relative">
                      <div className="flex justify-between items-start gap-4">
                        <div
                          className="flex-1 cursor-pointer hover:opacity-70"
                          onClick={() => {
                            setRawText(item.raw_text || "");
                            toast.success("Loaded from history.");
                          }}>
                          <p className="text-xs font-bold text-gray-400 mb-1">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {item.raw_text || "No text extracted"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-2 text-gray-400 hover:text-error-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
