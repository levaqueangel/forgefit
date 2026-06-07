"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const JOURS_FULL = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
// Index JS : 0=dimanche, 1=lundi … 6=samedi → on remape
const JS_DAY = [6, 0, 1, 2, 3, 4, 5]; // JS getDay() → index notre tableau

const STORAGE_KEY = "apx_rappels";
const DEFAULT = { enabled: false, heures: ["07:30", "17:00"], jours: [0, 1, 2, 3, 4] }; // lun-ven

function load() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return DEFAULT; }
}
function save(cfg) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch {}
}

export function RappelsSection({ addToast }) {
  const [cfg, setCfg] = useState(load);
  const [permState, setPermState] = useState("default"); // default | granted | denied
  const timerRef = useRef(null);

  /* Lire la permission actuelle */
  useEffect(() => {
    if ("Notification" in window) setPermState(Notification.permission);
  }, []);

  /* Sauvegarder à chaque changement */
  useEffect(() => { save(cfg); }, [cfg]);

  /* Demander la permission et activer */
  const requestPermAndEnable = async () => {
    if (!("Notification" in window)) {
      addToast?.("Notifications non supportées par ce navigateur", "error");
      return;
    }
    const perm = await Notification.requestPermission();
    setPermState(perm);
    if (perm === "granted") {
      setCfg(c => ({ ...c, enabled: true }));
      addToast?.("🔔 Rappels activés !", "success");
    } else {
      addToast?.("Permission refusée — autorise les notifications dans les réglages", "error");
    }
  };

  const toggle = () => {
    if (!cfg.enabled) {
      if (permState === "granted") {
        setCfg(c => ({ ...c, enabled: true }));
        addToast?.("🔔 Rappels activés !", "success");
      } else {
        requestPermAndEnable();
      }
    } else {
      setCfg(c => ({ ...c, enabled: false }));
      addToast?.("Rappels désactivés", "success");
    }
  };

  /* Vérification toutes les 30s — envoie notif si l'heure correspond */
  const check = useCallback(() => {
    if (!cfg.enabled || permState !== "granted") return;
    const now = new Date();
    const jsDay = now.getDay(); // 0=dim
    const dayIdx = JS_DAY[jsDay]; // index dans notre tableau
    if (!cfg.jours.includes(dayIdx)) return;
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    const cur = `${hh}:${mm}`;
    cfg.heures.forEach(h => {
      if (h === cur) {
        const lastKey = `apx_notif_${h}_${now.toDateString()}`;
        if (localStorage.getItem(lastKey)) return; // déjà envoyée aujourd'hui
        localStorage.setItem(lastKey, "1");
        new Notification("⚡ APXFITNESS — C'est l'heure !", {
          body: `Ta séance du ${JOURS_FULL[dayIdx]} t'attend. Lance-toi ! 💪`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: `apx-rappel-${h}`,
        });
      }
    });
  }, [cfg, permState]);

  useEffect(() => {
    check();
    timerRef.current = setInterval(check, 30000);
    return () => clearInterval(timerRef.current);
  }, [check]);

  /* Toggles heures / jours */
  const toggleJour = (i) => setCfg(c => ({
    ...c,
    jours: c.jours.includes(i) ? c.jours.filter(j => j !== i) : [...c.jours, i],
  }));

  const updateHeure = (idx, val) => setCfg(c => {
    const h = [...c.heures];
    h[idx] = val;
    return { ...c, heures: h };
  });

  const addHeure = () => {
    if (cfg.heures.length >= 3) return;
    setCfg(c => ({ ...c, heures: [...c.heures, "08:00"] }));
  };

  const removeHeure = (idx) => setCfg(c => ({
    ...c, heures: c.heures.filter((_, i) => i !== idx),
  }));

  /* Test manuel */
  const testNotif = () => {
    if (permState !== "granted") { requestPermAndEnable(); return; }
    new Notification("⚡ APXFITNESS — Test rappel", {
      body: "Tes rappels d'entraînement sont bien configurés !",
      icon: "/favicon.ico",
      tag: "apx-test",
    });
    addToast?.("Notification de test envoyée !", "success");
  };

  return (
    <div style={{
      background: cfg.enabled
        ? "rgba(201,168,76,0.04)"
        : "rgba(30,30,30,0.5)",
      border: `0.5px solid ${cfg.enabled ? "rgba(201,168,76,0.25)" : "#1A1A1A"}`,
      borderRadius: 14, padding: "16px 18px",
      transition: "all 0.3s",
    }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: cfg.enabled ? "#C9A84C" : "#555", marginBottom: 4 }}>
            🔔 Rappels d'entraînement
          </div>
          <div style={{ fontSize: 11, color: "#444", fontFamily: "'Cormorant Garamond',serif" }}>
            {cfg.enabled ? "Notifications activées" : "Ne rate aucune séance"}
          </div>
        </div>
        {/* Toggle switch */}
        <button
          onClick={toggle}
          style={{
            width: 46, height: 26, borderRadius: 13, border: "none",
            background: cfg.enabled ? "#C9A84C" : "#1A1A1A",
            cursor: "pointer", position: "relative", transition: "background 0.25s",
            flexShrink: 0,
          }}
        >
          <div style={{
            position: "absolute", top: 3, left: cfg.enabled ? 23 : 3,
            width: 20, height: 20, borderRadius: "50%",
            background: cfg.enabled ? "#0A0A0A" : "#333",
            transition: "left 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }} />
        </button>
      </div>

      {/* Permission refusée */}
      {permState === "denied" && (
        <div style={{
          background: "rgba(224,112,112,0.08)", border: "0.5px solid rgba(224,112,112,0.25)",
          borderRadius: 8, padding: "10px 12px", marginBottom: 12,
          fontSize: 12, color: "#E07070", fontFamily: "'Syne',sans-serif",
        }}>
          ⚠ Notifications bloquées — autorise-les dans les réglages de ton navigateur.
        </div>
      )}

      {cfg.enabled && permState === "granted" && (
        <>
          {/* ── Jours ── */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>
              Jours
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {JOURS.map((j, i) => (
                <button
                  key={i}
                  onClick={() => toggleJour(i)}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 8, cursor: "pointer",
                    border: `0.5px solid ${cfg.jours.includes(i) ? "rgba(201,168,76,0.5)" : "#1A1A1A"}`,
                    background: cfg.jours.includes(i) ? "rgba(201,168,76,0.12)" : "#0D0D0D",
                    color: cfg.jours.includes(i) ? "#C9A84C" : "#444",
                    fontSize: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700,
                    transition: "all 0.15s",
                  }}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          {/* ── Heures ── */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>
              Heures ({cfg.heures.length}/3)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cfg.heures.map((h, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="time"
                    value={h}
                    onChange={e => updateHeure(idx, e.target.value)}
                    style={{
                      flex: 1, background: "#0D0D0D", border: "0.5px solid #1E1E1E",
                      color: "#F0EDE8", fontFamily: "'Syne',sans-serif", fontSize: 13,
                      padding: "8px 12px", borderRadius: 8, outline: "none",
                      colorScheme: "dark",
                    }}
                  />
                  {cfg.heures.length > 1 && (
                    <button
                      onClick={() => removeHeure(idx)}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(224,112,112,0.1)", border: "0.5px solid rgba(224,112,112,0.2)",
                        color: "#E07070", cursor: "pointer", fontSize: 14,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {cfg.heures.length < 3 && (
                <button
                  onClick={addHeure}
                  style={{
                    background: "transparent", border: "0.5px dashed #1E1E1E",
                    color: "#444", fontSize: 11, fontFamily: "'Syne',sans-serif",
                    padding: "7px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  + Ajouter une heure
                </button>
              )}
            </div>
          </div>

          {/* Test */}
          <button
            onClick={testNotif}
            style={{
              background: "transparent", border: "0.5px solid #1E1E1E",
              color: "#555", fontFamily: "'Syne',sans-serif", fontSize: 10,
              fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
              padding: "8px 0", cursor: "pointer", width: "100%", borderRadius: 8,
              transition: "all 0.2s",
            }}
          >
            Tester la notification →
          </button>
        </>
      )}

      {!cfg.enabled && permState !== "denied" && (
        <div style={{ fontSize: 12, color: "#2A2A2A", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", textAlign: "center", paddingTop: 4 }}>
          Active pour recevoir des rappels quand l'app est ouverte
        </div>
      )}
    </div>
  );
}
