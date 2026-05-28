"use client";
import { useState, useEffect } from "react";
import { LANGS } from "./translations";

export function useLang() {
  // Toujours commencer avec "fr" côté serveur pour éviter les erreurs d'hydratation
  const [lang, setLangState] = useState("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("apxfitness_lang");
      if (saved && LANGS[saved]) setLangState(saved);
    } catch {
      // localStorage non disponible (SSR, mode privé, etc.)
    }
  }, []);

  const setLang = (code) => {
    setLangState(code);
    try {
      localStorage.setItem("apxfitness_lang", code);
    } catch {
      // Silencieux si localStorage indisponible
    }
  };

  return { lang, setLang, t: LANGS[lang], LANGS, mounted };
}
