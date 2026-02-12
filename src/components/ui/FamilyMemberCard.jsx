import React from "react";
import {
  User,
  Activity,
  AlertCircle,
  MessageSquare,
  Phone,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * FamilyMemberCard Component
 * A premium card to display family member health status and quick actions.
 */
export const FamilyMemberCard = ({ member, className, actions }) => {
  const getStatusColor = (score) => {
    if (score >= 80) return "text-success-600 bg-success-50 border-success-100";
    if (score >= 60) return "text-warning-600 bg-warning-50 border-warning-100";
    return "text-error-600 bg-error-50 border-error-100";
  };

  const scoreColor = getStatusColor(member.healthScore);

  return (
    <Card
      className={cn(
        "group border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem]",
        className,
      )}>
      <CardBody className="p-6">
        {/* Header: Avatar, Name, and Health Score */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-600 shadow-inner">
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
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                  member.healthScore >= 80
                    ? "bg-success-500"
                    : member.healthScore >= 60
                      ? "bg-warning-500"
                      : "bg-error-500",
                )}
              />
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
          <div
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-colors",
              scoreColor,
            )}>
            {member.healthScore}% Health
          </div>
        </div>

        {/* Status: Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wide">
                Daily Goals
              </span>
            </div>
            <span className="text-sm font-black text-gray-900">
              {member.completedTasks}
              <span className="text-gray-300 mx-0.5">/</span>
              {member.totalTasks}
            </span>
          </div>
          <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden border border-gray-100">
            <div
              className="bg-primary-600 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{
                width: `${(member.completedTasks / (member.totalTasks || 1)) * 100}%`,
              }}
            />
          </div>

          {/* Conditional Alert */}
          {member.alerts && member.alerts.length > 0 && (
            <div className="mt-4 bg-error-50/50 border border-error-100/50 p-3 rounded-2xl flex items-start gap-2.5 animate-pulse-slow">
              <AlertCircle className="w-4 h-4 text-error-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-error-700 leading-relaxed">
                {member.alerts[0]}
              </p>
            </div>
          )}
        </div>

        {/* Actions Slot */}
        {actions && (
          <div className="mt-6 flex gap-2 pt-5 border-t border-gray-50">
            {actions}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
