"use client";
import { useState, useEffect } from "react";
import { LANGS } from "./translations";

export function useLang() {
  const [lang, setLangState] = useState("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("apxfitness_lang");
      if (saved && LANGS[saved]) setLangState(saved);
    } catch {}
  }, []);

  const setLang = (code) => {
    setLangState(code);
    try { localStorage.setItem("apxfitness_lang", code); } catch {}
  };

  return { lang, setLang, t: LANGS[lang], LANGS, mounted };
}
