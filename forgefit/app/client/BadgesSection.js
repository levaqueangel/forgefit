"use client";
import { useState } from "react";

// ── Définitions ───────────────────────────────────────────────────────────────
export const BADGE_DEFS = [
  // Streak
  { id:"streak_3",    type:"streak", seuil:3,   cat:"Régularité", label:"Premier pas",    desc:"3 jours de streak",       icon:"🌱", xp:30,  rarity:"bronze"     },
  { id:"streak_7",    type:"streak", seuil:7,   cat:"Régularité", label:"Semaine entière",desc:"7 jours sans relâche",     icon:"🔥", xp:75,  rarity:"bronze"     },
  { id:"streak_14",   type:"streak", seuil:14,  cat:"Régularité", label:"Deux semaines",  desc:"14 jours de constance",   icon:"⚡", xp:150, rarity:"argent"     },
  { id:"streak_30",   type:"streak", seuil:30,  cat:"Régularité", label:"30 jours",       desc:"Un mois sans coupure",     icon:"💎", xp:300, rarity:"or"         },
  { id:"streak_60",   type:"streak", seuil:60,  cat:"Régularité", label:"60 jours",       desc:"60 jours de discipline",  icon:"👑", xp:500, rarity:"or"         },
  { id:"streak_90",   type:"streak", seuil:90,  cat:"Régularité", label:"90 jours",       desc:"90 jours — Elite",        icon:"🏆", xp:800, rarity:"légendaire" },

  // Séances totales
  { id:"seances_5",   type:"seances_total", seuil:5,   cat:"Entraînement", label:"5 séances",    desc:"5 séances réalisées",    icon:"💪", xp:40,  rarity:"bronze" },
  { id:"seances_10",  type:"seances_total", seuil:10,  cat:"Entraînement", label:"10 séances",   desc:"10 séances au compteur", icon:"🏋️", xp:80,  rarity:"bronze" },
  { id:"seances_25",  type:"seances_total", seuil:25,  cat:"Entraînement", label:"25 séances",   desc:"25 séances — Régulier",  icon:"🎯", xp:200, rarity:"argent" },
  { id:"seances_50",  type:"seances_total", seuil:50,  cat:"Entraînement", label:"50 séances",   desc:"50 séances — Sérieux",   icon:"🔩", xp:400, rarity:"or"     },
  { id:"seances_100", type:"seances_total", seuil:100, cat:"Entraînement", label:"100 séances",  desc:"100 séances — Légende",  icon:"🌟", xp:700, rarity:"légendaire" },

  // Journal alimentaire
  { id:"repas_3",   type:"journal_repas", jours:3,  cat:"Nutrition", label:"3 jours logs",   desc:"3 jours de journal",      icon:"🥗", xp:30,  rarity:"bronze" },
  { id:"repas_7",   type:"journal_repas", jours:7,  cat:"Nutrition", label:"7 jours logs",   desc:"7 jours de suivi",        icon:"🥦", xp:75,  rarity:"bronze" },
  { id:"repas_14",  type:"journal_repas", jours:14, cat:"Nutrition", label:"14 jours logs",  desc:"14 jours sans faille",    icon:"🍎", xp:150, rarity:"argent" },
  { id:"repas_30",  type:"journal_repas", jours:30, cat:"Nutrition", label:"30 jours logs",  desc:"30 jours — Rigueur totale", icon:"⭐", xp:300, rarity:"or"   },

  // Objectifs hebdo
  { id:"obj_1",  type:"objectifs_semaine", nb:1,  cat:"Objectifs", label:"Semaine parfaite",  desc:"1 semaine d'objectifs atteints",  icon:"🎯", xp:100, rarity:"bronze" },
  { id:"obj_3",  type:"objectifs_semaine", nb:3,  cat:"Objectifs", label:"3 semaines top",    desc:"3 semaines parfaites",            icon:"🔑", xp:250, rarity:"argent" },
  { id:"obj_5",  type:"objectifs_semaine", nb:5,  cat:"Objectifs", label:"5 semaines top",    desc:"5 semaines parfaites",            icon:"💫", xp:500, rarity:"or"     },

  // Forme & check-ins
  { id:"checkin_7",  type:"checkin", jours:7,  cat:"Bien-être", label:"7 check-ins",  desc:"7 jours de check-in forme",  icon:"📊", xp:60,  rarity:"bronze" },
  { id:"checkin_30", type:"checkin", jours:30, cat:"Bien-être", label:"30 check-ins", desc:"30 jours de suivi forme",    icon:"🧠", xp:200, rarity:"argent" },

  // Jalons
  { id:"bienvenue",  type:"static", cat:"Jalons", label:"Bienvenue",      desc:"Premier connexion au dashboard", icon:"👋", xp:10,  rarity:"bronze" },
  { id:"mensuration",type:"mensuration_objectif", cat:"Jalons", label:"Objectif atteint", desc:"Objectif de poids atteint", icon:"🎊", xp:400, rarity:"or" },
];

