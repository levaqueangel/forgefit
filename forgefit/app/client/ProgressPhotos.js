"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { storage, db } from "../firebase";

// ── Compression légère côté client avant upload ───────────────────────────────
function compressImage(file, maxPx = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const W = Math.round(img.width  * scale);
      const H = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width  = W;
      canvas.height = H;
      canvas.getContext("2d").drawImage(img, 0, 0, W, H);
      canvas.toBlob(resolve, "image/jpeg", quality);
    };
    img.src = url;
  });
}

const TAG_LABELS = { avant: "Avant", apres: "Après", progres: "Progrès" };
const TAG_COLORS = { avant: "#E07070", apres: "#7AE07A", progres: "#C9A84C" };

export function ProgressPhotos({ user, clientData, setClientData, addToast }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTag, setSelectedTag] = useState("progres");
  const [compare, setCompare] = useState(null); // { avant, apres }
  const [preview, setPreview] = useState(null);  // URL photo plein écran
  const inputRef = useRef(null);

  /* Charge les photos depuis Firestore */
  const loadPhotos = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDoc(doc(db, "clients", user.uid));
      const data = snap.data();
      setPhotos(data?.progressPhotos || []);
    } catch {}
  }, [user]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  /* Auto-compare : prend la 1ère "avant" et la 1ère "après" */
  useEffect(() => {
    const avant  = photos.find(p => p.tag === "avant");
    const apres  = photos.find(p => p.tag === "apres");
    if (avant && apres) setCompare({ avant, apres });
    else setCompare(null);
  }, [photos]);

  /* Upload */
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    e.target.value = "";

    setUploading(true);
    setProgress(0);

    try {
      const blob   = await compressImage(file);
      const ts     = Date.now();
      const path   = `progress_photos/${user.uid}/${ts}_${selectedTag}.jpg`;
      const storRef = ref(storage, path);

      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storRef, blob, { contentType: "image/jpeg" });
        task.on(
          "state_changed",
          (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => {
            const url = await getDownloadURL(storRef);
            const entry = { url, tag: selectedTag, path, date: new Date().toISOString().slice(0, 10) };

            await updateDoc(doc(db, "clients", user.uid), {
              progressPhotos: arrayUnion(entry),
            });
            setPhotos(prev => [...prev, entry]);
            addToast?.(`📸 Photo "${TAG_LABELS[selectedTag]}" ajoutée !`, "success");
            resolve();
          },
        );
      });
    } catch {
      addToast?.("Erreur lors de l'upload", "error");
    }

    setUploading(false);
    setProgress(0);
  };

  /* Suppression */
  const handleDelete = async (photo) => {
    if (!user?.uid) return;
    try {
      /* Supprime du Storage */
      try { await deleteObject(ref(storage, photo.path)); } catch {}
      /* Supprime de Firestore */
      await updateDoc(doc(db, "clients", user.uid), {
        progressPhotos: arrayRemove(photo),
      });
      setPhotos(prev => prev.filter(p => p.path !== photo.path));
      addToast?.("Photo supprimée", "success");
    } catch {
      addToast?.("Erreur suppression", "error");
    }
  };

  return (
    <div style={{
      background: "rgba(201,168,76,0.02)",
      border: "0.5px solid #1A1A1A",
      borderRadius: 14, padding: "16px 18px",
    }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
            📸 Photos de progression
          </div>
          <div style={{ fontSize: 11, color: "#333", fontFamily: "'Cormorant Garamond',serif" }}>
            Documente ta transformation
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#555" }}>{photos.length} photo{photos.length !== 1 ? "s" : ""}</div>
      </div>

      {/* ── Tag selector + Upload ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {Object.entries(TAG_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedTag(key)}
            style={{
              flex: 1, padding: "7px 6px", borderRadius: 8, cursor: "pointer",
              border: `0.5px solid ${selectedTag === key ? TAG_COLORS[key] : "#1E1E1E"}`,
              background: selectedTag === key ? `rgba(${key === "avant" ? "224,112,112" : key === "apres" ? "122,224,122" : "201,168,76"},0.08)` : "#0D0D0D",
              color: selectedTag === key ? TAG_COLORS[key] : "#555",
              fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700,
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "7px 16px", borderRadius: 8, cursor: uploading ? "wait" : "pointer",
            border: "0.5px solid rgba(201,168,76,0.3)",
            background: "rgba(201,168,76,0.08)",
            color: "#C9A84C", fontSize: 11, fontFamily: "'Syne',sans-serif",
            fontWeight: 700, whiteSpace: "nowrap",
            opacity: uploading ? 0.6 : 1, transition: "all 0.15s",
          }}
        >
          {uploading ? `${progress}%` : "+ Ajouter"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
      </div>

      {/* Barre de progression upload */}
      {uploading && (
        <div style={{ height: 3, background: "#1A1A1A", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#C9A84C,#5DCAA5)", borderRadius: 2, transition: "width 0.2s" }} />
        </div>
      )}

      {/* ── Comparaison côte à côte ── */}
      {compare && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#C9A84C", marginBottom: 8 }}>
            Comparaison avant / après
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[{ photo: compare.avant, label: "Avant" }, { photo: compare.apres, label: "Après" }].map(({ photo, label }) => (
              <div key={label} style={{ position: "relative", cursor: "pointer" }} onClick={() => setPreview(photo.url)}>
                <img
                  src={photo.url} alt={label}
                  style={{
                    width: "100%", aspectRatio: "3/4", objectFit: "cover",
                    borderRadius: 10, display: "block",
                    border: `0.5px solid ${label === "Avant" ? "rgba(224,112,112,0.4)" : "rgba(122,224,122,0.4)"}`,
                  }}
                />
                <div style={{
                  position: "absolute", bottom: 8, left: 8,
                  background: "rgba(10,10,10,0.85)", borderRadius: 6,
                  padding: "3px 8px", fontSize: 10, fontFamily: "'Syne',sans-serif",
                  fontWeight: 700, color: label === "Avant" ? "#E07070" : "#7AE07A",
                  letterSpacing: "1px",
                }}>
                  {label.toUpperCase()}
                </div>
                <div style={{
                  position: "absolute", bottom: 8, right: 8,
                  background: "rgba(10,10,10,0.8)", borderRadius: 6,
                  padding: "3px 6px", fontSize: 9, color: "#555",
                }}>
                  {photo.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Grille de toutes les photos ── */}
      {photos.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
          {photos.map((photo, i) => (
            <div
              key={i}
              style={{ position: "relative", cursor: "pointer", borderRadius: 8, overflow: "hidden", aspectRatio: "1" }}
            >
              <img
                src={photo.url} alt={TAG_LABELS[photo.tag] || photo.tag}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onClick={() => setPreview(photo.url)}
              />
              {/* Tag badge */}
              <div style={{
                position: "absolute", top: 6, left: 6,
                background: "rgba(10,10,10,0.85)", borderRadius: 4,
                padding: "2px 6px", fontSize: 9, fontFamily: "'Syne',sans-serif",
                fontWeight: 700, color: TAG_COLORS[photo.tag] || "#C9A84C",
                letterSpacing: "0.5px",
              }}>
                {(TAG_LABELS[photo.tag] || photo.tag).toUpperCase()}
              </div>
              {/* Bouton suppression */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                style={{
                  position: "absolute", top: 5, right: 5,
                  width: 24, height: 24, borderRadius: "50%",
                  background: "rgba(10,10,10,0.85)", border: "0.5px solid #333",
                  color: "#888", fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                ×
              </button>
              {/* Date */}
              <div style={{
                position: "absolute", bottom: 6, left: 6,
                background: "rgba(10,10,10,0.75)", borderRadius: 4,
                padding: "1px 5px", fontSize: 9, color: "#555",
              }}>
                {photo.date}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📷</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: "#333", fontStyle: "italic" }}>
            Ajoute ta première photo de progression
          </div>
          <div style={{ fontSize: 11, color: "#2A2A2A", marginTop: 6 }}>
            Sélectionne "Avant", "Après" ou "Progrès"<br/>puis clique sur + Ajouter
          </div>
        </div>
      )}

      {/* ── Lightbox plein écran ── */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <img
            src={preview} alt="Photo plein écran"
            style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 12 }}
          />
          <button
            onClick={() => setPreview(null)}
            style={{
              position: "absolute", top: 20, right: 20,
              background: "rgba(10,10,10,0.9)", border: "0.5px solid #333",
              width: 36, height: 36, borderRadius: "50%",
              color: "#F0EDE8", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
