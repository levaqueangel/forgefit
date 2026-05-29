"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

// ── Login Screen ──────────────────────────────────────────────────────
function LoginScreen({ lang, setLang, LANGS }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Email ou mot de passe incorrect.");
    }
    setLoading(false);
  };

  const inp = { width:"100%", background:"#111", border:"0.5px solid #242424", color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:13, padding:"12px 16px", outline:"none", borderRadius:0 };

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input:focus{border-color:#C9A84C !important;outline:none}`}</style>
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
              letterSpacing:"3px",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",marginTop:2}}>
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

// ── Bulle message ────────────────────────────────────────────────────
function Bubble({ msg, isCoach }) {
  const date = msg.createdAt?.toDate?.()
    ? msg.createdAt.toDate().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})
    : "";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isCoach?"flex-start":"flex-end",marginBottom:10}}>
      <div style={{maxWidth:"78%",padding:"9px 13px",
        background:isCoach?"#181818":"rgba(201,168,76,0.12)",
        border:`0.5px solid ${isCoach?"#242424":"#C9A84C"}`,
        fontSize:13,lineHeight:1.6,color:isCoach?"#C8C4BC":"#E8C87A",
        borderRadius:2}}>
        {msg.text}
      </div>
      <span style={{fontSize:10,color:"#333",marginTop:2}}>{isCoach?"Coach":"Toi"} · {date}</span>
    </div>
  );
}

