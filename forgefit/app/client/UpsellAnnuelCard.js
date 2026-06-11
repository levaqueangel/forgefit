"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SAVINGS = {
  starter: { monthly: 18.99, annual: 189.90 },
  forge:   { monthly: 38.99, annual: 389.90 },
  elite:   { monthly: 68.99, annual: 689.90 },
};

const DISMISS_KEY = "upsell-annual-dismissed";
const DISMISS_DURATION_DAYS = 30;

const STYLES = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1; }
  }
  @keyframes upsell-in {
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes upsell-out {
    from { opacity: 1; transform: translateY(0) scale(1); max-height: 300px; margin-bottom: 0; }
    to   { opacity: 0; transform: translateY(-8px) scale(0.97); max-height: 0; margin-bottom: -18px; }
  }
  @keyframes badge-pop {
    0%   { transform: scale(0.7) rotate(-6deg); opacity: 0; }
    60%  { transform: scale(1.1) rotate(2deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
`;

function AnimatedSaving({ value }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const duration = 900;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(ease * value * 100) / 100);
      if (p < 1) requestAnimationFrame(step);
    }
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toFixed(2).replace(".", ",")}€</>;
}

export function UpsellAnnuelCard({ user, clientData }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [loading, setLoading] = useState(false);

  const plan = (clientData?.plan || "forge").toLowerCase();
  const billing = clientData?.billing;
  const prices = SAVINGS[plan] || SAVINGS.forge;
  const savings = prices.monthly * 12 - prices.annual;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  useEffect(() => {
    // Ne montrer que si abonnement mensuel actif
    if (billing !== "monthly") return;
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) {
      const { until } = JSON.parse(raw);
      if (Date.now() < until) return;
    }
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [billing]);

  const handleDismiss = () => {
    setDismissing(true);
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ until: Date.now() + DISMISS_DURATION_DAYS * 86400000 }));
    setTimeout(() => setVisible(false), 400);
  };

  const handleUpgrade = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, billing: "annual" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  if (!visible || billing !== "monthly") return null;

  return (
    <>
      <style>{STYLES}</style>
      <div style={{
        animation: dismissing ? "upsell-out 0.35s ease forwards" : "upsell-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        marginBottom: dismissing ? 0 : undefined,
        overflow: "hidden",
      }}>
        <div style={{
          position: "relative", borderRadius: 16, overflow: "hidden",
          border: "1px solid rgba(201,168,76,0.3)",
          background: "linear-gradient(135deg, #0D0D0D 0%, #111008 100%)",
        }}>
          {/* Glow border top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, #C9A84C, #E8C87A, #C9A84C, transparent)",
            animation: "glow-pulse 2.5s ease infinite",
          }} />

          {/* Shimmer arrière-plan */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.04) 50%, transparent 60%)",
            backgroundSize: "800px 100%",
            animation: "shimmer 3s ease infinite",
          }} />

          <div style={{ padding: "16px 18px 18px", position: "relative" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: "2px",
                    textTransform: "uppercase", color: "#0A0A0A",
                    background: "linear-gradient(135deg,#C9A84C,#E8C87A)",
                    padding: "3px 8px", borderRadius: 20,
                    animation: "badge-pop 0.5s 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
                    display: "inline-block",
                  }}>
                    2 mois offerts
                  </span>
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 800, color: "#F0EDE8",
                  fontFamily: "'Syne',sans-serif", lineHeight: 1.25,
                }}>
                  Passe à l'annuel,{" "}
                  <span style={{ color: "#C9A84C" }}>
                    économise <AnimatedSaving value={savings} />
                  </span>
                </div>
              </div>

              <button onClick={handleDismiss} style={{
                background: "transparent", border: "none",
                color: "#333", cursor: "pointer", fontSize: 16,
                lineHeight: 1, padding: "2px 4px", flexShrink: 0,
                transition: "color 0.15s",
              }}
                onMouseEnter={e => e.target.style.color = "#666"}
                onMouseLeave={e => e.target.style.color = "#333"}
              >
                ✕
              </button>
            </div>

            {/* Comparaison mensuel vs annuel */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr auto 1fr",
              gap: 8, alignItems: "center", marginBottom: 16,
            }}>
              {/* Mensuel */}
              <div style={{
                background: "#0A0A0A", borderRadius: 10, padding: "10px 12px",
                border: "0.5px solid #1A1A1A",
              }}>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4, fontFamily: "'Syne',sans-serif" }}>
                  Mensuel actuel
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#666", fontFamily: "'Syne',sans-serif" }}>
                  {prices.monthly.toFixed(2).replace(".", ",")}€
                  <span style={{ fontSize: 10, color: "#333", fontWeight: 400 }}>/mois</span>
                </div>
                <div style={{ fontSize: 9, color: "#333", marginTop: 2 }}>
                  soit {(prices.monthly * 12).toFixed(2).replace(".", ",")}€/an
                </div>
              </div>

              {/* Flèche */}
              <div style={{
                fontSize: 16, color: "#C9A84C",
                animation: "shimmer 2s ease infinite",
              }}>→</div>

              {/* Annuel */}
              <div style={{
                background: "rgba(201,168,76,0.07)", borderRadius: 10, padding: "10px 12px",
                border: "1px solid rgba(201,168,76,0.25)",
                position: "relative",
              }}>
                <div style={{ fontSize: 9, color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4, fontFamily: "'Syne',sans-serif" }}>
                  Plan {planLabel} annuel
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#C9A84C", fontFamily: "'Syne',sans-serif" }}>
                  {(prices.annual / 12).toFixed(2).replace(".", ",")}€
                  <span style={{ fontSize: 10, color: "#A67C2E", fontWeight: 400 }}>/mois</span>
                </div>
                <div style={{ fontSize: 9, color: "#A67C2E", marginTop: 2 }}>
                  facturé {prices.annual.toFixed(2).replace(".", ",")}€/an
                </div>
              </div>
            </div>

            {/* Avantages */}
            <div style={{
              display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap",
            }}>
              {[
                "✓  Accès identique, même plan",
                "✓  Annulable à tout moment",
                `✓  ${savings.toFixed(2).replace(".", ",")}€ économisés`,
              ].map((item, i) => (
                <span key={i} style={{
                  fontSize: 10, color: "#888",
                  fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
                }}>
                  {item}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading
                  ? "#111"
                  : "linear-gradient(135deg,#C9A84C 0%,#E8C87A 50%,#C9A84C 100%)",
                backgroundSize: "200% auto",
                border: "none", borderRadius: 10,
                color: loading ? "#444" : "#0A0A0A",
                fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 800,
                letterSpacing: "2px", textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                boxShadow: loading ? "none" : "0 4px 20px rgba(201,168,76,0.25)",
              }}
              onMouseEnter={e => { if (!loading) e.target.style.backgroundPosition = "right center"; }}
              onMouseLeave={e => { if (!loading) e.target.style.backgroundPosition = "left center"; }}
            >
              {loading ? "Redirection…" : `Passer à l'annuel — économiser ${savings.toFixed(2).replace(".", ",")}€ →`}
            </button>

            <div style={{ fontSize: 9, color: "#333", textAlign: "center", marginTop: 8, fontFamily: "'Cormorant Garamond',serif" }}>
              Nouveau cycle de facturation annuel · Stripe sécurisé
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
