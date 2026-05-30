"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
// Sous-composants extraits pour la lisibilité et la maintenabilité
import { parseReposSeconds, beep } from "./utils";
import { RestTimer } from "./RestTimer";
import { ChargesTab } from "./ChargesTab";
import { CorpsJournal } from "./CorpsJournal";
import { ProgressBar } from "./ProgressBar";
import { ToastContainer } from "./Toast";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

// ── Composants utilitaires ─────────────────────────────────────────────

function LoginScreen({ lang, setLang, LANGS }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setError("Email ou mot de passe incorrect."); }
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
            <button type="submit" disabled={loading} style={{background:loading?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"14px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",marginTop:2}}>
              {loading?"Connexion...":"Se connecter →"}
            </button>
          </form>
          <p style={{fontSize:12,color:"#333",textAlign:"center",marginTop:"1.5rem",lineHeight:1.6}}>Tes identifiants t'ont été envoyés par email après ton bilan.</p>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg, isCoach }) {
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
  const [progSubTab, setProgSubTab] = useState("seance"); // seance | charges
  const [exoDone, setExoDone] = useState({});
  const [seanceDone, setSeanceDone] = useState({ 0:true, 1:true });
  const [timer, setTimer] = useState(null); // { duration, name }
  const [toasts, setToasts] = useState([]);
  const [confetti, setConfetti] = useState(false);
  const [prevTab, setPrevTab] = useState("dashboard");
  const bottomRef = useRef(null);

  // ── Toast helper ────────────────────────────────────────────
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  // ── Confetti quand tous les exercices sont faits ─────────────
  const prevDoneExos = useRef(0);
  // ── Générateur de repas ─────────────────────────────────────────
  const [mealPlan, setMealPlan] = useState(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealError, setMealError] = useState("");
  // ── Chatbot IA ───────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState([
    { role: "assistant", content: "Bonjour ! Je suis ton assistant fitness APXFITNESS. Pose-moi tes questions sur la musculation, la nutrition ou ta récupération 💪" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current:"", next:"", confirm:"" });
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────
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

  // ── Messages ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "messages"), where("clientId", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
    });
    return () => unsub();
  }, [user]);

  // ── Générateur de plan de repas ─────────────────────────────────
  const generateMealPlan = async () => {
    if (!nutrition || mealLoading) return;
    setMealLoading(true);
    setMealError("");
    try {
      const prompt = `Génère un plan alimentaire pour UNE journée type avec exactement ces macros :
- Calories : ${nutrition.calories_jour} kcal
- Protéines : ${nutrition.proteines_g}g
- Glucides : ${nutrition.glucides_g}g
- Lipides : ${nutrition.lipides_g}g
- Régime : ${clientData?.programmeData?.regime || "standard"}
- Objectif : ${nutrition.objectif || clientData?.programmeData?.objectif_principal || "fitness"}

Réponds UNIQUEMENT avec un JSON valide (sans markdown) :
{
  "repas": [
    { "nom": "Petit-déjeuner", "heure": "7h30", "aliments": ["aliment 1 - quantité", "aliment 2"], "calories": 520, "proteines": 35, "glucides": 60, "lipides": 12 },
    { "nom": "Déjeuner", "heure": "12h30", "aliments": [...], "calories": ..., "proteines": ..., "glucides": ..., "lipides": ... },
    { "nom": "Collation", "heure": "16h00", "aliments": [...], "calories": ..., "proteines": ..., "glucides": ..., "lipides": ... },
    { "nom": "Dîner", "heure": "19h30", "aliments": [...], "calories": ..., "proteines": ..., "glucides": ..., "lipides": ... }
  ],
  "conseil_du_jour": "Un conseil nutrition court et pratique"
}
Aliments concrets avec grammages. Total macros doit correspondre aux objectifs.`;

      const res = await fetch("/api/chatbot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, programmeData: clientData?.programmeData }),
      });
      const data = await res.json();
      if (data.reply) {
        try {
          const cleaned = data.reply.replace(/^```json\s*/i,"").replace(/\s*```$/i,"").trim();
          setMealPlan(JSON.parse(cleaned));
        } catch { setMealPlan(null); }
      }
    } catch(e) {
      console.error("mealPlan:", e);
      setMealError("Erreur lors de la génération. Réessaie.");
    }
    setMealLoading(false);
  };

  // ── Chatbot IA ──────────────────────────────────────────────────
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const userMsg = { role: "user", content: msg };
    setChatHistory(h => [...h, userMsg]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          programmeData: clientData?.programmeData || null,
          history: chatHistory.slice(-6),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatHistory(h => [...h.slice(-48), { role: "assistant", content: data.reply }]);
      } else {
        setChatHistory(h => [...h, { role: "assistant", content: "Désolé, je n'ai pas pu répondre. Réessaie !" }]);
      }
    } catch {
      setChatHistory(h => [...h, { role: "assistant", content: "Erreur de connexion. Réessaie dans un instant." }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // ── MDP ────────────────────────────────────────────────────────────
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
      addToast("Mot de passe modifié ✓", "success");
      setPwdForm({ current:"", next:"", confirm:"" });
      setTimeout(() => { setShowPwdModal(false); setPwdSuccess(false); }, 2000);
    } catch(e) {
      setPwdError(e.code === "auth/wrong-password" || e.code === "auth/invalid-credential" ? "Mot de passe actuel incorrect" : "Erreur : " + e.message);
    }
    setPwdLoading(false);
  };

  // ── Envoi message ──────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true); setSendError("");
    const txt = newMsg.trim();
    try {
      await addDoc(collection(db, "messages"), {
        clientId: user.uid, clientName: clientData?.nom || "Client",
        clientEmail: user.email, text: txt, sender: "client",
        createdAt: serverTimestamp(), read: false,
      });
      setNewMsg("");
      addToast("Message envoyé ✓", "success");
      fetch("/api/notify-coach", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ nom: clientData?.nom || "Client", email: user.email, message: txt }),
      }).catch(e => console.warn("Notif coach:", e));
    } catch { setSendError("Erreur lors de l'envoi. Réessaie."); }
    finally { setSending(false); }
  };

  // ── Données programme réelles ──────────────────────────────────────
  const pd = clientData?.programmeData;
  const seancesReelles = pd?.seances || [];
  const seancesS12 = seancesReelles.filter(s => s.semaines === "1-2" || s.semaines?.startsWith("1"));
  const seancesActuelles = seancesS12.length > 0 ? seancesS12 : seancesReelles;
  const seances = seancesActuelles.map((s, i) => ({
    nom: s.nom, det: `${s.exercices?.length || 0} exercices · ${s.duree_min || "~50"} min`,
    jour: s.jour_suggere || `Jour ${i+1}`, today: i === 2,
  }));
  const seanceAujourdhui = seancesActuelles[2] || seancesActuelles[0];
  const exercices = (seanceAujourdhui?.exercices || []).map(e => ({
    nom: e.nom,
    det: `${e.series} × ${e.reps} · ${e.charge} · repos ${e.repos}`,
    conseil: e.conseil,
    reposSec: parseReposSeconds(e.repos),
  }));
  const nutrition = pd?.nutrition || null;
  const records = exercices.slice(0, 4).map(e => ({ nom: e.nom.split(" ").slice(0,2).join(" "), val: "—" }));
  const nbSeances = pd?.seances_par_semaine || seances.length || 3;
  const semaine = ["L","M","M","J","V","S","D"];
  const joursEtat = Array.from({length:7}, (_,i) => {
    if (i < 2) return "done"; if (i === 2) return "today";
    if (i < nbSeances) return "future"; return "rest";
  });
  const doneSeances = Object.values(seanceDone).filter(Boolean).length;
  const doneExos = Object.values(exoDone).filter(Boolean).length;

  // Semaine calculée depuis la date de création du programme
  const currentWeek = (() => {
    if (!clientData?.createdAt) return null;
    const created = new Date(clientData.createdAt);
    const diffMs = Date.now() - created.getTime();
    const week = Math.min(Math.max(Math.floor(diffMs / (7 * 24 * 3600 * 1000)) + 1, 1), 4);
    return week;
  })();
  const totalWeeks = pd?.duree_programme_semaines || 4;

  // Streak réel depuis Firestore (sauvegardé dans clientData)
  const realStreak = clientData?.streakDays || 0;

  // Renouvellement : si programme > 28 jours
  const showRenew = clientData?.createdAt
    ? (Date.now() - new Date(clientData.createdAt).getTime()) > 28 * 24 * 3600 * 1000
    : false;

  const S = {
    card: { background:"#111", border:"0.5px solid #1E1E1E", borderRadius:4, padding:"16px" },
    cardTitle: { fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#C9A84C", marginBottom:12, display:"flex", alignItems:"center", gap:6 },
    tag: { fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:"#555" },
  };

  if (authLoading) return (
    <div style={{background:"#0A0A0A",minHeight:"100vh",fontFamily:"'Syne',sans-serif"}}>
      <style>{`@keyframes skeletonShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.skel{background:linear-gradient(90deg,#111 25%,#1A1A1A 50%,#111 75%);background-size:800px 100%;animation:skeletonShimmer 1.4s ease-in-out infinite;border-radius:3px}`}</style>
      {/* Skeleton Nav */}
      <div style={{height:57,borderBottom:"0.5px solid #1A1A1A",display:"flex",alignItems:"center",padding:"0 24px",gap:16}}>
        <div className="skel" style={{width:140,height:14}}/>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          <div className="skel" style={{width:70,height:24,borderRadius:12}}/>
          <div className="skel" style={{width:28,height:28,borderRadius:2}}/>
          <div className="skel" style={{width:90,height:28,borderRadius:2}}/>
        </div>
      </div>
      {/* Skeleton Header */}
      <div style={{padding:"16px 24px 0",borderBottom:"0.5px solid #1A1A1A"}}>
        <div className="skel" style={{width:260,height:20,marginBottom:16}}/>
        <div style={{display:"flex",gap:24,paddingBottom:0}}>
          {[80,80,70,80,90].map((w,i)=><div key={i} className="skel" style={{width:w,height:10,marginBottom:12}}/>)}
        </div>
      </div>
      {/* Skeleton Content */}
      <div style={{padding:"20px 24px",maxWidth:900,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[1,2,3,4].map(i=><div key={i} style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:4,padding:14}}>
            <div className="skel" style={{width:"55%",height:9,marginBottom:10}}/>
            <div className="skel" style={{width:"65%",height:22,marginBottom:6}}/>
            <div className="skel" style={{width:"45%",height:8}}/>
          </div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{background:"#111",border:"0.5px solid #1E1E1E",borderRadius:4,padding:16}}>
            <div className="skel" style={{width:"40%",height:9,marginBottom:16}}/>
            {[1,2,3,4].map(i=><div key={i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:"0.5px solid #141414"}}>
              <div className="skel" style={{width:20,height:20,borderRadius:"50%",flexShrink:0}}/>
              <div style={{flex:1}}><div className="skel" style={{width:"70%",height:11,marginBottom:5}}/><div className="skel" style={{width:"40%",height:8}}/></div>
            </div>)}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[1,2].map(j=><div key={j} style={{background:"#111",border:"0.5px solid #1E1E1E",borderRadius:4,padding:16,flex:1}}>
              <div className="skel" style={{width:"50%",height:9,marginBottom:14}}/>
              {[1,2,3].map(k=><div key={k} style={{marginBottom:k<3?12:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <div className="skel" style={{width:"35%",height:10}}/><div className="skel" style={{width:"12%",height:10}}/>
                </div>
                <div className="skel" style={{height:4}}/>
              </div>)}
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
  if (!user) return <LoginScreen lang={lang} setLang={setLang} LANGS={LANGS} />;

  const planName = clientData?.plan ? clientData.plan.charAt(0).toUpperCase() + clientData.plan.slice(1) : "—";

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        textarea:focus,input:focus{border-color:#C9A84C !important;outline:none}

        /* ── Animations ─────────────────────────────────────────── */
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes skeletonShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes checkPop{0%{transform:scale(0.8)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
        @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(120px) rotate(720deg);opacity:0}}
        @keyframes metricCount{from{opacity:0;transform:scale(0.85) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}

        /* ── Tabs ─────────────────────────────────────────────────── */
        .fade-in{animation:fadeUp 0.22s ease forwards}
        .slide-in-right{animation:slideInRight 0.22s cubic-bezier(0.25,1,0.5,1) forwards}
        .slide-in-left{animation:slideInLeft 0.22s cubic-bezier(0.25,1,0.5,1) forwards}
        .tab-btn{background:none;border:none;color:#555;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;padding:12px 0;border-bottom:2px solid transparent;transition:color 0.2s,border-color 0.2s;white-space:nowrap;display:flex;align-items:center;gap:6px;position:relative}
        .tab-btn.active{color:#E8C87A;border-bottom-color:#C9A84C}
        .tab-btn:hover:not(.active){color:#888}
        .tab-btn.active::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:linear-gradient(90deg,#C9A84C,#E8C87A);border-radius:1px}
        .sub-tab{background:transparent;border:0.5px solid #1A1A1A;color:#555;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:7px 14px;cursor:pointer;transition:all 0.15s;border-radius:2px}
        .sub-tab.active{border-color:#C9A84C;color:#C9A84C;background:rgba(201,168,76,0.05)}
        .sub-tab:hover:not(.active){border-color:#333;color:#888}

        /* ── Rows interactifs ─────────────────────────────────────── */
        .seance-row{display:flex;align-items:center;gap:10px;padding:9px 12px;background:#0D0D0D;border-radius:3px;cursor:pointer;transition:background 0.15s,transform 0.1s;border:0.5px solid transparent}
        .seance-row:hover{background:#161616;transform:translateX(2px)}
        .seance-row:active{transform:scale(0.99)}
        .seance-row.today-s{border-color:rgba(201,168,76,0.3);background:rgba(201,168,76,0.03)}
        .exo-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#0D0D0D;border-radius:3px;cursor:pointer;transition:all 0.15s;border:0.5px solid transparent}
        .exo-row:hover{background:#161616;transform:translateX(2px);border-color:#1E1E1E}
        .exo-row:active{transform:scale(0.99)}
        .exo-row.done-e{opacity:0.45}
        .exo-row.just-done{animation:checkPop 0.3s ease forwards}

        /* ── Cards ────────────────────────────────────────────────── */
        .metric-card{background:#0D0D0D;border:0.5px solid #1A1A1A;border-radius:4px;padding:14px;transition:border-color 0.2s,transform 0.2s,background 0.2s;cursor:default}
        .metric-card:hover{border-color:#333;transform:translateY(-1px);background:#111}
        .record-card{background:#0D0D0D;border:0.5px solid #1A1A1A;border-radius:4px;padding:12px;text-align:center;transition:border-color 0.2s,transform 0.2s}
        .record-card:hover{border-color:#333;transform:translateY(-1px)}
        .card-hover{transition:border-color 0.2s,transform 0.2s,box-shadow 0.2s}
        .card-hover:hover{border-color:#2A2A2A !important;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,0.3)}

        /* ── Skeleton ─────────────────────────────────────────────── */
        .skel{background:linear-gradient(90deg,#111 25%,#1A1A1A 50%,#111 75%);background-size:800px 100%;animation:skeletonShimmer 1.4s ease-in-out infinite;border-radius:3px}

        /* ── Spinner ──────────────────────────────────────────────── */
        .spinner{width:14px;height:14px;border:2px solid rgba(0,0,0,0.2);border-top-color:#0A0A0A;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;flex-shrink:0}

        /* ── Boutons actifs ───────────────────────────────────────── */
        .btn-primary{transition:opacity 0.15s,transform 0.1s}
        .btn-primary:hover:not(:disabled){opacity:0.88}
        .btn-primary:active:not(:disabled){transform:scale(0.98)}

        /* ── Messages chat ────────────────────────────────────────── */
        .chat-bubble{animation:fadeUp 0.2s ease forwards}

        /* ── Confetti ─────────────────────────────────────────────── */
        .confetti-piece{position:fixed;width:8px;height:8px;border-radius:2px;pointer-events:none;animation:confettiFall 1.2s ease-out forwards;z-index:9999}

        /* ── Password input ───────────────────────────────────────── */
        .pwd-input{width:100%;background:transparent;border:none;color:#F0EDE8;font-family:'Syne',sans-serif;font-size:13px;outline:none}

        /* ── Responsive ───────────────────────────────────────────── */
        @media(max-width:640px){
          .grid2{grid-template-columns:1fr !important}
          .metrics-grid{grid-template-columns:1fr 1fr !important}
        }
      `}</style>

      {/* ── Toast notifications ─────────────────────────────────── */}
      <ToastContainer toasts={toasts} />

      {/* ── Confetti ─────────────────────────────────────────────── */}
      {confetti && (
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
          {Array.from({length:24}).map((_,i) => {
            const colors = ["#C9A84C","#E8C87A","#7AE07A","#5DCAA5","#F0EDE8","#E07070"];
            const color = colors[i % colors.length];
            const left = `${Math.random()*100}%`;
            const delay = `${Math.random()*0.6}s`;
            const size = Math.random() > 0.5 ? 8 : 6;
            return (
              <div key={i} className="confetti-piece" style={{
                left, top: "-20px",
                background: color,
                width: size, height: size,
                borderRadius: Math.random() > 0.5 ? "50%" : 2,
                animationDelay: delay,
                animationDuration: `${0.9 + Math.random()*0.5}s`,
              }} />
            );
          })}
        </div>
      )}

      {/* ── Chronomètre flottant ──────────────────────────────────── */}
      {timer && (
        <RestTimer
          key={timer.startedAt}
          duration={timer.duration}
          exerciseName={timer.name}
          onDone={() => setTimer(null)}
          onSkip={() => setTimer(null)}
        />
      )}

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",borderBottom:"0.5px solid #1A1A1A",position:"sticky",top:0,background:"#0A0A0A",zIndex:100}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:5,cursor:"pointer"}} onClick={()=>router.push("/")}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",background:"rgba(201,168,76,0.08)",border:"0.5px solid rgba(201,168,76,0.4)",color:"#C9A84C",padding:"4px 12px",borderRadius:2}}>
            Plan {planName}
          </span>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={()=>setShowPwdModal(true)} style={{background:"transparent",border:"0.5px solid #1E1E1E",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 14px",cursor:"pointer",borderRadius:2}}>🔑</button>
          <button onClick={()=>signOut(auth)} style={{background:"transparent",border:"0.5px solid #1E1E1E",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 14px",cursor:"pointer",borderRadius:2}}>Déconnexion</button>
        </div>
      </nav>

      {/* ── Modale MDP ─────────────────────────────────────────────── */}
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
                    style={{flex:1,padding:"11px",background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2}}>Annuler</button>
                  <button onClick={handleChangePassword} disabled={pwdLoading}
                    style={{flex:2,padding:"11px",background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2}}>
                    {pwdLoading?"Modification...":"Confirmer →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Header + Tabs ───────────────────────────────────────────── */}
      <div style={{padding:"16px 24px 0",borderBottom:"0.5px solid #1A1A1A",background:"#0A0A0A"}}>
        {showRenew && (
          <div style={{background:"rgba(201,168,76,0.06)",border:"0.5px solid rgba(201,168,76,0.3)",borderRadius:4,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div style={{fontSize:12,color:"#C9A84C"}}>🏁 Ton programme de 4 semaines touche à sa fin — prêt pour la suite ?</div>
            <button onClick={()=>router.push("/bilan")} style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"7px 16px",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2,flexShrink:0}}>
              Nouveau bilan →
            </button>
          </div>
        )}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,marginBottom:12}}>
          Bonjour <em style={{color:"#C9A84C",fontStyle:"italic"}}>{clientData?.nom || user.email.split("@")[0]}</em> 👋
          <span style={{fontSize:13,color:"#555",fontFamily:"'Syne',sans-serif",fontWeight:400,fontStyle:"normal",marginLeft:12}}>
            {currentWeek && pd
            ? `Semaine ${currentWeek} sur ${totalWeeks} · ${pd.objectif_principal || ""}`
            : pd ? `${totalWeeks} semaines · ${pd.objectif_principal || ""}` : "Espace client"}
          </span>
        </div>
        <div style={{display:"flex",gap:"1.5rem",overflowX:"auto"}}>
          {[
            { id:"dashboard", label:"Dashboard", icon:"📊" },
            { id:"programme", label:"Programme", icon:"🏋️" },
            { id:"nutrition", label:"Nutrition", icon:"🥗" },
            { id:"corps", label:"Corps", icon:"📐" },
            { id:"messages", label:`Messages${messages.filter(m=>m.sender==="coach"&&!m.read).length > 0 ? " ●" : ""}`, icon:"💬" },
          ].map(tab => (
            <button key={tab.id} className={`tab-btn${activeTab===tab.id?" active":""}`} onClick={()=>setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────── */}
      <div style={{flex:1,padding:"20px 24px",display:"flex",flexDirection:"column",gap:16,maxWidth:900,width:"100%",margin:"0 auto"}}>

        {/* ════ DASHBOARD ════ */}
        {activeTab === "dashboard" && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="metrics-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                { label:"Séances", val:`${doneSeances}/4`, sub:"cette semaine", color:"#C9A84C" },
                { label:"Exercices faits", val:`${doneExos}/${exercices.length || "—"}`, sub:"séance du jour", color:"#7AE07A" },
                { label:"Programme", val:pd ? `${pd.duree_programme_semaines || 4}sem` : "—", sub:pd?.objectif_principal || "En attente", color:"#F0EDE8" },
                { label:"Streak", val:realStreak > 0 ? `${realStreak} j` : "0 j", sub:realStreak > 0 ? "sans interruption" : "Lance-toi !", color:realStreak >= 7 ? "#C9A84C" : "#F0EDE8" },
              ].map((m,i) => (
                <div key={i} className="metric-card">
                  <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:8}}>{m.label}</div>
                  <div style={{fontSize:22,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4,animation:"metricCount 0.4s ease forwards"}}>{m.val}</div>
                  <div style={{fontSize:11,color:"#444"}}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={S.card}>
                <div style={S.cardTitle}><span>📅</span> Séances de la semaine <span style={{...S.tag,marginLeft:"auto"}}>{doneSeances}/{nbSeances}</span></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:14}}>
                  {semaine.map((d,i) => (
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span style={{fontSize:10,color:"#555"}}>{d}</span>
                      <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,
                        background:joursEtat[i]==="done"?"#1A3A1A":joursEtat[i]==="today"?"#C9A84C":joursEtat[i]==="rest"?"#181818":"#111",
                        color:joursEtat[i]==="done"?"#7AE07A":joursEtat[i]==="today"?"#0A0A0A":"#444",
                        opacity:joursEtat[i]==="future"?0.35:1}}>
                        {joursEtat[i]==="done"?"✓":joursEtat[i]==="today"?"●":joursEtat[i]==="rest"?"—":""}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {seances.length > 0 ? seances.map((s,i) => (
                    <div key={i} className={`seance-row${s.today?" today-s":""}`}
                      onClick={async ()=>{
                    if(seanceDone[i]||i<2) return;
                    setSeanceDone(prev=>({...prev,[i]:!prev[i]}));
                    addToast(`✓ ${s.nom} — Séance validée !`, "success");
                    // Mettre à jour le streak dans Firestore
                    if (user) {
                      try {
                        const today = new Date().toDateString();
                        const last = clientData?.lastActiveDate;
                        const cur = clientData?.streakDays || 0;
                        const yesterday = new Date(Date.now()-86400000).toDateString();
                        const newStreak = last === today ? cur : last === yesterday ? cur+1 : 1;
                        await updateDoc(doc(db,"clients",user.uid),{lastActiveDate:today,streakDays:newStreak});
                        setClientData(d=>d?{...d,lastActiveDate:today,streakDays:newStreak}:d);
                      } catch(e){console.warn("streak:",e);}
                    }
                  }}>
                      <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,border:`1.5px solid ${seanceDone[i]?"#639922":"rgba(201,168,76,0.3)"}`,background:seanceDone[i]?"#1A3A1A":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#7AE07A"}}>
                        {seanceDone[i]?"✓":""}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:seanceDone[i]?"#555":"#F0EDE8"}}>{s.nom}</div>
                        <div style={{fontSize:11,color:"#555"}}>{s.det}</div>
                      </div>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:seanceDone[i]?"#1A3A1A":s.today?"rgba(201,168,76,0.1)":"#181818",color:seanceDone[i]?"#7AE07A":s.today?"#C9A84C":"#555",border:`0.5px solid ${seanceDone[i]?"#3A6A3A":s.today?"rgba(201,168,76,0.3)":"#242424"}`}}>
                        {seanceDone[i]?"Fait":s.today?"Aujourd'hui":s.jour}
                      </span>
                    </div>
                  )) : (
                    <div style={{padding:"1.5rem",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>Programme disponible après ton bilan</div>
                  )}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={S.card}>
                  <div style={S.cardTitle}>📈 Progression <span style={{...S.tag,marginLeft:"auto"}}>Sem. 3/4</span></div>
                  {[{label:"Prise de masse",pct:72,color:"#C9A84C"},{label:"Force globale",pct:58,color:"#7AE07A"},{label:"Endurance",pct:45,color:"#5DCAA5"}].map((p,i)=>(
                    <div key={i} style={{marginBottom:i<2?12:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                        <span style={{color:"#888"}}>{p.label}</span>
                        <span style={{color:p.color,fontWeight:700}}>{p.pct}%</span>
                      </div>
                      <ProgressBar value={p.pct} color={p.color} delay={i*150}/>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>🍎 Nutrition <span style={{...S.tag,marginLeft:"auto"}}>{nutrition ? `Obj. ${nutrition.calories_jour} kcal/j` : "— kcal/j"}</span></div>
                  {nutrition ? (
                    <>
                      {[{nom:"Protéines",val:`${nutrition.proteines_g}g`,pct:Math.round((nutrition.proteines_g*4/nutrition.calories_jour)*100),color:"#7AE07A"},
                        {nom:"Glucides",val:`${nutrition.glucides_g}g`,pct:Math.round((nutrition.glucides_g*4/nutrition.calories_jour)*100),color:"#C9A84C"},
                        {nom:"Lipides",val:`${nutrition.lipides_g}g`,pct:Math.round((nutrition.lipides_g*9/nutrition.calories_jour)*100),color:"#5DCAA5"}].map((c,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderTop:"0.5px solid #141414"}}>
                          <span style={{fontSize:12,color:"#555",width:62,flexShrink:0}}>{c.nom}</span>
                          <div style={{flex:1,height:4,background:"#1A1A1A",borderRadius:2,overflow:"hidden"}}>
                            <ProgressBar value={c.pct} color={c.color} delay={i*100}/>
                          </div>
                          <span style={{fontSize:12,fontWeight:700,color:"#888",width:40,textAlign:"right",flexShrink:0}}>{c.val}</span>
                        </div>
                      ))}
                    </>
                  ) : <div style={{padding:"1rem",textAlign:"center",color:"#555",fontSize:12,fontStyle:"italic"}}>Données disponibles après ton bilan</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ PROGRAMME ════ */}
        {activeTab === "programme" && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Sous-onglets */}
            <div style={{display:"flex",gap:8}}>
              <button className={`sub-tab${progSubTab==="seance"?" active":""}`} onClick={()=>setProgSubTab("seance")}>🏋️ Séance du jour</button>
              <button className={`sub-tab${progSubTab==="charges"?" active":""}`} onClick={()=>setProgSubTab("charges")}>📊 Suivi des charges</button>
            </div>

            {progSubTab === "seance" && (
              <>
                <div style={S.card}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                    <div style={S.cardTitle}>🏋️ {seanceAujourdhui?.nom || "Séance du jour"}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:11,color:"#C9A84C",fontWeight:700}}>{doneExos}/{exercices.length} exercices</span>
                      {clientData?.programme && (
                        <button onClick={() => {
                          // Fallback mobile : si window.open bloqué, copier le texte
                          try {
                            const win = window.open("","_blank");
                            if (!win) {
                              navigator.clipboard?.writeText(clientData.programme || "").then(()=>alert("Programme copié dans le presse-papier !")).catch(()=>{});
                              return;
                            }
                          win.document.write(`<!DOCTYPE html><html><head><title>Programme APXFITNESS - ${clientData?.nom || ""}</title>
                          <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#222}
                          h1{color:#C9A84C;border-bottom:2px solid #C9A84C;padding-bottom:12px;font-size:24px}
                          h2{color:#333;margin-top:24px;font-size:18px}
                          pre{white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.8;font-size:14px;background:#f9f9f9;padding:20px;border-left:3px solid #C9A84C}
                          .footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#888;text-align:center}
                          @media print{button{display:none}}</style></head><body>
                          <h1>Mon Programme APXFITNESS</h1>
                          <p>Client : <strong>${clientData?.nom || ""}</strong> — Plan ${clientData?.plan || ""}</p>
                          <pre>${clientData.programme.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>
                          <div class="footer">APXFITNESS — Coaching personnalisé — apxfitness-brown.vercel.app</div>
                          <script>window.onload=()=>window.print();</script></body></html>`);
                          win.document.close();
                          } catch(e) { navigator.clipboard?.writeText(clientData.programme||""); }
                        }} style={{background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:10,letterSpacing:"2px",textTransform:"uppercase",padding:"5px 10px",cursor:"pointer",borderRadius:2}}>
                          📄 PDF
                        </button>
                      )}
                    </div>
                  </div>
                  {exercices.length > 0 ? (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {exercices.map((e,i) => (
                        <div key={i} className={`exo-row${exoDone[i]?" done-e":""}`}
                          onClick={()=>{
                            const wasUndone = !exoDone[i];
                            setExoDone(prev => {
                              const next = {...prev, [i]: !prev[i]};
                              const newDoneCount = Object.values(next).filter(Boolean).length;
                              if (wasUndone && newDoneCount === exercices.length && exercices.length > 0) {
                                setTimeout(() => {
                                  setConfetti(true);
                                  addToast("🎉 Séance complète ! Bravo !", "gold");
                                  setTimeout(() => setConfetti(false), 1800);
                                }, 100);
                              } else if (wasUndone) {
                                addToast(`✓ ${e.nom}`, "success");
                              }
                              return next;
                            });
                            if (wasUndone && e.reposSec > 0) {
                              setTimer({ duration: e.reposSec, name: e.nom, startedAt: Date.now() });
                            } else if (!wasUndone) {
                              setTimer(null);
                            }
                          }}>
                          <div style={{width:18,height:18,borderRadius:3,flexShrink:0,border:`1.5px solid ${exoDone[i]?"#639922":"#333"}`,background:exoDone[i]?"#1A3A1A":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#7AE07A",transition:"all 0.2s"}}>
                            {exoDone[i]?"✓":""}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:exoDone[i]?"#444":"#F0EDE8"}}>{e.nom}</div>
                            <div style={{fontSize:11,color:"#444"}}>{e.det}</div>
                            {e.conseil && <div style={{fontSize:11,color:"rgba(201,168,76,0.7)",marginTop:1}}>⚡ {e.conseil}</div>}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,flexShrink:0}}>
                            {exoDone[i] && <span style={{fontSize:10,color:"#7AE07A",letterSpacing:"1px"}}>FAIT</span>}
                            <span style={{fontSize:10,color:"#333",letterSpacing:"1px"}}>⏱ {e.reposSec}s</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{padding:"2rem",textAlign:"center",color:"#444",fontSize:13,fontStyle:"italic"}}>Programme disponible après ton bilan</div>}
                </div>
                {records.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>🏆 Records personnels <span style={{...S.tag,marginLeft:"auto"}}>Cette semaine</span></div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                      {records.map((r,i)=>(
                        <div key={i} className="record-card">
                          <div style={{fontSize:11,color:"#555",marginBottom:6}}>{r.nom}</div>
                          <div style={{fontSize:16,fontWeight:700,color:"#C9A84C"}}>{r.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {clientData?.programme && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>📋 Programme complet</div>
                    <pre style={{fontFamily:"'Courier New',monospace",fontSize:12,color:"#666",whiteSpace:"pre-wrap",lineHeight:1.8}}>{clientData.programme}</pre>
                  </div>
                )}
              </>
            )}
            {progSubTab === "charges" && (
              <div style={S.card}>
                <div style={S.cardTitle}>📊 Suivi des charges <span style={{...S.tag,marginLeft:"auto"}}>Saisie semaine par semaine</span></div>
                <ChargesTab uid={user?.uid} exercices={exercices} />
              </div>
            )}
          </div>
        )}

        {/* ════ NUTRITION ════ */}
        {activeTab === "nutrition" && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="metrics-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                {label:"Calories",val:nutrition?`${nutrition.calories_jour}`:"—",sub:nutrition?"Objectif/jour":"Non défini",color:"#C9A84C"},
                {label:"Protéines",val:nutrition?`${nutrition.proteines_g} g`:"—",sub:nutrition?"Objectif/jour":"Non défini",color:"#7AE07A"},
                {label:"Glucides",val:nutrition?`${nutrition.glucides_g} g`:"—",sub:nutrition?"Objectif/jour":"Non défini",color:"#F0EDE8"},
                {label:"Lipides",val:nutrition?`${nutrition.lipides_g} g`:"—",sub:nutrition?"Objectif/jour":"Non défini",color:"#F0EDE8"},
              ].map((m,i)=>(
                <div key={i} className="metric-card">
                  <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:8}}>{m.label}</div>
                  <div style={{fontSize:20,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4}}>{m.val}</div>
                  <div style={{fontSize:11,color:"#444"}}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={S.card}>
                <div style={S.cardTitle}>🍽 Plan alimentaire</div>
                {nutrition?.repas?.length > 0 ? nutrition.repas.map((r,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",padding:"9px 10px",background:"#0D0D0D",borderRadius:2,gap:8,marginBottom:6}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#F0EDE8"}}>{r.nom}</div>
                      <div style={{fontSize:11,color:"#555"}}>{r.exemples}</div>
                    </div>
                  </div>
                )) : <div style={{padding:"1.5rem",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>Plan de repas disponible après ton bilan</div>}
              </div>
              <div style={S.card}>
                <div style={S.cardTitle}>💡 Conseils nutrition</div>
                {nutrition?.conseils?.length > 0 ? nutrition.conseils.map((c,i)=>(
                  <div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:"0.5px solid #141414"}}>
                    <span style={{color:"#C9A84C",flexShrink:0}}>→</span>
                    <span style={{fontSize:13,color:"#888",lineHeight:1.6}}>{c}</span>
                  </div>
                )) : <div style={{padding:"1rem",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>Conseils disponibles après ton bilan</div>}
              </div>
            </div>
            {/* Générateur de plan de repas */}
            <div style={S.card}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={S.cardTitle}>🍽 Plan de repas du jour</div>
                {nutrition && (
                  <button onClick={generateMealPlan} disabled={mealLoading}
                    style={{background:mealLoading?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 14px",cursor:mealLoading?"not-allowed":"pointer",borderRadius:2}}>
                    {mealLoading?"Génération...":"✨ Générer"}
                  </button>
                )}
              </div>
              {mealError && <div style={{fontSize:12,color:"#E07070",padding:"6px 0",marginBottom:8}}>{mealError}</div>}
              {!nutrition ? (
                <div style={{padding:"1rem",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>Disponible après ton bilan</div>
              ) : !mealPlan ? (
                <div style={{padding:"1.5rem",textAlign:"center",color:"#444",fontSize:13,fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:"italic",lineHeight:1.7}}>
                  Clique sur "Générer" pour obtenir un plan alimentaire adapté à tes macros du jour.
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {mealPlan.repas?.map((r,i) => (
                    <div key={i} style={{background:"#0D0D0D",borderRadius:2,padding:"12px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div>
                          <span style={{fontSize:13,fontWeight:700,color:"#F0EDE8"}}>{r.nom}</span>
                          <span style={{fontSize:11,color:"#555",marginLeft:8}}>{r.heure}</span>
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:"#C9A84C"}}>{r.calories} kcal</span>
                      </div>
                      <div style={{fontSize:12,color:"#666",lineHeight:1.7,marginBottom:6}}>
                        {r.aliments?.join(" · ")}
                      </div>
                      <div style={{display:"flex",gap:12,fontSize:11,color:"#444"}}>
                        <span>P: <strong style={{color:"#7AE07A"}}>{r.proteines}g</strong></span>
                        <span>G: <strong style={{color:"#C9A84C"}}>{r.glucides}g</strong></span>
                        <span>L: <strong style={{color:"#5DCAA5"}}>{r.lipides}g</strong></span>
                      </div>
                    </div>
                  ))}
                  {mealPlan.conseil_du_jour && (
                    <div style={{background:"rgba(201,168,76,0.05)",border:"0.5px solid rgba(201,168,76,0.2)",borderRadius:2,padding:"10px 14px",fontSize:13,color:"#888",lineHeight:1.6}}>
                      💡 {mealPlan.conseil_du_jour}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ CORPS ════ */}
        {activeTab === "corps" && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={S.card}>
              <div style={S.cardTitle}>📐 Journal corporel <span style={{...S.tag,marginLeft:"auto"}}>Saisie hebdomadaire</span></div>
              <CorpsJournal uid={user?.uid} />
            </div>
            <div style={{background:"rgba(201,168,76,0.04)",border:"0.5px solid rgba(201,168,76,0.15)",borderRadius:4,padding:"14px",fontSize:12,color:"#555",lineHeight:1.7}}>
              💡 <strong style={{color:"#C9A84C"}}>Conseil :</strong> Note tes mesures le même jour chaque semaine, le matin à jeun, pour des données comparables. La balance peut fluctuer de 1-3 kg selon l'hydratation — les mensurations sont plus fiables sur le long terme.
            </div>
          </div>
        )}

        {/* ════ ASSISTANT IA ════ */}
        {activeTab === "ia" && (
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
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start"}}>
                    <div style={{
                      maxWidth:"82%",padding:"10px 14px",borderRadius:2,fontSize:13,lineHeight:1.7,
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
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
                    <div style={{padding:"10px 14px",background:"#181818",border:"0.5px solid #242424",borderRadius:2,fontSize:13,color:"#555"}}>
                      <span style={{animation:"pulse 1s infinite"}}>● ● ●</span>
                    </div>
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
                  style={{flex:1,background:"#0D0D0D",border:"0.5px solid #1E1E1E",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"10px 14px",resize:"none",minHeight:52,outline:"none",borderRadius:2}}
                />
                <button onClick={sendChatMessage} disabled={!chatInput.trim()||chatLoading}
                  style={{background:chatInput.trim()&&!chatLoading?"linear-gradient(135deg,#C9A84C,#A67C2E)":"#181818",border:"none",color:"#0A0A0A",padding:"0 18px",cursor:chatInput.trim()&&!chatLoading?"pointer":"not-allowed",fontSize:18,fontWeight:700,borderRadius:2,flexShrink:0}}>
                  ↑
                </button>
              </div>
              <p style={{fontSize:11,color:"#333",marginTop:8,textAlign:"center"}}>
                L'IA répond aux questions générales. Pour un suivi personnalisé, écris au coach dans Messages.
              </p>
            </div>
          </div>
        )}

        {/* ════ MESSAGES ════ */}
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
                <textarea value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                  placeholder="Écris ton message... (Entrée pour envoyer)"
                  style={{flex:1,background:"#0D0D0D",border:"0.5px solid #1E1E1E",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"10px 14px",resize:"none",minHeight:52,outline:"none",borderRadius:2}}/>
                <button onClick={sendMessage} disabled={!newMsg.trim()||sending}
                  className="btn-primary"
                  style={{background:newMsg.trim()&&!sending?"linear-gradient(135deg,#C9A84C,#A67C2E)":"#181818",border:"none",color:sending?"#555":"#0A0A0A",padding:"0 18px",cursor:newMsg.trim()&&!sending?"pointer":"not-allowed",fontSize:18,fontWeight:700,borderRadius:2,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",minWidth:46}}>
                  {sending ? <div className="spinner" style={{borderTopColor:"#C9A84C"}} /> : "↑"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
