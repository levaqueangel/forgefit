"use client";
import { useState } from "react";
import { ChargesTab } from "./ChargesTab";
import { ExerciceGif } from "./ExerciceGif";
import { OneRMCalc } from "./OneRMCalc";
import { SeanceGuidee } from "./SeanceGuidee";

// Convertit "90 secondes" / "90s" / "1min30" → nombre entier de secondes
function parseReposSec(str) {
  if (!str) return 90;
  if (typeof str === "number") return str;
  const s = String(str).toLowerCase().trim();
  const min = s.match(/(\d+)\s*min/);
  const sec = s.match(/(\d+)\s*s/);
  return (min ? parseInt(min[1]) * 60 : 0) + (sec ? parseInt(sec[1]) : 0) || 90;
}

// ── Affichage structuré du programme complet ──────────────────────────────────
function ProgrammeComplet({ data, texte, S }) {
  const [openSeance, setOpenSeance] = useState(null);

  // Pas de données structurées → fallback texte
  if (!data?.seances?.length) {
    return (
      <div style={S.card}>
        <div style={S.cardTitle}>📋 Programme complet</div>
        <pre style={{fontFamily:"'Courier New',monospace",fontSize:12,color:"#555",whiteSpace:"pre-wrap",lineHeight:1.8,paddingTop:4}}>
          {texte}
        </pre>
      </div>
    );
  }

  // Grouper les séances par phase (semaines)
  const phases = {};
  data.seances.forEach(s => {
    const key = s.semaines || "Programme";
    if (!phases[key]) phases[key] = { label: s.phase || key, seances: [] };
    phases[key].seances.push(s);
  });

  return (
    <div style={S.card}>
      {/* En-tête */}
      <div style={{marginBottom:16}}>
        <div style={S.cardTitle}>📋 Programme complet</div>
        {data.message_perso && (
          <div style={{fontSize:12,color:"rgba(201,168,76,0.7)",fontStyle:"italic",lineHeight:1.6,marginTop:4,borderLeft:"2px solid rgba(201,168,76,0.3)",paddingLeft:10}}>
            {data.message_perso}
          </div>
        )}
      </div>

      {/* Méta : objectif / niveau / durée */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {data.objectif_principal && <span style={tagStyle("#C9A84C")}>🎯 {data.objectif_principal}</span>}
        {data.niveau && <span style={tagStyle("#5DCAA5")}>📶 {data.niveau}</span>}
        {data.seances_par_semaine && <span style={tagStyle("#7A8ECC")}>📅 {data.seances_par_semaine}×/sem</span>}
        {data.duree_programme_semaines && <span style={tagStyle("#888")}>⏳ {data.duree_programme_semaines} sem.</span>}
      </div>

      {/* Nutrition */}
      {data.nutrition && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>
          {[
            { label:"Calories", val:`${data.nutrition.calories_jour} kcal`, color:"#C9A84C" },
            { label:"Protéines", val:`${data.nutrition.proteines_g}g`, color:"#7AE07A" },
            { label:"Glucides", val:`${data.nutrition.glucides_g}g`, color:"#5DCAA5" },
            { label:"Lipides", val:`${data.nutrition.lipides_g}g`, color:"#CC8844" },
          ].map((m,i) => (
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"0.5px solid #1E1E1E",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
              <div style={{fontSize:13,fontWeight:700,color:m.color,fontFamily:"'Syne',sans-serif"}}>{m.val}</div>
              <div style={{fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:"1px",marginTop:2}}>{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Phases & séances */}
      {Object.entries(phases).map(([key, phase]) => (
        <div key={key} style={{marginBottom:16}}>
          {/* En-tête de phase */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{flex:1,height:"0.5px",background:"#1A1A1A"}} />
            <span style={{fontSize:9,color:"#C9A84C",letterSpacing:"2px",textTransform:"uppercase",whiteSpace:"nowrap"}}>
              Sem. {key} — {phase.label}
            </span>
            <div style={{flex:1,height:"0.5px",background:"#1A1A1A"}} />
          </div>

          {/* Cartes séances */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {phase.seances.map((s, si) => {
              const id = `${key}-${si}`;
              const open = openSeance === id;
              return (
                <div key={si} style={{border:"0.5px solid #1A1A1A",borderRadius:10,overflow:"hidden"}}>
                  {/* Header séance — cliquable */}
                  <button
                    onClick={() => setOpenSeance(open ? null : id)}
                    style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(255,255,255,0.015)",border:"none",cursor:"pointer",textAlign:"left",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                      <span style={{fontSize:14}}>🏋️</span>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#F0EDE8",fontFamily:"'Syne',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.nom}</div>
                        <div style={{fontSize:10,color:"#444",marginTop:1}}>{s.jour} · {s.duree_min} min · {s.exercices?.length||0} exercices</div>
                      </div>
                    </div>
                    <span style={{fontSize:12,color:"#C9A84C",flexShrink:0,transition:"transform 0.2s",transform:open?"rotate(180deg)":"none"}}>▾</span>
                  </button>

                  {/* Corps séance — accordéon */}
                  {open && (
                    <div style={{borderTop:"0.5px solid #111",padding:"10px 14px",display:"flex",flexDirection:"column",gap:0}}>
                      {(s.exercices||[]).map((ex, ei) => (
                        <div key={ei} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:ei<s.exercices.length-1?"0.5px solid #0F0F0F":"none"}}>
                          <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(201,168,76,0.1)",border:"0.5px solid rgba(201,168,76,0.25)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontSize:9,color:"#C9A84C",fontWeight:700,fontFamily:"'Syne',sans-serif"}}>{ei+1}</span>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:"#E8E4DE",fontFamily:"'Syne',sans-serif"}}>{ex.nom}</div>
                            <div style={{display:"flex",gap:12,marginTop:3,flexWrap:"wrap"}}>
                              {ex.series && <span style={pillStyle}>{ex.series} séries</span>}
                              {ex.reps && <span style={pillStyle}>{ex.reps} reps</span>}
                              {ex.charge && ex.charge !== "—" && <span style={pillStyle}>⚖ {ex.charge}</span>}
                              {ex.repos_sec && <span style={pillStyle}>⏱ {ex.repos_sec}s repos</span>}
                            </div>
                            {ex.conseil && <div style={{fontSize:10,color:"rgba(201,168,76,0.55)",marginTop:4,fontStyle:"italic"}}>⚡ {ex.conseil}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const tagStyle = (color) => ({
  fontSize:10,color,background:`${color}14`,border:`0.5px solid ${color}33`,
  borderRadius:20,padding:"3px 10px",fontFamily:"'Syne',sans-serif",whiteSpace:"nowrap",
});
const pillStyle = {
  fontSize:10,color:"#555",background:"#111",borderRadius:4,padding:"1px 6px",whiteSpace:"nowrap",
};

export function ProgrammeTab({
  S, progSubTab, setProgSubTab,
  seanceAujourdhui, doneExos, exercices, exoDone, setExoDone,
  records, clientData, setTimer, setConfetti, addToast, vibrate,
  focusMode, setFocusMode, focusIdx, setFocusIdx, user,
}) {
  const [showGuidee, setShowGuidee] = useState(false);

  // Seance formatée pour SeanceGuidee
  const seanceForGuidee = seanceAujourdhui ? {
    nom: seanceAujourdhui.nom || "Séance du jour",
    duree_min: seanceAujourdhui.duree_min || 50,
    exercices: (seanceAujourdhui.exercices || []).map(e => ({
      nom: e.nom,
      series: e.series || 3,
      reps: e.reps || 8,
      charge: e.charge || "Poids du corps",
      repos_sec: parseReposSec(e.repos),
      conseil: e.conseil || "",
    })),
  } : null;

  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Sous-onglets pill */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button className={`sub-tab${progSubTab==="seance"?" active":""}`} onClick={()=>setProgSubTab("seance")}>🏋️ Séance du jour</button>
        <button className={`sub-tab${progSubTab==="charges"?" active":""}`} onClick={()=>setProgSubTab("charges")}>📊 Charges</button>
        <button className={`sub-tab${progSubTab==="1rm"?" active":""}`} onClick={()=>setProgSubTab("1rm")}>💪 1RM</button>
      </div>

      {progSubTab === "seance" && (
        <>
          <div style={S.card}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div>
                <div style={S.cardTitle}>🏋️ {seanceAujourdhui?.nom||"Séance du jour"}</div>
                {/* Progress pill */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:-6}}>
                  <div style={{height:4,flex:1,maxWidth:120,background:"#1A1A1A",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${exercices.length?Math.round(doneExos/exercices.length*100):0}%`,background:"#C9A84C",borderRadius:4,transition:"width 0.6s ease"}}/>
                  </div>
                  <span style={{fontSize:11,color:"#C9A84C",fontWeight:700,fontFamily:"'Syne',sans-serif"}}>{doneExos}/{exercices.length}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {exercices.length > 0 && seanceForGuidee && (
                  <button onClick={()=>{ vibrate([30]); setShowGuidee(true); }}
                    style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"7px 14px",cursor:"pointer",borderRadius:20,transition:"all 0.15s"}}>
                    ▶ Démarrer
                  </button>
                )}
                {exercices.length > 0 && (
                  <button onClick={()=>{ setFocusIdx(0); setFocusMode(true); vibrate([40]); }}
                    style={{background:"rgba(201,168,76,0.12)",border:"0.5px solid rgba(201,168,76,0.35)",color:"#C9A84C",fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",padding:"7px 14px",cursor:"pointer",borderRadius:20,transition:"all 0.15s"}}>
                    ⚡ Focus
                  </button>
                )}
                {clientData?.programme && (
                  <button onClick={() => {
                    try {
                      const win = window.open("","_blank");
                      if (!win) { navigator.clipboard?.writeText(clientData.programme||"").then(()=>addToast?.("Programme copié ✓","success")).catch(()=>{}); return; }
                      win.document.write(`<!DOCTYPE html><html><head><title>Programme APXFITNESS</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#222}h1{color:#C9A84C;border-bottom:2px solid #C9A84C;padding-bottom:12px}pre{white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.8;font-size:14px;background:#f9f9f9;padding:20px;border-left:3px solid #C9A84C}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#888;text-align:center}@media print{button{display:none}}</style></head><body><h1>Mon Programme APXFITNESS</h1><p>Plan ${clientData?.plan||""}</p><pre>${(clientData.programme||"").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre><div class="footer">APXFITNESS — ${(process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app").replace("https://","")}</div><script>window.onload=()=>window.print();<\/script></body></html>`);
                      win.document.close();
                    } catch(e) { navigator.clipboard?.writeText(clientData.programme||""); }
                  }} style={{background:"transparent",border:"0.5px solid #222",color:"#444",fontFamily:"'Syne',sans-serif",fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",padding:"7px 12px",cursor:"pointer",borderRadius:20}}>
                    📄 PDF
                  </button>
                )}
              </div>
            </div>

            {/* Liste exercices */}
            {exercices.length > 0 ? (
              <div style={{display:"flex",flexDirection:"column"}}>
                {exercices.map((e,i) => (
                  <div key={i} className={`exo-row${exoDone[i]?" done-e":""}`}
                    onClick={()=>{
                      const wasUndone = !exoDone[i];
                      setExoDone(prev => {
                        const next = {...prev,[i]:!prev[i]};
                        const newDoneCount = Object.values(next).filter(Boolean).length;
                        if (wasUndone && newDoneCount === exercices.length && exercices.length > 0) {
                          setTimeout(()=>{ setConfetti(true); addToast("🎉 Séance complète ! Bravo !","gold"); vibrate([100,50,100,50,200]); setTimeout(()=>setConfetti(false),1800); },100);
                        } else if (wasUndone) { addToast(`✓ ${e.nom}`,"success"); vibrate([50]); }
                        return next;
                      });
                      if (wasUndone && e.reposSec > 0) setTimer({duration:e.reposSec,name:e.nom,startedAt:Date.now()});
                      else if (!wasUndone) setTimer(null);
                    }}>
                    {/* Checkbox circulaire */}
                    <div style={{
                      width:24,height:24,borderRadius:"50%",flexShrink:0,
                      background:exoDone[i]?"#1A3A1A":"transparent",
                      border:`2px solid ${exoDone[i]?"#5ABA5A":"#2A2A2A"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      transition:"all 0.25s",
                    }}>
                      {exoDone[i]&&<span style={{fontSize:12,color:"#7AE07A",lineHeight:1}}>✓</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:exoDone[i]?"#3A3A3A":"#F0EDE8",fontFamily:"'Syne',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:exoDone[i]?"line-through":"none"}}>{e.nom}</div>
                      <div style={{fontSize:11,color:"#444",fontFamily:"'Syne',sans-serif",marginTop:2}}>{e.det}</div>
                      {e.conseil&&!exoDone[i]&&<div style={{fontSize:11,color:"rgba(201,168,76,0.6)",marginTop:3}}>⚡ {e.conseil}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}} onClick={ev=>ev.stopPropagation()}>
                      {/* Bouton GIF démo */}
                      <ExerciceGif nom={e.nom} />
                      {exoDone[i]
                        ? <span style={{fontSize:9,color:"#7AE07A",letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'Syne',sans-serif",background:"rgba(122,224,122,0.08)",padding:"2px 8px",borderRadius:10}}>FAIT</span>
                        : <span style={{fontSize:10,color:"#555",fontFamily:"'Syne',sans-serif"}}>⏱ {e.reposSec}s</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{padding:"2rem",textAlign:"center",color:"#555",fontSize:14,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Programme disponible après ton bilan</div>}
          </div>

          {records.length > 0 && (
            <div style={S.card}>
              <div style={S.cardTitle}>🏆 Records personnels <span style={{fontSize:10,color:"#444",marginLeft:"auto",letterSpacing:"1px",textTransform:"uppercase",fontFamily:"'Syne',sans-serif"}}>Cette semaine</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {records.map((r,i)=>(
                  <div key={i} className="record-card">
                    <div style={{fontSize:10,color:"#444",marginBottom:6,fontFamily:"'Syne',sans-serif"}}>{r.nom}</div>
                    <div style={{fontSize:18,fontWeight:700,color:"#C9A84C",fontFamily:"'Syne',sans-serif"}}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(clientData?.programmeData || clientData?.programme) && (
            <ProgrammeComplet data={clientData.programmeData} texte={clientData.programme} S={S} />
          )}
        </>
      )}

      {progSubTab === "charges" && (
        <div style={S.card}>
          <div style={S.cardTitle}>📊 Suivi des charges <span style={{fontSize:10,color:"#444",marginLeft:"auto",letterSpacing:"1px",textTransform:"uppercase",fontFamily:"'Syne',sans-serif"}}>Saisie semaine par semaine</span></div>
          <ChargesTab uid={user?.uid} exercices={exercices} />
        </div>
      )}

      {progSubTab === "1rm" && (
        <div style={S.card}>
          <OneRMCalc />
        </div>
      )}

      {/* ── Mode séance guidée (overlay plein écran) ── */}
      {showGuidee && seanceForGuidee && (
        <SeanceGuidee
          seance={seanceForGuidee}
          user={user}
          addToast={addToast}
          onClose={() => setShowGuidee(false)}
          onComplete={() => {
            // Marquer tous les exos comme faits dans la vue classique aussi
            const allDone = {};
            exercices.forEach((_, i) => { allDone[i] = true; });
            setExoDone(allDone);
          }}
        />
      )}
    </div>
  );
}
