"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { auth } from "../firebase";

const NUTRISCORE_COLORS = { A:"#1a9850", B:"#91cf60", C:"#fee08b", D:"#fc8d59", E:"#d73027" };

export function ScanBarcode({ user, onSave }) {
  const [mode, setMode]             = useState("camera"); // "camera" | "upload" | "manual"
  const [scanning, setScanning]     = useState(false);
  const [product, setProduct]       = useState(null);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [quantity, setQuantity]     = useState(100); // grammes
  const [manualCode, setManualCode] = useState("");
  const [cameraSupported, setCameraSupported] = useState(true);

  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const detectorRef = useRef(null);

  // Vérifie si BarcodeDetector est dispo (Chrome/Edge/Android)
  const barcodeDetectorAvailable = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Démarre la caméra + scan en temps réel
  const startCamera = async () => {
    if (!barcodeDetectorAvailable) {
      setMode("upload");
      return;
    }
    setError("");
    setProduct(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      detectorRef.current = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
      });

      setScanning(true);
      scanLoop();
    } catch (e) {
      if (e.name === "NotAllowedError") {
        setError("Accès caméra refusé. Autorise l'accès dans les paramètres ou utilise l'upload.");
      } else {
        setError("Caméra indisponible sur cet appareil.");
        setCameraSupported(false);
      }
      setMode("upload");
    }
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    if (!video || !canvas || !detector || video.paused) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    detector.detect(canvas).then(barcodes => {
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        stopCamera();
        fetchProduct(code);
      } else {
        rafRef.current = requestAnimationFrame(scanLoop);
      }
    }).catch(() => {
      rafRef.current = requestAnimationFrame(scanLoop);
    });
  };

  const fetchProduct = async (code) => {
    const clean = code.replace(/\D/g, "");
    if (!clean || clean.length < 8) {
      setError("Code-barres non reconnu. Essaie à nouveau.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch(`/api/barcode?code=${clean}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Produit introuvable."); return; }
      setProduct(data);
      setQuantity(data.serving || 100);
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setProduct(null);

    if (!barcodeDetectorAvailable) {
      setError("Scan d'image non supporté sur ce navigateur. Saisis le code manuellement.");
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const detector = new window.BarcodeDetector({
          formats: ["ean_13","ean_8","upc_a","upc_e","code_128","code_39"],
        });
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          fetchProduct(barcodes[0].rawValue);
        } else {
          setError("Aucun code-barres détecté sur cette image. Essaie une meilleure photo ou saisis le code manuellement.");
        }
      } catch {
        setError("Erreur lors de la lecture de l'image.");
      }
      URL.revokeObjectURL(img.src);
    };
  };

  // Macros calculées selon la quantité saisie
  const calcMacros = () => {
    if (!product) return null;
    const ratio = quantity / 100;
    return {
      calories:  Math.round(product.per100.calories  * ratio),
      proteines: Math.round(product.per100.proteines * ratio * 10) / 10,
      glucides:  Math.round(product.per100.glucides  * ratio * 10) / 10,
      lipides:   Math.round(product.per100.lipides   * ratio * 10) / 10,
    };
  };

  const handleSave = async () => {
    if (!product || saving) return;
    const macros = calcMacros();
    setSaving(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch("/api/repas", {
        method: "POST",
        headers: { "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({
          save: true,
          description: `${product.nom}${product.marque ? ` (${product.marque})` : ""} — ${quantity}g`,
          analyse: {
            nom: product.nom,
            calories:  macros.calories,
            proteines: macros.proteines,
            glucides:  macros.glucides,
            lipides:   macros.lipides,
            fiable:    true,
            source:    "barcode",
          },
        }),
      });
      if (res.ok) {
        setSaved(true);
        onSave?.({ ...macros, nom: product.nom, source: "barcode" });
        setTimeout(() => { setSaved(false); setProduct(null); }, 2000);
      } else {
        setError("Erreur lors de l'enregistrement.");
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    stopCamera();
    setProduct(null);
    setError("");
    setManualCode("");
  };

  const macros = calcMacros();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* Onglets mode */}
      {!product && (
        <div style={{ display:"flex", gap:0, border:"0.5px solid #1A1A1A", width:"fit-content", borderRadius:2 }}>
          {[
            { id:"camera", label:"📷 Caméra" },
            { id:"upload", label:"🖼 Image" },
            { id:"manual", label:"⌨ Manuel" },
          ].map(m => (
            <button key={m.id} onClick={() => { stopCamera(); setMode(m.id); setError(""); }} style={{
              background: mode === m.id ? "rgba(232,176,0,0.12)" : "transparent",
              border:"none", borderRight: m.id !== "manual" ? "0.5px solid #1A1A1A" : "none",
              color: mode === m.id ? "#E8B000" : "#555",
              fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
              letterSpacing:"1.5px", textTransform:"uppercase",
              padding:"7px 14px", cursor:"pointer", transition:"all 0.15s",
            }}>{m.label}</button>
          ))}
        </div>
      )}

      {/* Mode caméra */}
      {!product && mode === "camera" && (
        <div>
          {!scanning ? (
            <button onClick={startCamera} style={{
              width:"100%", padding:"14px", background:"rgba(232,176,0,0.08)",
              border:"0.5px dashed rgba(232,176,0,0.3)", borderRadius:10,
              color:"#E8B000", fontFamily:"'Syne',sans-serif", fontSize:11,
              fontWeight:700, letterSpacing:"2px", textTransform:"uppercase",
              cursor:"pointer", transition:"all 0.15s",
            }}>
              📷 Scanner un code-barres
            </button>
          ) : (
            <div style={{ position:"relative", borderRadius:10, overflow:"hidden", border:"0.5px solid #1A1A1A" }}>
              <video ref={videoRef} playsInline muted style={{ width:"100%", display:"block", maxHeight:240, objectFit:"cover" }} />
              {/* Viseur */}
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
                <div style={{ width:220, height:80, border:"2px solid #E8B000", borderRadius:4, boxShadow:"0 0 0 2000px rgba(0,0,0,0.4)" }}>
                  <div style={{ position:"absolute", top:0, left:0, width:16, height:16, borderTop:"3px solid #E8B000", borderLeft:"3px solid #E8B000" }}/>
                  <div style={{ position:"absolute", top:0, right:0, width:16, height:16, borderTop:"3px solid #E8B000", borderRight:"3px solid #E8B000" }}/>
                  <div style={{ position:"absolute", bottom:0, left:0, width:16, height:16, borderBottom:"3px solid #E8B000", borderLeft:"3px solid #E8B000" }}/>
                  <div style={{ position:"absolute", bottom:0, right:0, width:16, height:16, borderBottom:"3px solid #E8B000", borderRight:"3px solid #E8B000" }}/>
                </div>
              </div>
              <button onClick={stopCamera} style={{
                position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)",
                border:"0.5px solid #333", color:"#888", padding:"4px 10px",
                borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"'Syne',sans-serif",
              }}>✕ Stop</button>
              <div style={{ position:"absolute", bottom:8, left:0, right:0, textAlign:"center", fontSize:10, color:"rgba(232,176,0,0.8)", letterSpacing:"2px" }}>
                POINTEZ LE CODE-BARRES
              </div>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display:"none" }} />
        </div>
      )}

      {/* Mode upload */}
      {!product && mode === "upload" && (
        <label style={{
          display:"block", width:"100%", padding:"14px", background:"rgba(232,176,0,0.05)",
          border:"0.5px dashed rgba(232,176,0,0.3)", borderRadius:10, textAlign:"center",
          color:"#E8B000", fontFamily:"'Syne',sans-serif", fontSize:11,
          fontWeight:700, letterSpacing:"2px", textTransform:"uppercase",
          cursor:"pointer", transition:"all 0.15s",
        }}>
          🖼 Choisir une photo du code-barres
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display:"none" }} />
        </label>
      )}

      {/* Mode manuel */}
      {!product && mode === "manual" && (
        <div style={{ display:"flex", gap:8 }}>
          <input
            value={manualCode}
            onChange={e => setManualCode(e.target.value.replace(/\D/g, "").slice(0, 14))}
            onKeyDown={e => e.key === "Enter" && manualCode.length >= 8 && fetchProduct(manualCode)}
            placeholder="Ex : 3017620422003"
            inputMode="numeric"
            style={{
              flex:1, background:"#0D0D0D", border:"0.5px solid #242424",
              borderRadius:10, padding:"11px 14px", color:"#F0EDE8",
              fontFamily:"'Cormorant Garamond',serif", fontSize:15,
              outline:"none", letterSpacing:"2px",
            }}
          />
          <button
            onClick={() => fetchProduct(manualCode)}
            disabled={manualCode.length < 8 || loading}
            style={{
              background: manualCode.length >= 8 ? "rgba(232,176,0,0.12)" : "transparent",
              border:`0.5px solid ${manualCode.length >= 8 ? "rgba(232,176,0,0.4)" : "#1A1A1A"}`,
              color: manualCode.length >= 8 ? "#E8B000" : "#333",
              fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
              letterSpacing:"1.5px", textTransform:"uppercase",
              padding:"0 14px", borderRadius:10, cursor: manualCode.length >= 8 ? "pointer" : "not-allowed",
              transition:"all 0.15s", whiteSpace:"nowrap",
            }}
          >
            {loading ? "⏳" : "Chercher"}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:"center", padding:"16px 0", fontSize:12, color:"#555", letterSpacing:"2px" }}>
          Recherche du produit…
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{ fontSize:11, color:"#E07070", padding:"8px 12px", background:"rgba(224,112,112,0.06)", border:"0.5px solid rgba(224,112,112,0.2)", borderRadius:8 }}>
          {error}
        </div>
      )}

      {/* Fiche produit */}
      {product && macros && (
        <div style={{ background:"rgba(232,176,0,0.04)", border:"0.5px solid rgba(232,176,0,0.2)", borderRadius:12, padding:"14px 16px" }}>

          {/* En-tête produit */}
          <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:12 }}>
            {product.image && (
              <img src={product.image} alt={product.nom} style={{ width:52, height:52, objectFit:"contain", borderRadius:8, background:"#111", flexShrink:0 }} />
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#F0EDE8", fontFamily:"'Syne',sans-serif", marginBottom:2, lineHeight:1.3 }}>
                {product.nom}
              </div>
              {product.marque && (
                <div style={{ fontSize:10, color:"#555", letterSpacing:"1px", marginBottom:4 }}>{product.marque}</div>
              )}
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                {product.nutriscore && (
                  <span style={{
                    fontSize:10, fontWeight:800, color:"#0A0A0A",
                    background: NUTRISCORE_COLORS[product.nutriscore] || "#555",
                    padding:"2px 7px", borderRadius:10, letterSpacing:"1px",
                  }}>
                    {product.nutriscore}
                  </span>
                )}
                <span style={{ fontSize:10, color:"#555" }}>via Open Food Facts</span>
              </div>
            </div>
          </div>

          {/* Quantité */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, padding:"10px 12px", background:"#0D0D0D", borderRadius:8 }}>
            <span style={{ fontSize:11, color:"#555", letterSpacing:"1px", flex:1 }}>Quantité consommée</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <button onClick={() => setQuantity(q => Math.max(10, q - 10))} style={{ background:"#1A1A1A", border:"none", color:"#888", width:26, height:26, borderRadius:6, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Math.min(2000, parseInt(e.target.value) || 1)))}
                style={{ width:52, textAlign:"center", background:"transparent", border:"0.5px solid #242424", borderRadius:6, padding:"4px", color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700 }}
              />
              <span style={{ fontSize:11, color:"#555" }}>g</span>
              <button onClick={() => setQuantity(q => Math.min(2000, q + 10))} style={{ background:"#1A1A1A", border:"none", color:"#888", width:26, height:26, borderRadius:6, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
            </div>
          </div>

          {/* Macros calculées */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:14 }}>
            {[
              { label:"Calories", val:`${macros.calories}`, unit:"kcal", color:"#E8B000" },
              { label:"Protéines", val:`${macros.proteines}`, unit:"g", color:"#7AE07A" },
              { label:"Glucides", val:`${macros.glucides}`, unit:"g", color:"#F5C832" },
              { label:"Lipides", val:`${macros.lipides}`, unit:"g", color:"#88A0E0" },
            ].map(m => (
              <div key={m.label} style={{ background:"#0D0D0D", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                <div style={{ fontSize:15, fontWeight:700, color:m.color, fontFamily:"'Syne',sans-serif" }}>{m.val}</div>
                <div style={{ fontSize:9, color:"#555", letterSpacing:"1px" }}>{m.unit}</div>
                <div style={{ fontSize:9, color:"#333", letterSpacing:"0.5px", marginTop:1 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={reset} style={{
              flex:1, padding:"10px", background:"transparent",
              border:"0.5px solid #242424", borderRadius:8, color:"#555",
              fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
              letterSpacing:"1.5px", textTransform:"uppercase", cursor:"pointer",
            }}>
              ← Nouveau scan
            </button>
            <button onClick={handleSave} disabled={saving || saved} style={{
              flex:2, padding:"10px",
              background: saved ? "rgba(122,224,122,0.15)" : "linear-gradient(135deg,#E8B000,#C49200)",
              border: saved ? "0.5px solid rgba(122,224,122,0.4)" : "none",
              borderRadius:8, color: saved ? "#7AE07A" : "#0A0A0A",
              fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
              letterSpacing:"2px", textTransform:"uppercase", cursor: saving ? "not-allowed" : "pointer",
              transition:"all 0.2s",
            }}>
              {saved ? "✓ Enregistré" : saving ? "Enregistrement…" : "Enregistrer →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
