"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ProgressPhotos } from "./ProgressPhotos";

// ── Animations CSS ────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes drawLine {
    from { stroke-dashoffset: 1000; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes countUp {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes shimmerSlide {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  .prog-card {
    background: #0D0D0D;
    border: 0.5px solid #1A1A1A;
    border-radius: 14px;
    padding: 16px 18px;
    animation: fadeUp 0.45s ease both;
  }
  .prog-stat-val {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 24px;
    color: #F0EDE8;
    line-height: 1;
  }
  .prog-stat-label {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #444;
    margin-top: 4px;
  }
  .seg-btn {
    flex: 1; padding: 6px; border: 0.5px solid #1E1E1E;
    background: transparent; color: #444; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 9px;
    font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    transition: all 0.15s; border-radius: 6px;
  }
  .seg-btn.active {
    background: rgba(232,176,0,0.1);
    border-color: rgba(232,176,0,0.4);
    color: #E8B000;
  }
  .tooltip-dot:hover { r: 5; }
`;

// ── Graphique poids interactif ────────────────────────────────────────────────
function WeightChart({ entries, targetWeight, periode }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  const filtered = entries
    .filter(e => e.poids)
    .filter(e => {
      if (!periode) return true;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - periode);
      return new Date(e.date) >= cutoff;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (filtered.length < 2) return (
    <div style={{ textAlign: "center", padding: "32px 0", color: "#444",
      fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic" }}>
      Saisis au moins 2 mesures pour voir le graphique.
    </div>
  );

  const vals = filtered.map(e => parseFloat(e.poids));
  const W = 340, H = 130, PX = 16, PY = 16;
  const target = targetWeight ? parseFloat(targetWeight) : null;
  const allVals = target ? [...vals, target] : vals;
  const minV = Math.min(...allVals) - 1.5;
  const maxV = Math.max(...allVals) + 1.5;
  const range = maxV - minV || 1;

  const toX = i => PX + (i / (filtered.length - 1)) * (W - PX * 2);
  const toY = v => PY + (H - PY * 2) - ((v - minV) / range) * (H - PY * 2);

  const pts = vals.map((v, i) => [toX(i), toY(v)]);

  // Courbe de Bézier lissée
  const pathD = pts.map((p, i) => {
    if (i === 0) return `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const prev = pts[i - 1];
    const cx = ((prev[0] + p[0]) / 2).toFixed(1);
    return `C ${cx} ${prev[1].toFixed(1)} ${cx} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }).join(" ");

  const areaD = `${pathD} L ${pts[pts.length-1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;
  const total = vals[vals.length-1] - vals[0];
  const trendColor = total < -0.1 ? "#7AE07A" : total > 0.1 ? "#E07070" : "#E8B000";
  const trendLabel = total < -0.1 ? `↓ ${Math.abs(total).toFixed(1)} kg` : total > 0.1 ? `↑ ${total.toFixed(1)} kg` : "→ stable";

  // Lignes de grille
  const gridLines = [0.25, 0.5, 0.75].map(frac => {
    const v = minV + frac * range;
    const y = toY(v).toFixed(1);
    return { y, label: v.toFixed(1) };
  });

  // Dates affichées (début, milieu, fin)
  const dateLabels = [0, Math.floor(filtered.length / 2), filtered.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(i => ({
      x: toX(i).toFixed(1),
      label: new Date(filtered[i].date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    }));

  const handleMouseMove = (e) => {
    if (!svgRef.current || !filtered.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * W;
    const dists = pts.map(([px]) => Math.abs(px - rawX));
    const idx = dists.indexOf(Math.min(...dists));
    setHovered({ idx, x: pts[idx][0], y: pts[idx][1], val: vals[idx], date: filtered[idx].date });
  };

  return (
    <div>
      {/* Résumé */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555" }}>
            Évolution du poids
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: trendColor, fontFamily: "'Syne',sans-serif" }}>
          {trendLabel}
        </span>
      </div>

      <svg
        ref={svgRef}
        width="100%" viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block", cursor: "crosshair", overflow: "visible" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8B000" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#E8B000" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C49200"/>
            <stop offset="50%" stopColor="#F5C832"/>
            <stop offset="100%" stopColor="#E8B000"/>
          </linearGradient>
        </defs>

        {/* Grille */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PX} x2={W - PX} y1={g.y} y2={g.y} stroke="#181818" strokeWidth="0.5"/>
            <text x={PX - 2} y={parseFloat(g.y) + 3.5} textAnchor="end" fontSize="7" fill="#333">{g.label}</text>
          </g>
        ))}

        {/* Objectif */}
        {target && !isNaN(target) && (
          <g>
            <line x1={PX} x2={W - PX}
              y1={toY(target).toFixed(1)} y2={toY(target).toFixed(1)}
              stroke="#7AE07A" strokeWidth="1" strokeDasharray="5 4" opacity="0.6"/>
            <text x={W - PX + 2} y={toY(target) + 3.5} fontSize="7" fill="#7AE07A">obj.</text>
          </g>
        )}

        {/* Zone */}
        <path d={areaD} fill="url(#progGrad)"/>

        {/* Ligne */}
        <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 1000, animation: "drawLine 1.2s ease both" }}/>

        {/* Points */}
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.5"
            fill="#0A0A0A" stroke="#E8B000" strokeWidth="2"
            style={{ transition: "r 0.15s" }}/>
        ))}

        {/* Tooltip hover */}
        {hovered && (
          <g>
            <line x1={hovered.x} x2={hovered.x} y1={PY} y2={H - PY}
              stroke="rgba(232,176,0,0.3)" strokeWidth="1" strokeDasharray="3 3"/>
            <circle cx={hovered.x} cy={hovered.y} r="5.5"
              fill="#E8B000" stroke="#0A0A0A" strokeWidth="2"/>
            <rect x={Math.min(hovered.x + 6, W - 70)} y={hovered.y - 26}
              width={62} height={22} rx={5}
              fill="rgba(10,10,10,0.92)" stroke="rgba(232,176,0,0.3)" strokeWidth="0.5"/>
            <text x={Math.min(hovered.x + 37, W - 35)} y={hovered.y - 14}
              textAnchor="middle" fontSize="10" fontWeight="700" fill="#E8B000">
              {hovered.val.toFixed(1)} kg
            </text>
            <text x={Math.min(hovered.x + 37, W - 35)} y={hovered.y - 5}
              textAnchor="middle" fontSize="7.5" fill="#666">
              {new Date(hovered.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </text>
          </g>
        )}
      </svg>

      {/* Dates bas */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingLeft: PX, paddingRight: PX }}>
        {dateLabels.map((d, i) => (
          <span key={i} style={{ fontSize: 8, color: "#444" }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// ── Mini-chart mensuration ─────────────────────────────────────────────────────
function MiniChart({ entries, field, label, color }) {
  const vals = entries
    .filter(e => e[field])
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(e => parseFloat(e[field]));
  if (vals.length < 2) return null;

  const W = 120, H = 40, PX = 4, PY = 4;
  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const range = max - min || 1;
  const toX = i => PX + (i / (vals.length - 1)) * (W - PX * 2);
  const toY = v => PY + (H - PY * 2) - ((v - min) / range) * (H - PY * 2);
  const pts = vals.map((v, i) => [toX(i), toY(v)]);
  const pathD = pts.map((p, i) => {
    if (i === 0) return `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const prev = pts[i - 1];
    const cx = ((prev[0] + p[0]) / 2).toFixed(1);
    return `C ${cx} ${prev[1].toFixed(1)} ${cx} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }).join(" ");
  const trend = vals[vals.length - 1] - vals[0];

  return (
    <div style={{ background: "#080808", borderRadius: 10, padding: "10px 12px", border: "0.5px solid #181818" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "#444" }}>{label}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: trend <= 0 ? "#7AE07A" : "#E07070", fontFamily: "'Syne',sans-serif" }}>
          {trend <= 0 ? `↓` : `↑`}{Math.abs(trend).toFixed(1)}<span style={{ fontSize: 8, color: "#555" }}> cm</span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2"
            fill="#080808" stroke={color} strokeWidth="1.5"/>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 8, color: "#333" }}>{vals[0].toFixed(1)}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: "#888" }}>{vals[vals.length - 1].toFixed(1)} cm</span>
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export function ProgressionTab({ user, clientData, setClientData, addToast }) {
  const [entries, setEntries] = useState([]);
  const [targetWeight, setTargetWeight] = useState("");
  const [periode, setPeriode] = useState(90);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDoc(doc(db, "clients", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setEntries(data.corpsMesures || []);
        if (data.programmeData?.poids_cible) setTargetWeight(String(data.programmeData.poids_cible));
      }
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Stats dérivées
  const weightEntries = entries.filter(e => e.poids).sort((a, b) => new Date(a.date) - new Date(b.date));
  const currentWeight = weightEntries.length ? weightEntries[weightEntries.length - 1].poids : null;
  const startWeight   = weightEntries.length ? weightEntries[0].poids : null;
  const totalDelta    = currentWeight && startWeight ? currentWeight - startWeight : null;
  const target        = targetWeight ? parseFloat(targetWeight) : null;
  const toGoal        = currentWeight && target ? currentWeight - target : null;

  // IMC
  const taille = clientData?.taille || clientData?.programmeData?.taille;
  const imc = currentWeight && taille ? (currentWeight / Math.pow(taille / 100, 2)).toFixed(1) : null;
  const imcLabel = imc ? (imc < 18.5 ? "Insuffisant" : imc < 25 ? "Normal" : imc < 30 ? "Surpoids" : "Obésité") : null;
  const imcColor = imc ? (imc < 18.5 ? "#E07070" : imc < 25 ? "#7AE07A" : imc < 30 ? "#E8B000" : "#E07070") : "#E8B000";

  const PERIODES = [
    { label: "30j",  val: 30 },
    { label: "90j",  val: 90 },
    { label: "6m",   val: 180 },
    { label: "Tout", val: null },
  ];

  const MESURES = [
    { field: "taille_tour", label: "Tour de taille", color: "#E8B000" },
    { field: "bras",        label: "Bras",           color: "#7AE07A" },
    { field: "cuisses",     label: "Cuisses",        color: "#A07AE0" },
    { field: "poitrine",    label: "Poitrine",       color: "#E07070" },
    { field: "epaules",     label: "Épaules",        color: "#7AB8E0" },
  ].filter(m => entries.some(e => e[m.field]));

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#444", fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic" }}>
      Chargement…
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{STYLES}</style>

      {/* ── Titre ── */}
      <div style={{ animation: "fadeUp 0.35s ease both" }}>
        <div style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
          Progression
        </div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#F0EDE8", lineHeight: 1.2 }}>
          Ta transformation
        </div>
      </div>

      {/* ── Stats hero ── */}
      {currentWeight && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8,
          animation: "fadeUp 0.4s 0.05s ease both", opacity: 0,
          animationFillMode: "forwards",
        }}>
          {[
            {
              val: `${currentWeight?.toFixed(1)} kg`,
              label: "Poids actuel",
              color: "#F0EDE8",
              sub: startWeight !== currentWeight ? (totalDelta > 0 ? `+${totalDelta?.toFixed(1)} depuis début` : `${totalDelta?.toFixed(1)} depuis début`) : "Première mesure",
              subColor: totalDelta < 0 ? "#7AE07A" : totalDelta > 0 ? "#E07070" : "#555",
            },
            {
              val: target ? `${target.toFixed(1)} kg` : "—",
              label: "Objectif",
              color: "#E8B000",
              sub: toGoal !== null ? (Math.abs(toGoal) < 0.5 ? "Objectif atteint !" : `${Math.abs(toGoal).toFixed(1)} kg restants`) : "Non défini",
              subColor: toGoal !== null && Math.abs(toGoal) < 0.5 ? "#7AE07A" : "#555",
            },
            {
              val: imc || "—",
              label: "IMC",
              color: imcColor,
              sub: imcLabel || (taille ? "Calcul…" : "Taille manquante"),
              subColor: imcColor,
            },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#0D0D0D", border: "0.5px solid #1A1A1A",
              borderRadius: 12, padding: "12px 10px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 8, right: 8, height: 1.5,
                background: s.color, borderRadius: "0 0 2px 2px", opacity: 0.5 }}/>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18,
                color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", color: "#444", marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 9, color: s.subColor, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Graphique poids ── */}
      <div className="prog-card" style={{ animationDelay: "0.1s" }}>
        {/* Sélecteur période */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {PERIODES.map(p => (
            <button
              key={p.label}
              className={`seg-btn${periode === p.val ? " active" : ""}`}
              onClick={() => setPeriode(p.val)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <WeightChart entries={entries} targetWeight={targetWeight} periode={periode} />
      </div>

      {/* ── Mensurations ── */}
      {MESURES.length > 0 && (
        <div className="prog-card" style={{ animationDelay: "0.15s" }}>
          <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>
            Mensurations
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {MESURES.map(m => (
              <MiniChart key={m.field} entries={entries} field={m.field} label={m.label} color={m.color} />
            ))}
          </div>
        </div>
      )}

      {/* ── Dernier enregistrement ── */}
      {weightEntries.length > 0 && (
        <div className="prog-card" style={{ animationDelay: "0.2s" }}>
          <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>
            Historique · {weightEntries.length} mesure{weightEntries.length > 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
            {[...weightEntries].reverse().map((e, i) => {
              const prev = weightEntries[weightEntries.length - 2 - i];
              const delta = prev ? e.poids - prev.poids : null;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", background: "#080808", borderRadius: 8,
                  border: "0.5px solid #141414",
                }}>
                  <div style={{ fontSize: 9, color: "#555" }}>
                    {new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {delta !== null && (
                      <span style={{ fontSize: 9, color: delta < 0 ? "#7AE07A" : delta > 0 ? "#E07070" : "#555" }}>
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg
                      </span>
                    )}
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "#E8B000" }}>
                      {parseFloat(e.poids).toFixed(1)} kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Photos de progression ── */}
      <div style={{ animationDelay: "0.25s", animation: "fadeUp 0.45s 0.25s ease both", opacity: 0, animationFillMode: "forwards" }}>
        <ProgressPhotos user={user} clientData={clientData} setClientData={setClientData} addToast={addToast} />
      </div>

    </div>
  );
}
