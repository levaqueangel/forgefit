"use client";
import { useState, useEffect, useRef } from "react";

// ── SVG Ring Progress ────────────────────────────────────────────────────────
function RingProgress({ pct, color, size = 64, stroke = 5, label, value }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1A1A1A" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - animated / 100)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text
          x={size/2} y={size/2 + 1}
          textAnchor="middle" dominantBaseline="middle"
          style={{ transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px` }}
          fill={color} fontSize={size * 0.22} fontWeight={800} fontFamily="'Syne',sans-serif"
        >{value}</text>
      </svg>
      {label && <div style={{ fontSize: 9, color: "#444", letterSpacing: "2px", textTransform: "uppercase" }}>{label}</div>}
    </div>
  );
}

// ── Note globale — grand arc ─────────────────────────────────────────────────
function GaugeNote({ note }) {
  const pct = note / 10;
  const color = note >= 8 ? "#7AE07A" : note >= 6 ? "#E8B000" : note >= 4 ? "#F5C832" : "#E07070";
  const W = 120, H = 70, r = 48, stroke = 10;
  const arcLen = Math.PI * r;
  const [filled, setFilled] = useState(0);
  useEffect(() => { const t = setTimeout(() => setFilled(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={W} height={H + 10} overflow="visible">
        <path d={`M${W/2-r},${H} A${r},${r} 0 0,1 ${W/2+r},${H}`} fill="none" stroke="#1A1A1A" strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={`M${W/2-r},${H} A${r},${r} 0 0,1 ${W/2+r},${H}`}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={arcLen * (1 - filled)}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text x={W/2} y={H - 4} textAnchor="middle" fill={color} fontSize={28} fontWeight={800} fontFamily="'Syne',sans-serif">{note}</text>
        <text x={W/2} y={H + 12} textAnchor="middle" fill="#333" fontSize={10} fontFamily="'Syne',sans-serif">/10</text>
      </svg>
    </div>
  );
}

// ── SVG Sparkline avancée ────────────────────────────────────────────────────
function SparkChart({ scores, height = 48 }) {
  if (!scores?.length) return <span style={{ fontSize: 11, color: "#333" }}>—</span>;
  const W = 140;
  const pad = 4;
  const max = 100;
  const pts = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1 || 1)) * (W - pad * 2);
    const y = height - pad - ((s / max) * (height - pad * 2));
    return `${x},${y}`;
  }).join(" ");
  const area = `M${pad},${height - pad} ` + scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1 || 1)) * (W - pad * 2);
    const y = height - pad - ((s / max) * (height - pad * 2));
    return `L${x},${y}`;
  }).join(" ") + ` L${W - pad},${height - pad} Z`;

  return (
    <svg width={W} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8B000" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#E8B000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkGrad)" />
      <polyline points={pts} fill="none" stroke="#E8B000" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {scores.map((s, i) => {
        const x = pad + (i / (scores.length - 1 || 1)) * (W - pad * 2);
        const y = height - pad - ((s / max) * (height - pad * 2));
        const c = s >= 70 ? "#7AE07A" : s >= 50 ? "#E8B000" : "#E07070";
        return <circle key={i} cx={x} cy={y} r={3} fill={c} stroke="#0D0D0D" strokeWidth={1.5} />;
      })}
    </svg>
  );
}

// ── Heatmap semaine ──────────────────────────────────────────────────────────
function WeekHeatmap({ seances, joursRealisees = [] }) {
  const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const seanceDays = (seances || []).map(s => s.jour?.substring(0, 3)?.toLowerCase());
  const realDays = (joursRealisees || []).map(j => j?.substring(0, 3)?.toLowerCase());
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {DAYS.map((d, i) => {
        const dayKey = d.toLowerCase();
        const planned = seanceDays.some(s => s?.startsWith(dayKey.substring(0, 2)));
        const done = realDays.some(r => r?.startsWith(dayKey.substring(0, 2)));
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 }}>
            <div style={{
              width: "100%", aspectRatio: "1/1",
              background: done ? "rgba(122,224,122,0.18)" : planned ? "rgba(232,176,0,0.1)" : "#0D0D0D",
              border: `0.5px solid ${done ? "rgba(122,224,122,0.4)" : planned ? "rgba(232,176,0,0.3)" : "#1A1A1A"}`,
              borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11,
            }}>
              {done ? "✓" : planned ? "·" : ""}
            </div>
            <span style={{ fontSize: 9, color: done ? "#7AE07A" : planned ? "#E8B000" : "#2A2A2A", letterSpacing: "0.5px", textTransform: "uppercase" }}>{d}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
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

  if (loading) return (
    <div style={{ padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "2px solid #1A1A1A", borderTop: "2px solid #E8B000", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 12, color: "#444", letterSpacing: "1px", textAlign: "center" }}>
        Génération du rapport…<br /><span style={{ fontSize: 10, color: "#2A2A2A" }}>Claude analyse la semaine</span>
      </div>
    </div>
  );

  if (error) return <div style={{ padding: 24, color: "#E07070", fontSize: 13 }}>{error}</div>;
  if (!rapport) return null;

  const { semaine, client, entrainement, nutrition, forme, objectifs, badges, narrative } = rapport;
  const E = entrainement, N = nutrition, F = forme, O = objectifs;

  const trainPct = E.seancesPrevues > 0 ? Math.round((E.seancesCount / E.seancesPrevues) * 100) : 0;
  const nutriPct = Math.round((N.jourNutrition / 7) * 100);
  const formePct = F.avgScore ?? 0;

  const trainColor = trainPct >= 100 ? "#7AE07A" : trainPct >= 60 ? "#E8B000" : "#E07070";
  const nutriColor = nutriPct >= 70 ? "#7AE07A" : nutriPct >= 40 ? "#E8B000" : "#E07070";
  const formeColor = formePct >= 70 ? "#7AE07A" : formePct >= 50 ? "#E8B000" : "#E07070";

  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "85vh", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#1A1A1A transparent" }}>
      <style>{`
        @keyframes rapportFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .rpt-section{animation:rapportFade 0.4s ease both}
      `}</style>

      {/* ── Hero header ── */}
      <div style={{
        padding: "22px 20px 18px",
        background: "linear-gradient(160deg, rgba(232,176,0,0.07) 0%, transparent 60%)",
        borderBottom: "0.5px solid #1A1A1A",
        position: "sticky", top: 0, backdropFilter: "blur(8px)",
        background: "rgba(10,10,10,0.95)", zIndex: 5,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 5 }}>
              Bilan hebdomadaire
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#F0EDE8", fontFamily: "'Syne',sans-serif", marginBottom: 3 }}>
              {isCoach ? client.nom : "Ma semaine"}
            </div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.5px" }}>
              {semaine.debut} → {semaine.fin}
            </div>
            {narrative?.titre && (
              <div style={{
                marginTop: 10, padding: "7px 10px",
                background: "rgba(232,176,0,0.06)", borderLeft: "2px solid rgba(232,176,0,0.4)",
                fontSize: 12, color: "#C49200", fontFamily: "'Cormorant Garamond',serif",
                fontStyle: "italic", lineHeight: 1.5, borderRadius: "0 4px 4px 0",
              }}>
                "{narrative.titre}"
              </div>
            )}
          </div>
          {narrative?.note_globale && (
            <GaugeNote note={narrative.note_globale} />
          )}
        </div>
      </div>

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* ── Intro IA ── */}
        {narrative?.intro && (
          <div className="rpt-section" style={{ fontSize: 14, color: "#666", lineHeight: 1.85, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", animationDelay: "0.05s" }}>
            {narrative.intro}
          </div>
        )}

        {/* ── 3 rings ── */}
        <div className="rpt-section" style={{ display: "flex", justifyContent: "space-around", padding: "6px 0", animationDelay: "0.1s" }}>
          <RingProgress pct={trainPct} color={trainColor} size={70} stroke={6}
            value={`${E.seancesCount}/${E.seancesPrevues}`} label="Séances" />
          <RingProgress pct={nutriPct} color={nutriColor} size={70} stroke={6}
            value={`${N.jourNutrition}j`} label="Nutrition" />
          <RingProgress pct={formePct} color={formeColor} size={70} stroke={6}
            value={F.avgScore !== null ? `${F.avgScore}` : "—"} label="Forme" />
        </div>

        {/* ── Heatmap semaine ── */}
        <div className="rpt-section" style={{ background: "#0D0D0D", border: "0.5px solid #1A1A1A", borderRadius: 8, padding: "14px 16px", animationDelay: "0.15s" }}>
          <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>📅 Semaine</div>
          <WeekHeatmap seances={E.seances} joursRealisees={E.seances.map(s => s.nom)} />
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#444" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(122,224,122,0.4)", border: "0.5px solid rgba(122,224,122,0.6)" }} />
              Réalisée
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#444" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(232,176,0,0.15)", border: "0.5px solid rgba(232,176,0,0.4)" }} />
              Prévue
            </div>
          </div>
        </div>

        {/* ── Entraînement ── */}
        <div className="rpt-section" style={{ background: "#0D0D0D", border: "0.5px solid #1A1A1A", borderRadius: 8, padding: "14px 16px", animationDelay: "0.2s" }}>
          <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 14 }}>🏋️ Entraînement</div>
          <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
            {[
              { label: "Durée totale", val: `${E.dureeTotal} min`, color: "#F0EDE8" },
              E.volumeTotal > 0 && { label: "Volume soulevé", val: `${E.volumeTotal} t`, color: "#E8B000" },
              E.avgDiff !== null && { label: "Difficulté", val: `${E.avgDiff}/5`, color: E.avgDiff >= 4 ? "#E07070" : E.avgDiff <= 2 ? "#7AE07A" : "#E8B000" },
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{ flex: 1, minWidth: 80, textAlign: "center", background: "#111", border: "0.5px solid #1A1A1A", borderRadius: 6, padding: "8px 6px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: item.color, fontFamily: "'Syne',sans-serif" }}>{item.val}</div>
                <div style={{ fontSize: 9, color: "#444", marginTop: 3, textTransform: "uppercase", letterSpacing: "1px" }}>{item.label}</div>
              </div>
            ))}
          </div>
          {E.seances.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {E.seances.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#111", borderRadius: 5, fontSize: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7AE07A", flexShrink: 0 }} />
                    <span style={{ color: "#888" }}>{s.nom}</span>
                  </div>
                  <span style={{ color: "#333", fontSize: 10 }}>{s.duree} min</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Nutrition ── */}
        <div className="rpt-section" style={{ background: "#0D0D0D", border: "0.5px solid #1A1A1A", borderRadius: 8, padding: "14px 16px", animationDelay: "0.25s" }}>
          <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 14 }}>🍽️ Nutrition</div>
          <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              { label: "Jours loggés", val: `${N.jourNutrition}/7`, color: nutriColor },
              N.avgCalo > 0 && { label: "Calories moy.", val: `${N.avgCalo} kcal`, color: "#F5C832" },
              N.avgProt > 0 && { label: "Protéines moy.", val: `${N.avgProt}g`, color: "#7AE07A" },
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{ flex: 1, minWidth: 80, textAlign: "center", background: "#111", border: "0.5px solid #1A1A1A", borderRadius: 6, padding: "8px 6px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: item.color, fontFamily: "'Syne',sans-serif" }}>{item.val}</div>
                <div style={{ fontSize: 9, color: "#444", marginTop: 3, textTransform: "uppercase", letterSpacing: "1px" }}>{item.label}</div>
              </div>
            ))}
          </div>
          {/* Barres macro vs cible */}
          {N.caloCible > 0 && (
            <NutritionBar label="Calories" val={N.avgCalo} max={N.caloCible} color="#F5C832" suffix=" kcal" />
          )}
          {N.protCible > 0 && (
            <NutritionBar label="Protéines" val={N.avgProt} max={N.protCible} color="#7AE07A" suffix="g" />
          )}
        </div>

        {/* ── Forme + sparkline ── */}
        {F.readCount > 0 && (
          <div className="rpt-section" style={{ background: "#0D0D0D", border: "0.5px solid #1A1A1A", borderRadius: 8, padding: "14px 16px", animationDelay: "0.3s" }}>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 14 }}>⚡ Forme quotidienne</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: formeColor, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
                  {F.avgScore}<span style={{ fontSize: 12, color: "#333", fontWeight: 400 }}>/100</span>
                </div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 4, textTransform: "uppercase", letterSpacing: "1px" }}>Score moyen</div>
                <div style={{ fontSize: 10, color: "#2A2A2A", marginTop: 2 }}>{F.readCount} check-in{F.readCount > 1 ? "s" : ""}</div>
              </div>
              <SparkChart scores={F.scoresTrend} height={52} />
            </div>
          </div>
        )}

        {/* ── Objectifs ── */}
        {O.total > 0 && (
          <div className="rpt-section" style={{ background: "#0D0D0D", border: "0.5px solid #1A1A1A", borderRadius: 8, padding: "14px 16px", animationDelay: "0.32s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555" }}>🎯 Objectifs hebdo</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: O.coches === O.total ? "#7AE07A" : "#E8B000" }}>{O.coches}/{O.total}</div>
                <div style={{ height: 4, width: 60, background: "#1A1A1A", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(O.coches / O.total) * 100}%`, background: O.coches === O.total ? "#7AE07A" : "#E8B000", borderRadius: 4, transition: "width 0.8s ease" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {O.liste.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: o.coche ? "rgba(122,224,122,0.04)" : "transparent", borderRadius: 5 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    background: o.coche ? "rgba(122,224,122,0.15)" : "transparent",
                    border: `1.5px solid ${o.coche ? "#5ABA5A" : "#2A2A2A"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: "#7AE07A",
                  }}>{o.coche && "✓"}</div>
                  <span style={{ fontSize: 12, color: o.coche ? "#555" : "#888", textDecoration: o.coche ? "line-through" : "none" }}>
                    {o.texte}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <div className="rpt-section" style={{ animationDelay: "0.35s" }}>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#E8B000", marginBottom: 10 }}>🏅 Badges débloqués</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {badges.map((b, i) => (
                <div key={i} style={{
                  background: "rgba(232,176,0,0.06)", border: "0.5px solid rgba(232,176,0,0.3)",
                  borderRadius: 20, padding: "6px 14px",
                  fontSize: 11, color: "#E8B000", fontFamily: "'Syne',sans-serif",
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: "0 0 12px rgba(232,176,0,0.08)",
                }}>
                  🎖️ {b.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Points forts / attention / conseil ── */}
        {narrative && (
          <div className="rpt-section" style={{ display: "flex", flexDirection: "column", gap: 10, animationDelay: "0.4s" }}>
            {narrative.points_forts?.length > 0 && (
              <div style={{ background: "rgba(122,224,122,0.04)", border: "0.5px solid rgba(122,224,122,0.18)", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#7AE07A", marginBottom: 10 }}>Points forts</div>
                {narrative.points_forts.map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "flex", gap: 8, lineHeight: 1.6 }}>
                    <span style={{ color: "#7AE07A", flexShrink: 0 }}>✓</span> {p}
                  </div>
                ))}
              </div>
            )}
            {narrative.points_attention?.length > 0 && (
              <div style={{ background: "rgba(245,200,50,0.04)", border: "0.5px solid rgba(245,200,50,0.18)", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#F5C832", marginBottom: 10 }}>Points d'attention</div>
                {narrative.points_attention.map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "flex", gap: 8, lineHeight: 1.6 }}>
                    <span style={{ color: "#F5C832", flexShrink: 0 }}>→</span> {p}
                  </div>
                ))}
              </div>
            )}
            {narrative.conseil_semaine && (
              <div style={{ background: "rgba(232,176,0,0.06)", border: "0.5px solid rgba(232,176,0,0.25)", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#E8B000", marginBottom: 8 }}>💡 Conseil semaine prochaine</div>
                <div style={{ fontSize: 14, color: "#888", lineHeight: 1.8, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
                  {narrative.conseil_semaine}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Streak ── */}
        <div className="rpt-section" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "10px 0", animationDelay: "0.45s" }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#E8B000", fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
              {client.streak} jour{client.streak > 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 2 }}>Streak actuel</div>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} style={{
            background: "transparent", border: "0.5px solid #1A1A1A", color: "#444",
            fontFamily: "'Syne',sans-serif", fontSize: 10, letterSpacing: "2px",
            textTransform: "uppercase", padding: "12px 0", cursor: "pointer", width: "100%",
            borderRadius: 6, transition: "all 0.2s",
          }}>
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}

// ── Barre nutrition ──────────────────────────────────────────────────────────
function NutritionBar({ label, val, max, color, suffix = "" }) {
  const pct = max > 0 ? Math.min(110, Math.round((val / max) * 100)) : 0;
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(pct), 200); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.5px" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>
          {val}{suffix} <span style={{ color: "#333", fontWeight: 400, fontSize: 10 }}>/ {max}{suffix}</span>
        </span>
      </div>
      <div style={{ height: 5, background: "#1A1A1A", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%", width: `${animated}%`, borderRadius: 4,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}
