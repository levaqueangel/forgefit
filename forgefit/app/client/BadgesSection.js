"use client";

const BADGE_DEFS = [
  // Streak séances
  { type: "streak", seuil: 7,  label: "7 jours",  desc: "7 jours de streak",       icon: "🔥", color: "#F5C832", rarity: "bronze" },
  { type: "streak", seuil: 30, label: "30 jours", desc: "30 jours sans relâche",   icon: "💎", color: "#5DCAA5", rarity: "argent" },
  { type: "streak", seuil: 60, label: "60 jours", desc: "60 jours de discipline",  icon: "👑", color: "#E8B000", rarity: "or" },
  { type: "streak", seuil: 90, label: "90 jours", desc: "90 jours — Légendaire",   icon: "⚡", color: "#E07070", rarity: "légendaire" },

  // Objectifs semaine
  { type: "objectifs_semaine", label: "Semaine parfaite", desc: "Tous les objectifs hebdo atteints", icon: "🎯", color: "#7AE07A", rarity: "bronze" },

  // Mensurations
  { type: "mensuration_objectif", label: "Objectif atteint", desc: "Objectif de poids atteint", icon: "🏆", color: "#E8B000", rarity: "or" },

  // Journal alimentaire
  { type: "journal_repas", jours: 7,  label: "7 jours logs",  desc: "7 jours de journal alimentaire", icon: "🥗", color: "#7AE07A", rarity: "bronze" },
  { type: "journal_repas", jours: 14, label: "14 jours logs", desc: "14 jours de journal alimentaire", icon: "🥦", color: "#5DCAA5", rarity: "argent" },
  { type: "journal_repas", jours: 30, label: "30 jours logs", desc: "30 jours de constance",          icon: "⭐", color: "#E8B000", rarity: "or" },
];

const RARITY_STYLE = {
  bronze:    { border: "rgba(180,120,60,0.4)",  glow: "rgba(180,120,60,0.15)"  },
  argent:    { border: "rgba(150,180,200,0.4)", glow: "rgba(150,180,200,0.15)" },
  or:        { border: "rgba(232,176,0,0.5)",  glow: "rgba(232,176,0,0.2)"   },
  légendaire:{ border: "rgba(224,112,112,0.5)", glow: "rgba(224,112,112,0.2)"  },
};

function Badge({ def, earned, date }) {
  const rs = RARITY_STYLE[def.rarity] || RARITY_STYLE.bronze;
  return (
    <div title={earned ? `${def.desc} — ${date ? new Date(date).toLocaleDateString("fr-FR") : ""}` : `🔒 ${def.desc}`}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:4,
        padding:"10px 8px", borderRadius:12,
        background: earned ? `rgba(10,10,10,0.9)` : "#0D0D0D",
        border: `0.5px solid ${earned ? rs.border : "#1A1A1A"}`,
        boxShadow: earned ? `0 0 12px ${rs.glow}` : "none",
        opacity: earned ? 1 : 0.35,
        transition: "all 0.2s",
        cursor: "default",
        minWidth: 64,
      }}>
      <div style={{ fontSize: 26, lineHeight: 1, filter: earned ? "none" : "grayscale(100%)" }}>
        {earned ? def.icon : "🔒"}
      </div>
      <div style={{
        fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase",
        color: earned ? def.color : "#333", fontFamily: "'Syne',sans-serif",
        fontWeight: 700, textAlign: "center", lineHeight: 1.3,
      }}>
        {def.label}
      </div>
      {earned && def.rarity === "légendaire" && (
        <div style={{ fontSize: 7, letterSpacing: "1px", color: "#E07070", textTransform: "uppercase" }}>
          légendaire
        </div>
      )}
    </div>
  );
}

export function BadgesSection({ clientData }) {
  const badges = clientData?.badges || [];
  const streak = clientData?.streakDays || 0;

  // Calculer les badges gagnés dynamiquement
  const earned = {};

  // Streak
  for (const def of BADGE_DEFS.filter(d => d.type === "streak")) {
    if (streak >= def.seuil) earned[`streak_${def.seuil}`] = { date: null };
  }

  // Depuis Firestore badges array
  for (const b of badges) {
    if (b.type === "objectifs_semaine") earned["objectifs_semaine"] = { date: b.date };
    if (b.type === "mensuration_objectif") earned["mensuration_objectif"] = { date: b.date };
    if (b.type === "journal_repas") earned[`journal_repas_${b.jours}`] = { date: b.date };
  }

  const total = Object.keys(earned).length;
  const totalDefs = BADGE_DEFS.length;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>
          🏅 Badges
        </div>
        <div style={{ fontSize:10, color:"#444", fontFamily:"'Syne',sans-serif" }}>
          {total}/{totalDefs} débloqués
        </div>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {BADGE_DEFS.map((def, i) => {
          const key = def.type === "streak" ? `streak_${def.seuil}`
            : def.type === "journal_repas" ? `journal_repas_${def.jours}`
            : def.type;
          const e = earned[key];
          return <Badge key={i} def={def} earned={!!e} date={e?.date} />;
        })}
      </div>

      {total === 0 && (
        <div style={{ fontSize:11, color:"#555", fontFamily:"'Cormorant Garamond',serif",
          fontStyle:"italic", textAlign:"center", marginTop:12 }}>
          Continue ta progression — les badges se débloquent automatiquement.
        </div>
      )}
    </div>
  );
}
