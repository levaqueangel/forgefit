"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged,
         updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, query, where, onSnapshot, addDoc,
         serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";
// Sous-composants UI
import { parseReposSeconds, beep } from "./utils";
import { RestTimer }     from "./RestTimer";
import { ChargesTab }    from "./ChargesTab";
import { CorpsJournal }  from "./CorpsJournal";
import { ProgressBar }   from "./ProgressBar";
import { ToastContainer } from "./Toast";
import { LoginScreen }   from "./LoginScreen";
import { Bubble }        from "./Bubble";
// Push notifications
import { usePushNotifications } from "../usePushNotifications";
// Sous-composants Tabs
import { DashboardTab }  from "./DashboardTab";
import { ProgrammeTab }  from "./ProgrammeTab";
import { NutritionTab }  from "./NutritionTab";
import { MessagesTab }   from "./MessagesTab";
import { AssistantTab }  from "./AssistantTab";

export default function ClientPage() {
  const router = useRouter();
  const { lang, setLang, t, LANGS } = useLang();

  // ── Auth & données ──────────────────────────────────────────
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clientData,  setClientData]  = useState(null);
  const [messages,    setMessages]    = useState([]);

  // ── Navigation ──────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState("dashboard");
  const [prevTab,     setPrevTab]     = useState("dashboard");
  const [progSubTab,  setProgSubTab]  = useState("seance");

  // ── Séances & exercices ─────────────────────────────────────
  const [exoDone,    setExoDone]    = useState({});
  const [seanceDone, setSeanceDone] = useState({ 0:true, 1:true });
  const [timer,      setTimer]      = useState(null);
  const [focusMode,  setFocusMode]  = useState(false);
  const [focusIdx,   setFocusIdx]   = useState(0);
  const [focusSet,   setFocusSet]   = useState(1);  // Compteur de sets
  const [focusRest,  setFocusRest]  = useState(false); // Repos entre sets

  // ── UI global ────────────────────────────────────────────────
  const [toasts,      setToasts]      = useState([]);
  const [confetti,    setConfetti]    = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // ── Messages ─────────────────────────────────────────────────
  const [newMsg,     setNewMsg]     = useState("");
  const [sending,    setSending]    = useState(false);
  const [sendError,  setSendError]  = useState("");

  // ── Nutrition / Repas ────────────────────────────────────────
  const [mealPlan,    setMealPlan]    = useState(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealError,   setMealError]   = useState("");

  // ── Chatbot ──────────────────────────────────────────────────
  const [chatHistory,  setChatHistory]  = useState([
    { role:"assistant", content:"Bonjour ! Je suis ton assistant fitness APXFITNESS. Pose-moi tes questions sur la musculation, la nutrition ou ta récupération 💪" }
  ]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatLoading,  setChatLoading]  = useState(false);

  // ── Mot de passe ─────────────────────────────────────────────
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm,      setPwdForm]      = useState({ current:"", next:"", confirm:"" });
  const [pwdError,     setPwdError]     = useState("");
  const [pwdSuccess,   setPwdSuccess]   = useState(false);
  const [pwdLoading,   setPwdLoading]   = useState(false);

  // ── Push notifications ──────────────────────────────────────────
  const {
    permission: pushPermission,
    subscribed: pushSubscribed,
    loading:    pushLoading,
    subscribe:  subscribePush,
  } = usePushNotifications(user?.uid);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Détection mode hors-ligne
  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  addToast("Connexion rétablie ✓", "success"); };
    const handleOffline = () => { setIsOnline(false); addToast("Mode hors-ligne", "error"); };
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addToast]);

  // Afficher la bannière 30s après connexion si permission pas encore accordée
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      const t = setTimeout(() => setShowPushBanner(true), 30000);
      return () => clearTimeout(t);
    }
  }, []);

  // ── Refs ─────────────────────────────────────────────────────
  const bottomRef    = useRef(null);
  const chatBottomRef = useRef(null);
  const touchStartX  = useRef(null);
  const touchStartY  = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────
  const addToast = useCallback((message, type="success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const vibrate = useCallback((pattern=[50]) => {
    try { navigator.vibrate?.(pattern); } catch {}
  }, []);

  const refreshData = useCallback(async () => {
    if (!user || dataLoading) return;
    setDataLoading(true);
    try {
      const snap = await getDoc(doc(db, "clients", user.uid));
      if (snap.exists()) setClientData(snap.data());
      addToast("Données mises à jour ✓", "info");
    } catch { addToast("Erreur de rechargement", "error"); }
    setDataLoading(false);
  }, [user, dataLoading, addToast]);

  // ── Swipe ────────────────────────────────────────────────────
  const TABS_ORDER = ["dashboard","programme","nutrition","corps","messages","ia"];
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs((touchStartY.current||0) - e.changedTouches[0].clientY);
    if (dy > Math.abs(dx)*1.5) { touchStartX.current=null; return; }
    if (Math.abs(dx) < 50)     { touchStartX.current=null; return; }
    const idx = TABS_ORDER.indexOf(activeTab);
    if (dx > 0 && idx < TABS_ORDER.length-1) { setPrevTab(activeTab); setActiveTab(TABS_ORDER[idx+1]); vibrate([40]); }
    else if (dx < 0 && idx > 0)              { setPrevTab(activeTab); setActiveTab(TABS_ORDER[idx-1]); vibrate([40]); }
    touchStartX.current = null;
  }, [activeTab, vibrate]);

  // ── Auth ─────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try { const snap = await getDoc(doc(db,"clients",u.uid)); if(snap.exists()) setClientData(snap.data()); }
        catch(e) { console.error("Firestore:",e); }
      }
      setAuthLoading(false);
    }, () => setAuthLoading(false));
    const t = setTimeout(()=>setAuthLoading(false), 5000);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  // ── Messages temps réel ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db,"messages"), where("clientId","==",user.uid));
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d=>({id:d.id,...d.data()}))
        .sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0));
      setMessages(msgs);
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
    });
    return () => unsub();
  }, [user]);

  // ── Envoi message ────────────────────────────────────────────
  const saveSessionRating = async (difficulte, energie) => {
    if (!user?.uid || !seanceAujourdhui) return;
    try {
      const { updateDoc, doc, arrayUnion } = await import("firebase/firestore");
      const { db } = await import("./firebase");
      const entry = {
        date: new Date().toISOString(),
        seance: seanceAujourdhui?.nom || "Séance",
        difficulte, energie,
      };
      await updateDoc(doc(db, "clients", user.uid), {
        sessionRatings: arrayUnion(entry),
        lastSessionRating: entry,
      });
      setSessionRating({ difficulte, energie, submitted: true });
      addToast("Séance notée ✓ Merci !");
      setTimeout(() => setShowRating(false), 2000);
    } catch { addToast("Erreur lors de la notation", "error"); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim()||sending) return;
    setSending(true); setSendError("");
    const txt = newMsg.trim();
    try {
      await addDoc(collection(db,"messages"),{
        clientId:user.uid, clientName:clientData?.nom||"Client",
        clientEmail:user.email, text:txt, sender:"client",
        createdAt:serverTimestamp(), read:false,
      });
      setNewMsg("");
      addToast("Message envoyé ✓","success");
      fetch("/api/notify-coach",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({nom:clientData?.nom||"Client",email:user.email,message:txt}),
      }).catch(e=>console.warn("Notif coach:",e));
    } catch { setSendError("Erreur lors de l'envoi. Réessaie."); }
    finally { setSending(false); }
  };

  // ── Générateur repas ─────────────────────────────────────────
  const generateMealPlan = async () => {
    if (!nutrition||mealLoading) return;
    setMealLoading(true); setMealError("");
    try {
      const prompt = `Génère un plan alimentaire pour UNE journée type avec exactement ces macros :
- Calories : ${nutrition.calories_jour} kcal
- Protéines : ${nutrition.proteines_g}g  - Glucides : ${nutrition.glucides_g}g  - Lipides : ${nutrition.lipides_g}g
- Régime : ${clientData?.programmeData?.regime||"standard"}
- Objectif : ${clientData?.programmeData?.objectif_principal||"fitness"}
Réponds UNIQUEMENT avec un JSON valide (sans markdown) :
{"repas":[{"nom":"Petit-déjeuner","heure":"7h30","aliments":["aliment - quantité"],"calories":520,"proteines":35,"glucides":60,"lipides":12},{"nom":"Déjeuner","heure":"12h30","aliments":[...],"calories":...,"proteines":...,"glucides":...,"lipides":...},{"nom":"Collation","heure":"16h00","aliments":[...],"calories":...,"proteines":...,"glucides":...,"lipides":...},{"nom":"Dîner","heure":"19h30","aliments":[...],"calories":...,"proteines":...,"glucides":...,"lipides":...}],"conseil_du_jour":"conseil court"}`;
      const res = await fetch("/api/chatbot",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:prompt,programmeData:clientData?.programmeData}),
      });
      const data = await res.json();
      if (data.reply) {
        try {
          const cleaned = data.reply.replace(/^```json\s*/i,"").replace(/\s*```$/i,"").trim();
          setMealPlan(JSON.parse(cleaned));
        } catch { setMealPlan(null); }
      }
    } catch(e) { console.error("mealPlan:",e); setMealError("Erreur lors de la génération. Réessaie."); }
    setMealLoading(false);
  };

  // ── Chatbot ──────────────────────────────────────────────────
  const sendChatMessage = async () => {
    if (!chatInput.trim()||chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatHistory(h=>[...h,{role:"user",content:msg}]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/chatbot",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:msg,programmeData:clientData?.programmeData||null,history:chatHistory.slice(-6)}),
      });
      const data = await res.json();
      setChatHistory(h=>[...h.slice(-48),{role:"assistant",content:data.reply||"Désolé, je n'ai pas pu répondre."}]);
    } catch {
      setChatHistory(h=>[...h,{role:"assistant",content:"Erreur de connexion. Réessaie dans un instant."}]);
    } finally {
      setChatLoading(false);
      setTimeout(()=>chatBottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
    }
  };

  // ── Changement MDP ───────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwdError(""); setPwdSuccess(false);
    if (pwdForm.next.length<6)              { setPwdError("Mot de passe trop court (6 caractères minimum)"); return; }
    if (pwdForm.next!==pwdForm.confirm)     { setPwdError("Les mots de passe ne correspondent pas"); return; }
    setPwdLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email,pwdForm.current);
      await reauthenticateWithCredential(user,cred);
      await updatePassword(user,pwdForm.next);
      setPwdSuccess(true);
      addToast("Mot de passe modifié ✓","success");
      setPwdForm({current:"",next:"",confirm:""});
      setTimeout(()=>{setShowPwdModal(false);setPwdSuccess(false);},2000);
    } catch(e) {
      setPwdError(e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Mot de passe actuel incorrect":"Erreur : "+e.message);
    }
    setPwdLoading(false);
  };

  // ── Variables dérivées ───────────────────────────────────────
  const pd             = clientData?.programmeData;
  const seancesReelles = pd?.seances || [];
  const seancesS12     = seancesReelles.filter(s=>s.semaines==="1-2"||s.semaines?.startsWith("1"));
  const seancesActuelles = seancesS12.length>0 ? seancesS12 : seancesReelles;
  const seances        = seancesActuelles.map((s,i)=>({
    nom:s.nom, det:`${s.exercices?.length||0} exercices · ${s.duree_min||"~50"} min`,
    jour:s.jour_suggere||`Jour ${i+1}`, today:i===2,
  }));
  const seanceAujourdhui = seancesActuelles[2]||seancesActuelles[0];
  const exercices      = (seanceAujourdhui?.exercices||[]).map(e=>({
    nom:e.nom, det:`${e.series} × ${e.reps} · ${e.charge} · repos ${e.repos}`,
    conseil:e.conseil, reposSec:parseReposSeconds(e.repos),
  }));
  const nutrition      = pd?.nutrition||null;
  const records        = exercices.slice(0,4).map(e=>({nom:e.nom.split(" ").slice(0,2).join(" "),val:"—"}));
  const nbSeances      = pd?.seances_par_semaine||seances.length||3;
  const semaine        = ["L","M","M","J","V","S","D"];
  const joursEtat      = Array.from({length:7},(_,i)=>{
    if(i<2) return "done"; if(i===2) return "today"; if(i<nbSeances) return "future"; return "rest";
  });
  const doneSeances    = Object.values(seanceDone).filter(Boolean).length;
  const doneExos       = Object.values(exoDone).filter(Boolean).length;
  const currentWeek    = (() => {
    if (!clientData?.createdAt) return null;
    const diff = Date.now()-new Date(clientData.createdAt).getTime();
    return Math.min(Math.max(Math.floor(diff/(7*24*3600*1000))+1,1),4);
  })();
  const totalWeeks  = pd?.duree_programme_semaines||4;
  const realStreak  = clientData?.streakDays||0;
  const showRenew   = clientData?.createdAt
    ? (Date.now()-new Date(clientData.createdAt).getTime())>28*24*3600*1000 : false;

  const S = {
    card:      {background:"#111",border:"0.5px solid #1E1E1E",borderRadius:14,padding:"18px"},
    cardTitle: {fontSize:11,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:14,display:"flex",alignItems:"center",gap:6},
    tag:       {fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#555"},
  };

  const planName = clientData?.plan ? clientData.plan.charAt(0).toUpperCase()+clientData.plan.slice(1) : "—";

  // ── Skeleton loading ─────────────────────────────────────────
  if (authLoading) return (
    <div style={{background:"#0A0A0A",minHeight:"100vh",fontFamily:"'Syne',sans-serif"}}>
      <style>{`@keyframes skeletonShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.skel{background:linear-gradient(90deg,#111 25%,#1A1A1A 50%,#111 75%);background-size:800px 100%;animation:skeletonShimmer 1.4s ease-in-out infinite;border-radius:3px}`}</style>
      <div style={{height:57,borderBottom:"0.5px solid #1A1A1A",display:"flex",alignItems:"center",padding:"0 24px",gap:16}}>
        <div className="skel" style={{width:140,height:14}}/>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          <div className="skel" style={{width:70,height:24,borderRadius:12}}/>
          <div className="skel" style={{width:28,height:28,borderRadius:2}}/>
          <div className="skel" style={{width:90,height:28,borderRadius:2}}/>
        </div>
      </div>
      <div style={{padding:"16px 24px 0",borderBottom:"0.5px solid #1A1A1A"}}>
        <div className="skel" style={{width:260,height:20,marginBottom:16}}/>
        <div style={{display:"flex",gap:24}}>
          {[80,80,70,80,90].map((w,i)=><div key={i} className="skel" style={{width:w,height:10,marginBottom:12}}/>)}
        </div>
      </div>
      <div style={{padding:"20px 24px",maxWidth:900,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[1,2,3,4].map(i=>(
            <div key={i} style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:4,padding:14}}>
              <div className="skel" style={{width:"55%",height:9,marginBottom:10}}/>
              <div className="skel" style={{width:"65%",height:22,marginBottom:6}}/>
              <div className="skel" style={{width:"45%",height:8}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!user) return <LoginScreen lang={lang} setLang={setLang} LANGS={LANGS} />;

  // ── Rendu principal ──────────────────────────────────────────
  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        textarea:focus,input:focus{border-color:#C9A84C !important;outline:none}

        /* ── Animations ─────────────────────────────────────────── */
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes skeletonShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes checkPop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
        @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(120px) rotate(720deg);opacity:0}}
        @keyframes metricCount{from{opacity:0;transform:scale(0.85) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes typingDot{0%,80%,100%{opacity:0.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1.1)}}
        @keyframes focusIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes timerSlideIn{from{opacity:0;transform:translateY(20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes pillIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}

        /* ── Tabs — style pill/capsule ───────────────────────────── */
        .tabs-wrap{display:flex;gap:6px;padding:10px 0;overflow-x:auto;-webkit-overflow-scrolling:touch}
        .tabs-wrap::-webkit-scrollbar{display:none}
        .tab-btn{background:transparent;border:none;color:#555;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;padding:8px 14px;border-radius:20px;transition:all 0.2s;white-space:nowrap;display:flex;align-items:center;gap:5px;position:relative}
        .tab-btn.active{background:rgba(201,168,76,0.14);color:#E8C87A;border:0.5px solid rgba(201,168,76,0.35)}
        .tab-btn:hover:not(.active){background:rgba(255,255,255,0.04);color:#888}

        /* ── Sub-tabs — pills ────────────────────────────────────── */
        .sub-tab{background:transparent;border:0.5px solid #222;color:#555;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:8px 18px;cursor:pointer;transition:all 0.18s;border-radius:20px}
        .sub-tab.active{border-color:rgba(201,168,76,0.5);color:#C9A84C;background:rgba(201,168,76,0.1)}
        .sub-tab:hover:not(.active){border-color:#333;color:#888;background:rgba(255,255,255,0.03)}

        /* ── Rows interactifs ────────────────────────────────────── */
        .seance-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:#0D0D0D;border-radius:12px;cursor:pointer;transition:all 0.15s;border:0.5px solid transparent}
        .seance-row:hover{background:#131313;transform:translateX(2px);border-color:#1E1E1E}
        .seance-row:active{transform:scale(0.99)}
        .seance-row.today-s{border-color:rgba(201,168,76,0.25);background:rgba(201,168,76,0.03)}
        .exo-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:#0D0D0D;border-radius:12px;cursor:pointer;transition:all 0.15s;border:0.5px solid transparent;margin-bottom:6px}
        .exo-row:last-child{margin-bottom:0}
        .exo-row:hover{background:#131313;transform:translateX(2px);border-color:#1E1E1E}
        .exo-row:active{transform:scale(0.99)}
        .exo-row.done-e{opacity:0.4}
        .exo-row.just-done{animation:checkPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards}

        /* ── Cards ───────────────────────────────────────────────── */
        .metric-card{background:#0D0D0D;border:0.5px solid #1A1A1A;border-radius:14px;padding:16px;transition:all 0.2s}
        .metric-card:hover{border-color:#2A2A2A;transform:translateY(-2px);background:#101010}
        .record-card{background:#0D0D0D;border:0.5px solid #1A1A1A;border-radius:12px;padding:14px;text-align:center;transition:all 0.2s}
        .record-card:hover{border-color:#2A2A2A;transform:translateY(-1px)}
        .card-hover{transition:all 0.2s}
        .card-hover:hover{border-color:#2A2A2A !important;transform:translateY(-2px)}

        /* ── Skeleton ────────────────────────────────────────────── */
        .skel{background:linear-gradient(90deg,#111 25%,#1A1A1A 50%,#111 75%);background-size:800px 100%;animation:skeletonShimmer 1.4s ease-in-out infinite;border-radius:6px}

        /* ── Spinner ─────────────────────────────────────────────── */
        .spinner{width:14px;height:14px;border:2px solid rgba(201,168,76,0.2);border-top-color:#C9A84C;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;flex-shrink:0}

        /* ── Boutons ─────────────────────────────────────────────── */
        .btn-primary{transition:opacity 0.15s,transform 0.1s}
        .btn-primary:hover:not(:disabled){opacity:0.88}
        .btn-primary:active:not(:disabled){transform:scale(0.97)}

        /* ── Chat ────────────────────────────────────────────────── */
        .chat-bubble{animation:fadeUp 0.2s ease forwards}

        /* ── Misc ────────────────────────────────────────────────── */
        .fade-in{animation:fadeUp 0.22s ease forwards}
        .focus-exo{animation:focusIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .confetti-piece{position:fixed;width:8px;height:8px;border-radius:2px;pointer-events:none;animation:confettiFall 1.2s ease-out forwards;z-index:9999}
        .pwd-input{width:100%;background:transparent;border:none;color:#F0EDE8;font-family:'Syne',sans-serif;font-size:13px;outline:none}

        /* ── Responsive ──────────────────────────────────────────── */
        @media(max-width:640px){
          .grid2{grid-template-columns:1fr !important}
          .metrics-grid{grid-template-columns:1fr 1fr !important}
        }
      `}</style>

      {/* ── Toasts ──────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} />

      {/* ── Bannière notifications push ──────────────────────────── */}
      {showPushBanner && pushPermission === "default" && !pushSubscribed && (
        <div style={{
          position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",
          zIndex:500,background:"#111",border:"0.5px solid rgba(201,168,76,0.35)",
          borderRadius:14,padding:"14px 20px",display:"flex",alignItems:"center",gap:14,
          boxShadow:"0 8px 32px rgba(0,0,0,0.6)",minWidth:280,maxWidth:380,
          animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}>
          <span style={{fontSize:24,flexShrink:0}}>🔔</span>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:"#F0EDE8",fontFamily:"'Syne',sans-serif",marginBottom:3}}>
              Sois alerté des messages
            </div>
            <div style={{fontSize:11,color:"#555",fontFamily:"'Syne',sans-serif",lineHeight:1.5}}>
              Reçois une notification quand le coach t'écrit.
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
            <button onClick={()=>{ subscribePush(); setShowPushBanner(false); }}
              disabled={pushLoading}
              style={{background:"rgba(201,168,76,0.12)",border:"0.5px solid rgba(201,168,76,0.35)",color:"#C9A84C",fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",padding:"6px 12px",cursor:"pointer",borderRadius:20,whiteSpace:"nowrap"}}>
              {pushLoading ? "..." : "Activer"}
            </button>
            <button onClick={()=>setShowPushBanner(false)}
              style={{background:"transparent",border:"none",color:"#333",fontFamily:"'Syne',sans-serif",fontSize:10,cursor:"pointer",textAlign:"center",letterSpacing:"1px",textTransform:"uppercase"}}>
              Plus tard
            </button>
          </div>
        </div>
      )}

      {/* ── Confetti ────────────────────────────────────────────── */}
      {confetti && (
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
          {Array.from({length:24}).map((_,i) => {
            const colors=["#C9A84C","#E8C87A","#7AE07A","#5DCAA5","#F0EDE8","#E07070"];
            const color=colors[i%colors.length], size=Math.random()>0.5?8:6;
            return <div key={i} className="confetti-piece" style={{left:`${Math.random()*100}%`,top:"-20px",background:color,width:size,height:size,borderRadius:Math.random()>0.5?"50%":2,animationDelay:`${Math.random()*0.6}s`,animationDuration:`${0.9+Math.random()*0.5}s`}}/>;
          })}
        </div>
      )}

      {/* ── Mode Focus ──────────────────────────────────────────── */}
      {focusMode && exercices.length > 0 && (
        <div style={{position:"fixed",inset:0,background:"rgba(10,10,10,0.97)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
          <button onClick={()=>setFocusMode(false)} style={{position:"absolute",top:20,right:20,background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"8px 16px",cursor:"pointer",borderRadius:2}}>✕ Quitter</button>
          <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:16}}>Exercice {focusIdx+1} sur {exercices.length}</div>
          <div style={{display:"flex",gap:4,marginBottom:32}}>
            {exercices.map((_,i)=><div key={i} style={{height:3,width:32,borderRadius:2,background:i<focusIdx?"#7AE07A":i===focusIdx?"#C9A84C":"#242424",transition:"background 0.3s"}}/>)}
          </div>
          {(() => {
            const e=exercices[focusIdx]; const done=exoDone[focusIdx];
            return (
              <div key={focusIdx} className="focus-exo" style={{textAlign:"center",maxWidth:480,width:"100%"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(32px,6vw,52px)",fontWeight:600,color:done?"#555":"#F0EDE8",lineHeight:1.1,marginBottom:16,textDecoration:done?"line-through":"none",transition:"all 0.3s"}}>{e.nom}</div>
                <div style={{fontSize:16,color:"#C9A84C",fontWeight:700,marginBottom:8,letterSpacing:"2px"}}>{e.det}</div>
                {e.conseil && <div style={{fontSize:14,color:"#666",marginBottom:32,lineHeight:1.7,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic"}}>⚡ {e.conseil}</div>}
                <button onClick={()=>{
                  const wasUndone=!exoDone[focusIdx];
                  setExoDone(prev=>({...prev,[focusIdx]:!prev[focusIdx]}));
                  if(wasUndone){
                    vibrate([50]); addToast(`✓ ${e.nom}`,"success");
                    if(focusIdx<exercices.length-1) setTimeout(()=>setFocusIdx(f=>f+1),600);
                    else { setConfetti(true); addToast("🎉 Séance complète ! Bravo !","gold"); vibrate([100,50,100,50,200]); setTimeout(()=>{setConfetti(false);setFocusMode(false);},2500); }
                    if(e.reposSec>0) setTimer({duration:e.reposSec,name:e.nom,startedAt:Date.now()});
                  }
                }} style={{background:done?"#1A3A1A":"linear-gradient(135deg,#C9A84C,#A67C2E)",border:`1px solid ${done?"#3A6A3A":"transparent"}`,color:done?"#7AE07A":"#0A0A0A",padding:"16px 40px",borderRadius:4,cursor:"pointer",fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",transition:"all 0.3s",minWidth:200}}>
                  {done?"✓ Fait !":"Exercice terminé →"}
                </button>
              </div>
            );
          })()}
          <div style={{display:"flex",gap:12,marginTop:32}}>
            <button onClick={()=>setFocusIdx(f=>Math.max(0,f-1))} disabled={focusIdx===0} style={{background:"transparent",border:"0.5px solid #242424",color:focusIdx===0?"#333":"#888",padding:"8px 20px",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",borderRadius:2}}>← Préc.</button>
            <button onClick={()=>setFocusIdx(f=>Math.min(exercices.length-1,f+1))} disabled={focusIdx===exercices.length-1} style={{background:"transparent",border:"0.5px solid #242424",color:focusIdx===exercices.length-1?"#333":"#888",padding:"8px 20px",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",borderRadius:2}}>Suiv. →</button>
          </div>
        </div>
      )}

      {/* ── RestTimer ────────────────────────────────────────────── */}
      {timer && <RestTimer key={timer.startedAt} duration={timer.duration} exerciseName={timer.name} onDone={()=>setTimer(null)} onSkip={()=>setTimer(null)} />}

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",borderBottom:"0.5px solid #1A1A1A",position:"sticky",top:0,background:"#0A0A0A",zIndex:100}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:5,cursor:"pointer"}} onClick={()=>router.push("/")}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",background:"rgba(201,168,76,0.1)",border:"0.5px solid rgba(201,168,76,0.35)",color:"#C9A84C",padding:"5px 14px",borderRadius:20}}>Plan {planName}</span>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={refreshData} disabled={dataLoading} style={{background:"transparent",border:"0.5px solid #1E1E1E",color:dataLoading?"#333":"#555",fontFamily:"'Syne',sans-serif",fontSize:13,padding:"7px 12px",cursor:dataLoading?"not-allowed":"pointer",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}} title="Rafraîchir">
            {dataLoading?<div className="spinner" style={{borderTopColor:"#C9A84C",width:12,height:12}}/>:"↻"}
          </button>
          <button onClick={()=>setShowPwdModal(true)} style={{background:"transparent",border:"0.5px solid #1E1E1E",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 14px",cursor:"pointer",borderRadius:2}}>🔑</button>
          <button onClick={()=>signOut(auth)} style={{background:"transparent",border:"0.5px solid #1E1E1E",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"7px 14px",cursor:"pointer",borderRadius:2}}>Déconnexion</button>
        </div>
      </nav>

      {/* ── Modale MDP ──────────────────────────────────────────── */}
      {showPwdModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
          <div style={{background:"#111",border:"0.5px solid #242424",padding:"2rem",width:"100%",maxWidth:400,borderRadius:4}}>
            <div style={{fontSize:11,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1rem"}}>— Changer le mot de passe</div>
            {pwdSuccess ? (
              <div style={{textAlign:"center",padding:"1.5rem 0"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{color:"#7AE07A",fontSize:14}}>Mot de passe modifié !</div></div>
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
                  <button onClick={()=>{setShowPwdModal(false);setPwdError("");setPwdForm({current:"",next:"",confirm:""});}} style={{flex:1,padding:"11px",background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2}}>Annuler</button>
                  <button onClick={handleChangePassword} disabled={pwdLoading} style={{flex:2,padding:"11px",background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2}}>
                    {pwdLoading?"Modification...":"Confirmer →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Header + Tabs ───────────────────────────────────────── */}
      <div style={{padding:"16px 24px 0",borderBottom:"0.5px solid #1A1A1A",background:"#0A0A0A"}}>
        {showRenew && (
          <div style={{background:"rgba(201,168,76,0.06)",border:"0.5px solid rgba(201,168,76,0.3)",borderRadius:4,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div style={{fontSize:12,color:"#C9A84C"}}>🏁 Ton programme de 4 semaines touche à sa fin — prêt pour la suite ?</div>
            <button onClick={()=>router.push("/bilan")} style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"7px 16px",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:2,flexShrink:0}}>Nouveau bilan →</button>
          </div>
        )}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,marginBottom:14}}>
          Bonjour <em style={{color:"#C9A84C",fontStyle:"italic"}}>{clientData?.nom||user.email.split("@")[0]}</em> 👋
          <div style={{fontSize:12,color:"#444",fontFamily:"'Syne',sans-serif",fontWeight:400,marginTop:5,display:"flex",alignItems:"center",gap:8}}>
            {currentWeek&&pd&&<span style={{background:"rgba(201,168,76,0.08)",border:"0.5px solid rgba(201,168,76,0.2)",color:"#C9A84C",padding:"3px 10px",borderRadius:20,fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase"}}>Sem. {currentWeek}/{totalWeeks}</span>}
            {pd?.objectif_principal&&<span style={{color:"#444"}}>{pd.objectif_principal}</span>}
            {!pd&&<span style={{color:"#444"}}>Espace client</span>}
          </div>
        </div>
        <div className="tabs-wrap">
          {[
            {id:"dashboard", label:"Dashboard",  icon:"📊", badge:null},
            {id:"programme", label:"Programme",  icon:"🏋️", badge:exercices.length>0?`${doneExos}/${exercices.length}`:null},
            {id:"nutrition", label:"Nutrition",  icon:"🥗", badge:null},
            {id:"corps",     label:"Corps",      icon:"📐", badge:null},
            {id:"messages",  label:"Messages",   icon:"💬", badge:messages.filter(m=>m.sender==="coach"&&!m.read).length||null},
            {id:"ia",        label:"IA",         icon:"🤖", badge:null},
          ].map(tab=>(
            <button key={tab.id} className={`tab-btn${activeTab===tab.id?" active":""}`}
              onClick={()=>{setPrevTab(activeTab);setActiveTab(tab.id);vibrate([30]);}}
              style={{position:"relative"}}>
              {tab.icon} {tab.label}
              {tab.badge!==null&&(
                <span style={{fontSize:9,fontWeight:700,letterSpacing:0,lineHeight:1.4,background:activeTab===tab.id?"#C9A84C":"#2A2A2A",color:activeTab===tab.id?"#0A0A0A":"#888",borderRadius:10,padding:"1px 6px",marginLeft:4,transition:"all 0.2s"}}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu swipeable ───────────────────────────────────── */}
      <div style={{flex:1,padding:"20px 24px 32px",display:"flex",flexDirection:"column",gap:18,maxWidth:900,width:"100%",margin:"0 auto"}}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

        {activeTab==="dashboard" && <DashboardTab S={S} doneSeances={doneSeances} doneExos={doneExos} exercices={exercices} pd={pd} realStreak={realStreak} nbSeances={nbSeances} semaine={semaine} joursEtat={joursEtat} seances={seances} seanceDone={seanceDone} setSeanceDone={setSeanceDone} user={user} clientData={clientData} setClientData={setClientData} vibrate={vibrate} addToast={addToast} nutrition={nutrition} currentWeek={currentWeek} totalWeeks={totalWeeks} />}

        {activeTab==="programme" && <ProgrammeTab S={S} progSubTab={progSubTab} setProgSubTab={setProgSubTab} seanceAujourdhui={seanceAujourdhui} doneExos={doneExos} exercices={exercices} exoDone={exoDone} setExoDone={setExoDone} records={records} clientData={clientData} setTimer={setTimer} setConfetti={setConfetti} addToast={addToast} vibrate={vibrate} focusMode={focusMode} setFocusMode={setFocusMode} focusIdx={focusIdx} setFocusIdx={setFocusIdx} user={user} />}

        {activeTab==="nutrition" && <NutritionTab S={S} nutrition={nutrition} mealPlan={mealPlan} mealLoading={mealLoading} mealError={mealError} generateMealPlan={generateMealPlan} />}

        {activeTab==="corps" && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={S.card}>
              <div style={S.cardTitle}>📐 Journal corporel <span style={{...S.tag,marginLeft:"auto"}}>Saisie hebdomadaire</span></div>
              <CorpsJournal uid={user?.uid} addToast={addToast} programmeData={pd} />
            </div>
            <div style={{background:"rgba(201,168,76,0.04)",border:"0.5px solid rgba(201,168,76,0.15)",borderRadius:4,padding:"14px",fontSize:12,color:"#555",lineHeight:1.7}}>
              💡 <strong style={{color:"#C9A84C"}}>Conseil :</strong> Note tes mesures le même jour chaque semaine, le matin à jeun. La balance peut fluctuer de 1-3 kg selon l'hydratation — les mensurations sont plus fiables.
            </div>
          </div>
        )}

        {activeTab==="ia" && <AssistantTab S={S} chatHistory={chatHistory} chatLoading={chatLoading} chatInput={chatInput} setChatInput={setChatInput} sendChatMessage={sendChatMessage} chatBottomRef={chatBottomRef} />}

        {activeTab==="messages" && <MessagesTab S={S} messages={messages} newMsg={newMsg} setNewMsg={setNewMsg} sending={sending} sendMessage={sendMessage} sendError={sendError} bottomRef={bottomRef} />}

      </div>
    </div>
  );
}
