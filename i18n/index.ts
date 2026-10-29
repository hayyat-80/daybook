import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar.json";
import de from "./locales/de.json";
import en from "./locales/en.json";

export const resources = {
  en: { translation: en },
  de: { translation: de },
  ar: { translation: ar },
} as const;

export type AppLanguage = keyof typeof resources;

function detectLanguage(): AppLanguage {
  if (typeof navigator === "undefined") return "en";
  const code = navigator.language.slice(0, 2).toLowerCase();
  if (code === "ar" || code === "de") return code;
  return "en";
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export function applyLanguage(lang: AppLanguage) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }
  void i18n.changeLanguage(lang);
}

export default i18n;
