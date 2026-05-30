"use client";
import { useState, useEffect, useCallback } from "react";
import { LANGS as FR_LANGS } from "./translations";

// Cache des traductions chargées dynamiquement
const langCache = { fr: FR_LANGS.fr };

// Langues disponibles (pour le sélecteur)
export const AVAILABLE_LANGS = {
  fr: { flag: FR_LANGS.fr.flag, label: FR_LANGS.fr.label },
  en: { flag: "🇬🇧", label: "EN" },
  de: { flag: "🇩🇪", label: "DE" },
  es: { flag: "🇪🇸", label: "ES" },
};

// Chargement dynamique d'une langue non-FR
async function loadLang(code) {
  if (langCache[code]) return langCache[code];
  try {
    // Import dynamique : Next.js code-split automatiquement
    const mod = await import(`./translations`);
    const lang = mod.LANGS[code];
    if (lang) langCache[code] = lang;
    return lang || FR_LANGS.fr;
  } catch {
    return FR_LANGS.fr;
  }
}

export function useLang() {
  const [lang, setLangCode] = useState("fr");
  const [t, setT] = useState(FR_LANGS.fr);
  const [mounted, setMounted] = useState(false);

  // Charger la langue sauvegardée au montage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("apxfitness_lang");
      if (saved && AVAILABLE_LANGS[saved]) {
        applyLang(saved);
      }
    } catch {}
  }, []);

  const applyLang = useCallback(async (code) => {
    const translations = await loadLang(code);
    setLangCode(code);
    setT(translations);
  }, []);

  const setLang = useCallback((code) => {
    if (!AVAILABLE_LANGS[code]) return;
    applyLang(code);
    try { localStorage.setItem("apxfitness_lang", code); } catch {}
  }, [applyLang]);

  return {
    lang,
    setLang,
    t,
    LANGS: FR_LANGS, // Rétrocompatibilité
    mounted,
  };
}
