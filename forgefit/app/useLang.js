"use client";
import { useState, useEffect } from "react";
import { LANGS } from "./translations";

const VALID_LANGS = ["fr", "en", "de", "es"];
const STORAGE_KEY = "apxfitness_lang";

export function useLang() {
  // Initialiser depuis localStorage si disponible
  const [lang, setLangState] = useState(() => {
    if (typeof window === "undefined") return "fr";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && VALID_LANGS.includes(saved) ? saved : "fr";
    } catch {
      return "fr";
    }
  });

  // t = traductions courantes — recalculé synchrone à chaque changement de lang
  const t = LANGS[lang] ?? LANGS.fr;

  const setLang = (code) => {
    if (!VALID_LANGS.includes(code)) return;
    setLangState(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
  };

  return { lang, setLang, t, LANGS };
}
