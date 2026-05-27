"use client";
import { useState, useEffect } from "react";
import { LANGS } from "./translations";

export function useLang() {
  const [lang, setLangState] = useState("fr");

  useEffect(() => {
    const saved = localStorage.getItem("apxfitness_lang");
    if (saved && LANGS[saved]) setLangState(saved);
  }, []);

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem("apxfitness_lang", code);
  };

  return { lang, setLang, t: LANGS[lang], LANGS };
}
