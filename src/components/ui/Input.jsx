import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      required,
      className,
      id,
      type = "text",
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {label}
            {required && <span className="text-error-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={cn(
            "input",
            error &&
              "border-error-500 focus:border-error-500 focus:ring-error-100",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-error-600 animate-fade-in">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
