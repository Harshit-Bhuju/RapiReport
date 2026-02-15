import React from "react";
import {
  User,
  Activity,
  AlertCircle,
  Heart,
  FileText,
  Thermometer,
  Droplets,
  ShieldAlert,
  ChevronRight,
  Pill,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/**
 * FamilyMemberCard Component
 * Displays family member profile + health summary (conditions, symptoms, reports).
 */
export const FamilyMemberCard = ({
  member,
  className,
  actions,
  onViewHealth,
}) => {
  const { t } = useTranslation();
  const health = member.health; // { profile, symptoms, reports } or null

  const getSeverityColor = (sev) => {
    if (sev === "severe") return "bg-error-100 text-error-700 border-error-200";
    if (sev === "moderate")
      return "bg-warning-100 text-warning-700 border-warning-200";
    return "bg-success-100 text-success-700 border-success-200";
  };

  const conditions = health?.profile?.conditions;
  const allergies = health?.profile?.allergies;
  const parentalHistory = health?.profile?.parentalHistory?.length || health?.profile?.customParentalHistory;
  const recentSymptoms = (health?.symptoms || []).slice(0, 3);
  const reportsCount = (health?.reports || []).length;
  const prescriptionsCount = (health?.prescriptions || []).length;
  const hasHealthData =
    health &&
    (conditions ||
      allergies ||
      parentalHistory ||
      recentSymptoms.length > 0 ||
      reportsCount > 0 ||
      prescriptionsCount > 0);

  return (
    <Card
      className={cn(
        "group border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem]",
        className,
      )}>
      <CardBody className="p-6">
        {/* Header: Avatar, Name, and Relation */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <User className="w-7 h-7" />
                )}
              </div>
              {member.alerts && member.alerts.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error-500 border-2 border-white animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">
                {member.name}
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                {member.relation}
              </p>
            </div>
          </div>
          {health?.profile?.bloodGroup && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-error-50 border border-error-100 text-error-600">
              <Droplets className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase">
                {health.profile.bloodGroup}
              </span>
            </div>
          )}
        </div>

        {/* Health Info Section */}
        <div className="space-y-3">
          {/* Conditions / Allergies */}
          {(conditions || allergies) && (
            <div className="space-y-2">
              {conditions && (
                <div className="flex items-start gap-2">
                  <Heart className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    <span className="font-bold text-gray-800">
                      {t("family.conditions") || "Conditions"}:{" "}
                    </span>
                    {conditions}
                  </p>
                </div>
              )}
              {allergies && (
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-warning-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    <span className="font-bold text-gray-800">
                      {t("family.allergies") || "Allergies"}:{" "}
                    </span>
                    {allergies}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recent Symptoms */}
          {recentSymptoms.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Thermometer className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {t("family.recentSymptoms") || "Recent Symptoms"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSymptoms.map((s, i) => (
                  <span
                    key={s.id || i}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      getSeverityColor(s.severity),
                    )}>
                    {t(`common.severities.${s.severity}`)}: {s.text?.length > 25 ? s.text.slice(0, 25) + "…" : s.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reports & Prescriptions Count */}
          {(reportsCount > 0 || prescriptionsCount > 0) && (
            <div className="flex items-center gap-3 flex-wrap">
              {reportsCount > 0 && (
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary-500" />
                  <span className="text-xs font-bold text-gray-600">
                    {reportsCount} {t("family.healthReports") || "health report(s)"}
                  </span>
                </div>
              )}
              {prescriptionsCount > 0 && (
                <div className="flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-bold text-gray-600">
                    {prescriptionsCount} prescription(s)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* No health data */}
          {!hasHealthData && health && (
            <div className="text-center py-3">
              <Activity className="w-5 h-5 text-gray-300 mx-auto mb-1" />
              <p className="text-xs text-gray-400 font-medium">
                {t("family.noHealthData") || "No health data available"}
              </p>
            </div>
          )}

          {/* Loading state */}
          {!health && (
            <div className="flex items-center justify-center py-3 gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin" />
              <span className="text-xs text-gray-400">
                {t("family.loadingHealth") || "Loading health data..."}
              </span>
            </div>
          )}

          {/* Alert */}
          {member.alerts && member.alerts.length > 0 && (
            <div className="bg-error-50/50 border border-error-100/50 p-3 rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-error-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-error-700 leading-relaxed">
                {member.alerts[0]}
              </p>
            </div>
          )}

          {/* View Health Details Button */}
          {hasHealthData && onViewHealth && (
            <button
              onClick={() => onViewHealth(member)}
              className="w-full flex items-center justify-center gap-2 py-2 mt-1 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-600 text-xs font-bold transition-colors">
              {t("family.viewHealthDetails") || "View Health Details"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Actions Slot */}
        {actions && (
          <div className="mt-5 flex gap-2 pt-4 border-t border-gray-50">
            {actions}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
