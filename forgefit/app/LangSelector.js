"use client";
import { useState } from "react";

export function LangSelector({ lang, setLang, LANGS }) {
  const [open, setOpen] = useState(false);
  const t = LANGS[lang];

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          border: "0.5px solid #333", padding: "6px 12px",
          fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: "#888",
          fontFamily: "'Syne', sans-serif", cursor: "pointer",
          transition: "all 0.2s", userSelect: "none",
        }}
      >
        <span>{t.flag}</span>
        <span>{t.label}</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          background: "#111", border: "0.5px solid #242424",
          minWidth: 140, zIndex: 200,
        }}>
          {Object.entries(LANGS).map(([code, l]) => (
            <div
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                cursor: "pointer", padding: "8px 16px", fontSize: 12,
                letterSpacing: "1px", display: "flex", alignItems: "center", gap: 8,
                color: lang === code ? "#E8B000" : "#888",
                background: lang === code ? "#1A1A1A" : "transparent",
                fontFamily: "'Syne', sans-serif",
                fontWeight: lang === code ? 700 : 400,
                transition: "background 0.15s",
              }}
            >
              <span>{l.flag}</span>
              <span>{{ fr: "Français", en: "English", de: "Deutsch", es: "Español" }[code]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
