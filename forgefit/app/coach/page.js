"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const COACH_EMAIL = process.env.NEXT_PUBLIC_COACH_EMAIL || "levaqueangel@gmail.com";
const INACTIVE_LIMIT = 30 * 60 * 1000;
const WARNING_BEFORE = 2 * 60 * 1000;

const TEMPLATES = [
  { label:"Bienvenue", text:"Bienvenue dans ton espace APXFITNESS ! Ton programme est prêt. N'hésite pas à me poser toutes tes questions ici. Je suis là pour t'accompagner tout au long de ces 4 semaines 💪" },
  { label:"Semaine 2", text:"Comment se passent les premières séances ? Est-ce que tu te sens à l'aise avec les exercices et les charges ? N'hésite pas à me donner tes retours pour qu'on ajuste si besoin." },
  { label:"Mi-programme", text:"On arrive à mi-parcours ! C'est le moment de faire le point : comment tu progresses ? Les charges augmentent-elles ? Tu ressens une différence par rapport au début ?" },
  { label:"Fin programme", text:"Bravo pour avoir complété ces 4 semaines ! Les résultats viennent avec la constance et tu as montré que tu en es capable. On peut envisager la suite ensemble si tu veux continuer 🏆" },
  { label:"Encouragement", text:"Continue comme ça, tu fais du excellent travail ! La régularité est la clé — chaque séance compte, même les jours où c'est plus difficile." },
  { label:"Nutrition", text:"Pense à bien respecter tes apports en protéines — c'est souvent le point faible qui freine la progression. Tu arrives à atteindre tes objectifs nutritionnels ?" },
];

// ── Login ──────────────────────────────────────────────────────────────
function LoginCoach() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, COACH_EMAIL, password); }
    catch { setError("Mot de passe incorrect."); }
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
            <button type="submit" disabled={loading} style={{background:loading?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"14px",marginTop:2,fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer"}}>
              {loading?"Connexion...":"Accéder →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── MessageBubble ──────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isCoach = msg.sender === "coach";
  const date = msg.createdAt?.toDate?.() ? msg.createdAt.toDate().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : "";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isCoach?"flex-end":"flex-start",marginBottom:12}}>
      <div style={{maxWidth:"75%",padding:"10px 14px",background:isCoach?"rgba(201,168,76,0.1)":"#181818",border:`0.5px solid ${isCoach?"#C9A84C":"#242424"}`,fontSize:14,lineHeight:1.6,color:isCoach?"#E8C87A":"#C8C4BC"}}>
        {msg.text}
      </div>
      <span style={{fontSize:10,color:"#333",marginTop:3}}>{isCoach?"Toi":"Client"} · {date}</span>
    </div>
  );
}

