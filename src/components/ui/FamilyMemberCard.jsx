import React from "react";
import { User, Activity, Heart, AlertCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";

export const FamilyMemberCard = ({ member }) => {
  const getStatusColor = (score) => {
    if (score >= 80) return "text-success-600 bg-success-50";
    if (score >= 60) return "text-warning-600 bg-warning-50";
    return "text-error-600 bg-error-50";
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer">
      <CardBody className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 leading-tight">
                {member.name}
              </h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {member.relation}
              </p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-black ${getStatusColor(
              member.healthScore,
            )}`}>
            {member.healthScore}% Health
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Activity className="w-4 h-4" />
              <span className="font-bold">Daily Goals</span>
            </div>
            <span className="font-black text-gray-900">
              {member.completedTasks}/{member.totalTasks}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${(member.completedTasks / member.totalTasks) * 100}%`,
              }}
            />
          </div>

          {member.alerts && member.alerts.length > 0 && (
            <div className="mt-3 bg-error-50 p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-error-700 leading-relaxed">
                {member.alerts[0]}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
