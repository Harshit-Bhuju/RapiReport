import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const Loading = ({ fullScreen = false, text, size = "md", className }) => {
  const { t } = useTranslation();

  const spinnerSizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className,
      )}>
      <Loader2
        className={cn("animate-spin text-primary-500", spinnerSizes[size])}
      />
      {(text || fullScreen) && (
        <p className="text-sm font-medium text-gray-600 animate-pulse">
          {text || t("common.loading")}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
