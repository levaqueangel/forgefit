"use client";
import { useState } from "react";

// Mapping exercice → Giphy ID (IDs vérifiés pour les exercices communs)
const EXERCISE_GIFS = {
  // Poitrine
  "développé couché":   "eE8S1RrLjE7Ao",
  "bench press":        "eE8S1RrLjE7Ao",
  "pompes":             "GUhQtRjBK0KBUv2rkC",
  "push-up":            "GUhQtRjBK0KBUv2rkC",
  "dips":               "qgQUggAC3Pfv687686",
  "écarté":             "v2OXxWHhOZIcIdnhKW",
  "pull over":          "v2OXxWHhOZIcIdnhKW",

  // Dos
  "tractions":          "d3KRbMBCIiRiPWoA",
  "pull-up":            "d3KRbMBCIiRiPWoA",
  "traction":           "d3KRbMBCIiRiPWoA",
  "rowing":             "3o6Zt8SEZkPaZuPoqQ",
  "tirage":             "3o6Zt8SEZkPaZuPoqQ",
  "soulevé de terre":   "3o7TKrdMLPZGo23bqU",
  "deadlift":           "3o7TKrdMLPZGo23bqU",

  // Épaules
  "développé militaire":"l46CdPifO7gBaQnBe",
  "shoulder press":     "l46CdPifO7gBaQnBe",
  "élévation latérale": "v2OXxWHhOZIcIdnhKW",
  "oiseau":             "v2OXxWHhOZIcIdnhKW",

  // Bras
  "curl":               "xT9GEiILkKu5HfNaCA",
  "bicep":              "xT9GEiILkKu5HfNaCA",
  "extension triceps":  "9EXL7mVMnQmEU",
  "tricep":             "9EXL7mVMnQmEU",
  "barre":              "xT9GEiILkKu5HfNaCA",

  // Jambes
  "squat":              "3o6ZtllbbKAGf6Ue4g",
  "fentes":             "l2SpXkMHNKjZtFB3y",
  "lunges":             "l2SpXkMHNKjZtFB3y",
  "leg press":          "3o6ZtllbbKAGf6Ue4g",
  "leg extension":      "3o6ZtllbbKAGf6Ue4g",
  "mollets":            "l2SpXkMHNKjZtFB3y",
  "hip thrust":         "QXh7GCEFObblS",

  // Abdominaux
  "gainage":            "aZH27Rv7yNPpuBa0n2",
  "planche":            "aZH27Rv7yNPpuBa0n2",
  "crunch":             "3o6ZtllbbKAGf6Ue4g",
  "abdominaux":         "aZH27Rv7yNPpuBa0n2",
  "relevé de jambes":   "aZH27Rv7yNPpuBa0n2",
  "russian twist":      "aZH27Rv7yNPpuBa0n2",
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
          background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.25)",
          color: "#C9A84C", fontSize: 9, fontWeight: 700, letterSpacing: "1px",
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
              <div style={{ fontSize:11, fontWeight:700, color:"#C9A84C", fontFamily:"'Syne',sans-serif", letterSpacing:"1px", textTransform:"uppercase" }}>
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
            <div style={{ marginTop:8, fontSize:10, color:"#333", textAlign:"center", fontFamily:"'Syne',sans-serif" }}>
              Appuie n'importe où pour fermer
            </div>
          </div>
        </div>
      )}
    </>
  );
}
