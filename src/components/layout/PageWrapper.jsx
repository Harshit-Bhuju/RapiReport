import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PageWrapper = ({
  children,
  className,
  title,
  subtitle,
  animate = true,
}) => {
  const content = (
    <div className={cn("container-custom py-8 md:py-12", className)}>
      {(title || subtitle) && (
        <div className="mb-8 md:mb-12">
          {title && (
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-gray-500 text-sm md:text-base">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="min-h-[calc(100vh-80px)]">
        {content}
      </motion.main>
    );
  }

  return <main className="min-h-[calc(100vh-80px)]">{content}</main>;
};

export default PageWrapper;
