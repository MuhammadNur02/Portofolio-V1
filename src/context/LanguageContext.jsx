import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations } from "../translations";

const LanguageContext = createContext(null);

// A first-time visitor with no saved preference gets whichever language their own browser is set
// to — Indonesian for an "id" locale, English for everyone else. This matters for reaching
// international companies: without it, every visitor saw Indonesian first regardless of where they
// were, which is the wrong default for a portfolio meant to also be read by recruiters abroad.
const detectBrowserLang = () => {
  try {
    const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
    return locales.some((l) => l?.toLowerCase().startsWith("id")) ? "id" : "en";
  } catch {
    return "id";
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem("portfolio-lang");
      if (saved === "en" || saved === "id") return saved;
    } catch {
      // ignore
    }
    return detectBrowserLang();
  });

  useEffect(() => {
    try {
      localStorage.setItem("portfolio-lang", lang);
    } catch {
      // ignore
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next === "en" ? "en" : "id");
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === "id" ? "en" : "id"));
  }, []);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Provider + hook live together on purpose (the standard context pattern); fast refresh just reloads this file.
// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
