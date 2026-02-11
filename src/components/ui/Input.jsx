import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { useSettingsStore } from "../../store/settingsStore";

const Input = forwardRef(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    const { ageMode } = useSettingsStore();
    const isElderly = ageMode === "elderly";

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              isElderly && "text-base font-semibold",
              error ? "text-error-500" : "text-gray-700",
            )}>
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "input",
            isElderly && "h-14 text-lg p-4", // Larger touch target and text for elderly
            error && "border-error-500 focus:ring-error-100",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className={cn("text-xs text-error-500", isElderly && "text-sm")}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              isElderly && "text-sm",
            )}>
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
