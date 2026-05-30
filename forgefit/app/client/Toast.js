"use client";
import { useEffect, useState } from "react";

export function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 1000, display: "flex", flexDirection: "column-reverse", gap: 8,
      alignItems: "center", pointerEvents: "none",
    }}>
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes toastOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(12px)}}
        .toast-item{animation:toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .toast-item.leaving{animation:toastOut 0.2s ease forwards}
      `}</style>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 2600);
    return () => clearTimeout(t);
  }, []);

  const colors = {
    success: { bg: "#0D1F0D", border: "#3A6A3A", text: "#7AE07A", icon: "✓" },
    error:   { bg: "#1A0808", border: "#5A1A1A", text: "#E07070", icon: "✕" },
    info:    { bg: "#0D0D1A", border: "#2A2A4A", text: "#8899E0", icon: "ℹ" },
    gold:    { bg: "#1A1208", border: "#5A4A1A", text: "#C9A84C", icon: "★" },
  };
  const c = colors[toast.type] || colors.success;

  return (
    <div className={`toast-item${leaving ? " leaving" : ""}`} style={{
      background: c.bg, border: `0.5px solid ${c.border}`, borderRadius: 8,
      padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
      fontFamily: "'Syne', sans-serif", fontSize: 12, color: "#F0EDE8",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)", pointerEvents: "all",
      maxWidth: 320, whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 14, color: c.text, flexShrink: 0 }}>{c.icon}</span>
      <span>{toast.message}</span>
    </div>
  );
}
