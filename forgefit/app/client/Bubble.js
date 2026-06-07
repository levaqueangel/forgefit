"use client";

export function Bubble({ msg, isCoach }) {
  const date = msg.createdAt?.toDate?.() ? msg.createdAt.toDate().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : "";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isCoach?"flex-start":"flex-end",marginBottom:12}}>
      <div style={{
        maxWidth:"78%",padding:"10px 14px",
        background:isCoach?"#181818":"rgba(201,168,76,0.1)",
        border:`0.5px solid ${isCoach?"#242424":"rgba(201,168,76,0.3)"}`,
        fontSize:13,lineHeight:1.7,
        color:isCoach?"#C8C4BC":"#E8C87A",
        borderRadius:isCoach?"14px 14px 14px 4px":"14px 14px 4px 14px",
      }}>
        {msg.text}
      </div>
      <span style={{fontSize:10,color:"#555",marginTop:3,fontFamily:"'Syne',sans-serif"}}>{isCoach?"Coach":"Toi"} · {date}</span>
    </div>
  );
}

