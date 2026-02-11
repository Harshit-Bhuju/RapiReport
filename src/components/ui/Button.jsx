import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      outline: "btn-outline",
      danger:
        "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 shadow-sm hover:shadow-md",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    };

    const sizes = {
      sm: "h-10 px-4 text-sm",
      md: "h-12 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "btn",
          variants[variant],
          sizes[size],
          loading && "opacity-70 cursor-not-allowed",
          className,
        )}
        {...props}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
