"use client";
import { useRef, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

// ── Compression image côté client ─────────────────────────────────────────────
async function compressImage(file, maxPx = 1024, quality = 0.85) {
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

// ── Badge confiance ────────────────────────────────────────────────────────────
function ConfidenceBadge({ confiance, fiable }) {
  if (!fiable) return (
    <span style={{ fontSize: 9, color: "#E07070", letterSpacing: "1.5px", textTransform: "uppercase" }}>
      ⚠ Estimation approximative
    </span>
  );
  const color = confiance >= 80 ? "#7AE07A" : confiance >= 55 ? "#C9A84C" : "#E07070";
  const label = confiance >= 80 ? "Analyse fiable" : confiance >= 55 ? "Estimation modérée" : "Peu fiable";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 9, color, letterSpacing: "1.5px", textTransform: "uppercase" }}>
        ✓ {label}
      </span>
      <span style={{
        fontSize: 9, fontWeight: 700, color, background: `${color}15`,
        border: `0.5px solid ${color}40`, padding: "1px 6px", borderRadius: 8,
      }}>
        {confiance}%
      </span>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function ScanRepas({ user, onSave }) {
  const fileRef   = useRef(null);
  const [preview, setPreview]     = useState(null);
  const [imageUrl, setImageUrl]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [description, setDescription] = useState(""); // contexte texte optionnel
  const [showDescInput, setShowDescInput] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  // ── Sélection d'image ──────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setResult(null); setSaved(false);

    if (file.size > 20 * 1024 * 1024) {
      setError("Image trop lourde (max 20 Mo). Utilise une photo moins volumineuse.");
      return;
    }

    const compressed = await compressImage(file);
    if (!compressed) { setError("Impossible de lire l'image."); return; }

    setPreview(compressed.preview);
    setMediaType("image/jpeg");

    // Upload vers Firebase Storage
    setUploading(true);
    try {
      const uid = user?.uid || "anon";
      const path = `repas-photos/${uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, path);
      const blob = await fetch(`data:image/jpeg;base64,${compressed.b64}`).then(r => r.blob());
      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
    } catch {
      // Fallback : garder base64 en mémoire si Storage échoue
      setImageUrl(`data:image/jpeg;base64,${compressed.b64}`);
    } finally {
      setUploading(false);
    }
  };

  // ── Analyse IA ─────────────────────────────────────────────────────────────
  const analyze = async () => {
    if (!imageUrl) return;
    setLoading(true); setError(""); setResult(null);

    try {
      const token = user ? await user.getIdToken() : null;
      const res = await fetch("/api/repas-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ imageUrl, description: description.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Erreur analyse."); return; }
      if (!data.fiable) {
        setError("Repas non reconnu sur la photo. Essaie de rapprocher l'appareil ou d'ajouter une description.");
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
          description: result.nom?.trim() || "Repas scanné",
          save: true,
          override: {
            nom: result.nom?.trim() || "Repas scanné",
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
    setPreview(null); setImageUrl(null); setResult(null);
    setError(""); setSaved(false); setSaving(false);
    setDescription(""); setShowDescInput(false);
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Bouton principal */}
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

          {/* Astuce */}
          <div style={{ fontSize: 10, color: "#333", textAlign: "center", lineHeight: 1.7 }}>
            💡 Pour de meilleurs résultats : photo rapprochée, bonne lumière, assiette bien visible
          </div>
        </div>
      )}

      {/* ── Aperçu photo + actions ── */}
      {preview && !saved && (
        <div style={card}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {/* Thumbnail */}
            <div style={{ flexShrink: 0, position: "relative" }}>
              <img
                src={preview} alt="Repas"
                style={{ width: 90, height: 90, objectFit: "cover", border: "0.5px solid #2A2A2A", borderRadius: 6 }}
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
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 10, lineHeight: 1.6 }}>
                    Photo prête. Lance l'analyse IA pour estimer les valeurs nutritionnelles.
                  </div>

                  {/* Contexte texte optionnel */}
                  <button
                    onClick={() => setShowDescInput(p => !p)}
                    style={{
                      background: "transparent", border: "none", color: "#555",
                      fontSize: 10, letterSpacing: "1px", textTransform: "uppercase",
                      cursor: "pointer", padding: 0, marginBottom: 8, display: "block",
                    }}
                  >
                    {showDescInput ? "▾" : "▸"} Ajouter un contexte (optionnel)
                  </button>

                  {showDescInput && (
                    <input
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ex: poulet grillé + riz + haricots verts…"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        background: "#0D0D0D", border: "0.5px solid #2A2A2A",
                        color: "#F0EDE8", padding: "8px 12px", borderRadius: 6,
                        fontSize: 12, outline: "none", marginBottom: 10,
                      }}
                    />
                  )}

                  <button onClick={analyze} disabled={uploading || !imageUrl} style={{
                    background: uploading ? "rgba(201,168,76,0.2)" : "linear-gradient(135deg,#C9A84C,#A67C2E)",
                    border: "none", color: uploading ? "#C9A84C" : "#0A0A0A", fontFamily: "'Syne',sans-serif",
                    fontWeight: 800, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase",
                    padding: "10px 18px", cursor: uploading ? "not-allowed" : "pointer", width: "100%", borderRadius: 4,
                  }}>
                    {uploading ? "⏳ Upload en cours…" : "🔍 Analyser avec l'IA"}
                  </button>
                </>
              )}

              {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 24, height: 24, border: "2px solid #1A1A1A", borderTop: "2px solid #C9A84C", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: "#888" }}>
                      Analyse en cours…
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#444", lineHeight: 1.7 }}>
                    🔎 Identification des aliments<br/>
                    📐 Estimation des portions<br/>
                    🧮 Calcul des macros
                  </div>
                </div>
              )}

              {result && !loading && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F0EDE8", marginBottom: 4, lineHeight: 1.4 }}>
                    {result.nom}
                  </div>
                  <ConfidenceBadge confiance={result.confiance ?? 0} fiable={result.fiable} />
                  {result.details && (
                    <div style={{ fontSize: 10, color: "#444", marginTop: 6, lineHeight: 1.5 }}>
                      {result.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Ingrédients détectés ── */}
          {result && !loading && result.ingredients?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>
                — Aliments détectés
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.ingredients.map((ing, i) => (
                  <span key={i} style={{
                    fontSize: 10, color: "#888",
                    background: "rgba(201,168,76,0.05)",
                    border: "0.5px solid rgba(201,168,76,0.15)",
                    padding: "3px 10px", borderRadius: 20,
                  }}>
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Édition des valeurs ── */}
          {result && !loading && (
            <>
              <div style={{ height: "0.5px", background: "#1A1A1A", margin: "16px 0" }} />

              {/* Calories en grand */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>Calories estimées</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <button onClick={() => setResult(r => ({ ...r, calories: Math.max(0, r.calories - 50) }))}
                    style={{ background: "transparent", border: "0.5px solid #2A2A2A", color: "#555", width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>−</button>
                  <div style={{ fontSize: 40, fontWeight: 800, color: "#C9A84C", lineHeight: 1, minWidth: 100, textAlign: "center" }}>
                    {result.calories}
                  </div>
                  <button onClick={() => setResult(r => ({ ...r, calories: r.calories + 50 }))}
                    style={{ background: "transparent", border: "0.5px solid rgba(201,168,76,0.3)", color: "#C9A84C", width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>+</button>
                </div>
                <div style={{ fontSize: 10, color: "#555" }}>kcal · modifiable</div>
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

              {/* Correction cohérence */}
              {result._coherenceFixed && (
                <div style={{ fontSize: 10, color: "#C9A84C", background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.15)", padding: "6px 12px", borderRadius: 4, marginBottom: 12 }}>
                  ⚠ Les calories ont été recalculées d'après les macros pour assurer la cohérence.
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={reset} style={{
                  background: "transparent", border: "0.5px solid #2A2A2A", color: "#555",
                  fontFamily: "'Syne',sans-serif", fontSize: 10, letterSpacing: "1.5px",
                  textTransform: "uppercase", padding: "10px 0", cursor: "pointer", flex: 1, borderRadius: 4,
                }}>
                  ↩ Refaire
                </button>
                <button onClick={save} disabled={saving} style={{
                  background: saving ? "#1A1A1A" : "linear-gradient(135deg,#C9A84C,#A67C2E)",
                  border: "none", color: saving ? "#555" : "#0A0A0A",
                  fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  padding: "10px 0", cursor: saving ? "not-allowed" : "pointer", flex: 2, borderRadius: 4,
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
          borderRadius: 6,
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
            textTransform: "uppercase", padding: "6px 12px", cursor: "pointer", borderRadius: 20,
          }}>
            + Autre photo
          </button>
        </div>
      )}

      {/* ── Erreur ── */}
      {error && (
        <div style={{ fontSize: 12, color: "#E07070", padding: "10px 14px", background: "rgba(224,112,112,0.06)", border: "0.5px solid rgba(224,112,112,0.2)", borderRadius: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}
