"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

function LoginScreen({ onLogin, lang, setLang, LANGS }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    }
    setLoading(false);
  };

  const inp = { width:"100%", background:"#111", border:"0.5px solid #242424", color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:13, padding:"12px 16px", outline:"none", borderRadius:0 };

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}input:focus{border-color:#C9A84C !important;outline:none}`}</style>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 28px",borderBottom:"0.5px solid #242424"}}>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:5}}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
        <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
      </nav>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{width:"100%",maxWidth:400}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.75rem"}}>— Espace client</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:600,lineHeight:1.1,marginBottom:"2rem"}}>
            Bon retour<br/><em style={{fontStyle:"italic",color:"#555"}}>parmi nous</em>
          </div>
          <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:1}}>
            <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:7}}>Email</div>
              <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" required />
            </div>
            <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:7}}>Mot de passe</div>
              <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div style={{background:"#1A0808",border:"0.5px solid #5A1A1A",color:"#E07070",fontSize:12,padding:"10px 14px"}}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              background:loading?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",
              border:"none",color:"#0A0A0A",padding:"14px",
              fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
              letterSpacing:"3px",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",
              marginTop:2}}>
              {loading ? "Connexion..." : "Se connecter →"}
            </button>
          </form>
          <p style={{fontSize:12,color:"#333",textAlign:"center",marginTop:"1.5rem",lineHeight:1.6}}>
            Tes identifiants t'ont été envoyés par email après ton bilan.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, isCoach }) {
  const date = msg.createdAt?.toDate?.() ? msg.createdAt.toDate().toLocaleTimeString("fr-FR", {hour:"2-digit",minute:"2-digit"}) : "";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isCoach?"flex-start":"flex-end",marginBottom:12}}>
      <div style={{
        maxWidth:"75%",padding:"10px 14px",
        background:isCoach?"#181818":"rgba(201,168,76,0.1)",
        border:`0.5px solid ${isCoach?"#242424":"#C9A84C"}`,
        fontSize:14,lineHeight:1.6,color:isCoach?"#C8C4BC":"#E8C87A",
      }}>
        {msg.text}
      </div>
      <span style={{fontSize:10,color:"#333",marginTop:3}}>{isCoach?"Coach":"Vous"} · {date}</span>
    </div>
  );
}

export default function ClientPage() {
  const router = useRouter();
  const { lang, setLang, t, LANGS } = useLang();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "clients", u.uid));
          if (snap.exists()) setClientData(snap.data());
        } catch(e) { console.error("Firestore error:", e); }
      }
      setAuthLoading(false);
    }, (error) => {
      console.error("Auth error:", error);
      setAuthLoading(false);
    });
    // Timeout de sécurité — 5 secondes max
    const timer = setTimeout(() => setAuthLoading(false), 5000);
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "messages"), where("clientId", "==", user.uid), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [user]);

  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    await addDoc(collection(db, "messages"), {
      clientId: user.uid,
      clientName: clientData?.nom || "Client",
      clientEmail: user.email,
      text: newMsg.trim(),
      sender: "client",
      createdAt: serverTimestamp(),
      read: false,
    });
    // Notifier le coach par email
    await fetch("/api/notify-coach", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: clientData?.nom || "Client", email: user.email, message: newMsg.trim() }),
    });
    setNewMsg("");
    setSending(false);
  };

  if (authLoading) return <div style={{background:"#0A0A0A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#C9A84C",fontSize:11,letterSpacing:"3px"}}>CHARGEMENT...</div></div>;

  if (!user) return <LoginScreen onLogin={()=>{}} lang={lang} setLang={setLang} LANGS={LANGS} />;

  const navTab = (id, label) => (
    <button onClick={() => setActiveTab(id)} style={{
      background:"none",border:"none",color:activeTab===id?"#E8C87A":"#555",
      fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",
      textTransform:"uppercase",cursor:"pointer",padding:"0 0 8px",
      borderBottom:`2px solid ${activeTab===id?"#C9A84C":"transparent"}`,transition:"all 0.2s"}}>
      {label}
    </button>
  );

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}textarea:focus{border-color:#C9A84C !important;outline:none}`}</style>

      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:"0.5px solid #242424",position:"sticky",top:0,background:"#0A0A0A",zIndex:100}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:5,cursor:"pointer"}} onClick={()=>router.push("/")}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          {clientData && <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",background:"rgba(201,168,76,0.1)",border:"0.5px solid #C9A84C",color:"#C9A84C",padding:"4px 12px"}}>Plan {clientData.plan}</div>}
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={()=>signOut(auth)} style={{background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 16px",cursor:"pointer"}}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{padding:"1.5rem 1.5rem 0",borderBottom:"0.5px solid #242424",maxWidth:800,width:"100%",margin:"0 auto"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,marginBottom:"1rem"}}>
          Bonjour <em style={{color:"#C9A84C",fontStyle:"italic"}}>{clientData?.nom || user.email}</em> 👋
        </div>
        <div style={{display:"flex",gap:"2rem"}}>
          {navTab("messages","💬 Messages")}
          {navTab("programme","📋 Mon programme")}
        </div>
      </div>

      <div style={{flex:1,maxWidth:800,width:"100%",margin:"0 auto",padding:"1.5rem",display:"flex",flexDirection:"column"}}>

        {/* TAB MESSAGES */}
        {activeTab === "messages" && (
          <div style={{display:"flex",flexDirection:"column",flex:1}}>
            <div style={{flex:1,overflowY:"auto",maxHeight:"calc(100vh - 340px)",marginBottom:"1rem",minHeight:200}}>
              {messages.length === 0 ? (
                <div style={{textAlign:"center",padding:"3rem",color:"#333",fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic"}}>
                  Aucun message pour l'instant.<br/>Le coach va te contacter très bientôt.
                </div>
              ) : (
                messages.map(msg => <MessageBubble key={msg.id} msg={msg} isCoach={msg.sender==="coach"} />)
              )}
              <div ref={bottomRef} />
            </div>
            <div style={{display:"flex",gap:1,borderTop:"0.5px solid #242424",paddingTop:"1rem"}}>
              <textarea
                value={newMsg}
                onChange={e=>setNewMsg(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}}}
                placeholder="Écris ton message... (Entrée pour envoyer)"
                style={{flex:1,background:"#111",border:"0.5px solid #242424",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"12px 16px",resize:"none",minHeight:56,outline:"none",borderRadius:0}}
              />
              <button onClick={sendMessage} disabled={!newMsg.trim()||sending} style={{
                background:newMsg.trim()?"linear-gradient(135deg,#C9A84C,#A67C2E)":"#181818",
                border:"none",color:"#0A0A0A",padding:"0 20px",cursor:newMsg.trim()?"pointer":"not-allowed",
                fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700}}>
                ↑
              </button>
            </div>
          </div>
        )}

        {/* TAB PROGRAMME */}
        {activeTab === "programme" && (
          <div>
            {clientData?.programme ? (
              <div style={{background:"#111",border:"0.5px solid #242424",padding:"24px"}}>
                <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:16}}>— Ton programme personnalisé</div>
                <pre style={{fontFamily:"'Courier New',monospace",fontSize:13,color:"#888",whiteSpace:"pre-wrap",lineHeight:1.8}}>{clientData.programme}</pre>
              </div>
            ) : (
              <div style={{textAlign:"center",padding:"3rem",color:"#333",fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic"}}>
                Ton programme est en cours de préparation. Tu le recevras très bientôt !
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