const RARITY = {
  bronze:    { label:"Bronze",    border:"rgba(180,120,60,0.45)",  glow:"rgba(180,120,60,0.18)",  bg:"rgba(180,120,60,0.06)",  text:"#B4783C" },
  argent:    { label:"Argent",    border:"rgba(160,190,210,0.45)", glow:"rgba(160,190,210,0.18)", bg:"rgba(160,190,210,0.06)", text:"#A0BED2" },
  or:        { label:"Or",        border:"rgba(232,176,0,0.55)",   glow:"rgba(232,176,0,0.22)",   bg:"rgba(232,176,0,0.07)",   text:"#E8B000" },
  légendaire:{ label:"Légendaire",border:"rgba(224,112,112,0.55)", glow:"rgba(224,112,112,0.22)", bg:"rgba(224,112,112,0.07)", text:"#E07070" },
};

const CATS = ["Régularité","Entraînement","Nutrition","Objectifs","Bien-être","Jalons"];

// XP → niveau
function xpToLevel(xp) {
  const thresholds = [0,100,250,500,900,1400,2000,2800,3800,5000];
  let lv = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) lv = i + 1;
    else break;
  }
  const cur = thresholds[lv - 1] || 0;
  const next = thresholds[lv] || thresholds[thresholds.length - 1];
  return { level: lv, cur, next, pct: Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100)) };
}

