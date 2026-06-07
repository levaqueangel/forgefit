"use client";
import { useState, useEffect } from "react";

// ── Calcul local (miroir de l'API) ────────────────────────────────────────────
function calcScore(sommeil, stress, courbatures) {
  return Math.round(
    (sommeil / 5) * 40 +
    ((6 - stress) / 5) * 35 +
    ((6 - courbatures) / 5) * 25
  );
}

function getRecommandation(score) {
  if (score < 40) return { label: "Repos aujourd'hui", detail: "Marche légère ou étirements seulement.", couleur: "#E07070", emoji: "😴" };
  if (score < 55) return { label: "Séance légère", detail: "Cardio doux ou mobilité — évite l'intensité.", couleur: "#E8C87A", emoji: "🚶" };
  if (score < 70) return { label: "Séance normale", detail: "Suis ton programme sans te forcer.", couleur: "#C9A84C", emoji: "💪" };
  if (score < 85) return { label: "Bonne forme", detail: "Donne tout — tu es prêt(e) !", couleur: "#7AE07A", emoji: "🔥" };
  return { label: "Forme optimale", detail: "Séance intensive — repousse tes limites !", couleur: "#5DCAA5", emoji: "⚡" };
}

// ── Jauge circulaire animée ───────────────────────────────────────────────────
function ScoreGauge({ score, couleur }) {
  const size = 120;
  const r = 48;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const dash = circ * (animated / 100);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={60} cy={60} r={r} fill="none" stroke="#1A1A1A" strokeWidth={10} />
        <circle
          cx={60} cy={60} r={r} fill="none"
          stroke={couleur} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 6px ${couleur}60)` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: couleur, lineHeight: 1, fontFamily: "'Syne',sans-serif" }}>
          {animated}
        </div>
        <div style={{ fontSize: 9, color: "#555", letterSpacing: "1.5px" }}>/100</div>
      </div>
    </div>
  );
}

// ── Sélecteur de valeur 1-5 avec emoji + label ────────────────────────────────
function Question({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {options.map((opt, i) => {
          const val = i + 1;
          const active = value === val;
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              style={{
                flex: 1, padding: "10px 4px", flexDirection: "column",
                display: "flex", alignItems: "center", gap: 4,
                background: active ? `${opt.color}15` : "#111",
                border: `0.5px solid ${active ? opt.color : "#1A1A1A"}`,
                cursor: "pointer", transition: "all 0.15s",
                transform: active ? "scale(1.06)" : "scale(1)",
              }}
            >
              <span style={{ fontSize: 20 }}>{opt.emoji}</span>
              <span style={{ fontSize: 8, color: active ? opt.color : "#444", letterSpacing: "0.5px", lineHeight: 1.3, textAlign: "center", fontFamily: "'Syne',sans-serif" }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SOMMEIL_OPTS = [
  { emoji: "😩", label: "Très mauvais", color: "#E07070" },
  { emoji: "😴", label: "Mauvais", color: "#E8C87A" },
  { emoji: "😐", label: "Correct", color: "#C9A84C" },
  { emoji: "😊", label: "Bon", color: "#7AE07A" },
  { emoji: "🌟", label: "Excellent", color: "#5DCAA5" },
];
const STRESS_OPTS = [
  { emoji: "🤯", label: "Très stressé", color: "#E07070" },
  { emoji: "😤", label: "Stressé", color: "#E8C87A" },
  { emoji: "😐", label: "Neutre", color: "#C9A84C" },
  { emoji: "😌", label: "Calme", color: "#7AE07A" },
  { emoji: "😎", label: "Zen", color: "#5DCAA5" },
];
const COURB_OPTS = [
  { emoji: "🤕", label: "Très douloureux", color: "#E07070" },
  { emoji: "😣", label: "Courbaturé", color: "#E8C87A" },
  { emoji: "😐", label: "Un peu", color: "#C9A84C" },
  { emoji: "💪", label: "Légères", color: "#7AE07A" },
  { emoji: "✨", label: "Aucune", color: "#5DCAA5" },
];

// ── Historique 7 jours (mini barres) ─────────────────────────────────────────
function MiniHistorique({ historique }) {
  if (!historique?.length) return null;
  const last7 = historique.slice(-7);
  const days = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>
        7 derniers jours
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 40 }}>
        {last7.map((r, i) => {
          const rec = getRecommandation(r.score);
          const h = Math.max(6, Math.round((r.score / 100) * 36));
          const d = new Date(r.dateTs || Date.now());
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }} title={`${r.score}/100 — ${rec.label}`}>
              <div style={{
                width: "100%", height: h, background: rec.couleur,
                opacity: 0.7, borderRadius: "2px 2px 0 0",
                transition: "height 0.4s ease",
              }} />
              <div style={{ fontSize: 7, color: "#555" }}>{days[d.getDay() === 0 ? 6 : d.getDay() - 1]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function ReadinessScore({ user, clientData }) {
  const [phase, setPhase] = useState("loading"); // loading | cta | questions | result
  const [sommeil, setSommeil] = useState(3);
  const [stress, setStress] = useState(3);
  const [courbatures, setCourbatures] = useState(3);
  const [result, setResult] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [saving, setSaving] = useState(false);

  // Score preview temps réel pendant la saisie
  const previewScore = calcScore(sommeil, stress, courbatures);
  const previewRec = getRecommandation(previewScore);

  // ── Chargement du check-in du jour ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) { setPhase("cta"); return; }
    const load = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/readiness?uid=${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHistorique(data.historique || []);
          if (data.today) {
            setResult(data.today);
            setPhase("result");
          } else {
            setPhase("cta");
          }
        } else {
          setPhase("cta");
        }
      } catch {
        setPhase("cta");
      }
    };
    load();
  }, [user]);

  // ── Sauvegarde ──────────────────────────────────────────────────────────────
  const submit = async () => {
    if (saving || !user?.uid) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: user.uid, sommeil, stress, courbatures }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.entry);
        setHistorique(prev => {
          const today = new Date().toDateString();
          return [...prev.filter(r => r.date !== today), data.entry];
        });
        setPhase("result");
      }
    } catch {}
    setSaving(false);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const card = { padding: "16px 18px" }; // la card vient du parent

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 20, height: 20, border: "2px solid #1A1A1A", borderTop: "2px solid #C9A84C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 11, color: "#555" }}>Chargement de ton score du jour…</div>
      </div>
    );
  }

  // ── CTA (pas encore de check-in) ────────────────────────────────────────────
  if (phase === "cta") {
    return (
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
              Score de forme
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              3 questions · 15 secondes · recommandation personnalisée
            </div>
          </div>
          <button onClick={() => setPhase("questions")} style={{
            background: "linear-gradient(135deg,#C9A84C,#A67C2E)",
            border: "none", color: "#0A0A0A", fontFamily: "'Syne',sans-serif",
            fontWeight: 800, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
            padding: "10px 18px", cursor: "pointer", whiteSpace: "nowrap", transition: "opacity 0.2s",
          }}>
            ⚡ Check-in du matin
          </button>
        </div>
        <MiniHistorique historique={historique} />
      </div>
    );
  }

  // ── QUESTIONS ───────────────────────────────────────────────────────────────
  if (phase === "questions") {
    return (
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#555" }}>
            Comment tu te sens aujourd'hui ?
          </div>
          {/* Preview score en direct */}
          <div style={{
            fontSize: 14, fontWeight: 800, color: previewRec.couleur,
            fontFamily: "'Syne',sans-serif", transition: "color 0.3s",
          }}>
            {previewRec.emoji} {previewScore}
          </div>
        </div>

        <Question label="Qualité du sommeil" options={SOMMEIL_OPTS} value={sommeil} onChange={setSommeil} />
        <Question label="Niveau de stress" options={STRESS_OPTS} value={stress} onChange={setStress} />
        <Question label="Courbatures / douleurs" options={COURB_OPTS} value={courbatures} onChange={setCourbatures} />

        <button onClick={submit} disabled={saving} style={{
          background: saving ? "#1A1A1A" : `linear-gradient(135deg,${previewRec.couleur},${previewRec.couleur}AA)`,
          border: "none", color: "#0A0A0A",
          fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11,
          letterSpacing: "1.5px", textTransform: "uppercase",
          padding: "13px 0", cursor: saving ? "not-allowed" : "pointer",
          width: "100%", transition: "all 0.3s",
        }}>
          {saving ? "Enregistrement…" : `${previewRec.emoji} Mon score est ${previewScore}/100`}
        </button>
      </div>
    );
  }

  // ── RÉSULTAT ─────────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const rec = result.recommandation || getRecommandation(result.score);
    return (
      <div style={card}>
        <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 14 }}>
          Score de forme — Aujourd'hui
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Jauge */}
          <ScoreGauge score={result.score} couleur={rec.couleur} />

          {/* Recommandation */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: rec.couleur, fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>
              {rec.emoji} {rec.label}
            </div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7, marginBottom: 12 }}>
              {rec.detail}
            </div>

            {/* Détail des réponses */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Sommeil", val: result.sommeil, max: 5, color: "#7AE07A" },
                { label: "Stress", val: 6 - result.stress, max: 5, color: "#C9A84C" },
                { label: "Muscles", val: 6 - result.courbatures, max: 5, color: "#5DCAA5" },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#444", letterSpacing: "1px", marginBottom: 3, textTransform: "uppercase" }}>{item.label}</div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: j < item.val ? item.color : "#1A1A1A",
                        transition: `background ${0.1 * j}s ease`,
                      }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <MiniHistorique historique={historique} />

        {/* Refaire demain */}
        <div style={{ marginTop: 12, fontSize: 10, color: "#2A2A2A", textAlign: "center" }}>
          Reviens demain matin pour ton prochain check-in ·{" "}
          <button onClick={() => setPhase("questions")} style={{
            background: "transparent", border: "none", color: "#444",
            fontSize: 10, cursor: "pointer", textDecoration: "underline", fontFamily: "'Syne',sans-serif",
          }}>
            Modifier
          </button>
        </div>
      </div>
    );
  }

  return null;
}
