import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useSettingsStore } from "../../store/settingsStore";

const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const { ageMode } = useSettingsStore();

    // Adjust size for elderly mode
    const effectiveSize = ageMode === "elderly" && size === "md" ? "lg" : size;

    const variants = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      outline: "btn-outline",
      danger: "btn-danger",
      ghost: "btn-ghost",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
      icon: "h-11 w-11 p-2",
    };

    return (
      <button
        className={cn(
          "btn",
          variants[variant],
          sizes[effectiveSize],
          isLoading && "opacity-70 cursor-not-allowed",
          className,
        )}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
