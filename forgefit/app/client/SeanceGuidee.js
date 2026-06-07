"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function parseCharge(str) {
  if (!str) return 0;
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// ── Composant timer circulaire ────────────────────────────────────────────────
function CircularTimer({ value, max, size = 180 }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  const dash = circ * pct;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A1A1A" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#C9A84C" strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 0.9s linear" }}
      />
    </svg>
  );
}

// ── Bouton réutilisable ───────────────────────────────────────────────────────
function Btn({ onClick, children, variant = "primary", disabled, style: extra }) {
  const base = {
    border: "none", fontFamily: "'Syne',sans-serif", fontWeight: 700,
    fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase",
    padding: "14px 24px", cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s", opacity: disabled ? 0.4 : 1, width: "100%",
    ...extra,
  };
  const variants = {
    primary:   { background: "linear-gradient(135deg,#C9A84C,#A67C2E)", color: "#0A0A0A" },
    secondary: { background: "#141414", border: "0.5px solid #2A2A2A", color: "#888" },
    danger:    { background: "rgba(224,112,112,0.12)", border: "0.5px solid rgba(224,112,112,0.3)", color: "#E07070" },
    ghost:     { background: "transparent", border: "0.5px solid #2A2A2A", color: "#555" },
  };
  return <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

// ── Input numérique ────────────────────────────────────────────────────────────
function NumInput({ label, value, onChange, unit, step = 1 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
      <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#555" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#111", border: "0.5px solid #2A2A2A", width: "100%" }}>
        <button onClick={() => onChange(Math.max(0, Number(value) - step))} style={{
          background: "transparent", border: "none", color: "#555", fontSize: 20,
          padding: "10px 16px", cursor: "pointer", flexShrink: 0,
        }}>−</button>
        <input
          type="number" value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            background: "transparent", border: "none", color: "#F0EDE8",
            fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22,
            textAlign: "center", flex: 1, width: 0, outline: "none",
          }}
        />
        <button onClick={() => onChange(Number(value) + step)} style={{
          background: "transparent", border: "none", color: "#C9A84C", fontSize: 20,
          padding: "10px 16px", cursor: "pointer", flexShrink: 0,
        }}>+</button>
      </div>
      <div style={{ fontSize: 10, color: "#444" }}>{unit}</div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function SeanceGuidee({ seance, user, addToast, onClose, onComplete }) {
  // seance: { nom, duree_min, exercices: [{nom, series, reps, charge, repos_sec}] }

  const exercices = seance.exercices || [];
  const totalExos = exercices.length;

  // ── État global ──────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState("intro"); // intro|serie|repos|fin|saving|done
  const [exoIdx, setExoIdx] = useState(0);
  const [serieIdx, setSerieIdx] = useState(0);
  const [startTime] = useState(Date.now());
  const [lastSeance, setLastSeance] = useState(null);
  const [rating, setRating] = useState({ difficulte: 3, energie: "bonne" });
  const [saveResult, setSaveResult] = useState(null);

  // ── Log par exercice × série ──────────────────────────────────────────────
  const [log, setLog] = useState(() =>
    exercices.map(e =>
      Array.from({ length: Math.max(1, parseInt(e.series) || 3) }, () => ({
        repsTarget: parseInt(e.reps) || 8,
        repsActuel: parseInt(e.reps) || 8,
        poidsTarget: parseCharge(e.charge),
        poidsActuel: parseCharge(e.charge),
        done: false,
      }))
    )
  );

  // ── Timer repos ───────────────────────────────────────────────────────────
  const [restMax, setRestMax] = useState(90);
  const [restTime, setRestTime] = useState(90);
  const intervalRef = useRef(null);
  const advanceRef  = useRef(null); // toujours la version fraîche d'advanceAfterRest

  const clearTimer = () => { clearInterval(intervalRef.current); intervalRef.current = null; };

  // ── Chargement historique ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/seance?uid=${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const { historique } = await res.json();
          const last = (historique || []).reverse().find(h => h.seanceNom === seance.nom);
          setLastSeance(last || null);
        }
      } catch {}
    };
    load();
  }, []);

  // ── Dernière charge connue pour un exercice ────────────────────────────────
  const getLastPoids = useCallback((nom) => {
    if (!lastSeance) return null;
    const exo = lastSeance.exercices?.find(e => e.nom === nom);
    if (!exo) return null;
    const done = (exo.series || []).filter(s => s.done && s.poidsActuel > 0);
    if (!done.length) return null;
    return done[done.length - 1].poidsActuel;
  }, [lastSeance]);

  // ── Avancer après le repos ────────────────────────────────────────────────
  const advanceAfterRest = useCallback(() => {
    const totalSeries = log[exoIdx]?.length || 3;
    if (serieIdx + 1 < totalSeries) {
      setSerieIdx(s => s + 1);
      setPhase("serie");
    } else if (exoIdx + 1 < totalExos) {
      setExoIdx(e => e + 1);
      setSerieIdx(0);
      setPhase("serie");
    } else {
      setPhase("fin");
    }
  }, [exoIdx, serieIdx, totalExos, log]);

  // Maintenir le ref à jour pour éviter la stale closure dans l'interval
  useEffect(() => { advanceRef.current = advanceAfterRest; }, [advanceAfterRest]);

  // ── Démarrer le timer ──────────────────────────────────────────────────────
  const startRest = useCallback((dur) => {
    clearTimer();
    setRestMax(dur);
    setRestTime(dur);
    setPhase("repos");
    intervalRef.current = setInterval(() => {
      setRestTime(t => {
        if (t <= 1) {
          clearTimer();
          advanceRef.current?.(); // toujours la version fraîche
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []); // pas de dépendances — utilise advanceRef

  useEffect(() => () => clearTimer(), []);

  // ── Valider une série ──────────────────────────────────────────────────────
  const markDone = () => {
    setLog(prev => prev.map((exo, ei) =>
      ei === exoIdx
        ? exo.map((s, si) => si === serieIdx ? { ...s, done: true } : s)
        : exo
    ));

    const totalSeries = log[exoIdx]?.length || 3;
    const isLastSet = serieIdx + 1 >= totalSeries;
    const isLastExo = exoIdx + 1 >= totalExos;

    if (isLastSet && isLastExo) {
      setPhase("fin");
    } else {
      const repos = parseInt(exercices[exoIdx]?.repos_sec) || 90;
      startRest(repos);
    }
  };

  // ── Passer le repos ─────────────────────────────────────────────────────────
  const skipRest = () => { clearTimer(); advanceAfterRest(); };

  // ── Mettre à jour une valeur du log ─────────────────────────────────────────
  const updateLog = (field, val) => {
    setLog(prev => prev.map((exo, ei) =>
      ei === exoIdx
        ? exo.map((s, si) => si === serieIdx ? { ...s, [field]: val } : s)
        : exo
    ));
  };

  // ── Sauvegarder ─────────────────────────────────────────────────────────────
  const saveSeance = async () => {
    setPhase("saving");
    const dureeMin = Math.round((Date.now() - startTime) / 60000);

    try {
      const token = user ? await user.getIdToken() : null;
      const res = await fetch("/api/seance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          uid: user?.uid,
          seanceNom: seance.nom,
          date: new Date().toDateString(),
          dateTs: Date.now(),
          dureeMin,
          exercices: exercices.map((e, ei) => ({
            nom: e.nom,
            series: log[ei] || [],
          })),
          rating,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveResult(data);
        setPhase("done");
        onComplete?.();
        addToast?.(`💪 Séance "${seance.nom}" enregistrée !`, "success");
      } else {
        addToast?.(data.error || "Erreur sauvegarde", "error");
        setPhase("fin");
      }
    } catch {
      addToast?.("Erreur de connexion.", "error");
      setPhase("fin");
    }
  };

  // ── Stats globales ────────────────────────────────────────────────────────
  const doneCount = log.flat().filter(s => s.done).length;
  const totalCount = log.flat().length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const currentExo = exercices[exoIdx];
  const currentLog = log[exoIdx]?.[serieIdx];
  const totalSeries = log[exoIdx]?.length || 3;

  // ── Styles communs ────────────────────────────────────────────────────────
  const overlay = {
    position: "fixed", inset: 0, background: "#080808", zIndex: 1000,
    display: "flex", flexDirection: "column", overflowY: "auto",
    fontFamily: "'Syne',sans-serif",
  };
  const header = {
    padding: "14px 18px", borderBottom: "0.5px solid #1A1A1A",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexShrink: 0, position: "sticky", top: 0, background: "#080808", zIndex: 10,
  };
  const content = {
    flex: 1, padding: "28px 20px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 24, maxWidth: 460, margin: "0 auto", width: "100%",
  };
  const card = {
    background: "#111", border: "0.5px solid #1A1A1A",
    padding: "18px", width: "100%",
  };

  // ══ PHASE : INTRO ═══════════════════════════════════════════════════════════
  if (phase === "intro") {
    return (
      <div style={overlay}>
        <div style={header}>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#444", fontSize:20, cursor:"pointer" }}>✕</button>
          <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>Aperçu de la séance</div>
          <div style={{ width:32 }} />
        </div>

        <div style={content}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🏋️</div>
            <div style={{ fontSize:26, fontWeight:800, color:"#F0EDE8", marginBottom:8 }}>{seance.nom}</div>
            <div style={{ fontSize:12, color:"#555" }}>
              {totalExos} exercice{totalExos > 1 ? "s" : ""} · ~{seance.duree_min || 50} min
            </div>
          </div>

          {/* Barre de programme */}
          <div style={{ width:"100%", height:3, background:"#1A1A1A", borderRadius:2 }}>
            <div style={{ height:"100%", width:"0%", background:"linear-gradient(90deg,#C9A84C,#A67C2E)", borderRadius:2 }} />
          </div>

          {/* Liste des exercices */}
          <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:6 }}>
            {exercices.map((e, i) => {
              const last = getLastPoids(e.nom);
              return (
                <div key={i} style={{ ...card, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px" }}>
                  <div>
                    <div style={{ fontSize:13, color:"#F0EDE8", fontWeight:600, marginBottom:2 }}>{e.nom}</div>
                    <div style={{ fontSize:11, color:"#444" }}>
                      {e.series} × {e.reps} reps · {e.charge || "Poids du corps"}
                    </div>
                  </div>
                  {last != null && (
                    <div style={{ fontSize:10, color:"#C9A84C", background:"rgba(201,168,76,0.08)", padding:"3px 9px", border:"0.5px solid rgba(201,168,76,0.2)", whiteSpace:"nowrap" }}>
                      Dernier: {last}kg
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {lastSeance && (
            <div style={{ fontSize:11, color:"#555", textAlign:"center" }}>
              Dernière fois : {new Date(lastSeance.dateTs).toLocaleDateString("fr-FR")} · {lastSeance.dureeMin} min
            </div>
          )}

          <div style={{ width:"100%", paddingBottom:24 }}>
            <Btn onClick={() => setPhase("serie")}>Démarrer la séance →</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ══ PHASE : SÉRIE ═══════════════════════════════════════════════════════════
  if (phase === "serie") {
    const lastPoids = getLastPoids(currentExo?.nom);
    const diff = lastPoids != null && currentLog?.poidsActuel > 0
      ? currentLog.poidsActuel - lastPoids : null;

    return (
      <div style={overlay}>
        <div style={header}>
          <button onClick={() => { if(confirm("Abandonner la séance ?")) { clearTimer(); onClose(); } }}
            style={{ background:"transparent", border:"none", color:"#444", fontSize:13, cursor:"pointer", letterSpacing:"1px" }}>
            ✕ Abandonner
          </button>
          <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#C9A84C" }}>
            Exercice {exoIdx + 1}/{totalExos}
          </div>
          <div style={{ fontSize:11, color:"#555" }}>{progress}%</div>
        </div>

        {/* Barre de progression globale */}
        <div style={{ height:3, background:"#1A1A1A" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#C9A84C,#A67C2E)", transition:"width 0.4s" }} />
        </div>

        <div style={content}>
          {/* Nom de l'exercice */}
          <div style={{ textAlign:"center", width:"100%" }}>
            <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:8 }}>
              {seance.nom}
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:"#F0EDE8", marginBottom:6 }}>
              {currentExo?.nom}
            </div>
            {lastPoids != null && (
              <div style={{ fontSize:11, color:"#555" }}>
                Dernière fois : <span style={{ color:"#C9A84C" }}>{lastPoids} kg</span>
              </div>
            )}
          </div>

          {/* Indicateur de série */}
          <div style={{ display:"flex", gap:6 }}>
            {Array.from({ length: totalSeries }).map((_, i) => (
              <div key={i} style={{
                height:6, flex:1, borderRadius:3, transition:"background 0.3s",
                background: i < serieIdx ? "#7AE07A" : i === serieIdx ? "#C9A84C" : "#1A1A1A",
              }} />
            ))}
          </div>
          <div style={{ fontSize:12, color:"#888" }}>
            Série <span style={{ color:"#F0EDE8", fontWeight:700 }}>{serieIdx + 1}</span> sur {totalSeries}
          </div>

          {/* Inputs reps + poids */}
          <div style={{ ...card, display:"flex", gap:16 }}>
            <NumInput
              label="Reps" unit="répétitions"
              value={currentLog?.repsActuel ?? 8}
              onChange={v => updateLog("repsActuel", v)}
            />
            <div style={{ width:"0.5px", background:"#1A1A1A", flexShrink:0 }} />
            <NumInput
              label="Charge" unit="kilogrammes"
              value={currentLog?.poidsActuel ?? 0}
              step={2.5}
              onChange={v => updateLog("poidsActuel", v)}
            />
          </div>

          {/* Comparaison avec dernière séance */}
          {diff !== null && (
            <div style={{
              fontSize:11, padding:"8px 16px",
              color: diff > 0 ? "#7AE07A" : diff < 0 ? "#E07070" : "#888",
              background: diff > 0 ? "rgba(122,224,122,0.06)" : diff < 0 ? "rgba(224,112,112,0.06)" : "transparent",
              border: `0.5px solid ${diff > 0 ? "rgba(122,224,122,0.2)" : diff < 0 ? "rgba(224,112,112,0.2)" : "#1A1A1A"}`,
            }}>
              {diff > 0 ? `▲ +${diff}kg par rapport à la dernière fois` :
               diff < 0 ? `▼ ${diff}kg par rapport à la dernière fois` :
               "= Même charge que la dernière fois"}
            </div>
          )}

          {/* Cible du programme */}
          <div style={{ fontSize:11, color:"#444", textAlign:"center" }}>
            Cible programme : {currentExo?.series} × {currentExo?.reps} @ {currentExo?.charge || "poids du corps"}
          </div>

          {/* CTA */}
          <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:10, paddingBottom:24 }}>
            <Btn onClick={markDone}>✓ Série terminée</Btn>
            <Btn variant="ghost" onClick={() => {
              // Passer cette série sans la logger
              const repos = parseInt(currentExo?.repos_sec) || 90;
              const isLastSet = serieIdx + 1 >= totalSeries;
              const isLastExo = exoIdx + 1 >= totalExos;
              if (isLastSet && isLastExo) setPhase("fin");
              else startRest(repos);
            }}>
              Passer cette série
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  // ══ PHASE : REPOS ════════════════════════════════════════════════════════════
  if (phase === "repos") {
    return (
      <div style={overlay}>
        <div style={header}>
          <div style={{ width:60 }} />
          <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>Temps de repos</div>
          <div style={{ fontSize:11, color:"#555" }}>{progress}%</div>
        </div>
        <div style={{ height:3, background:"#1A1A1A" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#C9A84C,#A67C2E)", transition:"width 0.4s" }} />
        </div>

        <div style={{ ...content, justifyContent:"center" }}>
          <div style={{ fontSize:12, color:"#555", letterSpacing:"2px", textTransform:"uppercase" }}>
            Série {serieIdx} validée ✓
          </div>

          {/* Timer circulaire */}
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <CircularTimer value={restTime} max={restMax} size={200} />
            <div style={{ position:"absolute", textAlign:"center" }}>
              <div style={{ fontSize:44, fontWeight:800, color:"#F0EDE8", lineHeight:1 }}>{fmt(restTime)}</div>
              <div style={{ fontSize:10, color:"#555", letterSpacing:"2px", marginTop:4 }}>REPOS</div>
            </div>
          </div>

          {/* Prochain exercice */}
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, color:"#555", letterSpacing:"2px", textTransform:"uppercase", marginBottom:6 }}>
              Prochain
            </div>
            {serieIdx + 1 < totalSeries ? (
              <div style={{ fontSize:16, color:"#F0EDE8", fontWeight:700 }}>
                {currentExo?.nom} — Série {serieIdx + 2}/{totalSeries}
              </div>
            ) : exoIdx + 1 < totalExos ? (
              <div style={{ fontSize:16, color:"#F0EDE8", fontWeight:700 }}>
                {exercices[exoIdx + 1]?.nom}
                <span style={{ fontSize:12, color:"#555", fontWeight:400 }}> — Série 1</span>
              </div>
            ) : (
              <div style={{ fontSize:16, color:"#C9A84C", fontWeight:700 }}>Fin de séance 🎉</div>
            )}
          </div>

          {/* Ajuster le repos */}
          <div style={{ display:"flex", gap:8 }}>
            {[30, 60, 90, 120].map(t => (
              <button key={t} onClick={() => {
                clearTimer();
                setRestTime(t); setRestMax(t);
                intervalRef.current = setInterval(() => {
                  setRestTime(prev => {
                    if (prev <= 1) { clearTimer(); advanceRef.current?.(); return 0; }
                    return prev - 1;
                  });
                }, 1000);
              }} style={{
                background: restMax === t ? "rgba(201,168,76,0.15)" : "#111",
                border: `0.5px solid ${restMax === t ? "rgba(201,168,76,0.4)" : "#1A1A1A"}`,
                color: restMax === t ? "#C9A84C" : "#555",
                padding:"6px 12px", fontSize:11, cursor:"pointer", fontFamily:"'Syne',sans-serif",
              }}>
                {t}s
              </button>
            ))}
          </div>

          <div style={{ width:"100%", paddingBottom:24 }}>
            <Btn variant="secondary" onClick={skipRest}>Passer le repos →</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ══ PHASE : FIN (résumé + notation) ══════════════════════════════════════════
  if (phase === "fin") {
    const dureeMin = Math.round((Date.now() - startTime) / 60000);
    const totalPoidsLeve = log.flat()
      .filter(s => s.done && s.poidsActuel > 0)
      .reduce((sum, s) => sum + s.poidsActuel * s.repsActuel, 0);

    return (
      <div style={overlay}>
        <div style={header}>
          <div style={{ width:32 }} />
          <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#C9A84C" }}>Résumé de séance</div>
          <div style={{ width:32 }} />
        </div>

        <div style={content}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:8 }}>🎉</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#F0EDE8", marginBottom:4 }}>Séance terminée !</div>
            <div style={{ fontSize:12, color:"#555" }}>{seance.nom}</div>
          </div>

          {/* Stats rapides */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, width:"100%" }}>
            {[
              { label:"Durée", val:`${dureeMin} min`, icon:"⏱️" },
              { label:"Séries", val:`${doneCount}/${totalCount}`, icon:"✓" },
              { label:"Volume", val:totalPoidsLeve > 0 ? `${totalPoidsLeve}kg` : "—", icon:"🏋️" },
            ].map((s, i) => (
              <div key={i} style={{ ...card, textAlign:"center", padding:"14px 8px" }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:18, fontWeight:800, color:"#C9A84C" }}>{s.val}</div>
                <div style={{ fontSize:9, color:"#555", letterSpacing:"1.5px", textTransform:"uppercase", marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Récap exercices */}
          <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:6 }}>
            {exercices.map((e, ei) => (
              <div key={ei} style={{ ...card, padding:"12px 14px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#F0EDE8", marginBottom:8 }}>{e.nom}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {(log[ei] || []).map((s, si) => (
                    <div key={si} style={{
                      fontSize:11, padding:"4px 10px",
                      background: s.done ? "rgba(122,224,122,0.08)" : "rgba(255,255,255,0.03)",
                      border: `0.5px solid ${s.done ? "rgba(122,224,122,0.25)" : "#1A1A1A"}`,
                      color: s.done ? "#7AE07A" : "#444",
                    }}>
                      {s.done
                        ? `S${si + 1}: ${s.repsActuel}×${s.poidsActuel > 0 ? s.poidsActuel + "kg" : "PC"}`
                        : `S${si + 1}: —`}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Notation */}
          <div style={{ ...card, width:"100%" }}>
            <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:16 }}>
              Comment s'est passée la séance ?
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#888", marginBottom:10 }}>Difficulté perçue</div>
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { val:1, label:"😴 Facile" },
                  { val:3, label:"💪 OK" },
                  { val:5, label:"🔥 Dur" },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setRating(r => ({ ...r, difficulte: opt.val }))} style={{
                    flex:1, padding:"10px 6px", background: rating.difficulte === opt.val ? "rgba(201,168,76,0.12)" : "#0A0A0A",
                    border: `0.5px solid ${rating.difficulte === opt.val ? "rgba(201,168,76,0.4)" : "#1A1A1A"}`,
                    color: rating.difficulte === opt.val ? "#C9A84C" : "#555",
                    fontSize:12, cursor:"pointer", fontFamily:"'Syne',sans-serif", transition:"all 0.15s",
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize:11, color:"#888", marginBottom:10 }}>Niveau d'énergie</div>
              <div style={{ display:"flex", gap:8 }}>
                {["basse","bonne","excellente"].map(e => (
                  <button key={e} onClick={() => setRating(r => ({ ...r, energie: e }))} style={{
                    flex:1, padding:"10px 6px", background: rating.energie === e ? "rgba(122,224,122,0.08)" : "#0A0A0A",
                    border: `0.5px solid ${rating.energie === e ? "rgba(122,224,122,0.3)" : "#1A1A1A"}`,
                    color: rating.energie === e ? "#7AE07A" : "#555",
                    fontSize:11, cursor:"pointer", fontFamily:"'Syne',sans-serif", transition:"all 0.15s",
                    textTransform:"capitalize",
                  }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width:"100%", paddingBottom:24 }}>
            <Btn onClick={saveSeance}>Enregistrer la séance ✓</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ══ PHASE : SAVING ════════════════════════════════════════════════════════════
  if (phase === "saving") {
    return (
      <div style={{ ...overlay, alignItems:"center", justifyContent:"center", gap:20 }}>
        <div style={{ width:48, height:48, border:"3px solid #1A1A1A", borderTop:"3px solid #C9A84C", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <div style={{ fontSize:13, color:"#555", letterSpacing:"2px", textTransform:"uppercase" }}>Enregistrement…</div>
      </div>
    );
  }

  // ══ PHASE : DONE ═════════════════════════════════════════════════════════════
  if (phase === "done") {
    const dureeMin = Math.round((Date.now() - startTime) / 60000);
    return (
      <div style={{ ...overlay, alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", padding:32, display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
          <div style={{ fontSize:72 }}>🏆</div>
          <div style={{ fontSize:24, fontWeight:800, color:"#C9A84C" }}>Bravo !</div>
          <div style={{ fontSize:13, color:"#888", lineHeight:1.8 }}>
            Séance enregistrée · {dureeMin} min · {doneCount} séries validées
          </div>
          {saveResult?.newBadges?.length > 0 && (
            <div style={{ background:"rgba(201,168,76,0.08)", border:"0.5px solid rgba(201,168,76,0.3)", padding:"12px 20px", textAlign:"center" }}>
              <div style={{ fontSize:9, letterSpacing:"2px", color:"#C9A84C", textTransform:"uppercase", marginBottom:6 }}>Nouveau badge débloqué !</div>
              {saveResult.newBadges.map((b, i) => (
                <div key={i} style={{ fontSize:13, color:"#F0EDE8" }}>🏅 {b.label}</div>
              ))}
            </div>
          )}
          <button onClick={onClose} style={{
            background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none",
            color:"#0A0A0A", fontFamily:"'Syne',sans-serif", fontWeight:800,
            fontSize:12, letterSpacing:"2px", textTransform:"uppercase",
            padding:"14px 36px", cursor:"pointer", marginTop:8,
          }}>
            Retour au programme
          </button>
        </div>
      </div>
    );
  }

  return null;
}