// ── Badge card ───────────────────────────────────────────────────────────────
function BadgeCard({ def, earned, date, isNew }) {
  const [hover, setHover] = useState(false);
  const rs = RARITY[def.rarity];
  const recent = isNew && date && (Date.now() - new Date(date).getTime()) < 7 * 86400000;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "14px 10px 10px",
        borderRadius: 12,
        background: earned ? rs.bg : "#0A0A0A",
        border: `0.5px solid ${earned ? rs.border : "#151515"}`,
        boxShadow: earned && hover ? `0 0 20px ${rs.glow}` : earned ? `0 0 10px ${rs.glow}40` : "none",
        opacity: earned ? 1 : 0.3,
        transition: "all 0.25s",
        cursor: earned ? "default" : "not-allowed",
        minWidth: 72, flex: "1 1 72px", maxWidth: 90,
      }}
    >
      {/* Shimmer on new */}
      {earned && recent && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 12, pointerEvents: "none",
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)",
          backgroundSize: "200% 100%",
          animation: "badgeShimmer 2s ease infinite",
        }} />
      )}
      {/* NEW pill */}
      {earned && recent && (
        <div style={{
          position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
          background: "#E8B000", color: "#0A0A0A",
          fontSize: 7, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 8, whiteSpace: "nowrap",
        }}>NEW</div>
      )}
      <div style={{ fontSize: 28, lineHeight: 1, filter: earned ? "none" : "grayscale(1)" }}>
        {earned ? def.icon : "🔒"}
      </div>
      <div style={{
        fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase",
        color: earned ? rs.text : "#2A2A2A",
        fontFamily: "'Syne',sans-serif", fontWeight: 700,
        textAlign: "center", lineHeight: 1.35,
      }}>
        {def.label}
      </div>
      {earned && (
        <div style={{ fontSize: 7, color: "#333", letterSpacing: "1px", textTransform: "uppercase" }}>
          +{def.xp} XP
        </div>
      )}
      {/* Tooltip on hover */}
      {hover && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "#111", border: "0.5px solid #222",
          borderRadius: 8, padding: "8px 12px", width: 150, zIndex: 20,
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: earned ? rs.text : "#555", marginBottom: 4, fontFamily: "'Syne',sans-serif" }}>
            {def.label}
          </div>
          <div style={{ fontSize: 10, color: "#666", lineHeight: 1.5 }}>{def.desc}</div>
          {earned && date && (
            <div style={{ fontSize: 9, color: "#333", marginTop: 4 }}>
              Débloqué le {new Date(date).toLocaleDateString("fr-FR")}
            </div>
          )}
          {earned && (
            <div style={{ fontSize: 9, color: rs.text, marginTop: 2 }}>{rs.label} · +{def.xp} XP</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section principale ───────────────────────────────────────────────────────
export function BadgesSection({ clientData }) {
  const [activecat, setActiveCat] = useState("Tout");

  const rawBadges = clientData?.badges || [];
  const streak    = clientData?.streakDays || clientData?.streak || 0;
  const seancesTotal = clientData?.seancesTotal || 0;
  const checkinsTotal = clientData?.checkinsTotal || 0;
  const semParfaites = rawBadges.filter(b => b.type === "objectifs_semaine").length;

  // Construire earned map
  const earned = {};
  // Statique — bienvenue toujours débloqué si connecté
  earned["bienvenue"] = { date: clientData?.createdAt || null };

  // Streak
  for (const def of BADGE_DEFS.filter(d => d.type === "streak")) {
    if (streak >= def.seuil) earned[def.id] = { date: null };
  }
  // Séances
  for (const def of BADGE_DEFS.filter(d => d.type === "seances_total")) {
    if (seancesTotal >= def.seuil) earned[def.id] = { date: null };
  }
  // Journal repas
  for (const b of rawBadges.filter(b => b.type === "journal_repas")) {
    for (const def of BADGE_DEFS.filter(d => d.type === "journal_repas" && d.jours <= (b.jours || 0))) {
      earned[def.id] = { date: b.date };
    }
  }
  // Objectifs semaine
  for (const def of BADGE_DEFS.filter(d => d.type === "objectifs_semaine")) {
    if (semParfaites >= (def.nb || 1)) {
      const latest = rawBadges.filter(b => b.type === "objectifs_semaine").slice(-1)[0];
      earned[def.id] = { date: latest?.date || null };
    }
  }
  // Check-ins
  for (const def of BADGE_DEFS.filter(d => d.type === "checkin")) {
    if (checkinsTotal >= def.jours) earned[def.id] = { date: null };
  }
  // Mensuration
  if (rawBadges.some(b => b.type === "mensuration_objectif")) {
    earned["mensuration"] = { date: rawBadges.find(b => b.type === "mensuration_objectif")?.date };
  }

  const totalEarned = Object.keys(earned).length;
  const totalXP = BADGE_DEFS.filter(d => earned[d.id]).reduce((s, d) => s + d.xp, 0);
  const { level, cur, next, pct: lvPct } = xpToLevel(totalXP);

  // Prochain badge par catégorie (pour motivation)
  function nextBadge(cat) {
    return BADGE_DEFS.filter(d => d.cat === cat && !earned[d.id])[0] || null;
  }

  const cats = ["Tout", ...CATS];
  const displayed = activecat === "Tout"
    ? BADGE_DEFS
    : BADGE_DEFS.filter(d => d.cat === activecat);

  return (
    <div>
      <style>{`
        @keyframes badgeShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes lvBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      `}</style>

      {/* ── Niveau XP ── */}
      <div style={{
        background: "rgba(232,176,0,0.05)", border: "0.5px solid rgba(232,176,0,0.2)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
              Niveau
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#E8B000", fontFamily: "'Syne',sans-serif", lineHeight: 1, animation: "lvBounce 3s ease infinite" }}>
                {level}
              </span>
              <span style={{ fontSize: 10, color: "#444", letterSpacing: "1px" }}>
                {totalXP} XP total
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#333", marginBottom: 4 }}>
              {totalEarned}/{BADGE_DEFS.length} badges
            </div>
            <div style={{ fontSize: 10, color: "#555" }}>
              {next - totalXP} XP → niv. {level + 1}
            </div>
          </div>
        </div>
        {/* XP bar */}
        <div style={{ height: 5, background: "#1A1A1A", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            background: "linear-gradient(90deg, #C49200, #E8B000, #F5C832)",
            width: `${lvPct}%`, transition: "width 1s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 9, color: "#2A2A2A" }}>Niv. {level}</span>
          <span style={{ fontSize: 9, color: "#2A2A2A" }}>Niv. {level + 1}</span>
        </div>
      </div>

      {/* ── Filtres catégories ── */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setActiveCat(c)} style={{
            background: activecat === c ? "rgba(232,176,0,0.12)" : "transparent",
            border: `0.5px solid ${activecat === c ? "rgba(232,176,0,0.4)" : "#1A1A1A"}`,
            color: activecat === c ? "#E8B000" : "#444",
            fontFamily: "'Syne',sans-serif", fontSize: 9, fontWeight: 700,
            letterSpacing: "1.5px", textTransform: "uppercase",
            padding: "5px 10px", borderRadius: 20, cursor: "pointer",
            whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0,
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* ── Grille badges ── */}
      {activecat === "Tout" ? (
        CATS.map(cat => {
          const catBadges = BADGE_DEFS.filter(d => d.cat === cat);
          const catEarned = catBadges.filter(d => earned[d.id]).length;
          const next = nextBadge(cat);
          return (
            <div key={cat} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555" }}>
                  {cat}
                </div>
                <div style={{ fontSize: 9, color: catEarned === catBadges.length ? "#7AE07A" : "#333" }}>
                  {catEarned}/{catBadges.length}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {catBadges.map(def => (
                  <BadgeCard key={def.id} def={def} earned={!!earned[def.id]} date={earned[def.id]?.date} isNew />
                ))}
              </div>
              {/* Prochain badge */}
              {next && !earned[next.id] && (
                <div style={{
                  marginTop: 8, padding: "6px 10px",
                  background: "#0A0A0A", border: "0.5px dashed #1A1A1A",
                  borderRadius: 8, fontSize: 10, color: "#333",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ fontSize: 13 }}>🎯</span>
                  <span>Prochain : <span style={{ color: "#555" }}>{next.label}</span> — {next.desc}</span>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {displayed.map(def => (
            <BadgeCard key={def.id} def={def} earned={!!earned[def.id]} date={earned[def.id]?.date} isNew />
          ))}
        </div>
      )}

      {totalEarned <= 1 && (
        <div style={{ fontSize: 12, color: "#2A2A2A", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", textAlign: "center", marginTop: 8 }}>
          Continue ta progression — les badges se débloquent automatiquement.
        </div>
      )}
    </div>
  );
}
