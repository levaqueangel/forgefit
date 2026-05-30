"use client";
import { useState, useEffect } from "react";

// Barre de progression animée — se remplit progressivement au montage
export function ProgressBar({ value, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ height: 5, background: "#1A1A1A", borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${width}%`,
        background: color,
        borderRadius: 3,
        transition: "width 1.2s cubic-bezier(0.25,1,0.5,1)"
      }} />
    </div>
  );
}
