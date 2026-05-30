"use client";

export function Bubble({ msg, isCoach }) {
  const date = msg.createdAt?.toDate?.() ? msg.createdAt.toDate().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : "";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isCoach?"flex-start":"flex-end",marginBottom:10}}>
      <div style={{maxWidth:"78%",padding:"9px 13px",background:isCoach?"#181818":"rgba(201,168,76,0.12)",border:`0.5px solid ${isCoach?"#242424":"#C9A84C"}`,fontSize:13,lineHeight:1.6,color:isCoach?"#C8C4BC":"#E8C87A",borderRadius:2}}>
        {msg.text}
      </div>
      <span style={{fontSize:10,color:"#333",marginTop:2}}>{isCoach?"Coach":"Toi"} · {date}</span>
    </div>
  );
}
