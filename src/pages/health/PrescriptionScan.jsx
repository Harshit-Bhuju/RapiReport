import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
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
  Loader2,
  Sparkles,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthStore } from "@/store/healthStore";
import { useConfirmStore } from "@/store/confirmStore";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import API from "@/Configs/ApiEndpoints";

// Helper to convert File or Blob to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data:image/jpeg;base64, prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const PrescriptionScan = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    addPrescription,
    prescriptions,
    removePrescription,
    fetchPrescriptions,
  } = useHealthStore();
  const navigate = useNavigate();

  const [imageUrl, setImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [rawText, setRawText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [note, setNote] = useState("");
  const [ocrHistory, setOcrHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [detectedMeds, setDetectedMeds] = useState([]);

  const fetchOcrHistory = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchPrescriptions();
    fetchOcrHistory();
  }, [fetchPrescriptions, fetchOcrHistory]);

  const onPickFile = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageFile(file);
    setRawText("");
    setDetectedMeds([]);
    toast.success("Image loaded. Click Scan to read handwriting.");
  };

  const handleDeleteHistory = (id) => {
    useConfirmStore.getState().openConfirm({
      title: t("confirm.delete") + " history?",
      message: "This will permanently delete this scan from your history.",
      confirmLabel: t("confirm.delete"),
      cancelLabel: t("confirm.cancel"),
      variant: "danger",
      onConfirm: async () => {
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
      },
    });
  };

  const handleScan = async () => {
    if (!imageFile) {
      toast.error("Upload a prescription image first.");
      return;
    }

    setIsScanning(true);
    try {
      const base64 = await fileToBase64(imageFile);
      const res = await axios.post(
        API.GEMINI_OCR,
        {
          image: base64,
          mimeType: imageFile.type,
        },
        { withCredentials: true },
      );

      if (res.data?.status === "success") {
        setRawText(res.data.rawText || "");
        setDetectedMeds(res.data.meds || []);
        toast.success("Handwriting scanned successfully!");
        fetchOcrHistory(); // Refresh history because gemini_ocr.php saves it
      } else {
        console.error("Gemini OCR Server Error:", res.data);
        toast.error(res.data?.message || "Scan failed.");
      }
    } catch (err) {
      console.error("Gemini OCR Request Failure:", err);
      const errorMsg =
        err.response?.data?.message || err.message || "Enhanced scan failed.";
      toast.error(`${errorMsg}. Try a clearer photo.`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = () => {
    if (!rawText.trim()) {
      toast.error("No extracted text to save.");
      return;
    }

    // Create FormData to send image + data
    const formData = new FormData();
    formData.append("note", note.trim());
    formData.append("rawText", rawText);
    formData.append("meds", JSON.stringify(detectedMeds));

    // Add image if available
    if (imageFile) {
      formData.append("image", imageFile);
    }

    addPrescription(formData);
    toast.success("Prescription saved.");
    setNote("");
  };

  // Internal parser for manual edits (fallback)
  const manualParsedMeds = useMemo(() => {
    if (detectedMeds.length > 0) return detectedMeds;
    // Basic regex parser if Gemini didn't return structured meds or user edited text
    // ... we can keep the old parsePrescriptionText logic here if needed
    return [];
  }, [detectedMeds]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          Prescription Scan
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-tighter">
            <Sparkles className="w-3 h-3" />
            AI Vision
          </span>
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Specialized in reading handwriting & complex prescriptions.
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
                    Handwritten prescriptions work best
                  </p>
                </div>
              </label>

              {imageUrl && (
                <div className="mt-4">
                  <img
                    src={imageUrl}
                    alt="Prescription"
                    className="w-full rounded-2xl border border-gray-100 shadow-sm"
                  />
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <Button
                  onClick={handleScan}
                  loading={isScanning}
                  className="gap-2 flex-1 shadow-lg shadow-primary-200">
                  <ScanLine className="w-4 h-4" />
                  Enhanced Scan
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setImageUrl(null);
                    setImageFile(null);
                    setRawText("");
                    setDetectedMeds([]);
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
                placeholder="e.g. Health Checkup, Dr. Sharma…"
              />
              <div className="mt-4">
                <Button
                  onClick={handleSave}
                  className="w-full gap-2 font-black">
                  <Save className="w-4 h-4" />
                  Save to history
                </Button>
              </div>
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
                    "text-xs font-bold px-3 py-1 rounded-full border transition-all",
                    detectedMeds.length
                      ? "bg-success-50 text-success-700 border-success-100"
                      : "bg-gray-50 text-gray-600 border-gray-100",
                  )}>
                  {detectedMeds.length} medicines detected
                </span>
              </div>

              <textarea
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 transition-all min-h-[160px] resize-none text-sm font-medium text-gray-700 bg-gray-50/30"
                placeholder="Scan result will appear here…"
                value={rawText}
                readOnly
              />

              {/* Inline detected medicines */}
              {detectedMeds.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                    Medicines Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detectedMeds.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-[1.5rem] border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <p className="font-extrabold text-gray-900 text-sm mb-2">
                          {m.name}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.dose && (
                            <span className="px-2 py-0.5 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-black uppercase">
                              {m.dose}
                            </span>
                          )}
                          {m.frequency && (
                            <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-black uppercase">
                              {m.frequency}
                            </span>
                          )}
                          {m.duration && (
                            <span className="px-2 py-0.5 rounded-lg bg-warning-50 text-warning-700 text-[10px] font-black uppercase">
                              {m.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button: Ask RapiAI */}
              {detectedMeds.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                  <Button
                    onClick={() => {
                      navigate("/consultation", {
                        state: {
                          initialPrescription: {
                            rawText: rawText,
                            meds: detectedMeds,
                          },
                        },
                      });
                    }}
                    className="gap-3 px-8 py-6 rounded-[2rem] bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-200 group transition-all hover:scale-105 active:scale-95">
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="font-black text-base">
                      Ask RapiAI about these medicines
                    </span>
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* History Section */}
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
                <p className="text-sm text-gray-500 font-medium text-center py-10 scale-95 opacity-80">
                  No history found. Try scanning a prescription.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {ocrHistory.map((item) => (
                    <div
                      key={`ocr-${item.id}`}
                      className="group rounded-3xl border border-gray-100 bg-white p-5 hover:border-primary-100 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
                              AI Scan
                            </span>
                            <span className="text-xs font-bold text-gray-400">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                          {(item.image_path && API.OCR_IMAGE(item.image_path)) ? (
                            <a
                              href={API.OCR_IMAGE(item.image_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 block w-fit rounded-xl overflow-hidden border border-gray-100 hover:border-primary-200 transition-colors">
                              <img
                                src={API.OCR_IMAGE(item.image_path)}
                                alt="OCR scan"
                                className="max-h-32 object-cover"
                              />
                            </a>
                          ) : null}
                          <p className="text-sm font-bold text-gray-700 mt-2 line-clamp-2 leading-relaxed">
                            {item.raw_text || "No text extracted"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-2 text-gray-300 hover:text-error-600 transition-colors rounded-xl hover:bg-error-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Pill className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {item.raw_text?.split("\n").length || 0} Lines
                            Extracted
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setRawText(item.raw_text || "");
                            setDetectedMeds([]); // Reset detected meds on history load for now
                            toast.success("Loaded from history.");
                          }}
                          className="text-xs font-black text-primary-600 hover:text-primary-700 flex items-center gap-1">
                          View details
                          <Sparkles className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            navigate("/consultation", {
                              state: {
                                initialPrescription: {
                                  rawText: item.raw_text || "",
                                  meds: [],
                                },
                              },
                            });
                          }}
                          className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                          Analyze with AI
                          <BrainCircuit className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Saved prescriptions summary */}
                  {prescriptions.length > 0 && (
                    <div className="mt-4 pt-6 border-t border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 pl-1">
                        Recent Saved Prescriptions
                      </p>
                      <div className="space-y-3">
                        {prescriptions.slice(0, 3).map((p) => (
                          <div
                            key={`p-${p.id}`}
                            className="p-4 rounded-2xl border border-gray-50 bg-gray-50/30 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center text-success-600">
                                <Save className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-extrabold text-gray-900">
                                  {p.note || `${p.meds?.length || 0} Medicines`}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400">
                                  {new Date(p.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                useConfirmStore.getState().openConfirm({
                                  title: t("confirm.delete") + " prescription?",
                                  message: t("confirm.removePrescription"),
                                  confirmLabel: t("confirm.delete"),
                                  cancelLabel: t("confirm.cancel"),
                                  variant: "danger",
                                  onConfirm: async () => {
                                    await removePrescription(p.id);
                                    toast.success("Prescription removed.");
                                  },
                                });
                              }}
                              className="p-2 text-gray-300 hover:text-error-600 transition-opacity">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
