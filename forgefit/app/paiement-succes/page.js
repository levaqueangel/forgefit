"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PLAN_DETAILS = {
  starter: {
    label: "Starter",
    color: "#5DCAA5",
    message: "Angel va analyser ton bilan et te livrer ton programme personnalisé par email dans les 48 heures ouvrées.",
    next: "Vérifie ta boîte mail — un récapitulatif de commande vient d'être envoyé.",
    showClient: false,
  },
  forge: {
    label: "Forge",
    color: "#E8B000",
    message: "Ton accès à l'espace client privé sera activé par Angel dans les 48 heures ouvrées.",
    next: "Tu recevras un email avec tes identifiants de connexion dès que ton espace est prêt.",
    showClient: true,
  },
  elite: {
    label: "Elite",
    color: "#7AE07A",
    message: "Ton accès complet à l'espace client Elite sera activé par Angel dans les 48 heures ouvrées.",
    next: "Tu recevras un email avec tes identifiants. La messagerie directe avec le coach sera disponible immédiatement.",
    showClient: true,
  },
};

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan") || "starter";
  const details = PLAN_DETAILS[plan] || PLAN_DETAILS.starter;

  return (
    <div style={{
      background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh",
      fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "2rem",
    }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>

        {/* Icône succès */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `${details.color}15`,
          border: `1.5px solid ${details.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 2rem", fontSize: 36,
        }}>
          ✓
        </div>

        {/* Titre */}
        <div style={{ fontSize: 11, letterSpacing: "4px", textTransform: "uppercase", color: details.color, marginBottom: "1rem" }}>
          — Paiement confirmé
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, lineHeight: 1.2, marginBottom: "1.5rem" }}>
          Bienvenue dans la famille<br />
          <span style={{ color: details.color }}>APXFIT</span>NESS
        </h1>

        {/* Plan */}
        <div style={{
          display: "inline-block", background: `${details.color}15`,
          border: `0.5px solid ${details.color}`,
          padding: "6px 18px", borderRadius: 20, marginBottom: "2rem",
        }}>
          <span style={{ fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", color: details.color }}>
            Plan {details.label}
          </span>
        </div>

        {/* Message principal */}
        <div style={{
          background: "#111", border: "0.5px solid #1E1E1E",
          borderRadius: 4, padding: "24px", marginBottom: "1.5rem", textAlign: "left",
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#F0EDE8", marginBottom: 10 }}>
            📬 Quelle est la suite ?
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: "#888", lineHeight: 1.7, margin: "0 0 10px" }}>
            {details.message}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: "#555", lineHeight: 1.7, margin: 0 }}>
            {details.next}
          </p>
        </div>

        {/* Garantie */}
        <div style={{
          fontSize: 13, color: "#555", lineHeight: 1.6,
          background: "#0D0D0D", border: "0.5px solid #1A1A1A",
          borderRadius: 4, padding: "14px 20px", marginBottom: "2rem",
        }}>
          🛡️ <strong style={{ color: "#888" }}>Garantie 14 jours.</strong> Si tu n'es pas satisfait, on te rembourse sans question.
        </div>

        {/* Boutons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {details.showClient && (
            <button
              onClick={() => router.push("/client")}
              style={{
                background: `linear-gradient(135deg,${details.color},${details.color}aa)`,
                border: "none", color: "#0A0A0A",
                padding: "13px 28px", fontFamily: "'Syne',sans-serif",
                fontSize: 11, fontWeight: 700, letterSpacing: "3px",
                textTransform: "uppercase", cursor: "pointer", borderRadius: 2,
              }}
            >
              Mon espace client →
            </button>
          )}
          <button
            onClick={() => router.push("/")}
            style={{
              background: "transparent", border: "0.5px solid #2A2A2A",
              color: "#555", padding: "13px 28px", fontFamily: "'Syne',sans-serif",
              fontSize: 11, letterSpacing: "3px", textTransform: "uppercase",
              cursor: "pointer", borderRadius: 2,
            }}
          >
            Retour à l'accueil
          </button>
        </div>

        {/* Logo */}
        <div style={{ marginTop: "3rem", fontSize: 16, fontWeight: 800, letterSpacing: 5, opacity: 0.3 }}>
          APXFIT<span style={{ color: "#E8B000" }}>NESS</span>
        </div>
      </div>
    </div>
  );
}

export default function PaiementSuccesPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#E8B000", letterSpacing: "3px", fontSize: 12, textTransform: "uppercase" }}>Chargement...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
