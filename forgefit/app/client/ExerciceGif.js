"use client";
import { useState } from "react";

// Mapping exercice → Giphy ID (IDs stables pour exercices courants)
const EXERCISE_GIFS = {
  // ── Poitrine ─────────────────────────────────────────────────────────────────
  "développé couché":    "eE8S1RrLjE7Ao",
  "bench press":         "eE8S1RrLjE7Ao",
  "développé incliné":   "l4pT6g02p9RDHBp2M",
  "pompes":              "GUhQtRjBK0KBUv2rkC",
  "push-up":             "GUhQtRjBK0KBUv2rkC",
  "dips":                "qgQUggAC3Pfv687686",
  "écarté":              "v2OXxWHhOZIcIdnhKW",
  "fly":                 "v2OXxWHhOZIcIdnhKW",
  "pull over":           "v2OXxWHhOZIcIdnhKW",

  // ── Dos ──────────────────────────────────────────────────────────────────────
  "tractions":           "d3KRbMBCIiRiPWoA",
  "pull-up":             "d3KRbMBCIiRiPWoA",
  "traction":            "d3KRbMBCIiRiPWoA",
  "rowing":              "3o6Zt8SEZkPaZuPoqQ",
  "tirage":              "3o6Zt8SEZkPaZuPoqQ",
  "soulevé de terre":    "3o7TKrdMLPZGo23bqU",
  "deadlift":            "3o7TKrdMLPZGo23bqU",
  "romanian":            "3o7TKrdMLPZGo23bqU",
  "rdl":                 "3o7TKrdMLPZGo23bqU",
  "face pull":           "3o6Zt8SEZkPaZuPoqQ",
  "hyperextension":      "3o6Zt8SEZkPaZuPoqQ",

  // ── Épaules ──────────────────────────────────────────────────────────────────
  "développé militaire": "l46CdPifO7gBaQnBe",
  "overhead press":      "l46CdPifO7gBaQnBe",
  "shoulder press":      "l46CdPifO7gBaQnBe",
  "élévation latérale":  "v2OXxWHhOZIcIdnhKW",
  "lateral raise":       "v2OXxWHhOZIcIdnhKW",
  "élévation frontale":  "v2OXxWHhOZIcIdnhKW",
  "oiseau":              "v2OXxWHhOZIcIdnhKW",
  "reverse fly":         "v2OXxWHhOZIcIdnhKW",
  "upright row":         "3o6Zt8SEZkPaZuPoqQ",

  // ── Bras ─────────────────────────────────────────────────────────────────────
  "curl":                "xT9GEiILkKu5HfNaCA",
  "bicep":               "xT9GEiILkKu5HfNaCA",
  "marteau":             "xT9GEiILkKu5HfNaCA",
  "hammer":              "xT9GEiILkKu5HfNaCA",
  "extension triceps":   "9EXL7mVMnQmEU",
  "tricep":              "9EXL7mVMnQmEU",
  "skull":               "9EXL7mVMnQmEU",
  "pushdown":            "9EXL7mVMnQmEU",
  "barre":               "xT9GEiILkKu5HfNaCA",

  // ── Jambes ───────────────────────────────────────────────────────────────────
  "squat":               "3o6ZtllbbKAGf6Ue4g",
  "gobelet":             "3o6ZtllbbKAGf6Ue4g",
  "fente":               "l2SpXkMHNKjZtFB3y",
  "fentes":              "l2SpXkMHNKjZtFB3y",
  "lunges":              "l2SpXkMHNKjZtFB3y",
  "leg press":           "3o6ZtllbbKAGf6Ue4g",
  "leg extension":       "3o6ZtllbbKAGf6Ue4g",
  "leg curl":            "l2SpXkMHNKjZtFB3y",
  "ischios":             "l2SpXkMHNKjZtFB3y",
  "mollets":             "l2SpXkMHNKjZtFB3y",
  "calf":                "l2SpXkMHNKjZtFB3y",
  "hip thrust":          "QXh7GCEFObblS",
  "glute bridge":        "QXh7GCEFObblS",
  "step up":             "l2SpXkMHNKjZtFB3y",
  "sumo":                "3o6ZtllbbKAGf6Ue4g",

  // ── Abdominaux / Gainage ─────────────────────────────────────────────────────
  "gainage":             "aZH27Rv7yNPpuBa0n2",
  "planche":             "aZH27Rv7yNPpuBa0n2",
  "plank":               "aZH27Rv7yNPpuBa0n2",
  "crunch":              "3o6ZtllbbKAGf6Ue4g",
  "abdominaux":          "aZH27Rv7yNPpuBa0n2",
  "relevé de jambes":    "aZH27Rv7yNPpuBa0n2",
  "leg raise":           "aZH27Rv7yNPpuBa0n2",
  "russian twist":       "aZH27Rv7yNPpuBa0n2",
  "mountain climber":    "aZH27Rv7yNPpuBa0n2",
  "bicycle":             "aZH27Rv7yNPpuBa0n2",

  // ── Cardio / Fonctionnel ─────────────────────────────────────────────────────
  "burpees":             "KyBX9ektgXWve",
  "burpee":              "KyBX9ektgXWve",
  "jumping jack":        "KyBX9ektgXWve",
  "kettlebell":          "KyBX9ektgXWve",
  "battle rope":         "KyBX9ektgXWve",
  "corde à sauter":      "KyBX9ektgXWve",
  "sprint":              "KyBX9ektgXWve",
  "box jump":            "KyBX9ektgXWve",
};

function findGifId(exerciceName) {
  if (!exerciceName) return null;
  const lower = exerciceName.toLowerCase();
  for (const [keyword, id] of Object.entries(EXERCISE_GIFS)) {
    if (lower.includes(keyword)) return id;
  }
  return null;
}

export function ExerciceGif({ nom }) {
  const [showGif, setShowGif] = useState(false);
  const [gifError, setGifError] = useState(false);

  const gifId = findGifId(nom);
  if (!gifId || gifError) return null;

  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setShowGif(true); }}
        title="Voir la démo"
        style={{
          background: "rgba(232,176,0,0.08)", border: "0.5px solid rgba(232,176,0,0.25)",
          color: "#E8B000", fontSize: 9, fontWeight: 700, letterSpacing: "1px",
          textTransform: "uppercase", padding: "3px 8px", borderRadius: 10,
          cursor: "pointer", fontFamily: "'Syne',sans-serif", flexShrink: 0,
          transition: "all 0.15s",
        }}>
        GIF
      </button>

      {showGif && (
        <div
          onClick={() => setShowGif(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#111", border: "0.5px solid #242424", borderRadius: 16,
              padding: "16px", maxWidth: 340, width: "100%",
            }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#E8B000", fontFamily:"'Syne',sans-serif", letterSpacing:"1px", textTransform:"uppercase" }}>
                {nom}
              </div>
              <button onClick={() => setShowGif(false)} style={{ background:"transparent", border:"none", color:"#555", fontSize:16, cursor:"pointer", lineHeight:1 }}>✕</button>
            </div>
            <img
              src={`https://media.giphy.com/media/${gifId}/giphy.gif`}
              alt={`Démo ${nom}`}
              onError={() => { setGifError(true); setShowGif(false); }}
              style={{ width:"100%", borderRadius:10, display:"block" }}
            />
            <div style={{ marginTop:8, fontSize:10, color:"#555", textAlign:"center", fontFamily:"'Syne',sans-serif" }}>
              Appuie n'importe où pour fermer
            </div>
          </div>
        </div>
      )}
    </>
  );
}
