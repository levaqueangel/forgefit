"use client";
import { ChargesTab } from "./ChargesTab";

export function ProgrammeTab({
  S, progSubTab, setProgSubTab,
  seanceAujourdhui, doneExos, exercices, exoDone, setExoDone,
  records, clientData, setTimer, setConfetti, addToast, vibrate,
  focusMode, setFocusMode, focusIdx, setFocusIdx, user,
}) {
  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Sous-onglets */}
      <div style={{display:"flex",gap:8}}>
        <button className={`sub-tab${progSubTab==="seance"?" active":""}`} onClick={()=>setProgSubTab("seance")}>🏋️ Séance du jour</button>
        <button className={`sub-tab${progSubTab==="charges"?" active":""}`} onClick={()=>setProgSubTab("charges")}>📊 Suivi des charges</button>
      </div>

      {progSubTab === "seance" && (
        <>
          <div style={S.card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={S.cardTitle}>🏋️ {seanceAujourdhui?.nom || "Séance du jour"}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:"#C9A84C",fontWeight:700}}>{doneExos}/{exercices.length} exercices</span>
                {exercices.length > 0 && (
                  <button onClick={()=>{ setFocusIdx(0); setFocusMode(true); vibrate([40]); }}
                    style={{background:"rgba(201,168,76,0.1)",border:"0.5px solid rgba(201,168,76,0.4)",color:"#C9A84C",fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",padding:"5px 10px",cursor:"pointer",borderRadius:2,transition:"all 0.15s"}}>
                    ⚡ Focus
                  </button>
                )}
                {clientData?.programme && (
                  <button onClick={() => {
                    try {
                      const win = window.open("","_blank");
                      if (!win) { navigator.clipboard?.writeText(clientData.programme||"").then(()=>alert("Programme copié !")).catch(()=>{}); return; }
                      win.document.write(`<!DOCTYPE html><html><head><title>Programme APXFITNESS</title>
                      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#222}
                      h1{color:#C9A84C;border-bottom:2px solid #C9A84C;padding-bottom:12px}
                      pre{white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.8;font-size:14px;background:#f9f9f9;padding:20px;border-left:3px solid #C9A84C}
                      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#888;text-align:center}
                      @media print{button{display:none}}</style></head><body>
                      <h1>Mon Programme APXFITNESS</h1>
                      <p>Plan ${clientData?.plan || ""}</p>
                      <pre>${(clientData.programme||"").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>
                      <div class="footer">APXFITNESS — apxfitness-brown.vercel.app</div>
                      <script>window.onload=()=>window.print();</script></body></html>`);
                      win.document.close();
                    } catch(e) { navigator.clipboard?.writeText(clientData.programme||""); }
                  }} style={{background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:10,letterSpacing:"2px",textTransform:"uppercase",padding:"5px 10px",cursor:"pointer",borderRadius:2}}>
                    📄 PDF
                  </button>
                )}
              </div>
            </div>
            {exercices.length > 0 ? (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {exercices.map((e,i) => (
                  <div key={i} className={`exo-row${exoDone[i]?" done-e":""}`}
                    onClick={()=>{
                      const wasUndone = !exoDone[i];
                      setExoDone(prev => {
                        const next = {...prev, [i]: !prev[i]};
                        const newDoneCount = Object.values(next).filter(Boolean).length;
                        if (wasUndone && newDoneCount === exercices.length && exercices.length > 0) {
                          setTimeout(() => {
                            setConfetti(true);
                            addToast("🎉 Séance complète ! Bravo !", "gold");
                            vibrate([100,50,100,50,200]);
                            setTimeout(() => setConfetti(false), 1800);
                          }, 100);
                        } else if (wasUndone) {
                          addToast(`✓ ${e.nom}`, "success");
                          vibrate([50]);
                        }
                        return next;
                      });
                      if (wasUndone && e.reposSec > 0) {
                        setTimer({ duration: e.reposSec, name: e.nom, startedAt: Date.now() });
                      } else if (!wasUndone) {
                        setTimer(null);
                      }
                    }}>
                    <div style={{width:18,height:18,borderRadius:3,flexShrink:0,
                      border:`1.5px solid ${exoDone[i]?"#639922":"#333"}`,
                      background:exoDone[i]?"#1A3A1A":"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#7AE07A",transition:"all 0.2s"}}>
                      {exoDone[i]?"✓":""}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:exoDone[i]?"#444":"#F0EDE8"}}>{e.nom}</div>
                      <div style={{fontSize:11,color:"#444"}}>{e.det}</div>
                      {e.conseil && <div style={{fontSize:11,color:"rgba(201,168,76,0.7)",marginTop:1}}>⚡ {e.conseil}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,flexShrink:0}}>
                      {exoDone[i] && <span style={{fontSize:10,color:"#7AE07A",letterSpacing:"1px"}}>FAIT</span>}
                      <span style={{fontSize:10,color:"#333",letterSpacing:"1px"}}>⏱ {e.reposSec}s</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{padding:"2rem",textAlign:"center",color:"#444",fontSize:13,fontStyle:"italic"}}>Programme disponible après ton bilan</div>}
          </div>

          {records.length > 0 && (
            <div style={S.card}>
              <div style={S.cardTitle}>🏆 Records personnels <span style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginLeft:"auto"}}>Cette semaine</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {records.map((r,i)=>(
                  <div key={i} className="record-card">
                    <div style={{fontSize:11,color:"#555",marginBottom:6}}>{r.nom}</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#C9A84C"}}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clientData?.programme && (
            <div style={S.card}>
              <div style={S.cardTitle}>📋 Programme complet</div>
              <pre style={{fontFamily:"'Courier New',monospace",fontSize:12,color:"#666",whiteSpace:"pre-wrap",lineHeight:1.8}}>
                {clientData.programme}
              </pre>
            </div>
          )}
        </>
      )}

      {progSubTab === "charges" && (
        <div style={S.card}>
          <div style={S.cardTitle}>📊 Suivi des charges <span style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginLeft:"auto"}}>Saisie semaine par semaine</span></div>
          <ChargesTab uid={user?.uid} exercices={exercices} />
        </div>
      )}
    </div>
  );
}
