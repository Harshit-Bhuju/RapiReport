import React, { useMemo } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { useHealthStore } from "@/store/healthStore";
import { AlertTriangle, ShieldAlert, Info, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Alerts = () => {
  const { adherenceLogs, prescriptions, symptoms, getAdherenceStreak } = useHealthStore();
  const today = new Date().toISOString().slice(0, 10);

  const alerts = useMemo(() => {
    const list = [];

    const todayTaken = adherenceLogs.filter((l) => l.date === today && l.taken).length;
    const todayTotal = adherenceLogs.filter((l) => l.date === today).length;
    if (todayTotal > 0 && todayTaken < todayTotal) {
      list.push({
        id: "adherence-missed",
        type: "warning",
        title: "Missed doses today",
        message: `You have ${todayTotal - todayTaken} dose(s) not yet marked as taken.`,
        icon: AlertTriangle,
      });
    }

    const streak = getAdherenceStreak();
    if (streak >= 7) {
      list.push({
        id: "adherence-streak",
        type: "success",
        title: "Adherence streak",
        message: `${streak} days in a row with at least one dose taken. Keep it up!`,
        icon: TrendingUp,
      });
    }

    const severeSymptoms = symptoms.filter((s) => s.severity === "severe" && s.date >= today);
    if (severeSymptoms.length > 0) {
      list.push({
        id: "severe-symptom",
        type: "danger",
        title: "Severe symptom logged",
        message: "You logged a severe symptom. Consider consulting a doctor.",
        icon: ShieldAlert,
      });
    }

    if (prescriptions.length > 0) {
      const lastRx = prescriptions[0];
      const lastDate = lastRx?.createdAt ? new Date(lastRx.createdAt) : null;
      if (lastDate && (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24) > 90) {
        list.push({
          id: "old-prescription",
          type: "info",
          title: "Prescription review",
          message: "Your last prescription was over 90 days ago. Consider a follow-up with your doctor.",
          icon: Info,
        });
      }
    }

    return list;
  }, [adherenceLogs, today, prescriptions, symptoms, getAdherenceStreak]);

  const typeStyles = {
    warning: "bg-warning-50 border-warning-200 text-warning-800",
    success: "bg-success-50 border-success-200 text-success-800",
    danger: "bg-error-50 border-error-200 text-error-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Predictive AI alerts
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Side effects, interactions, dosage warnings, and lifestyle suggestions based on your data.
        </p>
      </div>

      {alerts.length === 0 ? (
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-8 text-center">
            <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No alerts right now.</p>
            <p className="text-sm text-gray-400 mt-1">
              Alerts will appear when we detect missed doses, severe symptoms, or prescription follow-up reminders.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((a) => {
            const Icon = a.icon;
            return (
              <Card
                key={a.id}
                className={cn("border-2", typeStyles[a.type] || typeStyles.info)}
              >
                <CardBody className="p-5 flex items-start gap-4">
                  <Icon className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-black">{a.title}</h3>
                    <p className="text-sm mt-1 opacity-90">{a.message}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Alerts are generated from your adherence, symptoms, and prescription history. They are not a substitute for professional medical advice.
      </p>
    </div>
  );
};
