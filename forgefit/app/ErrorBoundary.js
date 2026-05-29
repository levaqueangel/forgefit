"use client";
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", fontFamily: "'Syne', sans-serif", textAlign: "center", padding: "2rem"
        }}>
          <div style={{
            fontSize: "clamp(60px,12vw,100px)", fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 600, background: "linear-gradient(90deg,#C9A84C,#E8C87A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1
          }}>Oops</div>
          <div style={{ height: 1, width: 60, background: "linear-gradient(90deg,transparent,#C9A84C,transparent)", margin: "1rem auto" }} />
          <div style={{ fontSize: 11, letterSpacing: "4px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "0.75rem" }}>
            — Erreur inattendue
          </div>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#555",
            lineHeight: 1.7, maxWidth: 400, marginBottom: "2rem"
          }}>
            Une erreur s'est produite. Rafraîchis la page pour continuer.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
            style={{
              background: "linear-gradient(135deg,#C9A84C,#A67C2E)", border: "none",
              color: "#0A0A0A", padding: "13px 32px", fontFamily: "'Syne', sans-serif",
              fontSize: 12, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer"
            }}>
            Retour à l'accueil →
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
