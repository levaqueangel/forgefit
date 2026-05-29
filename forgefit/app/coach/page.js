"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const COACH_EMAIL = process.env.NEXT_PUBLIC_COACH_EMAIL || "levaqueangel@gmail.com";

function LoginCoach({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, COACH_EMAIL, password);
    } catch {
      setError("Mot de passe incorrect.");
    }
    setLoading(false);
  };

  const inp = { width:"100%", background:"#111", border:"0.5px solid #242424", color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:13, padding:"12px 16px", outline:"none", borderRadius:0 };

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input:focus{border-color:#C9A84C !important;outline:none}`}</style>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 28px",borderBottom:"0.5px solid #242424"}}>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:5}}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
        <div style={{fontSize:11,letterSpacing:"3px",color:"#C9A84C",textTransform:"uppercase"}}>Interface Coach</div>
      </nav>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{width:"100%",maxWidth:360}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.75rem"}}>— Accès réservé</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,lineHeight:1.1,marginBottom:"2rem"}}>
            Tableau de bord<br/><em style={{fontStyle:"italic",color:"#555"}}>coach</em>
          </div>
          <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:1}}>
            <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:7}}>Mot de passe</div>
              <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div style={{background:"#1A0808",border:"0.5px solid #5A1A1A",color:"#E07070",fontSize:12,padding:"10px 14px"}}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              background:loading?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",
              border:"none",color:"#0A0A0A",padding:"14px",marginTop:2,
              fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
              letterSpacing:"3px",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer"}}>
              {loading ? "Connexion..." : "Accéder →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isCoach = msg.sender === "coach";
  const date = msg.createdAt?.toDate?.() ? msg.createdAt.toDate().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : "";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isCoach?"flex-end":"flex-start",marginBottom:12}}>
      <div style={{
        maxWidth:"75%",padding:"10px 14px",
        background:isCoach?"rgba(201,168,76,0.1)":"#181818",
        border:`0.5px solid ${isCoach?"#C9A84C":"#242424"}`,
        fontSize:14,lineHeight:1.6,color:isCoach?"#E8C87A":"#C8C4BC",
      }}>{msg.text}</div>
      <span style={{fontSize:10,color:"#333",marginTop:3}}>{isCoach?"Toi":"Client"} · {date}</span>
    </div>
  );
}

// Constantes hors du composant pour éviter les recréations à chaque render
const INACTIVE_LIMIT = 30 * 60 * 1000; // 30 min
const WARNING_BEFORE = 2 * 60 * 1000;  // avertir 2 min avant

