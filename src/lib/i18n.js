import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "../translations/en.json";
import neTranslations from "../translations/ne.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    ne: { translation: neTranslations },
  },
  lng: localStorage.getItem("language") || "ne", // Default to Nepali
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false,
  },
});

// Save language preference
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
  document.documentElement.lang = lng;
});

export default i18n;
