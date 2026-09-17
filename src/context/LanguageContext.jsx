import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations } from "../translations";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem("portfolio-lang");
      if (saved === "en" || saved === "id") return saved;
    } catch {
      // ignore
    }
    return "id";
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

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
