import React, { useEffect, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const MedicalHistory = () => {
  const { user } = useAuthStore();
  const { prescriptions, fetchPrescriptions, symptoms } = useHealthStore();

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

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
    () => symptoms.slice(0, 10).sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [symptoms],
  );

  const recentPrescriptions = useMemo(
    () => prescriptions.slice(0, 10),
    [prescriptions],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Medical history
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Past prescriptions, conditions, family history. AI cross-checks new prescriptions against this.
        </p>
      </div>

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
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {typeof item === "string" ? item : item?.label ?? JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">None recorded. Update in Profile.</p>
            )}
          </CardBody>
        </Card>

        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-black text-gray-900">Family history</h2>
            </div>
            {parentalHistory.length ? (
              <ul className="space-y-1">
                {parentalHistory.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {typeof item === "string" ? item : item?.label ?? JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">None recorded. Update in Profile.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-black text-gray-900">Past prescriptions</h2>
          </div>
          {recentPrescriptions.length ? (
            <ul className="space-y-3">
              {recentPrescriptions.map((rx) => (
                <li
                  key={rx.id}
                  className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-gray-500">
                    {rx.createdAt ? format(new Date(rx.createdAt), "MMM d, yyyy") : "—"}
                  </span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {(rx.meds || []).map((m) => m.name).filter(Boolean).join(", ") || "No medicines listed"}
                  </p>
                  {rx.note && <p className="text-gray-500 mt-0.5">{rx.note}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No prescriptions saved yet. Use Prescription Scan to add.</p>
          )}
        </CardBody>
      </Card>

      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-black text-gray-900">Recent symptom logs</h2>
          </div>
          {recentSymptoms.length ? (
            <ul className="space-y-2">
              {recentSymptoms.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{s.text}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold capitalize",
                    s.severity === "severe" && "bg-error-50 text-error-700",
                    s.severity === "moderate" && "bg-warning-50 text-warning-700",
                    s.severity === "mild" && "bg-success-50 text-success-700",
                  )}>
                    {s.severity || "mild"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No symptoms logged. Use Symptoms page to add.</p>
          )}
        </CardBody>
      </Card>

      <Card className="border-none shadow-xl shadow-gray-100/50 bg-primary-50/50 border border-primary-100">
        <CardBody className="p-6 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-gray-900">AI cross-check</h3>
            <p className="text-sm text-gray-600 mt-1">
              When you scan a new prescription, we check it against your conditions, allergies, and history.
              Warnings for repeated meds, interactions, or contraindications appear before you save.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default MedicalHistory;
