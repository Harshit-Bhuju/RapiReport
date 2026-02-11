import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { useSettingsStore } from "../../store/settingsStore";

const TextArea = forwardRef(({ className, label, error, ...props }, ref) => {
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
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isElderly && "text-base p-4 min-h-[100px]",
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
    </div>
  );
});
TextArea.displayName = "TextArea";

export { TextArea };
