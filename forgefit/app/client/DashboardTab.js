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
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:18}}>

      {/* ── Métriques — style app avec accent coloré ── */}
      <div className="metrics-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          { label:"Séances",         val:`${doneSeances}/4`,                       sub:"cette semaine",  color:"#C9A84C",  dot:"rgba(201,168,76,0.15)"  },
          { label:"Exercices",       val:`${doneExos}/${exercices.length||"—"}`,   sub:"séance du jour", color:"#7AE07A",  dot:"rgba(122,224,122,0.15)" },
          { label:"Programme",       val:pd?`${pd.duree_programme_semaines||4}W`:"—", sub:pd?.objectif_principal||"En attente", color:"#F0EDE8", dot:"rgba(240,237,232,0.08)" },
          { label:"Streak",          val:realStreak>0?`${realStreak}j`:"0j",       sub:realStreak>0?"sans coupure":"Lance-toi !", color:realStreak>=7?"#C9A84C":"#F0EDE8", dot:realStreak>=7?"rgba(201,168,76,0.15)":"rgba(240,237,232,0.08)" },
        ].map((m,i) => (
          <div key={i} className="metric-card" style={{position:"relative",overflow:"hidden"}}>
            {/* Accent top */}
            <div style={{position:"absolute",top:0,left:16,right:16,height:2,background:m.color,borderRadius:"0 0 2px 2px",opacity:0.6}}/>
            <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:10,marginTop:8}}>{m.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4,animation:"metricCount 0.4s ease forwards",fontFamily:"'Syne',sans-serif"}}>{m.val}</div>
            <div style={{fontSize:10,color:"#444",fontFamily:"'Syne',sans-serif"}}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

        {/* ── Séances semaine ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <span>📅</span> Séances
            <span style={{marginLeft:"auto",fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555"}}>{doneSeances}/{nbSeances}</span>
          </div>
          {/* Calendrier */}
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {semaine.map((d,i) => (
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}>
                <span style={{fontSize:9,color:"#444",fontFamily:"'Syne',sans-serif",letterSpacing:"1px"}}>{d}</span>
                <div style={{
                  width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,fontWeight:700,fontFamily:"'Syne',sans-serif",transition:"all 0.2s",
                  background:joursEtat[i]==="done"?"#1A3A1A":joursEtat[i]==="today"?"#C9A84C":joursEtat[i]==="rest"?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.03)",
                  color:joursEtat[i]==="done"?"#7AE07A":joursEtat[i]==="today"?"#0A0A0A":"#333",
                  border:joursEtat[i]==="today"?"none":joursEtat[i]==="done"?"0.5px solid #3A6A3A":"0.5px solid #1A1A1A",
                  opacity:joursEtat[i]==="future"?0.3:1,
                }}>
                  {joursEtat[i]==="done"?"✓":joursEtat[i]==="today"?"●":""}
                </div>
              </div>
            ))}
          </div>
          {/* Liste séances */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {seances.length > 0 ? seances.map((s,i) => (
              <div key={i} className={`seance-row${s.today?" today-s":""}`}
                onClick={async ()=>{
                  if(seanceDone[i]||i<2) return;
                  setSeanceDone(prev=>({...prev,[i]:!prev[i]}));
                  addToast(`✓ ${s.nom} — Séance validée !`,"success");
                  if (user) {
                    try {
                      const today=new Date().toDateString();
                      const last=clientData?.lastActiveDate;
                      const cur=clientData?.streakDays||0;
                      const yesterday=new Date(Date.now()-86400000).toDateString();
                      const newStreak=last===today?cur:last===yesterday?cur+1:1;
                      await updateDoc(doc(db,"clients",user.uid),{lastActiveDate:today,streakDays:newStreak});
                      setClientData(d=>d?{...d,lastActiveDate:today,streakDays:newStreak}:d);
                    } catch(e){console.warn("streak:",e);}
                  }
                }}>
                {/* Checkbox circulaire */}
                <div style={{
                  width:22,height:22,borderRadius:"50%",flexShrink:0,
                  border:`1.5px solid ${seanceDone[i]?"#5ABA5A":"rgba(201,168,76,0.3)"}`,
                  background:seanceDone[i]?"#1A3A1A":"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,color:"#7AE07A",transition:"all 0.25s",
                }}>
                  {seanceDone[i]&&"✓"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:seanceDone[i]?"#4A4A4A":"#F0EDE8",fontFamily:"'Syne',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.nom}</div>
                  <div style={{fontSize:10,color:"#444",fontFamily:"'Syne',sans-serif",marginTop:2}}>{s.det}</div>
                </div>
                <span style={{fontSize:10,padding:"3px 10px",borderRadius:20,flexShrink:0,fontFamily:"'Syne',sans-serif",
                  background:seanceDone[i]?"rgba(90,186,90,0.1)":s.today?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.04)",
                  color:seanceDone[i]?"#7AE07A":s.today?"#C9A84C":"#444",
                  border:`0.5px solid ${seanceDone[i]?"rgba(90,186,90,0.3)":s.today?"rgba(201,168,76,0.25)":"#1E1E1E"}`,
                }}>
                  {seanceDone[i]?"Fait":s.today?"Auj.":s.jour}
                </span>
              </div>
            )) : (
              <div style={{padding:"1.5rem",textAlign:"center",color:"#333",fontSize:13,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Programme disponible après ton bilan</div>
            )}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Progression */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              📈 Progression
              <span style={{marginLeft:"auto",fontSize:10,color:"#444",letterSpacing:"1px",textTransform:"uppercase",fontFamily:"'Syne',sans-serif"}}>Sem. {currentWeek||"?"}/{totalWeeks}</span>
            </div>
            {[
              {label:"Prise de masse", pct:72, color:"#C9A84C"},
              {label:"Force globale",  pct:58, color:"#7AE07A"},
              {label:"Endurance",      pct:45, color:"#5DCAA5"},
            ].map((p,i)=>(
              <div key={i} style={{marginBottom:i<2?14:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <span style={{fontSize:12,color:"#888",fontFamily:"'Syne',sans-serif"}}>{p.label}</span>
                  <span style={{fontSize:12,color:p.color,fontWeight:700,fontFamily:"'Syne',sans-serif"}}>{p.pct}%</span>
                </div>
                <ProgressBar value={p.pct} color={p.color} delay={i*150}/>
              </div>
            ))}
          </div>

          {/* Nutrition */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              🍎 Nutrition
              <span style={{marginLeft:"auto",fontSize:10,color:"#444",fontFamily:"'Syne',sans-serif"}}>{nutrition?`${nutrition.calories_jour} kcal`:"—"}</span>
            </div>
            {nutrition ? (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[
                  {nom:"Protéines", val:`${nutrition.proteines_g}g`, pct:Math.round((nutrition.proteines_g*4/nutrition.calories_jour)*100), color:"#7AE07A"},
                  {nom:"Glucides",  val:`${nutrition.glucides_g}g`,  pct:Math.round((nutrition.glucides_g*4/nutrition.calories_jour)*100),  color:"#C9A84C"},
                  {nom:"Lipides",   val:`${nutrition.lipides_g}g`,   pct:Math.round((nutrition.lipides_g*9/nutrition.calories_jour)*100),   color:"#5DCAA5"},
                ].map((c,i)=>(
                  <div key={i}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:11,color:"#555",fontFamily:"'Syne',sans-serif"}}>{c.nom}</span>
                      <span style={{fontSize:11,fontWeight:700,color:"#888",fontFamily:"'Syne',sans-serif"}}>{c.val}</span>
                    </div>
                    <ProgressBar value={c.pct} color={c.color} delay={i*80} height={6}/>
                  </div>
                ))}
              </div>
            ) : <div style={{padding:"1rem 0",textAlign:"center",color:"#333",fontSize:12,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Données disponibles après ton bilan</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
