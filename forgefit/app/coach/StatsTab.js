"use client";
import { useState } from "react";

const PLAN_COLORS = { starter:"#7AE07A", forge:"#E8B000", elite:"#F5C832" };

function MiniSparkline({ data, color = "#E8B000" }) {
  if (data.length < 2) return null;
  const W = 200, H = 40, PAD = 4;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [
    PAD + (i / (data.length - 1)) * (W - PAD * 2),
    PAD + (H - PAD * 2) - (v / max) * (H - PAD * 2)
  ]);
  const d = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", opacity: 0.8 }}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${d} L ${pts[pts.length-1][0]} ${H} L ${pts[0][0]} ${H} Z`} fill={`url(#sg${color.replace('#','')})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="2.5" fill={color}/>)}
    </svg>
  );
}

export function StatsView({ clients, allMsgsCount }) {
  const now = Date.now();
  const recentClients  = clients.filter(c => c.createdAt && (now - new Date(c.createdAt).getTime()) < 30*24*3600*1000).length;
  const activeClients  = clients.filter(c => c.lastActiveDate && (now - new Date(c.lastActiveDate).getTime()) < 7*24*3600*1000).length;
  const inactiveClients= clients.filter(c => !c.lastActiveDate || (now - new Date(c.lastActiveDate).getTime()) > 7*24*3600*1000).length;
  const avgStreak      = clients.length > 0 ? Math.round(clients.reduce((s,c) => s+(c.streakDays||0),0)/clients.length) : 0;
  const renewalDue     = clients.filter(c => { if (!c.createdAt) return false; const d = now - new Date(c.createdAt).getTime(); return d > 24*24*3600*1000 && d < 30*24*3600*1000 && !c.recapJ28SentAt; }).length;
  const plans          = clients.reduce((acc,c) => { const p=(c.plan||"?").toLowerCase(); acc[p]=(acc[p]||0)+1; return acc; }, {});
  const planPrices     = { starter:49, forge:129, elite:249 };
  const totalRevenue   = clients.reduce((s,c) => s+(planPrices[c.plan?.toLowerCase()]||0),0);

  const METRICS = [
    {label:"Total clients",      val:clients.length,   icon:"👥",  color:"#E8B000"},
    {label:"Nouveaux ce mois",   val:recentClients,    icon:"🆕",  color:"#7AE07A"},
    {label:"Actifs cette sem.",  val:activeClients,    icon:"🔥",  color:"#F5C832"},
    {label:"À relancer",        val:inactiveClients,  icon:"⚠️",  color:"#E07070"},
    {label:"Messages total",    val:allMsgsCount,     icon:"💬",  color:"#F0EDE8"},
    {label:"Streak moyen",      val:`${avgStreak}j`,  icon:"⚡",  color:"#5DCAA5"},
    {label:"Renouvellements J28",val:renewalDue,       icon:"🔄",  color:"#E8B000"},
    {label:"Revenus estimés",   val:`${totalRevenue}€`,icon:"💰",  color:"#F5C832"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:900,margin:"0 auto",animation:"fadeUp 0.3s ease forwards"}}>
      <div>
        <div style={{fontSize:10,letterSpacing:"4px",textTransform:"uppercase",color:"#E8B000",marginBottom:6}}>— Tableau de bord</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,color:"#F0EDE8"}}>
          Vue d'ensemble
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {METRICS.map((m,i) => (
          <div key={i} style={{
            background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:14,padding:"16px",
            position:"relative",overflow:"hidden",animation:`fadeUp 0.3s ease ${i*0.05}s both`,
          }}>
            <div style={{position:"absolute",top:0,left:12,right:12,height:2,background:m.color,opacity:0.6,borderRadius:"0 0 2px 2px"}}/>
            <div style={{fontSize:20,marginBottom:10,marginTop:4}}>{m.icon}</div>
            <div style={{fontSize:22,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4}}>{m.val}</div>
            <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"#666"}}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Courbe nouvelles inscriptions (7 dernières semaines) */}
      {clients.length >= 3 && (() => {
        const weeks = Array.from({length:7}, (_,i) => {
          const weekStart = now - (6-i)*7*24*3600*1000;
          const weekEnd   = weekStart + 7*24*3600*1000;
          return clients.filter(c => {
            const t = c.createdAt ? new Date(c.createdAt).getTime() : 0;
            return t >= weekStart && t < weekEnd;
          }).length;
        });
        const labels = Array.from({length:7}, (_,i) => {
          const d = new Date(now - (6-i)*7*24*3600*1000);
          return d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
        });
        return (
          <div style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:14,padding:"18px 20px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555"}}>Nouvelles inscriptions</div>
              <div style={{fontSize:11,fontWeight:700,color:"#E8B000"}}>7 dernières semaines</div>
            </div>
            <MiniSparkline data={weeks} color="#E8B000"/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{fontSize:10,color:"#666"}}>{labels[0]}</span>
              <span style={{fontSize:10,color:"#666"}}>{labels[3]}</span>
              <span style={{fontSize:10,color:"#666"}}>{labels[6]}</span>
            </div>
          </div>
        );
      })()}

      {/* Répartition plans */}
      <div style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:14,padding:"18px 20px"}}>
        <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:14}}>Répartition des plans</div>
        {Object.entries(plans).sort((a,b)=>b[1]-a[1]).map(([plan,count]) => {
          const color = PLAN_COLORS[plan] || "#555";
          const pct   = Math.round((count/Math.max(clients.length,1))*100);
          return (
            <div key={plan} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <span style={{
                fontSize:9,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",
                color,width:50,flexShrink:0,fontFamily:"'Syne',sans-serif",
              }}>{plan}</span>
              <div style={{flex:1,height:6,background:"#1A1A1A",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",background:color,borderRadius:4,width:`${pct}%`,transition:"width 1.2s ease"}}/>
              </div>
              <span style={{fontSize:11,color:"#F0EDE8",fontWeight:700,width:24,textAlign:"right"}}>{count}</span>
              <span style={{fontSize:10,color:"#666",width:36,textAlign:"right"}}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Clients inactifs */}
      {inactiveClients > 0 && (
        <div style={{background:"rgba(224,112,112,0.04)",border:"0.5px solid rgba(224,112,112,0.2)",borderRadius:14,padding:"16px 18px"}}>
          <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#E07070",marginBottom:12}}>⚠️ Clients inactifs (+7 jours)</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {clients.filter(c => !c.lastActiveDate || (Date.now()-new Date(c.lastActiveDate).getTime())>7*24*3600*1000).slice(0,6).map(c => {
              const d = c.lastActiveDate ? Math.floor((Date.now()-new Date(c.lastActiveDate).getTime())/86400000) : null;
              return (
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(224,112,112,0.08)",border:"1px solid rgba(224,112,112,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#E07070",flexShrink:0}}>
                    {c.nom?.charAt(0)||"?"}
                  </div>
                  <span style={{flex:1,color:"#F0EDE8",fontSize:12,fontWeight:600}}>{c.nom||c.email}</span>
                  <span style={{fontSize:10,color:"#555"}}>{c.plan||"—"}</span>
                  <span style={{fontSize:10,color:"#E07070",fontWeight:700}}>{d===null?"Jamais connecté":`${d}j inactif`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
