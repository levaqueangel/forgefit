"use client";
import { useState, useEffect } from "react";

export function ProgressBar({ value, color, delay = 0, height = 5 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ height, background: "#1A1A1A", borderRadius: height, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${width}%`,
        background: color,
        borderRadius: height,
        transition: "width 1.2s cubic-bezier(0.25,1,0.5,1)"
      }} />
    </div>
  );
}

