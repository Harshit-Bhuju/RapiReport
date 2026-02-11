import React from "react";
import { cn } from "@/lib/utils";

export const Card = ({ children, className, hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card",
        hover && "card-hover",
        onClick && "cursor-pointer",
        className,
      )}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => (
  <div
    className={cn("pb-4 border-b border-gray-100 mb-4", className)}
    {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }) => (
  <div
    className={cn("pt-4 border-t border-gray-100 mt-4", className)}
    {...props}>
    {children}
  </div>
);
