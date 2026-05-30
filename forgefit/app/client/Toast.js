"use client";
import { useEffect, useState } from "react";

export function ToastContainer({ toasts }) {
  return (
    <div style={{
      position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",
      zIndex:1000,display:"flex",flexDirection:"column-reverse",gap:8,
      alignItems:"center",pointerEvents:"none",
    }}>
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateY(14px) scale(0.93)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes toastOut{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(10px) scale(0.95)}}
        .toast-enter{animation:toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .toast-leave{animation:toastOut 0.2s ease forwards}
      `}</style>
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}

function ToastItem({ toast }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 2600);
    return () => clearTimeout(t);
  }, []);

  const styles = {
    success: { bg:"rgba(15,40,15,0.95)",   border:"rgba(90,186,90,0.3)",    text:"#7AE07A",   icon:"✓" },
    error:   { bg:"rgba(40,10,10,0.95)",   border:"rgba(200,60,60,0.3)",    text:"#E07070",   icon:"✕" },
    info:    { bg:"rgba(10,20,40,0.95)",   border:"rgba(100,130,200,0.3)",  text:"#88A0E0",   icon:"ℹ" },
    gold:    { bg:"rgba(35,25,5,0.97)",    border:"rgba(201,168,76,0.4)",   text:"#E8C87A",   icon:"★" },
  };
  const s = styles[toast.type] || styles.success;

  return (
    <div className={leaving ? "toast-leave" : "toast-enter"} style={{
      background:s.bg,
      border:`0.5px solid ${s.border}`,
      borderRadius:24,
      padding:"10px 18px",
      display:"flex",alignItems:"center",gap:10,
      fontFamily:"'Syne',sans-serif",fontSize:12,color:"#F0EDE8",
      backdropFilter:"blur(12px)",
      pointerEvents:"all",
      whiteSpace:"nowrap",
      minWidth:160,
    }}>
      <div style={{
        width:22,height:22,borderRadius:"50%",
        background:`${s.border}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:12,color:s.text,flexShrink:0,fontWeight:700,
      }}>{s.icon}</div>
      <span style={{color:"#E8E8E8",fontWeight:500}}>{toast.message}</span>
    </div>
  );
}
