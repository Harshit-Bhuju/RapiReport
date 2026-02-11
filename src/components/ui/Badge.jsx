import React from "react";
import { cn } from "@/lib/utils";

const Badge = ({ children, variant = "default", size = "md", className }) => {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-primary-50 text-primary-700",
    success: "bg-success-50 text-success-700",
    error: "bg-error-50 text-error-700",
    warning: "bg-warning-50 text-warning-700",
    info: "bg-blue-50 text-blue-700",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variants[variant],
        sizes[size],
        className,
      )}>
      {children}
    </span>
  );
};

export default Badge;