export default function CoachPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const [showInactiveWarning, setShowInactiveWarning] = useState(false);
  const inactiveTimer = useRef(null);
  const warningTimer = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u && u.email === COACH_EMAIL ? u : null);
      setAuthLoading(false);
    }, (error) => {
      console.error("Auth error:", error);
      setAuthLoading(false);
    });
    // Timeout de sécurité — 5 secondes max
    const timer = setTimeout(() => setAuthLoading(false), 5000);
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  // Déconnexion automatique après 30 min d'inactivité
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      clearTimeout(inactiveTimer.current);
      clearTimeout(warningTimer.current);
      setShowInactiveWarning(false);
      // Avertir 2 min avant
      warningTimer.current = setTimeout(() => setShowInactiveWarning(true), INACTIVE_LIMIT - WARNING_BEFORE);
      // Déconnecter après 30 min
      inactiveTimer.current = setTimeout(() => signOut(auth), INACTIVE_LIMIT);
    };

    const events = ["mousedown","mousemove","keydown","scroll","touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(inactiveTimer.current);
      clearTimeout(warningTimer.current);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "clients"), snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // Compteurs de messages non lus — chargés séparément pour tous les clients
  const [unreadCounts, setUnreadCounts] = useState({});
  useEffect(() => {
    if (!user) return;
    // Écouter les messages non lus de tous les clients (léger : seulement les non lus)
    const q = query(collection(db, "messages"), where("sender", "==", "client"), where("read", "==", false));
    const unsub = onSnapshot(q, snap => {
      const counts = {};
      snap.docs.forEach(d => {
        const clientId = d.data().clientId;
        counts[clientId] = (counts[clientId] || 0) + 1;
      });
      setUnreadCounts(counts);
    });
    return () => unsub();
  }, [user]);

  // Messages du client sélectionné uniquement
  const [clientMessages, setClientMessages] = useState([]);
  useEffect(() => {
    if (!user || !selectedClient) { setClientMessages([]); return; }
    const q = query(
      collection(db, "messages"),
      where("clientId", "==", selectedClient.id),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setClientMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [user, selectedClient]);

  const unreadCount = (clientId) => unreadCounts[clientId] || 0;

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedClient || sending) return;
    setSending(true);
    await addDoc(collection(db, "messages"), {
      clientId: selectedClient.id,
      clientName: selectedClient.nom,
      clientEmail: selectedClient.email,
      text: newMsg.trim(),
      sender: "coach",
      createdAt: serverTimestamp(),
      read: true,
    });
    // Notif email au client
    await fetch("/api/notify-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: selectedClient.email, nom: selectedClient.nom, message: newMsg.trim() }),
    });
    // Marquer les messages du client comme lus
    const unread = clientMessages.filter(m => m.sender === "client" && !m.read);
    await Promise.all(unread.map(m => updateDoc(doc(db, "messages", m.id), { read: true })));
    setNewMsg("");
    setSending(false);
  };

  if (authLoading) return <div style={{background:"#0A0A0A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#C9A84C",fontSize:11,letterSpacing:"3px"}}>CHARGEMENT...</div></div>;
  if (!user) return <LoginCoach />;

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}textarea:focus{border-color:#C9A84C !important;outline:none}`}</style>

      {/* Nav */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:"0.5px solid #242424",position:"sticky",top:0,background:"#0A0A0A",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:18,fontWeight:800,letterSpacing:5,cursor:"pointer"}} onClick={()=>router.push("/")}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
          <div style={{fontSize:11,letterSpacing:"3px",color:"#C9A84C",textTransform:"uppercase",borderLeft:"0.5px solid #242424",paddingLeft:16}}>Interface Coach</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,letterSpacing:"1px",color:"#555"}}>{clients.length} client{clients.length>1?"s":""}</div>
          <button onClick={()=>signOut(auth)} style={{background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 16px",cursor:"pointer"}}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr",minHeight:"calc(100vh - 57px)"}}>

        {/* Modale avertissement inactivité */}
        {showInactiveWarning && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:"#111",border:"0.5px solid #C9A84C",padding:"2rem",maxWidth:380,width:"90%",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
              <div style={{fontSize:14,fontWeight:700,color:"#E8C87A",marginBottom:8,letterSpacing:"1px"}}>Inactivité détectée</div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#888",lineHeight:1.7,marginBottom:"1.5rem"}}>
                Tu vas être déconnecté dans <strong style={{color:"#E8C87A"}}>2 minutes</strong> pour des raisons de sécurité.
              </p>
              <button onClick={()=>{setShowInactiveWarning(false); clearTimeout(inactiveTimer.current); clearTimeout(warningTimer.current); warningTimer.current = setTimeout(()=>setShowInactiveWarning(true), INACTIVE_LIMIT - WARNING_BEFORE); inactiveTimer.current = setTimeout(()=>signOut(auth), INACTIVE_LIMIT);}}
                style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"12px 32px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
                Je suis toujours là →
              </button>
            </div>
          </div>
        )}

        {/* Liste clients */}
        <div style={{borderRight:"0.5px solid #242424",overflowY:"auto"}}>
          <div style={{padding:"14px 16px",borderBottom:"0.5px solid #242424",fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555"}}>Clients</div>
          {clients.length === 0 ? (
            <div style={{padding:"2rem",textAlign:"center",color:"#333",fontSize:13,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Aucun client pour l'instant.</div>
          ) : clients.map(client => {
            const unread = unreadCount(client.id);
            const isSelected = selectedClient?.id === client.id;
            const lastMsg = allMessages.filter(m=>m.clientId===client.id).slice(-1)[0];
            return (
              <div key={client.id} onClick={()=>setSelectedClient(client)} style={{
                padding:"14px 16px",cursor:"pointer",borderBottom:"0.5px solid #242424",
                background:isSelected?"#181818":"transparent",transition:"background 0.15s",
                borderLeft:`2px solid ${isSelected?"#C9A84C":"transparent"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:13,fontWeight:700,color:isSelected?"#E8C87A":"#F0EDE8"}}>{client.nom}</div>
                  {unread > 0 && <span style={{background:"#C9A84C",color:"#0A0A0A",fontSize:10,fontWeight:700,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}
                </div>
                <div style={{fontSize:11,color:"#555",marginBottom:3,letterSpacing:"1px",textTransform:"uppercase"}}>Plan {client.plan}</div>
                {lastMsg && <div style={{fontSize:12,color:"#333",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lastMsg.sender==="coach"?"Toi : ":""}{lastMsg.text}</div>}
              </div>
            );
          })}
        </div>

        {/* Zone de conversation */}
        <div style={{display:"flex",flexDirection:"column"}}>
          {!selectedClient ? (
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#333"}}>
              <div style={{fontSize:32}}>💬</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:"italic"}}>Sélectionne un client pour voir la conversation</div>
            </div>
          ) : (
            <>
              {/* Header client */}
              <div style={{padding:"14px 20px",borderBottom:"0.5px solid #242424",display:"flex",alignItems:"center",gap:12,background:"#0D0D0D"}}>
                <div style={{width:36,height:36,background:"rgba(201,168,76,0.15)",border:"0.5px solid #C9A84C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#C9A84C"}}>
                  {selectedClient.nom?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:700}}>{selectedClient.nom}</div>
                  <div style={{fontSize:11,color:"#555",letterSpacing:"1px"}}>{selectedClient.email} · Plan {selectedClient.plan}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{flex:1,overflowY:"auto",padding:"20px",maxHeight:"calc(100vh - 260px)"}}>
                {clientMessages.length === 0 ? (
                  <div style={{textAlign:"center",padding:"2rem",color:"#333",fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:"italic"}}>
                    Envoie un message de bienvenue à {selectedClient.nom} !
                  </div>
                ) : clientMessages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{padding:"16px 20px",borderTop:"0.5px solid #242424",display:"flex",gap:8}}>
                <textarea
                  value={newMsg}
                  onChange={e=>setNewMsg(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}}}
                  placeholder={`Message à ${selectedClient.nom}... (Entrée pour envoyer)`}
                  style={{flex:1,background:"#111",border:"0.5px solid #242424",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"12px 16px",resize:"none",minHeight:52,outline:"none",borderRadius:0}}
                />
                <button onClick={sendMessage} disabled={!newMsg.trim()||sending} style={{
                  background:newMsg.trim()?"linear-gradient(135deg,#C9A84C,#A67C2E)":"#181818",
                  border:"none",color:"#0A0A0A",padding:"0 20px",cursor:newMsg.trim()?"pointer":"not-allowed",
                  fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,minWidth:52}}>
                  ↑
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
