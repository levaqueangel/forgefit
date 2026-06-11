"use client";
import { useState, useEffect } from "react";

// ── Barre de stat horizontale ─────────────────────────────────────────────────
function StatBar({ label, val, max, color, suffix = "" }) {
  const pct = max > 0 ? Math.min(100, Math.round((val / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "#666", letterSpacing: "0.5px" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>
          {val}{suffix} <span style={{ color: "#333", fontWeight: 400 }}>/ {max}{suffix}</span>
        </span>
      </div>
      <div style={{ height: 5, background: "#1A1A1A", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

// ── Note globale circulaire ────────────────────────────────────────────────────
function NoteGlobale({ note }) {
  const color = note >= 8 ? "#7AE07A" : note >= 6 ? "#E8B000" : note >= 4 ? "#F5C832" : "#E07070";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 42, fontWeight: 800, color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{note}</div>
      <div style={{ fontSize: 9, color: "#444", letterSpacing: "2px", textTransform: "uppercase", marginTop: 2 }}>/10</div>
    </div>
  );
}

// ── Mini sparkline scores de forme ────────────────────────────────────────────
function Sparkline({ scores }) {
  if (!scores?.length) return <span style={{ fontSize: 11, color: "#333" }}>—</span>;
  const max = Math.max(...scores, 1);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 28 }}>
      {scores.map((s, i) => {
        const h = Math.max(4, Math.round((s / 100) * 28));
        const c = s >= 70 ? "#7AE07A" : s >= 50 ? "#E8B000" : "#E07070";
        return <div key={i} style={{ width: 6, height: h, background: c, borderRadius: "2px 2px 0 0", opacity: 0.8 }} />;
      })}
    </div>
  );
}

// ── Composant rapport ─────────────────────────────────────────────────────────
export function RapportHebdo({ clientId, user, isCoach = false, onClose }) {
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientId) return;
    const load = async () => {
      setLoading(true); setError("");
      try {
        const token = user?.getIdToken ? await user.getIdToken() : null;
        const res = await fetch(`/api/rapport?clientId=${clientId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok) setRapport(data);
        else setError(data.error || "Erreur lors du chargement.");
      } catch {
        setError("Erreur de connexion.");
      }
      setLoading(false);
    };
    load();
  }, [clientId]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: 32, height: 32, border: "2px solid #1A1A1A", borderTop: "2px solid #E8B000", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 12, color: "#555", letterSpacing: "1px" }}>
        Génération du rapport en cours…<br />
        <span style={{ fontSize: 10, color: "#333" }}>Claude analyse la semaine</span>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, color: "#E07070", fontSize: 13 }}>{error}</div>
  );

  if (!rapport) return null;

  const { semaine, client, entrainement, nutrition, forme, objectifs, badges, narrative } = rapport;
  const E = entrainement, N = nutrition, F = forme, O = objectifs;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: "80vh", overflowY: "auto" }}>

      {/* ── Header ── */}
      <div style={{ padding: "18px 20px 14px", borderBottom: "0.5px solid #1A1A1A", position: "sticky", top: 0, background: "#0D0D0D", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
              Bilan hebdomadaire
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#F0EDE8", fontFamily: "'Syne',sans-serif" }}>
              {isCoach ? client.nom : "Ma semaine"}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
              {semaine.debut} → {semaine.fin}
            </div>
          </div>
          {narrative?.note_globale && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <NoteGlobale note={narrative.note_globale} />
              <div style={{ fontSize: 8, color: "#333", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>Semaine</div>
            </div>
          )}
        </div>

        {/* Titre IA */}
        {narrative?.titre && (
          <div style={{
            marginTop: 10, padding: "8px 12px",
            background: "rgba(232,176,0,0.06)", border: "0.5px solid rgba(232,176,0,0.2)",
            fontSize: 12, color: "#E8B000", fontFamily: "'Cormorant Garamond',serif",
            fontStyle: "italic", lineHeight: 1.5,
          }}>
            "{narrative.titre}"
          </div>
        )}
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Résumé IA ── */}
        {narrative?.intro && (
          <div style={{ fontSize: 13, color: "#888", lineHeight: 1.8, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
            {narrative.intro}
          </div>
        )}

        {/* ── Grille stats rapides ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { label: "Séances", val: `${E.seancesCount}/${E.seancesPrevues}`, sub: `${E.dureeTotal} min`, color: E.seancesCount >= E.seancesPrevues ? "#7AE07A" : "#E8B000", icon: "🏋️" },
            { label: "Nutrition", val: `${N.jourNutrition}j/7`, sub: `~${N.avgCalo} kcal/j`, color: N.jourNutrition >= 5 ? "#7AE07A" : N.jourNutrition >= 3 ? "#E8B000" : "#E07070", icon: "🍽️" },
            { label: "Forme", val: F.avgScore !== null ? `${F.avgScore}/100` : "—", sub: `${F.readCount} check-ins`, color: F.avgScore >= 70 ? "#7AE07A" : F.avgScore >= 50 ? "#E8B000" : "#E07070", icon: "⚡" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#111", border: "0.5px solid #1A1A1A", padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: "#444", marginTop: 3 }}>{s.sub}</div>
              <div style={{ fontSize: 8, color: "#333", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Entraînement détaillé ── */}
        <div style={{ background: "#111", border: "0.5px solid #1A1A1A", padding: "14px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>🏋️ Entraînement</div>
          <StatBar label="Séances réalisées" val={E.seancesCount} max={E.seancesPrevues} color="#7AE07A" />
          {E.volumeTotal > 0 && (
            <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>
              Volume total : <span style={{ color: "#E8B000", fontWeight: 700 }}>{E.volumeTotal} t</span> soulevées
            </div>
          )}
          {E.avgDiff !== null && (
            <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
              Difficulté perçue : <span style={{ color: E.avgDiff >= 4 ? "#E07070" : E.avgDiff <= 2 ? "#7AE07A" : "#E8B000", fontWeight: 700 }}>{E.avgDiff}/5</span>
            </div>
          )}
          {E.seances.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              {E.seances.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555" }}>
                  <span>✓ {s.nom}</span>
                  <span style={{ color: "#333" }}>{s.duree} min</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Nutrition ── */}
        <div style={{ background: "#111", border: "0.5px solid #1A1A1A", padding: "14px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>🍽️ Nutrition</div>
          <StatBar label="Jours loggés" val={N.jourNutrition} max={7} color="#E8B000" suffix="j" />
          {N.caloCible > 0 && <StatBar label="Calories moyennes/jour" val={N.avgCalo} max={N.caloCible} color="#F5C832" suffix=" kcal" />}
          {N.protCible > 0 && <StatBar label="Protéines moyennes/jour" val={N.avgProt} max={N.protCible} color="#7AE07A" suffix="g" />}
        </div>

        {/* ── Score de forme ── */}
        {F.readCount > 0 && (
          <div style={{ background: "#111", border: "0.5px solid #1A1A1A", padding: "14px 16px" }}>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>⚡ Forme quotidienne</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: F.avgScore >= 70 ? "#7AE07A" : F.avgScore >= 50 ? "#E8B000" : "#E07070", fontFamily: "'Syne',sans-serif" }}>
                  {F.avgScore}<span style={{ fontSize: 12, color: "#444" }}>/100</span>
                </div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>Score moyen semaine</div>
              </div>
              <Sparkline scores={F.scoresTrend} />
            </div>
          </div>
        )}

        {/* ── Objectifs ── */}
        {O.total > 0 && (
          <div style={{ background: "#111", border: "0.5px solid #1A1A1A", padding: "14px 16px" }}>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>
              🎯 Objectifs hebdo
              <span style={{ marginLeft: 8, color: O.coches === O.total ? "#7AE07A" : "#E8B000" }}>
                {O.coches}/{O.total}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {O.liste.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    background: o.coche ? "#1A3A1A" : "transparent",
                    border: `1.5px solid ${o.coche ? "#5ABA5A" : "#2A2A2A"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: "#7AE07A",
                  }}>
                    {o.coche && "✓"}
                  </div>
                  <span style={{ color: o.coche ? "#444" : "#888", textDecoration: o.coche ? "line-through" : "none" }}>
                    {o.texte}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Badges semaine ── */}
        {badges.length > 0 && (
          <div style={{ background: "rgba(232,176,0,0.04)", border: "0.5px solid rgba(232,176,0,0.2)", padding: "12px 16px" }}>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#E8B000", marginBottom: 8 }}>
              🏅 Badges débloqués cette semaine
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {badges.map((b, i) => (
                <div key={i} style={{ fontSize: 12, color: "#F0EDE8" }}>🎖️ {b.label}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Points forts & attention (IA) ── */}
        {narrative && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {narrative.points_forts?.length > 0 && (
              <div style={{ background: "rgba(122,224,122,0.04)", border: "0.5px solid rgba(122,224,122,0.2)", padding: "12px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#7AE07A", marginBottom: 8 }}>Points forts</div>
                {narrative.points_forts.map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#888", marginBottom: 4, display: "flex", gap: 6 }}>
                    <span style={{ color: "#7AE07A", flexShrink: 0 }}>✓</span> {p}
                  </div>
                ))}
              </div>
            )}
            {narrative.points_attention?.length > 0 && (
              <div style={{ background: "rgba(232,200,122,0.04)", border: "0.5px solid rgba(232,200,122,0.2)", padding: "12px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#F5C832", marginBottom: 8 }}>Points d'attention</div>
                {narrative.points_attention.map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#888", marginBottom: 4, display: "flex", gap: 6 }}>
                    <span style={{ color: "#F5C832", flexShrink: 0 }}>→</span> {p}
                  </div>
                ))}
              </div>
            )}
            {narrative.conseil_semaine && (
              <div style={{ background: "rgba(232,176,0,0.06)", border: "0.5px solid rgba(232,176,0,0.25)", padding: "12px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#E8B000", marginBottom: 6 }}>
                  💡 Conseil pour la semaine prochaine
                </div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
                  {narrative.conseil_semaine}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Streak ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 0" }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <span style={{ fontSize: 13, color: "#555" }}>
            Streak actuel : <span style={{ color: "#E8B000", fontWeight: 700 }}>{client.streak} jour{client.streak > 1 ? "s" : ""}</span>
          </span>
        </div>

        {onClose && (
          <button onClick={onClose} style={{
            background: "transparent", border: "0.5px solid #2A2A2A", color: "#555",
            fontFamily: "'Syne',sans-serif", fontSize: 10, letterSpacing: "1.5px",
            textTransform: "uppercase", padding: "12px 0", cursor: "pointer", width: "100%",
          }}>
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}
