import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useHealthStore } from "@/store/healthStore";
import { useConfirmStore } from "@/store/confirmStore";
import { Plus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { format, subDays } from "date-fns";

const SEVERITIES = [
  { key: "mild", label: "Mild" },
  { key: "moderate", label: "Moderate" },
  { key: "severe", label: "Severe" },
];

const Symptoms = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { symptoms, addSymptom, removeSymptom, fetchSymptoms } = useHealthStore();
  const openConfirm = useConfirmStore((s) => s.openConfirm);
  useEffect(() => { fetchSymptoms(); }, [fetchSymptoms]);
  const [text, setText] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [vitalsNote, setVitalsNote] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!text.trim()) {
      toast.error("Describe your symptom.");
      return;
    }
    setAdding(true);
    const entry = {
      text: text.trim(),
      severity,
      vitals: vitalsNote.trim() ? { note: vitalsNote } : undefined,
    };
    await addSymptom(entry);
    setText("");
    setVitalsNote("");
    setAdding(false);
    toast.success("Symptom saved. Redirecting to AI for follow-up...");
    navigate("/consultation", {
      state: {
        fromSymptoms: true,
        initialSymptom: {
          text: entry.text,
          severity: entry.severity,
          vitalsNote: vitalsNote.trim() || null,
        },
      },
    });
  };

  const last7 = useMemo(() => {
    const cutoff = subDays(new Date(), 7).toISOString().slice(0, 10);
    return symptoms.filter((s) => s.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
  }, [symptoms]);

  const byDate = useMemo(() => {
    const map = {};
    last7.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [last7]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Symptom log
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Log symptoms daily; view trends over time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-xl shadow-gray-100/50 lg:col-span-1">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Log symptom</h2>
            </div>
            <div className="space-y-4">
              <textarea
                className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 min-h-[100px] resize-none text-sm"
                placeholder="e.g. Headache since morning, mild fever..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Severity</label>
                <div className="flex gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSeverity(s.key)}
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all",
                        severity === s.key
                          ? "bg-primary-50 border-primary-600 text-primary-700"
                          : "border-gray-100 text-gray-500",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Vitals / notes (optional)"
                value={vitalsNote}
                onChange={(e) => setVitalsNote(e.target.value)}
                placeholder="e.g. BP 120/80, temp 98.6"
              />
              <Button onClick={handleAdd} className="w-full gap-2" disabled={adding}>
                <Plus className="w-4 h-4" /> {adding ? "Saving..." : "Add entry"}
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Last 7 days</h2>
              </div>
              {last7.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium">No entries yet.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(byDate).map(([date, entries]) => (
                    <div key={date} className="border border-gray-100 rounded-2xl p-4 bg-white">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {format(new Date(date), "EEE, MMM d")}
                      </p>
                      {entries.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{s.text}</p>
                            {s.vitals?.note && (
                              <p className="text-xs text-gray-500 mt-0.5">{s.vitals.note}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-bold",
                                s.severity === "severe" && "bg-error-50 text-error-700",
                                s.severity === "moderate" && "bg-warning-50 text-warning-700",
                                s.severity === "mild" && "bg-success-50 text-success-700",
                              )}
                            >
                              {s.severity}
                            </span>
                            <button
                              onClick={() => {
                                openConfirm({
                                  title: t("confirm.delete") + " symptom?",
                                  message: t("confirm.removeSymptom"),
                                  confirmLabel: t("confirm.delete"),
                                  cancelLabel: t("confirm.cancel"),
                                  variant: "danger",
                                  onConfirm: async () => {
                                    await removeSymptom(s.id);
                                    toast.success("Symptom removed.");
                                  },
                                });
                              }}
                              className="text-xs font-bold text-error-600 hover:bg-error-50 px-2 py-1 rounded-lg"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
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

export default Symptoms;