// ── Stats Dashboard ────────────────────────────────────────────────────
function StatsTab({ clients, allMsgsCount }) {
  const plans = clients.reduce((acc, c) => { acc[c.plan||"?"] = (acc[c.plan||"?"]||0)+1; return acc; }, {});
  const topPlan = Object.entries(plans).sort((a,b)=>b[1]-a[1])[0];
  const recentClients = clients.filter(c => c.createdAt && (Date.now() - new Date(c.createdAt).getTime()) < 30*24*3600*1000).length;

  return (
    <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:16}}>
      <div style={{fontSize:11,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:4}}>— Vue d'ensemble</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[
          {label:"Total clients",val:clients.length,icon:"👥",color:"#C9A84C"},
          {label:"Nouveaux ce mois",val:recentClients,icon:"🆕",color:"#7AE07A"},
          {label:"Messages échangés",val:allMsgsCount,icon:"💬",color:"#F0EDE8"},
          {label:"Plan le + vendu",val:topPlan?`${topPlan[0]} (${topPlan[1]})`:"—",icon:"🏆",color:"#E8C87A"},
        ].map((s,i)=>(
          <div key={i} style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:4,padding:"16px"}}>
            <div style={{fontSize:20,marginBottom:8}}>{s.icon}</div>
            <div style={{fontSize:22,fontWeight:700,color:s.color,lineHeight:1,marginBottom:4}}>{s.val}</div>
            <div style={{fontSize:11,color:"#555",letterSpacing:"1px",textTransform:"uppercase"}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:4,padding:"16px"}}>
        <div style={{fontSize:11,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:12}}>Répartition des plans</div>
        {Object.entries(plans).map(([plan,count])=>(
          <div key={plan} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:12,color:"#888",width:70,flexShrink:0,textTransform:"uppercase"}}>{plan}</span>
            <div style={{flex:1,height:6,background:"#1A1A1A",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",background:"#C9A84C",borderRadius:3,width:`${(count/clients.length)*100}%`,transition:"width 0.8s ease"}}/>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:"#F0EDE8",width:20,textAlign:"right",flexShrink:0}}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page Coach principale ──────────────────────────────────────────────
export default function CoachPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientMessages, setClientMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showInactiveWarning, setShowInactiveWarning] = useState(false);
  const [activeView, setActiveView] = useState("messages"); // messages | stats
  const [showTemplates, setShowTemplates] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [allMsgsCount, setAllMsgsCount] = useState(0);
  const bottomRef = useRef(null);
  const inactiveTimer = useRef(null);
  const warningTimer = useRef(null);

  // ── Auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u && u.email === COACH_EMAIL ? u : null);
      setAuthLoading(false);
    }, () => setAuthLoading(false));
    const t = setTimeout(() => setAuthLoading(false), 5000);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  // ── Inactivité ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const reset = () => {
      clearTimeout(inactiveTimer.current); clearTimeout(warningTimer.current);
      setShowInactiveWarning(false);
      warningTimer.current = setTimeout(() => setShowInactiveWarning(true), INACTIVE_LIMIT - WARNING_BEFORE);
      inactiveTimer.current = setTimeout(() => signOut(auth), INACTIVE_LIMIT);
    };
    const events = ["mousedown","mousemove","keydown","scroll","touchstart"];
    events.forEach(e => window.addEventListener(e, reset));
    reset();
    return () => { events.forEach(e => window.removeEventListener(e, reset)); clearTimeout(inactiveTimer.current); clearTimeout(warningTimer.current); };
  }, [user]);

  // ── Clients ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "clients"), snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  // ── Unread counts ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "messages"), where("read", "==", false));
    return onSnapshot(q, snap => {
      const counts = {};
      let total = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.sender === "client") { counts[data.clientId] = (counts[data.clientId]||0)+1; total++; }
      });
      setUnreadCounts(counts);
      setAllMsgsCount(snap.size);
    });
  }, [user]);

  // ── Messages client sélectionné ───────────────────────────────────
  useEffect(() => {
    if (!user || !selectedClient) { setClientMessages([]); return; }
    const q = query(collection(db, "messages"), where("clientId", "==", selectedClient.id));
    return onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
      setClientMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
    });
  }, [user, selectedClient]);

  // ── Charger notes privées ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedClient) { setNotes(""); return; }
    setNotes(selectedClient.coachNotes || "");
  }, [selectedClient]);

  const saveNotes = async () => {
    if (!selectedClient) return;
    setNotesSaving(true);
    try {
      await updateDoc(doc(db, "clients", selectedClient.id), { coachNotes: notes });
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, coachNotes: notes } : c));
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch(e) { console.error("notes:", e); }
    setNotesSaving(false);
  };

  // ── Envoi message ─────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedClient || sending) return;
    setSending(true); setSendError("");
    const txt = newMsg.trim();
    try {
      await addDoc(collection(db, "messages"), {
        clientId: selectedClient.id, clientName: selectedClient.nom,
        clientEmail: selectedClient.email, text: txt, sender: "coach",
        createdAt: serverTimestamp(), read: true,
      });
      setNewMsg(""); setShowTemplates(false);
      fetch("/api/notify-client", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ to: selectedClient.email, nom: selectedClient.nom, message: txt }),
      }).catch(e => console.warn("Notif client:", e));
      const unread = clientMessages.filter(m => m.sender === "client" && !m.read);
      await Promise.all(unread.map(m => updateDoc(doc(db, "messages", m.id), { read: true })));
    } catch(e) { setSendError("Erreur lors de l'envoi. Réessaie."); }
    finally { setSending(false); }
  };

  const unreadCount = (clientId) => unreadCounts[clientId] || 0;

  if (authLoading) return <div style={{background:"#0A0A0A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#C9A84C",fontSize:11,letterSpacing:"3px"}}>CHARGEMENT...</div></div>;
  if (!user) return <LoginCoach />;

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}textarea:focus,input:focus{border-color:#C9A84C !important;outline:none}.template-btn{background:#111;border:0.5px solid #1A1A1A;color:#888;font-family:'Syne',sans-serif;font-size:11px;padding:7px 12px;cursor:pointer;transition:all 0.15s;border-radius:2px;text-align:left}.template-btn:hover{border-color:#C9A84C;color:#E8C87A}`}</style>

      {/* Modale inactivité */}
      {showInactiveWarning && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#111",border:"0.5px solid #C9A84C",padding:"2rem",maxWidth:380,width:"90%",textAlign:"center",borderRadius:4}}>
            <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:14,fontWeight:700,color:"#E8C87A",marginBottom:8}}>Inactivité détectée</div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#888",lineHeight:1.7,marginBottom:"1.5rem"}}>
              Tu vas être déconnecté dans <strong style={{color:"#E8C87A"}}>2 minutes</strong>.
            </p>
            <button onClick={()=>{
              setShowInactiveWarning(false);
              clearTimeout(inactiveTimer.current); clearTimeout(warningTimer.current);
              warningTimer.current = setTimeout(()=>setShowInactiveWarning(true), INACTIVE_LIMIT-WARNING_BEFORE);
              inactiveTimer.current = setTimeout(()=>signOut(auth), INACTIVE_LIMIT);
            }} style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"12px 32px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2}}>
              Je suis toujours là →
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:"0.5px solid #242424",position:"sticky",top:0,background:"#0A0A0A",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:18,fontWeight:800,letterSpacing:5,cursor:"pointer"}} onClick={()=>router.push("/")}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
          <div style={{fontSize:11,letterSpacing:"3px",color:"#C9A84C",textTransform:"uppercase",borderLeft:"0.5px solid #242424",paddingLeft:16}}>Interface Coach</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setActiveView(v=>v==="stats"?"messages":"stats")} style={{background:activeView==="stats"?"rgba(201,168,76,0.1)":"transparent",border:`0.5px solid ${activeView==="stats"?"#C9A84C":"#242424"}`,color:activeView==="stats"?"#C9A84C":"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 16px",cursor:"pointer",borderRadius:2}}>
            📊 Stats
          </button>
          <div style={{fontSize:11,letterSpacing:"1px",color:"#555"}}>{clients.length} client{clients.length>1?"s":""}</div>
          <button onClick={()=>signOut(auth)} style={{background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 16px",cursor:"pointer",borderRadius:2}}>Déconnexion</button>
        </div>
      </nav>

      {/* Stats view */}
      {activeView === "stats" ? (
        <StatsTab clients={clients} allMsgsCount={allMsgsCount} />
      ) : (
        <div style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr",minHeight:"calc(100vh - 57px)"}}>

          {/* Sidebar clients */}
          <div style={{borderRight:"0.5px solid #242424",overflowY:"auto"}}>
            <div style={{padding:"14px 16px",borderBottom:"0.5px solid #242424",fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555"}}>Clients</div>
            {clients.length === 0 ? (
              <div style={{padding:"2rem",textAlign:"center",color:"#333",fontSize:13,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Aucun client pour l'instant.</div>
            ) : clients.map(client => {
              const unread = unreadCount(client.id);
              const isSelected = selectedClient?.id === client.id;
              const lastMsg = isSelected ? clientMessages[clientMessages.length-1] : null;
              return (
                <div key={client.id} onClick={()=>setSelectedClient(client)} style={{padding:"14px 16px",cursor:"pointer",borderBottom:"0.5px solid #242424",background:isSelected?"#181818":"transparent",transition:"background 0.15s",borderLeft:`2px solid ${isSelected?"#C9A84C":"transparent"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div style={{fontSize:13,fontWeight:700,color:isSelected?"#E8C87A":"#F0EDE8"}}>{client.nom}</div>
                    {unread > 0 && <span style={{background:"#C9A84C",color:"#0A0A0A",fontSize:10,fontWeight:700,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}
                  </div>
                  <div style={{fontSize:11,color:"#555",letterSpacing:"1px",textTransform:"uppercase",marginBottom:client.coachNotes?4:0}}>Plan {client.plan}</div>
                  {client.coachNotes && <div style={{fontSize:10,color:"rgba(201,168,76,0.5)",letterSpacing:"0px",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📝 {client.coachNotes.slice(0,30)}...</div>}
                  {lastMsg && <div style={{fontSize:12,color:"#333",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{lastMsg.sender==="coach"?"Toi : ":""}{lastMsg.text}</div>}
                </div>
              );
            })}
          </div>

          {/* Zone principale */}
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
                  <div style={{width:36,height:36,background:"rgba(201,168,76,0.15)",border:"0.5px solid #C9A84C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#C9A84C",borderRadius:2}}>
                    {selectedClient.nom?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700}}>{selectedClient.nom}</div>
                    <div style={{fontSize:11,color:"#555",letterSpacing:"1px"}}>{selectedClient.email} · Plan {selectedClient.plan}</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <span style={{fontSize:11,color:"#555"}}>
                      {selectedClient.createdAt ? `Client depuis le ${new Date(selectedClient.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}` : ""}
                    </span>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 260px",flex:1,minHeight:0}}>
                  {/* Messages */}
                  <div style={{display:"flex",flexDirection:"column",borderRight:"0.5px solid #1A1A1A"}}>
                    <div style={{flex:1,overflowY:"auto",padding:"20px",maxHeight:"calc(100vh - 320px)"}}>
                      {clientMessages.length === 0 ? (
                        <div style={{textAlign:"center",padding:"2rem",color:"#333",fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:"italic"}}>
                          Envoie un message de bienvenue à {selectedClient.nom} !
                        </div>
                      ) : clientMessages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                      <div ref={bottomRef}/>
                    </div>

                    {/* Templates */}
                    {showTemplates && (
                      <div style={{padding:"12px 16px",borderTop:"0.5px solid #1A1A1A",background:"#0A0A0A"}}>
                        <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:8}}>Messages rapides</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {TEMPLATES.map((t,i) => (
                            <button key={i} className="template-btn" onClick={() => { setNewMsg(t.text); setShowTemplates(false); }}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Input */}
                    {sendError && <div style={{padding:"4px 20px",fontSize:12,color:"#E07070"}}>{sendError}</div>}
                    <div style={{padding:"12px 16px",borderTop:"0.5px solid #1A1A1A",display:"flex",gap:8,alignItems:"flex-end"}}>
                      <button onClick={()=>setShowTemplates(p=>!p)} style={{background:showTemplates?"rgba(201,168,76,0.1)":"transparent",border:`0.5px solid ${showTemplates?"#C9A84C":"#242424"}`,color:showTemplates?"#C9A84C":"#555",fontFamily:"'Syne',sans-serif",fontSize:11,padding:"9px 12px",cursor:"pointer",borderRadius:2,flexShrink:0,letterSpacing:"1px"}}>
                        ⚡
                      </button>
                      <textarea value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                        placeholder={`Message à ${selectedClient.nom}...`}
                        style={{flex:1,background:"#111",border:"0.5px solid #242424",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"9px 12px",resize:"none",minHeight:42,outline:"none",borderRadius:2}}/>
                      <button onClick={sendMessage} disabled={!newMsg.trim()||sending}
                        style={{background:newMsg.trim()?"linear-gradient(135deg,#C9A84C,#A67C2E)":"#181818",border:"none",color:"#0A0A0A",padding:"9px 16px",cursor:newMsg.trim()?"pointer":"not-allowed",fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,minWidth:44,borderRadius:2}}>
                        ↑
                      </button>
                    </div>
                  </div>

                  {/* Notes privées */}
                  <div style={{display:"flex",flexDirection:"column",padding:"16px",background:"#0A0A0A"}}>
                    <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:10}}>📝 Notes privées</div>
                    <div style={{fontSize:11,color:"#333",marginBottom:8,fontStyle:"italic"}}>Visibles uniquement par toi</div>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder={`Notes sur ${selectedClient.nom}...\nProgression, observations, points d'attention...`}
                      style={{flex:1,background:"#0D0D0D",border:"0.5px solid #1A1A1A",color:"#888",fontFamily:"'Syne',sans-serif",fontSize:12,padding:"10px 12px",resize:"none",outline:"none",borderRadius:2,lineHeight:1.7,minHeight:120}}
                    />
                    <button onClick={saveNotes} disabled={notesSaving} style={{marginTop:8,padding:"9px",background:notesSaved?"#1A3A1A":"transparent",border:`0.5px solid ${notesSaved?"#3A6A3A":"#242424"}`,color:notesSaved?"#7AE07A":"#555",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2,transition:"all 0.2s"}}>
                      {notesSaved?"✓ Sauvegardé":notesSaving?"Sauvegarde...":"Sauvegarder"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
