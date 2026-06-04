import "use client";
import { Bubble } from "./Bubble";

export function MessagesTab({
  S, messages, newMsg, setNewMsg, sending, sendMessage, sendError, bottomRef,
}) {
  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",flex:1}}>
      <div style={{...S.card,flex:1}}>
        <div style={{...S.cardTitle,marginBottom:14}}>
          💬 Coach Angel
          <span style={{marginLeft:"auto",fontSize:11,color:"#7AE07A",display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:6,height:6,background:"#7AE07A",borderRadius:"50%",display:"inline-block"}}/>
            En ligne
          </span>
        </div>
        <div style={{overflowY:"auto",maxHeight:"calc(100vh - 380px)",minHeight:200,marginBottom:12,paddingRight:2}}>
          {messages.length === 0 ? (
            <div style={{textAlign:"center",padding:"3rem",color:"#333",fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic"}}>
              Aucun message pour l'instant.<br/>Le coach va te contacter très bientôt.
            </div>
          ) : messages.map(msg => <Bubble key={msg.id} msg={msg} isCoach={msg.sender==="coach"} />)}
          <div ref={bottomRef}/>
        </div>
        {sendError && <div style={{fontSize:12,color:"#E07070",padding:"4px 0",marginBottom:6}}>{sendError}</div>}
        <div style={{display:"flex",gap:8,borderTop:"0.5px solid #1A1A1A",paddingTop:12}}>
          <textarea value={newMsg} onChange={e=>setNewMsg(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
            placeholder="Écris ton message... (Entrée pour envoyer)"
            style={{flex:1,background:"#0D0D0D",border:"0.5px solid #1E1E1E",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"10px 14px",resize:"none",minHeight:52,outline:"none",borderRadius:14}}/>
          <button onClick={sendMessage} disabled={!newMsg.trim()||sending}
            className="btn-primary"
            style={{background:newMsg.trim()&&!sending?"linear-gradient(135deg,#C9A84C,#A67C2E)":"#181818",border:"none",color:sending?"#555":"#0A0A0A",padding:"0 18px",cursor:newMsg.trim()&&!sending?"pointer":"not-allowed",fontSize:18,fontWeight:700,borderRadius:14,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",minWidth:46}}>
            {sending ? <div className="spinner" style={{borderTopColor:"#C9A84C"}} /> : "↑"}
          </button>
        </div>
      </div>
    </div>
  );
}

