import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const Select = forwardRef(
    (
        {
            label,
            error,
            helperText,
            required,
            className,
            id,
            options = [],
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
                <div className="relative">
                    <select
                        ref={ref}
                        id={id}
                        className={cn(
                            "input pr-10 appearance-none bg-white",
                            error &&
                            "border-error-500 focus:border-error-500 focus:ring-error-100",
                            className,
                        )}
                        {...props}>
                        <option value="" disabled>Select an option</option>
                        {options.map((option) => (
                            <option key={option.value || option} value={option.value || option}>
                                {option.label || option}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
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

Select.displayName = "Select";

export default Select;
