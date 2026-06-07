"use client";
import { useRef, useState } from "react";

// ── Compression image côté client ─────────────────────────────────────────────
async function compressImage(file, maxPx = 1024, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      // Extraire base64 sans le préfixe data:...;base64,
      resolve({ b64: dataUrl.split(",")[1], preview: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// ── Champ éditable simple ─────────────────────────────────────────────────────
function EditField({ label, value, unit, onChange, color = "#F0EDE8" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <div style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#555" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="number" value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            background: "transparent", border: "none", borderBottom: "0.5px solid #2A2A2A",
            color, fontFamily: "'Syne',sans-serif", fontWeight: 700,
            fontSize: 18, textAlign: "center", width: 60, outline: "none", padding: "2px 0",
          }}
        />
        <span style={{ fontSize: 10, color: "#444" }}>{unit}</span>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function ScanRepas({ user, onSave }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);       // dataURL pour l'affichage
  const [b64, setB64] = useState(null);               // base64 pour l'API
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);         // réponse IA
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Sélection d'image ──────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setResult(null); setSaved(false);

    const compressed = await compressImage(file);
    if (!compressed) { setError("Impossible de lire l'image."); return; }

    setPreview(compressed.preview);
    setB64(compressed.b64);
    setMediaType("image/jpeg"); // toujours jpeg après compression canvas
  };

  // ── Analyse IA ─────────────────────────────────────────────────────────────
  const analyze = async () => {
    if (!b64) return;
    setLoading(true); setError(""); setResult(null);

    try {
      const token = user ? await user.getIdToken() : null;
      const res = await fetch("/api/repas-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image: b64, mediaType }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Erreur analyse."); return; }
      if (!data.fiable) {
        setError("Repas non reconnu sur la photo. Essaie de rapprocher l'appareil.");
        setResult(data);
        return;
      }
      setResult(data);
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  // ── Enregistrement ─────────────────────────────────────────────────────────
  const save = async () => {
    if (!result || saving) return;
    setSaving(true);

    try {
      const token = user ? await user.getIdToken() : null;
      const res = await fetch("/api/repas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          uid: user?.uid,
          description: result.nom,
          save: true,
          // On passe les valeurs déjà calculées pour éviter un double appel IA
          override: {
            nom: result.nom,
            calories: result.calories,
            proteines: result.proteines,
            glucides: result.glucides,
            lipides: result.lipides,
            heure: result.heure,
            fiable: true,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        onSave?.(result, data);
      } else {
        setError(data.error || "Erreur enregistrement.");
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setPreview(null); setB64(null); setResult(null);
    setError(""); setSaved(false); setSaving(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  const card = {
    background: "#111", border: "0.5px solid #1A1A1A", padding: "18px",
    width: "100%",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>

      {/* ── Input caché ── */}
      <input
        ref={fileRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }}
        onChange={handleFile}
      />

      {/* ── Zone de drop / bouton ── */}
      {!preview && (
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            background: "rgba(201,168,76,0.04)",
            border: "1px dashed rgba(201,168,76,0.25)",
            color: "#C9A84C", fontFamily: "'Syne',sans-serif",
            fontSize: 13, fontWeight: 600, letterSpacing: "1px",
            padding: "28px 20px", cursor: "pointer", width: "100%",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.04)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)"; }}
        >
          <span style={{ fontSize: 36 }}>📸</span>
          <span>Prendre une photo de ton repas</span>
          <span style={{ fontSize: 10, color: "#555", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Ou importer depuis la galerie
          </span>
        </button>
      )}

      {/* ── Aperçu photo + actions ── */}
      {preview && !saved && (
        <div style={card}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {/* Thumbnail */}
            <div style={{ flexShrink: 0, position: "relative" }}>
              <img
                src={preview} alt="Repas"
                style={{ width: 90, height: 90, objectFit: "cover", border: "0.5px solid #2A2A2A" }}
              />
              {!loading && !result && (
                <button onClick={reset} style={{
                  position: "absolute", top: -8, right: -8, background: "#1A1A1A",
                  border: "0.5px solid #2A2A2A", color: "#555", width: 22, height: 22,
                  borderRadius: "50%", cursor: "pointer", fontSize: 11,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              )}
            </div>

            {/* État analyse */}
            <div style={{ flex: 1 }}>
              {!result && !loading && (
                <>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 12, lineHeight: 1.6 }}>
                    Photo prête. Lance l'analyse IA pour estimer les valeurs nutritionnelles.
                  </div>
                  <button onClick={analyze} style={{
                    background: "linear-gradient(135deg,#C9A84C,#A67C2E)",
                    border: "none", color: "#0A0A0A", fontFamily: "'Syne',sans-serif",
                    fontWeight: 800, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase",
                    padding: "10px 18px", cursor: "pointer", width: "100%",
                  }}>
                    🔍 Analyser avec l'IA
                  </button>
                </>
              )}

              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 24, height: 24, border: "2px solid #1A1A1A", borderTop: "2px solid #C9A84C", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: "#888" }}>
                    Analyse du repas en cours…<br />
                    <span style={{ fontSize: 10, color: "#444" }}>Claude identifie les aliments et estime les macros</span>
                  </div>
                </div>
              )}

              {result && !loading && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#F0EDE8", marginBottom: 2 }}>
                    {result.nom}
                  </div>
                  {result.details && (
                    <div style={{ fontSize: 10, color: "#555", marginBottom: 6, lineHeight: 1.5 }}>
                      {result.details}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: result.fiable ? "#7AE07A" : "#E07070", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                      {result.fiable ? "✓ Analyse fiable" : "⚠ Estimation approximative"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Édition des valeurs ── */}
          {result && !loading && (
            <>
              <div style={{ height: "0.5px", background: "#1A1A1A", margin: "16px 0" }} />

              {/* Calories en grand */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>Calories estimées</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <button onClick={() => setResult(r => ({ ...r, calories: Math.max(0, r.calories - 50) }))}
                    style={{ background: "transparent", border: "0.5px solid #2A2A2A", color: "#555", width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <div style={{ fontSize: 40, fontWeight: 800, color: "#C9A84C", lineHeight: 1, minWidth: 100, textAlign: "center" }}>
                    {result.calories}
                  </div>
                  <button onClick={() => setResult(r => ({ ...r, calories: r.calories + 50 }))}
                    style={{ background: "transparent", border: "0.5px solid rgba(201,168,76,0.3)", color: "#C9A84C", width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
                <div style={{ fontSize: 10, color: "#555" }}>kcal</div>
              </div>

              {/* Macros */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <EditField label="Protéines" value={result.proteines} unit="g" color="#7AE07A"
                  onChange={v => setResult(r => ({ ...r, proteines: v }))} />
                <EditField label="Glucides" value={result.glucides} unit="g" color="#C9A84C"
                  onChange={v => setResult(r => ({ ...r, glucides: v }))} />
                <EditField label="Lipides" value={result.lipides} unit="g" color="#5DCAA5"
                  onChange={v => setResult(r => ({ ...r, lipides: v }))} />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={reset} style={{
                  background: "transparent", border: "0.5px solid #2A2A2A", color: "#555",
                  fontFamily: "'Syne',sans-serif", fontSize: 10, letterSpacing: "1.5px",
                  textTransform: "uppercase", padding: "10px 0", cursor: "pointer", flex: 1,
                }}>
                  ↩ Refaire
                </button>
                <button onClick={save} disabled={saving} style={{
                  background: saving ? "#1A1A1A" : "linear-gradient(135deg,#C9A84C,#A67C2E)",
                  border: "none", color: saving ? "#555" : "#0A0A0A",
                  fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  padding: "10px 0", cursor: saving ? "not-allowed" : "pointer", flex: 2,
                }}>
                  {saving ? "Enregistrement…" : "✓ Enregistrer ce repas"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Succès ── */}
      {saved && (
        <div style={{
          background: "rgba(122,224,122,0.06)", border: "0.5px solid rgba(122,224,122,0.25)",
          padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 12, color: "#7AE07A", fontWeight: 700, marginBottom: 2 }}>
              ✓ Repas enregistré !
            </div>
            <div style={{ fontSize: 11, color: "#555" }}>
              {result?.nom} · {result?.calories} kcal
            </div>
          </div>
          <button onClick={reset} style={{
            background: "transparent", border: "0.5px solid #2A2A2A", color: "#555",
            fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: "1.5px",
            textTransform: "uppercase", padding: "6px 12px", cursor: "pointer",
          }}>
            + Autre photo
          </button>
        </div>
      )}

      {/* ── Erreur ── */}
      {error && (
        <div style={{ fontSize: 12, color: "#E07070", padding: "10px 14px", background: "rgba(224,112,112,0.06)", border: "0.5px solid rgba(224,112,112,0.2)" }}>
          {error}
        </div>
      )}
    </div>
  );
}
