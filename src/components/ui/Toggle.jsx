import React from "react";
import { Switch } from "@headlessui/react";
import { cn } from "@/lib/utils";

const Toggle = ({ label, enabled, onChange, className }) => {
  return (
    <Switch.Group>
      <div className={cn("flex items-center gap-4", className)}>
        {label && (
          <Switch.Label className="text-sm font-medium text-gray-700 cursor-pointer">
            {label}
          </Switch.Label>
        )}
        <Switch
          checked={enabled}
          onChange={onChange}
          className={cn(
            enabled ? "bg-primary-600" : "bg-gray-200",
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          )}>
          <span
            className={cn(
              enabled ? "translate-x-6" : "translate-x-1",
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
            )}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
};

export default Toggle;
