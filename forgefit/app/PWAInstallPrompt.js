"use client";
import { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Ne pas montrer si déjà installé (mode standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    if (ios) {
      // iOS : pas d'événement beforeinstallprompt, montrer manuellement après 30s
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        const t = setTimeout(() => { setIsIOS(true); setShow(true); }, 30_000);
        return () => clearTimeout(t);
      }
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setDeferredPrompt(e);
        setShow(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, width: "min(90vw, 380px)",
      background: "#111", border: "0.5px solid rgba(232,176,0,0.35)",
      borderRadius: 16, padding: "14px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(135deg,#E8B000,#C49200)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>
        💪
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: "#F0EDE8",
          fontFamily: "'Syne',sans-serif", letterSpacing: "0.5px",
        }}>
          Installer APXFITNESS
        </div>
        {isIOS ? (
          <div style={{ fontSize: 10, color: "#888", marginTop: 2, lineHeight: 1.4 }}>
            Appuie sur <span style={{ color: "#E8B000" }}>⎋ Partager</span> puis{" "}
            <span style={{ color: "#E8B000" }}>«Sur l'écran d'accueil»</span>
          </div>
        ) : (
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            Accès rapide depuis ton écran d'accueil
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {!isIOS && (
          <button onClick={handleInstall} style={{
            background: "linear-gradient(135deg,#E8B000,#C49200)",
            border: "none", color: "#0A0A0A",
            fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700,
            letterSpacing: "1px", textTransform: "uppercase",
            padding: "7px 12px", borderRadius: 8, cursor: "pointer",
          }}>
            Installer
          </button>
        )}
        <button onClick={handleDismiss} style={{
          background: "transparent", border: "0.5px solid #242424",
          color: "#555", width: 28, height: 28, borderRadius: 8,
          cursor: "pointer", fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          ✕
        </button>
      </div>
    </div>
  );
}
