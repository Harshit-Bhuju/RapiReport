import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Stethoscope,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export const Typewriter = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className="relative">
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-2 h-4 bg-primary-600 animate-pulse ml-1 align-middle" />
      )}
    </span>
  );
};

export const HealthInsightCard = ({ insights, type = "info" }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const styles = {
    info: "bg-primary-50 border-primary-100 text-primary-900 icon-bg-primary-100 icon-color-primary-600",
    warning:
      "bg-warning-50 border-warning-100 text-warning-900 icon-bg-warning-100 icon-color-warning-600",
    success:
      "bg-success-50 border-success-100 text-success-900 icon-bg-success-100 icon-color-success-600",
    error:
      "bg-error-50 border-error-100 text-error-900 icon-bg-error-100 icon-color-error-600",
  };

  const Icon =
    type === "warning"
      ? AlertTriangle
      : type === "success"
        ? CheckCircle2
        : Lightbulb;

  return (
    <Card className={cn("border-none shadow-sm", styles[type].split(" ")[0])}>
      <CardBody className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              styles[type].split(" ")[3],
            )}>
            <Icon className={cn("w-6 h-6", styles[type].split(" ")[4])} />
          </div>
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-sm font-bold leading-relaxed">
                  <Typewriter
                    text={currentLang === "ne" ? insight.ne : insight.en}
                  />
                </p>
                <p className="text-xs font-semibold opacity-60 italic">
                  {currentLang === "ne" ? insight.en : insight.ne}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export const DailyRoutineCard = ({ activities }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
        <Stethoscope className="w-5 h-5 text-primary-600" />
        AI Tailored Routine
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {activities.map((act, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center justify-between group hover:border-primary-100 transition-all">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">
                {currentLang === "ne" ? act.ne : act.en}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                {act.time}
              </span>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-primary-600 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};
