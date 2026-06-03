import { memo } from "react";
"use client";

function AssistantTab({
  S, chatHistory, chatLoading, chatInput, setChatInput,
  sendChatMessage, chatBottomRef,
}) {
  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",flex:1}}>
      <div style={{...S.card,flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{...S.cardTitle,marginBottom:14}}>
          🤖 Assistant fitness IA
          <span style={{marginLeft:"auto",fontSize:11,color:"#555",letterSpacing:"1px",fontWeight:400,textTransform:"none"}}>
            Questions musculation, nutrition, récupération
          </span>
        </div>
        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",maxHeight:"calc(100vh - 400px)",minHeight:200,marginBottom:12,paddingRight:2,display:"flex",flexDirection:"column",gap:10}}>
          {chatHistory.map((msg, i) => (
            <div key={i} className="chat-bubble" style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start"}}>
              <div style={{
                maxWidth:"82%",padding:"10px 14px",borderRadius:14,fontSize:13,lineHeight:1.7,
                background:msg.role==="user"?"rgba(201,168,76,0.1)":"#181818",
                border:`0.5px solid ${msg.role==="user"?"#C9A84C":"#242424"}`,
                color:msg.role==="user"?"#E8C87A":"#C8C4BC",
              }}>
                {msg.content}
              </div>
              <span style={{fontSize:10,color:"#333",marginTop:2}}>
                {msg.role==="user"?"Toi":"Assistant IA"}
              </span>
            </div>
          ))}
          {chatLoading && (
            <div className="chat-bubble" style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
              <div style={{padding:"12px 16px",background:"#181818",border:"0.5px solid #242424",borderRadius:14,display:"flex",alignItems:"center",gap:4}}>
                {[0,1,2].map(j=>(
                  <div key={j} style={{width:7,height:7,borderRadius:"50%",background:"#555",animation:"typingDot 1.2s ease-in-out infinite",animationDelay:`${j*0.18}s`}}/>
                ))}
              </div>
              <span style={{fontSize:10,color:"#333",marginTop:2}}>Assistant IA</span>
            </div>
          )}
          <div ref={chatBottomRef}/>
        </div>
        {/* Input */}
        <div style={{display:"flex",gap:8,borderTop:"0.5px solid #1A1A1A",paddingTop:12}}>
          <textarea
            value={chatInput}
            onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChatMessage();}}}
            placeholder="Pose ta question fitness... (Entrée pour envoyer)"
            style={{flex:1,background:"#0D0D0D",border:"0.5px solid #1E1E1E",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"10px 14px",resize:"none",minHeight:52,outline:"none",borderRadius:14}}
          />
          <button onClick={sendChatMessage} disabled={!chatInput.trim()||chatLoading}
            style={{background:chatInput.trim()&&!chatLoading?"linear-gradient(135deg,#C9A84C,#A67C2E)":"#181818",border:"none",color:"#0A0A0A",padding:"0 18px",cursor:chatInput.trim()&&!chatLoading?"pointer":"not-allowed",fontSize:18,fontWeight:700,borderRadius:14,flexShrink:0}}>
            ↑
          </button>
        </div>
        <p style={{fontSize:11,color:"#333",marginTop:8,textAlign:"center"}}>
          L'IA répond aux questions générales. Pour un suivi personnalisé, écris au coach dans Messages.
        </p>
      </div>
    </div>
  );
}

export { memo(AssistantTab) as AssistantTab };