// ── Barre de progression animée ─────────────────────────────────────
function ProgressBar({ value, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{height:5,background:"#1A1A1A",borderRadius:3,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${width}%`,background:color,borderRadius:3,transition:"width 1.2s cubic-bezier(0.25,1,0.5,1)"}}/>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────
export default function ClientPage() {
  const router = useRouter();
  const { lang, setLang, t, LANGS } = useLang();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [exoDone, setExoDone] = useState({});
  const [seanceDone, setSeanceDone] = useState({ 0:true, 1:true });
  const bottomRef = useRef(null);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current:"", next:"", confirm:"" });
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // ── Auth + données client ────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "clients", u.uid));
          if (snap.exists()) setClientData(snap.data());
        } catch(e) { console.error("Firestore:", e); }
      }
      setAuthLoading(false);
    }, () => setAuthLoading(false));
    const timer = setTimeout(() => setAuthLoading(false), 5000);
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  // ── Messages temps réel ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "messages"),
      where("clientId", "==", user.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
    });
    return () => unsub();
  }, [user]);

  // ── Changement mot de passe ──────────────────────────────────────
  const handleChangePassword = async () => {
    setPwdError(""); setPwdSuccess(false);
    if (pwdForm.next.length < 6) { setPwdError("Mot de passe trop court (6 caractères minimum)"); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError("Les mots de passe ne correspondent pas"); return; }
    setPwdLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pwdForm.current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pwdForm.next);
      setPwdSuccess(true);
      setPwdForm({ current:"", next:"", confirm:"" });
      setTimeout(() => { setShowPwdModal(false); setPwdSuccess(false); }, 2000);
    } catch(e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") setPwdError("Mot de passe actuel incorrect");
      else setPwdError("Erreur : " + e.message);
    }
    setPwdLoading(false);
  };

  // ── Envoi message ──────────────────────────────────────────────
  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true); setSendError("");
    const txt = newMsg.trim();
    try {
      await addDoc(collection(db, "messages"), {
        clientId: user.uid,
        clientName: clientData?.nom || "Client",
        clientEmail: user.email,
        text: txt,
        sender: "client",
        createdAt: serverTimestamp(),
        read: false,
      });
      setNewMsg("");
      fetch("/api/notify-coach", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ nom: clientData?.nom || "Client", email: user.email, message: txt }),
      }).catch(e => console.warn("Notif coach:", e));
    } catch(e) {
      setSendError("Erreur lors de l'envoi. Réessaie.");
    } finally {
      setSending(false);
    }
  };

  // ── Données statiques dashboard ───────────────────────────────
  const seances = [
    { nom:"Poitrine / Triceps", det:"5 exercices · 52 min", jour:"Lundi" },
    { nom:"Dos / Biceps",       det:"5 exercices · 48 min", jour:"Mardi" },
    { nom:"Jambes / Épaules",   det:"6 exercices · 60 min", jour:"Aujourd'hui", today:true },
    { nom:"Full body",          det:"4 exercices · 45 min", jour:"Vendredi" },
  ];
  const exercices = [
    { nom:"Squat barre",          det:"4 × 8 · 70 kg · repos 2 min" },
    { nom:"Presse à cuisses",     det:"4 × 10 · 100 kg · repos 90 s" },
    { nom:"Fentes marchées",      det:"3 × 12 · 20 kg · repos 60 s" },
    { nom:"Développé épaules",    det:"4 × 10 · 30 kg · repos 90 s" },
    { nom:"Élévations latérales", det:"3 × 15 · 8 kg · repos 60 s" },
    { nom:"Mollets debout",       det:"4 × 15 · poids de corps · repos 45 s" },
  ];
  const records = [
    { nom:"Développé", val:"82 kg" },
    { nom:"Squat",     val:"90 kg" },
    { nom:"Tirage",    val:"75 kg" },
    { nom:"Tractions", val:"5 reps" },
  ];
  const semaine = ["L","M","M","J","V","S","D"];
  const joursEtat = ["done","done","today","rest","future","rest","rest"];
  const doneSeances = Object.values(seanceDone).filter(Boolean).length;
  const doneExos = Object.values(exoDone).filter(Boolean).length;

  // ── Styles partagés ────────────────────────────────────────────
  const S = {
    card: { background:"#111", border:"0.5px solid #1E1E1E", borderRadius:4, padding:"16px" },
    cardTitle: { fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#C9A84C", marginBottom:12, display:"flex", alignItems:"center", gap:6 },
    tag: { fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:"#555" },
  };

  if (authLoading) return (
    <div style={{background:"#0A0A0A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"#C9A84C",fontSize:11,letterSpacing:"3px"}}>CHARGEMENT...</div>
    </div>
  );
  if (!user) return <LoginScreen lang={lang} setLang={setLang} LANGS={LANGS} />;

  const planName = clientData?.plan ? clientData.plan.charAt(0).toUpperCase() + clientData.plan.slice(1) : "—";

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        textarea:focus,input:focus{border-color:#C9A84C !important;outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeUp 0.25s ease forwards}
        .tab-btn{background:none;border:none;color:#555;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;padding:12px 0;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;display:flex;align-items:center;gap:6px}
        .tab-btn.active{color:#E8C87A;border-bottom-color:#C9A84C}
        .tab-btn:hover:not(.active){color:#888}
        .seance-row{display:flex;align-items:center;gap:10px;padding:9px 12px;background:#0D0D0D;border-radius:2px;cursor:pointer;transition:background 0.15s;border:0.5px solid transparent}
        .seance-row:hover{background:#161616}
        .seance-row.today-s{border-color:rgba(201,168,76,0.3)}
        .exo-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#0D0D0D;border-radius:2px;cursor:pointer;transition:all 0.15s;border:0.5px solid transparent}
        .exo-row:hover{background:#161616}
        .exo-row.done-e{opacity:0.45}
        .metric-card{background:#0D0D0D;border:0.5px solid #1A1A1A;border-radius:4px;padding:14px;transition:border-color 0.2s}
        .metric-card:hover{border-color:#242424}
        .record-card{background:#0D0D0D;border:0.5px solid #1A1A1A;border-radius:4px;padding:12px;text-align:center}
        .pwd-input{width:100%;background:transparent;border:none;color:#F0EDE8;font-family:'Syne',sans-serif;font-size:13px;outline:none}
        @media(max-width:640px){.grid2{grid-template-columns:1fr !important}.metrics-grid{grid-template-columns:1fr 1fr !important}.week-grid{gap:4px !important}}
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",borderBottom:"0.5px solid #1A1A1A",position:"sticky",top:0,background:"#0A0A0A",zIndex:100}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:5,cursor:"pointer"}} onClick={()=>router.push("/")}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",background:"rgba(201,168,76,0.08)",border:"0.5px solid rgba(201,168,76,0.4)",color:"#C9A84C",padding:"4px 12px",borderRadius:2}}>
            Plan {planName}
          </span>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={()=>setShowPwdModal(true)} style={{background:"transparent",border:"0.5px solid #1E1E1E",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 14px",cursor:"pointer",borderRadius:2}}>
            🔑
          </button>
          <button onClick={()=>signOut(auth)} style={{background:"transparent",border:"0.5px solid #1E1E1E",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 14px",cursor:"pointer",borderRadius:2}}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ── Modale MDP ───────────────────────────────────────────── */}
      {showPwdModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
          <div style={{background:"#111",border:"0.5px solid #242424",padding:"2rem",width:"100%",maxWidth:400,borderRadius:4}}>
            <div style={{fontSize:11,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1rem"}}>— Changer le mot de passe</div>
            {pwdSuccess ? (
              <div style={{textAlign:"center",padding:"1.5rem 0"}}>
                <div style={{fontSize:32,marginBottom:8}}>✅</div>
                <div style={{color:"#7AE07A",fontSize:14}}>Mot de passe modifié !</div>
              </div>
            ) : (
              <>
                {[["current","Mot de passe actuel","••••••••"],["next","Nouveau mot de passe","6 caractères minimum"],["confirm","Confirmer","Répète le nouveau"]].map(([k,l,ph])=>(
                  <div key={k} style={{background:"#0D0D0D",padding:"12px 14px",border:"0.5px solid #242424",marginBottom:1,borderRadius:2}}>
                    <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:6}}>{l}</div>
                    <input type="password" placeholder={ph} value={pwdForm[k]} onChange={e=>setPwdForm(f=>({...f,[k]:e.target.value}))} className="pwd-input"/>
                  </div>
                ))}
                {pwdError && <div style={{background:"#1A0808",border:"0.5px solid #5A1A1A",color:"#E07070",fontSize:12,padding:"10px 14px",marginTop:1,borderRadius:2}}>{pwdError}</div>}
                <div style={{display:"flex",gap:8,marginTop:16}}>
                  <button onClick={()=>{setShowPwdModal(false);setPwdError("");setPwdForm({current:"",next:"",confirm:""});}}
                    style={{flex:1,padding:"11px",background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2}}>
                    Annuler
                  </button>
                  <button onClick={handleChangePassword} disabled={pwdLoading}
                    style={{flex:2,padding:"11px",background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2}}>
                    {pwdLoading ? "Modification..." : "Confirmer →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Header + Tabs ────────────────────────────────────────── */}
      <div style={{padding:"16px 24px 0",borderBottom:"0.5px solid #1A1A1A",background:"#0A0A0A"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,marginBottom:12}}>
          Bonjour <em style={{color:"#C9A84C",fontStyle:"italic"}}>{clientData?.nom || user.email.split("@")[0]}</em> 👋
          <span style={{fontSize:13,color:"#555",fontFamily:"'Syne',sans-serif",fontWeight:400,fontStyle:"normal",marginLeft:12}}>Semaine 3 sur 4</span>
        </div>
        <div style={{display:"flex",gap:"1.5rem",overflowX:"auto"}}>
          {[
            { id:"dashboard", label:"Dashboard",  icon:"📊" },
            { id:"programme", label:"Programme",  icon:"🏋️" },
            { id:"nutrition", label:"Nutrition",  icon:"🥗" },
            { id:"messages",  label:`Messages${messages.filter(m=>m.sender==="coach"&&!m.read).length > 0 ? " ●" : ""}`, icon:"💬" },
          ].map(tab => (
            <button key={tab.id} className={`tab-btn${activeTab===tab.id?" active":""}`} onClick={()=>setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────── */}
      <div style={{flex:1,padding:"20px 24px",display:"flex",flexDirection:"column",gap:16,maxWidth:900,width:"100%",margin:"0 auto"}}>

        {/* ════════════ DASHBOARD ════════════ */}
        {activeTab === "dashboard" && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Métriques */}
            <div className="metrics-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                { label:"Séances", val:`${doneSeances}/4`, sub:"cette semaine", color:"#C9A84C" },
                { label:"Charge max", val:"+4 kg", sub:"développé couché", color:"#7AE07A" },
                { label:"Hydratation", val:"1.8 L", sub:"objectif 2.5 L", color:"#F0EDE8" },
                { label:"Streak", val:"12 j", sub:"sans interruption", color:"#F0EDE8" },
              ].map((m,i) => (
                <div key={i} className="metric-card">
                  <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:8}}>{m.label}</div>
                  <div style={{fontSize:22,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4}}>{m.val}</div>
                  <div style={{fontSize:11,color:"#444"}}>{m.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

              {/* Séances semaine */}
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <span>📅</span> Séances de la semaine
                  <span style={{...S.tag,marginLeft:"auto"}}>{doneSeances}/4</span>
                </div>
                {/* Calendrier semaine */}
                <div className="week-grid" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:14}}>
                  {semaine.map((d,i) => (
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span style={{fontSize:10,color:"#555"}}>{d}</span>
                      <div style={{
                        width:26,height:26,borderRadius:"50%",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,
                        background: joursEtat[i]==="done"?"#1A3A1A": joursEtat[i]==="today"?"#C9A84C": joursEtat[i]==="rest"?"#181818":"#111",
                        color: joursEtat[i]==="done"?"#7AE07A": joursEtat[i]==="today"?"#0A0A0A": "#444",
                        opacity: joursEtat[i]==="future"?0.35:1,
                      }}>
                        {joursEtat[i]==="done"?"✓": joursEtat[i]==="today"?"●": joursEtat[i]==="rest"?"—":""}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {seances.map((s,i) => (
                    <div key={i} className={`seance-row${s.today?" today-s":""}`}
                      onClick={()=>{ if(seanceDone[i]||i<2) return; setSeanceDone(prev=>({...prev,[i]:!prev[i]})); }}>
                      <div style={{
                        width:20,height:20,borderRadius:"50%",flexShrink:0,
                        border:`1.5px solid ${seanceDone[i]?"#639922":"rgba(201,168,76,0.3)"}`,
                        background:seanceDone[i]?"#1A3A1A":"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#7AE07A"
                      }}>
                        {seanceDone[i]?"✓":""}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:seanceDone[i]?"#555":"#F0EDE8"}}>{s.nom}</div>
                        <div style={{fontSize:11,color:"#555"}}>{s.det}</div>
                      </div>
                      <span style={{
                        fontSize:11,padding:"2px 8px",borderRadius:10,
                        background:seanceDone[i]?"#1A3A1A":s.today?"rgba(201,168,76,0.1)":"#181818",
                        color:seanceDone[i]?"#7AE07A":s.today?"#C9A84C":"#555",
                        border:`0.5px solid ${seanceDone[i]?"#3A6A3A":s.today?"rgba(201,168,76,0.3)":"#242424"}`
                      }}>
                        {seanceDone[i]?"Fait":s.today?"Aujourd'hui":s.jour}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {/* Progression objectifs */}
                <div style={S.card}>
                  <div style={S.cardTitle}>📈 Progression <span style={{...S.tag,marginLeft:"auto"}}>Sem. 3/4</span></div>
                  {[
                    { label:"Prise de masse", pct:72, color:"#C9A84C" },
                    { label:"Force globale",  pct:58, color:"#7AE07A" },
                    { label:"Endurance",      pct:45, color:"#5DCAA5" },
                  ].map((p,i) => (
                    <div key={i} style={{marginBottom:i<2?12:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                        <span style={{color:"#888"}}>{p.label}</span>
                        <span style={{color:p.color,fontWeight:700}}>{p.pct}%</span>
                      </div>
                      <ProgressBar value={p.pct} color={p.color} delay={i*150} />
                    </div>
                  ))}
                </div>

                {/* Calories */}
                <div style={S.card}>
                  <div style={S.cardTitle}>🍎 Calories aujourd'hui <span style={{...S.tag,marginLeft:"auto"}}>2 180/2 800 kcal</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px",background:"#0A0A0A",borderRadius:2,marginBottom:12}}>
                    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
                      <circle cx="22" cy="22" r="17" fill="none" stroke="#1A1A1A" strokeWidth="4"/>
                      <circle cx="22" cy="22" r="17" fill="none" stroke="#C9A84C" strokeWidth="4"
                        strokeDasharray="107 107" strokeDashoffset="27" strokeLinecap="round"
                        transform="rotate(-90 22 22)"/>
                    </svg>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#F0EDE8"}}>78% de l'objectif</div>
                      <div style={{fontSize:11,color:"#555",marginTop:2}}>620 kcal restantes</div>
                    </div>
                  </div>
                  {[
                    { nom:"Protéines", val:"142 g", pct:81, color:"#7AE07A" },
                    { nom:"Glucides",  val:"248 g", pct:65, color:"#C9A84C" },
                    { nom:"Lipides",   val:"58 g",  pct:73, color:"#5DCAA5" },
                  ].map((c,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderTop:"0.5px solid #141414"}}>
                      <span style={{fontSize:12,color:"#555",width:62,flexShrink:0}}>{c.nom}</span>
                      <div style={{flex:1,height:4,background:"#1A1A1A",borderRadius:2,overflow:"hidden"}}>
                        <ProgressBar value={c.pct} color={c.color} delay={i*100} />
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:"#888",width:40,textAlign:"right",flexShrink:0}}>{c.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ PROGRAMME ════════════ */}
        {activeTab === "programme" && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Séance du jour */}
            <div style={S.card}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div style={S.cardTitle}>🏋️ Séance du jour — Jambes / Épaules</div>
                <span style={{fontSize:11,color:"#C9A84C",fontWeight:700}}>{doneExos}/{exercices.length} exercices</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {exercices.map((e,i) => (
                  <div key={i} className={`exo-row${exoDone[i]?" done-e":""}`}
                    onClick={()=>setExoDone(prev=>({...prev,[i]:!prev[i]}))}>
                    <div style={{
                      width:18,height:18,borderRadius:3,flexShrink:0,
                      border:`1.5px solid ${exoDone[i]?"#639922":"#333"}`,
                      background:exoDone[i]?"#1A3A1A":"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:10,color:"#7AE07A",transition:"all 0.2s"
                    }}>
                      {exoDone[i]?"✓":""}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:exoDone[i]?"#444":"#F0EDE8"}}>{e.nom}</div>
                      <div style={{fontSize:11,color:"#444"}}>{e.det}</div>
                    </div>
                    {exoDone[i] && <span style={{fontSize:10,color:"#7AE07A",letterSpacing:"1px"}}>FAIT</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Records */}
            <div style={S.card}>
              <div style={S.cardTitle}>🏆 Records personnels <span style={{...S.tag,marginLeft:"auto"}}>Cette semaine</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {records.map((r,i) => (
                  <div key={i} className="record-card">
                    <div style={{fontSize:11,color:"#555",marginBottom:6}}>{r.nom}</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#C9A84C"}}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Programme complet */}
            {clientData?.programme && (
              <div style={S.card}>
                <div style={S.cardTitle}>📋 Programme complet</div>
                <pre style={{fontFamily:"'Courier New',monospace",fontSize:12,color:"#666",whiteSpace:"pre-wrap",lineHeight:1.8}}>
                  {clientData.programme}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ════════════ NUTRITION ════════════ */}
        {activeTab === "nutrition" && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="metrics-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                { label:"Calories",  val:"2 180", sub:"/ 2 800 kcal",  color:"#C9A84C" },
                { label:"Protéines", val:"142 g",  sub:"/ 175 g objectif", color:"#7AE07A" },
                { label:"Glucides",  val:"248 g",  sub:"/ 380 g objectif", color:"#F0EDE8" },
                { label:"Lipides",   val:"58 g",   sub:"/ 80 g objectif",  color:"#F0EDE8" },
              ].map((m,i) => (
                <div key={i} className="metric-card">
                  <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:8}}>{m.label}</div>
                  <div style={{fontSize:20,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4}}>{m.val}</div>
                  <div style={{fontSize:11,color:"#444"}}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={S.card}>
                <div style={S.cardTitle}>🍽 Repas d'aujourd'hui</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    { nom:"Petit-déjeuner",     det:"Flocons avoine · œufs · whey",       kcal:520 },
                    { nom:"Déjeuner",           det:"Poulet · riz · légumes verts",         kcal:680 },
                    { nom:"Collation pré-séance",det:"Banane · amandes · fromage blanc",  kcal:380 },
                  ].map((r,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 10px",background:"#0D0D0D",borderRadius:2}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#F0EDE8"}}>{r.nom}</div>
                        <div style={{fontSize:11,color:"#555"}}>{r.det}</div>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:"#C9A84C"}}>{r.kcal} kcal</div>
                    </div>
                  ))}
                  <div style={{padding:"9px 10px",border:"0.5px dashed #242424",borderRadius:2,fontSize:13,color:"#444",cursor:"pointer"}}>
                    + Ajouter dîner <span style={{float:"right",fontSize:11,color:"#333"}}>620 kcal restantes</span>
                  </div>
                </div>
              </div>
              <div style={S.card}>
                <div style={S.cardTitle}>📆 Semaine en cours</div>
                {[
                  { j:"Lundi",    kcal:2690, pct:96 },
                  { j:"Mardi",    kcal:2490, pct:89 },
                  { j:"Mercredi", kcal:2180, pct:78 },
                  { j:"Jeudi",    kcal:null,  pct:0  },
                ].map((d,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span style={{fontSize:12,color:"#555",width:64,flexShrink:0}}>{d.j}</span>
                    <div style={{flex:1,height:4,background:"#1A1A1A",borderRadius:2,overflow:"hidden"}}>
                      <ProgressBar value={d.pct} color="#C9A84C" delay={i*100}/>
                    </div>
                    <span style={{fontSize:12,color:"#555",width:70,textAlign:"right",flexShrink:0}}>
                      {d.kcal ? `${d.kcal.toLocaleString()} kcal` : "—"}
                    </span>
                  </div>
                ))}
                <div style={{borderTop:"0.5px solid #1A1A1A",paddingTop:10,marginTop:4,fontSize:12,color:"#555"}}>
                  Moyenne : <strong style={{color:"#F0EDE8"}}>2 453 kcal</strong> · Objectif : <strong style={{color:"#C9A84C"}}>2 800 kcal</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ MESSAGES ════════════ */}
        {activeTab === "messages" && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",flex:1}}>
            <div style={{...S.card,flex:1}}>
              <div style={{...S.cardTitle,marginBottom:14}}>
                💬 Coach Angel
                <span style={{marginLeft:"auto",fontSize:11,color:"#7AE07A",display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:6,height:6,background:"#7AE07A",borderRadius:"50%",display:"inline-block"}}></span>
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
                <textarea
                  value={newMsg}
                  onChange={e=>setNewMsg(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                  placeholder="Écris ton message... (Entrée pour envoyer)"
                  style={{flex:1,background:"#0D0D0D",border:"0.5px solid #1E1E1E",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"10px 14px",resize:"none",minHeight:52,outline:"none",borderRadius:2}}
                />
                <button onClick={sendMessage} disabled={!newMsg.trim()||sending} style={{
                  background:newMsg.trim()?"linear-gradient(135deg,#C9A84C,#A67C2E)":"#181818",
                  border:"none",color:"#0A0A0A",padding:"0 18px",
                  cursor:newMsg.trim()?"pointer":"not-allowed",
                  fontSize:18,fontWeight:700,borderRadius:2,flexShrink:0}}>
                  ↑
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
