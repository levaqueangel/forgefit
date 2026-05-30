"use client";
import { ProgressBar } from "./ProgressBar";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export function DashboardTab({
  S, doneSeances, doneExos, exercices, pd, realStreak,
  nbSeances, semaine, joursEtat, seances, seanceDone, setSeanceDone,
  user, clientData, setClientData, vibrate, addToast, nutrition,
  currentWeek, totalWeeks,
}) {
  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Métriques */}
      <div className="metrics-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          { label:"Séances",        val:`${doneSeances}/4`,                          sub:"cette semaine",       color:"#C9A84C" },
          { label:"Exercices faits",val:`${doneExos}/${exercices.length || "—"}`,    sub:"séance du jour",      color:"#7AE07A" },
          { label:"Programme",      val:pd ? `${pd.duree_programme_semaines || 4}sem` : "—",
            sub:pd?.objectif_principal || "En attente",                                                          color:"#F0EDE8" },
          { label:"Streak",
            val:realStreak > 0 ? `${realStreak} j` : "0 j",
            sub:realStreak > 0 ? "sans interruption" : "Lance-toi !",
            color:realStreak >= 7 ? "#C9A84C" : "#F0EDE8" },
        ].map((m,i) => (
          <div key={i} className="metric-card">
            <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:8}}>{m.label}</div>
            <div style={{fontSize:22,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4,animation:"metricCount 0.4s ease forwards"}}>{m.val}</div>
            <div style={{fontSize:11,color:"#444"}}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

        {/* Séances de la semaine */}
        <div style={S.card}>
          <div style={S.cardTitle}><span>📅</span> Séances de la semaine <span style={{...S.tag,marginLeft:"auto"}}>{doneSeances}/{nbSeances}</span></div>
          {/* Calendrier semaine */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:14}}>
            {semaine.map((d,i) => (
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <span style={{fontSize:10,color:"#555"}}>{d}</span>
                <div style={{
                  width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,
                  background:joursEtat[i]==="done"?"#1A3A1A":joursEtat[i]==="today"?"#C9A84C":joursEtat[i]==="rest"?"#181818":"#111",
                  color:joursEtat[i]==="done"?"#7AE07A":joursEtat[i]==="today"?"#0A0A0A":"#444",
                  opacity:joursEtat[i]==="future"?0.35:1,
                }}>
                  {joursEtat[i]==="done"?"✓":joursEtat[i]==="today"?"●":joursEtat[i]==="rest"?"—":""}
                </div>
              </div>
            ))}
          </div>
          {/* Liste séances */}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {seances.length > 0 ? seances.map((s,i) => (
              <div key={i} className={`seance-row${s.today?" today-s":""}`}
                onClick={async ()=>{
                  if(seanceDone[i]||i<2) return;
                  setSeanceDone(prev=>({...prev,[i]:!prev[i]}));
                  addToast(`✓ ${s.nom} — Séance validée !`, "success");
                  if (user) {
                    try {
                      const today = new Date().toDateString();
                      const last = clientData?.lastActiveDate;
                      const cur  = clientData?.streakDays || 0;
                      const yesterday = new Date(Date.now()-86400000).toDateString();
                      const newStreak = last===today ? cur : last===yesterday ? cur+1 : 1;
                      await updateDoc(doc(db,"clients",user.uid),{lastActiveDate:today,streakDays:newStreak});
                      setClientData(d=>d?{...d,lastActiveDate:today,streakDays:newStreak}:d);
                    } catch(e){console.warn("streak:",e);}
                  }
                }}>
                <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,
                  border:`1.5px solid ${seanceDone[i]?"#639922":"rgba(201,168,76,0.3)"}`,
                  background:seanceDone[i]?"#1A3A1A":"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#7AE07A"}}>
                  {seanceDone[i]?"✓":""}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:seanceDone[i]?"#555":"#F0EDE8"}}>{s.nom}</div>
                  <div style={{fontSize:11,color:"#555"}}>{s.det}</div>
                </div>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,
                  background:seanceDone[i]?"#1A3A1A":s.today?"rgba(201,168,76,0.1)":"#181818",
                  color:seanceDone[i]?"#7AE07A":s.today?"#C9A84C":"#555",
                  border:`0.5px solid ${seanceDone[i]?"#3A6A3A":s.today?"rgba(201,168,76,0.3)":"#242424"}`}}>
                  {seanceDone[i]?"Fait":s.today?"Aujourd'hui":s.jour}
                </span>
              </div>
            )) : (
              <div style={{padding:"1.5rem",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>Programme disponible après ton bilan</div>
            )}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Progression */}
          <div style={S.card}>
            <div style={S.cardTitle}>📈 Progression <span style={{...S.tag,marginLeft:"auto"}}>Sem. {currentWeek||"?"}/{totalWeeks}</span></div>
            {[
              {label:"Prise de masse",pct:72,color:"#C9A84C"},
              {label:"Force globale", pct:58,color:"#7AE07A"},
              {label:"Endurance",     pct:45,color:"#5DCAA5"},
            ].map((p,i)=>(
              <div key={i} style={{marginBottom:i<2?12:0}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                  <span style={{color:"#888"}}>{p.label}</span>
                  <span style={{color:p.color,fontWeight:700}}>{p.pct}%</span>
                </div>
                <ProgressBar value={p.pct} color={p.color} delay={i*150}/>
              </div>
            ))}
          </div>

          {/* Calories */}
          <div style={S.card}>
            <div style={S.cardTitle}>🍎 Nutrition <span style={{...S.tag,marginLeft:"auto"}}>{nutrition ? `Obj. ${nutrition.calories_jour} kcal/j` : "— kcal/j"}</span></div>
            {nutrition ? (
              <>
                {[
                  {nom:"Protéines",val:`${nutrition.proteines_g}g`,pct:Math.round((nutrition.proteines_g*4/nutrition.calories_jour)*100),color:"#7AE07A"},
                  {nom:"Glucides", val:`${nutrition.glucides_g}g`, pct:Math.round((nutrition.glucides_g*4/nutrition.calories_jour)*100), color:"#C9A84C"},
                  {nom:"Lipides",  val:`${nutrition.lipides_g}g`,  pct:Math.round((nutrition.lipides_g*9/nutrition.calories_jour)*100),  color:"#5DCAA5"},
                ].map((c,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderTop:"0.5px solid #141414"}}>
                    <span style={{fontSize:12,color:"#555",width:62,flexShrink:0}}>{c.nom}</span>
                    <div style={{flex:1,height:4,background:"#1A1A1A",borderRadius:2,overflow:"hidden"}}>
                      <ProgressBar value={c.pct} color={c.color} delay={i*100}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:"#888",width:40,textAlign:"right",flexShrink:0}}>{c.val}</span>
                  </div>
                ))}
              </>
            ) : <div style={{padding:"1rem",textAlign:"center",color:"#555",fontSize:12,fontStyle:"italic"}}>Données disponibles après ton bilan</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
