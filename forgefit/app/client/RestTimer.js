"use client";
import { useState, useEffect, useRef } from "react";
import { beep } from "./utils";

export function RestTimer({ duration, exerciseName, onDone, onSkip }) {
  const [remaining, setRemaining] = useState(duration);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (paused) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (!doneRef.current) { doneRef.current = true; beep(); setTimeout(onDone, 300); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused, onDone]);

  const pct = ((duration - remaining) / duration);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:500,background:"#0D0D0D",border:"0.5px solid #C9A84C",borderRadius:8,padding:"16px 20px",boxShadow:"0 8px 32px rgba(0,0,0,0.6)",minWidth:220,animation:"slideUp 0.3s ease"}}>
      <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:10}}>⏱ Temps de repos</div>
      <div style={{fontSize:11,color:"#555",marginBottom:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exerciseName}</div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{position:"relative",width:120,height:120,flexShrink:0}}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{transform:"rotate(-90deg)"}} aria-label={`Repos : ${mins}:${String(secs).padStart(2,"0")}`}>
            <circle cx="60" cy="60" r={r} fill="none" stroke="#1A1A1A" strokeWidth="6"/>
            <circle cx="60" cy="60" r={r} fill="none" stroke="#C9A84C" strokeWidth="6"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:28,fontWeight:700,color:remaining<=10?"#E07070":"#F0EDE8",lineHeight:1,fontFamily:"'Syne',sans-serif"}}>
              {mins > 0 ? `${mins}:${String(secs).padStart(2,"0")}` : secs}
            </div>
            <div style={{fontSize:10,color:"#555",letterSpacing:"1px"}}>sec</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>setPaused(p=>!p)} style={{background:"transparent",border:"0.5px solid #333",color:"#888",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",padding:"8px 14px",cursor:"pointer",borderRadius:2,transition:"all 0.15s"}}>
            {paused?"▶ Reprendre":"⏸ Pause"}
          </button>
          <button onClick={onSkip} style={{background:"transparent",border:"0.5px solid #1A1A1A",color:"#444",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",padding:"8px 14px",cursor:"pointer",borderRadius:2,transition:"all 0.15s"}}>
            Passer →
          </button>
        </div>
      </div>
      {remaining <= 5 && remaining > 0 && (
        <div style={{marginTop:10,fontSize:12,color:"#E8C87A",textAlign:"center",fontWeight:700,animation:"pulse 0.5s infinite"}}>
          Prêt... {remaining}
        </div>
      )}
    </div>
  );
}

// ── Suivi des charges ──────────────────────────────────────────────────
