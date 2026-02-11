import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance, parseISO, isValid } from "date-fns";
import { ne as nepaliLocale } from "date-fns/locale";

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to NPR (Nepali Rupees)
 * @param {number} amount
 * @returns {string} e.g. "रु 3,450"
 */
export const formatNPR = (amount) => {
  const formatted = new Intl.NumberFormat("ne-NP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `रु ${formatted}`;
};

/**
 * Format date based on locale
 * @param {Date|string} date
 * @param {string} formatStr
 * @param {string} locale
 * @returns {string}
 */
export const formatDate = (date, formatStr = "PP", locale = "en") => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) return "Invalid date";

  return format(dateObj, formatStr, {
    locale: locale === "ne" ? nepaliLocale : undefined,
  });
};

/**
 * Relative time (e.g., "2 hours ago")
 * @param {Date|string} date
 * @param {string} locale
 * @returns {string}
 */
export const formatRelativeTime = (date, locale = "en") => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) return "";

  return formatDistance(dateObj, new Date(), {
    addSuffix: true,
    locale: locale === "ne" ? nepaliLocale : undefined,
  });
};

/**
 * Text-to-Speech helper for Nepali/English
 * @param {string} text
 * @param {string} lang 'ne-NP' | 'en-US'
 */
export const speakText = (text, lang = "ne-NP") => {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel(); // Stop current speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1;

  // Try to find a specific voice if available
  // Note: Nepali voices might not be available on all devices, fallbacks to Hindi or generic
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.startsWith(lang.split("-")[0]));

  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
};
