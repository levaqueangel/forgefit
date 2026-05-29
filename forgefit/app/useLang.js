"use client";
import { useState, useEffect } from "react";

// Import statique de FR (langue par défaut) pour éviter le flash
import { LANGS as ALL_LANGS } from "./translations";

export function useLang() {
  const [lang, setLangState] = useState("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("apxfitness_lang");
      if (saved && ALL_LANGS[saved]) setLangState(saved);
    } catch {
      // localStorage non disponible
    }
  }, []);

  const setLang = (code) => {
    if (!ALL_LANGS[code]) return;
    setLangState(code);
    try {
      localStorage.setItem("apxfitness_lang", code);
    } catch {
      // Silencieux si localStorage indisponible
    }
  };

  return {
    lang,
    setLang,
    t: ALL_LANGS[lang] || ALL_LANGS["fr"],
    LANGS: ALL_LANGS,
    mounted,
  };
}
