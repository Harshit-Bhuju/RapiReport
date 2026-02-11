import { clsx } from "clsx";
import { format, formatDistance, parseISO, isValid } from "date-fns";

export const cn = (...inputs) => {
  return clsx(inputs);
};

export const formatNPR = (amount) => {
  const formatted = new Intl.NumberFormat("ne-NP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `रु ${formatted}`;
};
export const formatDate = (date, formatStr = "PP", locale = "en") => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) return "Invalid date";

  if (locale === "ne") {
    return new Intl.DateTimeFormat("ne-NP", {
      dateStyle: "long",
    }).format(dateObj);
  }

  return format(dateObj, formatStr);
};

export const formatRelativeTime = (date, locale = "en") => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) return "";

  if (locale === "ne") {
    // Basic fallback for relative time in Nepali using Intl if available,
    // or just format the date normally if relative is too complex to implement manually
    return new Intl.DateTimeFormat("ne-NP", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(dateObj);
  }

  return formatDistance(dateObj, new Date(), {
    addSuffix: true,
  });
};
