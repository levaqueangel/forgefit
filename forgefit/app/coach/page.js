"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp, where, getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

// ── Constantes ─────────────────────────────────────────────────────────────
const COACH_EMAIL = process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";
const INACTIVE_LIMIT   = 15 * 60 * 1000;
const WARNING_BEFORE   =  2 * 60 * 1000;

const PLAN_COLORS = { starter:"#7AE07A", forge:"#C9A84C", elite:"#E8C87A" };
const PLAN_BG     = { starter:"rgba(122,224,122,0.08)", forge:"rgba(201,168,76,0.08)", elite:"rgba(232,200,122,0.08)" };

const TEMPLATES = [
  { label:"Bienvenue 👋",    text:"Bonjour ! Bienvenue chez APXFITNESS. Ton programme est prêt dans ton espace. N'hésite pas si tu as des questions !" },
  { label:"Bravo 💪",        text:"Super séance ! Continue comme ça, tu es sur la bonne voie. La régularité, c'est la clé." },
  { label:"Check-in 📋",     text:"Comment tu te sens ce mois-ci ? Des douleurs particulières, des exercices qui te posent problème ?" },
  { label:"Rappel séance ⚡", text:"N'oublie pas ta séance d'aujourd'hui ! Même 30 minutes, ça compte. Lance le mode Focus dans l'app." },
  { label:"Ajustement 🔧",   text:"En regardant ta progression, je te conseille d'augmenter les charges sur le squat et le développé cette semaine. Tu es prêt." },
];

// ── Login ──────────────────────────────────────────────────────────────────
function LoginCoach() {
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, COACH_EMAIL, password); }
    catch { setError("Mot de passe incorrect."); }
    setLoading(false);
  };

  const handleReset = async () => {
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, COACH_EMAIL);
      setResetSent(true);
    } catch { setError("Erreur lors de l'envoi. Réessaie."); }
    setResetLoading(false);
  };

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:22,fontWeight:800,letterSpacing:6,marginBottom:"3rem"}}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
      <div style={{width:"100%",maxWidth:360,padding:"0 1rem"}}>
        <div style={{fontSize:10,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.75rem"}}>— Interface coach</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:600,lineHeight:1.1,marginBottom:"2rem"}}>
          Tableau de<br/><em style={{fontStyle:"italic",color:"#555"}}>bord</em>
        </div>
        <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:1}}>
          <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
            <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:7}}>Mot de passe</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{width:"100%",background:"transparent",border:"none",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,outline:"none"}}/>
          </div>
          {error && <div style={{background:"#1A0808",border:"0.5px solid #5A1A1A",color:"#E07070",fontSize:12,padding:"10px 14px"}}>{error}</div>}
          {resetSent && (
            <div style={{background:"#081A08",border:"0.5px solid #1A3A1A",color:"#7AE07A",fontSize:12,padding:"10px 14px",lineHeight:1.6}}>
              ✓ Email envoyé à {COACH_EMAIL} — clique sur le lien pour créer ton mot de passe.
            </div>
          )}
          <button type="submit" disabled={loading} style={{background:loading?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"14px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",marginTop:2}}>
            {loading ? "Connexion..." : "Accéder →"}
          </button>
        </form>
        <button onClick={handleReset} disabled={resetLoading || resetSent}
          style={{marginTop:16,background:"none",border:"none",color:resetSent?"#555":"#C9A84C",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",cursor:resetSent?"default":"pointer",textDecoration:"underline",width:"100%",textAlign:"center",opacity:resetLoading?0.5:1}}>
          {resetLoading ? "Envoi..." : resetSent ? "Email envoyé ✓" : "Mot de passe oublié ?"}
        </button>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:999,display:"flex",flexDirection:"column-reverse",gap:8,alignItems:"center",pointerEvents:"none"}}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:t.type==="error"?"rgba(40,10,10,0.96)":t.type==="gold"?"rgba(35,25,5,0.97)":"rgba(12,30,12,0.96)",
          border:`0.5px solid ${t.type==="error"?"rgba(200,60,60,0.3)":t.type==="gold"?"rgba(201,168,76,0.4)":"rgba(90,186,90,0.3)"}`,
          borderRadius:24,padding:"9px 18px",display:"flex",alignItems:"center",gap:10,
          fontFamily:"'Syne',sans-serif",fontSize:12,color:"#F0EDE8",
          backdropFilter:"blur(10px)",animation:"toastIn 0.3s ease forwards",
        }}>
          <span style={{color:t.type==="error"?"#E07070":t.type==="gold"?"#E8C87A":"#7AE07A",fontSize:14,fontWeight:700}}>
            {t.type==="error"?"✕":t.type==="gold"?"★":"✓"}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Bulle message ──────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isCoach = msg.sender === "coach";
  const time = msg.createdAt?.toDate?.()
    ? msg.createdAt.toDate().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})
    : "";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isCoach?"flex-end":"flex-start",marginBottom:10,animation:"fadeUp 0.2s ease forwards"}}>
      <div style={{
        maxWidth:"78%",padding:"10px 14px",
        background:isCoach?"rgba(201,168,76,0.1)":"#181818",
        border:`0.5px solid ${isCoach?"rgba(201,168,76,0.3)":"#242424"}`,
        fontSize:13,lineHeight:1.7,
        color:isCoach?"#E8C87A":"#C8C4BC",
        borderRadius:isCoach?"14px 14px 4px 14px":"14px 14px 14px 4px",
      }}>{msg.text}</div>
      <span style={{fontSize:10,color:"#2A2A2A",marginTop:3,fontFamily:"'Syne',sans-serif"}}>
        {isCoach ? "Toi" : "Client"} · {time}
      </span>
    </div>
  );
}

// ── Page coach principale ──────────────────────────────────────────────────
export default function CoachPage() {
  const router = useRouter();

  // Auth
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Clients
  const [clients, setClients]             = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientMessages, setClientMessages] = useState([]);
  const [unreadCounts, setUnreadCounts]   = useState({});
  const [clientData, setClientData]       = useState(null);  // données complètes du client sélectionné

  // Message
  const [newMsg, setNewMsg]       = useState("");
  const [sending, setSending]     = useState(false);
  const [sendError, setSendError] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isTyping, setIsTyping]   = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState("messages"); // messages | stats | programme

  // Notes
  const [notes, setNotes]           = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Edition programme
  const [showEditProg, setShowEditProg] = useState(false);
  const [editProgText, setEditProgText] = useState("");
  const [editProgSaving, setEditProgSaving] = useState(false);

  // Filtres sidebar
  const [clientFilter, setClientFilter] = useState("all");
  const [clientSort, setClientSort]     = useState("recent");
  const [clientSearch, setClientSearch] = useState("");

  // Export CSV
  const [exporting, setExporting] = useState(false);

  // Modal création client manuel
  const [showAddClient, setShowAddClient]     = useState(false);
  const [newClientForm, setNewClientForm]     = useState({ nom:"", email:"", plan:"forge", programme:"" });
  const [newClientLoading, setNewClientLoading] = useState(false);
  const [newClientError, setNewClientError]   = useState("");

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type="success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  // Stats
  const [allMsgsCount, setAllMsgsCount] = useState(0);

  // Inactivité
  const [showInactiveWarning, setShowInactiveWarning] = useState(false);
  const inactiveTimer = useRef(null);
  const warningTimer  = useRef(null);
  const bottomRef     = useRef(null);

  // ── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setAuthLoading(false), 8000);
    const unsub = onAuthStateChanged(auth, u => {
      clearTimeout(t);
      setUser(u && u.email === COACH_EMAIL ? u : null);
      setAuthLoading(false);
    });
    return () => { unsub(); clearTimeout(t); };
  }, []);

  // ── Inactivité ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const reset = () => {
      setShowInactiveWarning(false);
      clearTimeout(inactiveTimer.current); clearTimeout(warningTimer.current);
      warningTimer.current  = setTimeout(() => setShowInactiveWarning(true), INACTIVE_LIMIT - WARNING_BEFORE);
      inactiveTimer.current = setTimeout(() => signOut(auth), INACTIVE_LIMIT);
    };
    reset();
    const events = ["mousemove","keydown","click","scroll","touchstart"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => { events.forEach(e => window.removeEventListener(e, reset)); clearTimeout(inactiveTimer.current); clearTimeout(warningTimer.current); };
  }, [user]);

  // ── Clients Firestore ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "clients"), snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  // ── Unread counts ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "messages"), where("sender","==","client"), where("read","==",false));
    const unsub = onSnapshot(q, snap => {
      const counts = {};
      snap.docs.forEach(d => {
        const cId = d.data().clientId;
        counts[cId] = (counts[cId] || 0) + 1;
      });
      setUnreadCounts(counts);
    });
    return unsub;
  }, [user]);

  // ── Messages client sélectionné ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedClient) { setClientMessages([]); return; }
    const q = query(collection(db, "messages"),
      where("clientId","==",selectedClient.id), orderBy("createdAt","asc"));
    let isFirst = true;
    const unsub = onSnapshot(q, snap => {
      setClientMessages(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      if (!isFirst) setAllMsgsCount(c => c + snap.docChanges().filter(ch=>ch.type==="added").length);
      isFirst = false;
    });
    return unsub;
  }, [selectedClient]);

  // ── Auto-scroll messages ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [clientMessages]);

  // ── Données complètes client sélectionné ────────────────────────────────
  useEffect(() => {
    if (!selectedClient?.id) { setClientData(null); return; }
    getDoc(doc(db, "clients", selectedClient.id))
      .then(snap => snap.exists() ? setClientData(snap.data()) : setClientData(null))
      .catch(() => setClientData(null));
  }, [selectedClient]);

  // ── Notes privées ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedClient) return;
    setNotes(selectedClient.coachNotes || "");
  }, [selectedClient]);

  // ── Indicateur typing ────────────────────────────────────────────────────
  useEffect(() => {
    if (!newMsg) { setIsTyping(false); return; }
    setIsTyping(true);
    const t = setTimeout(() => setIsTyping(false), 1500);
    return () => clearTimeout(t);
  }, [newMsg]);

  // ── Envoi message ────────────────────────────────────────────────────────
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
      addToast(`Message envoyé à ${selectedClient.nom?.split(" ")[0]} ✓`);
      fetch("/api/notify-client", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedClient.email, nom: selectedClient.nom, message: txt }),
      }).catch(() => {});
      const unread = clientMessages.filter(m => m.sender === "client" && !m.read);
      await Promise.all(unread.map(m => updateDoc(doc(db,"messages",m.id), { read: true })));
    } catch { setSendError("Erreur lors de l'envoi."); }
    finally { setSending(false); }
  };

  // ── Sauvegarder notes ────────────────────────────────────────────────────
  const saveNotes = async () => {
    if (!selectedClient || notesSaving) return;
    setNotesSaving(true);
    try {
      await updateDoc(doc(db,"clients",selectedClient.id), { coachNotes: notes });
      setNotesSaved(true);
      addToast("Notes sauvegardées ✓");
      setTimeout(() => setNotesSaved(false), 3000);
    } catch { addToast("Erreur lors de la sauvegarde", "error"); }
    setNotesSaving(false);
  };

  // ── Export CSV ──────────────────────────────────────────────────────────
  // ── Edition programme client ─────────────────────────────────────────────────
  const saveEditedProg = async () => {
    if (!selectedClient || editProgSaving || !editProgText.trim()) return;
    setEditProgSaving(true);
    try {
      await updateDoc(doc(db,"clients",selectedClient.id), { programme: editProgText.trim() });
      addToast(`Programme de ${selectedClient.nom?.split(" ")[0]} mis à jour ✓`);
      setShowEditProg(false);
    } catch { addToast("Erreur lors de la sauvegarde", "error"); }
    setEditProgSaving(false);
  };

  const createClientManual = async () => {
    const { nom, email, plan, programme } = newClientForm;
    if (!nom.trim() || !email.trim() || !programme.trim()) {
      setNewClientError("Nom, email et programme sont obligatoires."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewClientError("Email invalide."); return;
    }
    setNewClientLoading(true); setNewClientError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ nom: nom.trim(), email: email.trim().toLowerCase(), plan, programme }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Client ${nom} créé ✓`);
        setShowAddClient(false);
        setNewClientForm({ nom:"", email:"", plan:"forge", programme:"" });
      } else {
        setNewClientError(data.error || "Erreur lors de la création.");
      }
    } catch (e) {
      setNewClientError("Erreur réseau : " + e.message);
    }
    setNewClientLoading(false);
  };

  const exportCSV = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/export-clients", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Erreur export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `apxfitness-clients-${new Date().toISOString().split("T")[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      addToast("Export CSV téléchargé ✓");
    } catch (e) { addToast("Erreur export : " + e.message, "error"); }
    setExporting(false);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const unreadCount = (cId) => unreadCounts[cId] || 0;
  const totalUnread  = Object.values(unreadCounts).reduce((a,b) => a+b, 0);

  // Clients filtrés
  const filteredClients = clients
    .filter(c => {
      if (clientFilter !== "all" && (c.plan||"").toLowerCase() !== clientFilter) return false;
      if (clientSearch.trim()) {
        const q = clientSearch.toLowerCase();
        return (c.nom||"").toLowerCase().includes(q) || (c.email||"").toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a,b) => {
      if (clientSort === "name")     return (a.nom||"").localeCompare(b.nom||"");
      if (clientSort === "activity") {
        const aL = a.lastActiveDate ? new Date(a.lastActiveDate).getTime() : 0;
        const bL = b.lastActiveDate ? new Date(b.lastActiveDate).getTime() : 0;
        return bL - aL;
      }
      return new Date(b.createdAt||0).getTime() - new Date(a.createdAt||0).getTime();
    });

  const daysSince = (dateStr) => {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  };

  if (authLoading) return (
    <div style={{background:"#0A0A0A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:20,height:20,border:"2px solid rgba(201,168,76,0.2)",borderTopColor:"#C9A84C",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
    </div>
  );
  if (!user) return <LoginCoach />;

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",height:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        textarea:focus,input:focus{border-color:#C9A84C !important;outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(0.94)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes badgePop{0%{transform:scale(0)}70%{transform:scale(1.3)}100%{transform:scale(1)}}
        .client-row{padding:12px 14px;cursor:pointer;transition:all 0.15s;border-bottom:0.5px solid #0F0F0F;position:relative}
        .client-row:hover{background:#0D0D0D}
        .client-row.active{background:#111;border-left:2px solid #C9A84C}
        .tab-pill{background:transparent;border:none;color:#555;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;padding:7px 16px;border-radius:20px;transition:all 0.2s;white-space:nowrap;display:flex;align-items:center;gap:6px}
        .tab-pill.active{background:rgba(201,168,76,0.12);color:#E8C87A;border:0.5px solid rgba(201,168,76,0.3)}
        .tab-pill:hover:not(.active){background:rgba(255,255,255,0.04);color:#888}
        .nav-btn{background:transparent;border:0.5px solid #1E1E1E;color:#555;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 14px;cursor:pointer;transition:all 0.2s;border-radius:20px}
        .nav-btn:hover{border-color:#333;color:#888}
        .template-pill{background:#111;border:0.5px solid #1A1A1A;color:#888;font-family:'Syne',sans-serif;font-size:11px;padding:6px 12px;cursor:pointer;transition:all 0.15s;border-radius:20px}
        .template-pill:hover{border-color:#C9A84C;color:#E8C87A;background:rgba(201,168,76,0.06)}
        .send-btn{background:linear-gradient(135deg,#C9A84C,#A67C2E);border:none;color:#0A0A0A;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
        .send-btn:disabled{background:#181818;cursor:not-allowed}
        .send-btn:not(:disabled):hover{transform:scale(1.08)}
        .stat-card{background:#0D0D0D;border:0.5px solid #1A1A1A;border-radius:12px;padding:14px;transition:all 0.2s;position:relative;overflow:hidden}
        .stat-card:hover{border-color:#2A2A2A;transform:translateY(-2px)}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1E1E1E;border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:#2A2A2A}
      `}</style>

      <Toast toasts={toasts} />

      {/* ── Modale inactivité ─────────────────────────────────────────────── */}
      {showInactiveWarning && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#111",border:"0.5px solid #C9A84C",padding:"2rem",maxWidth:360,width:"90%",textAlign:"center",borderRadius:14}}>
            <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:14,fontWeight:700,color:"#E8C87A",marginBottom:8}}>Inactivité détectée</div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#888",lineHeight:1.7,marginBottom:"1.5rem"}}>
              Tu vas être déconnecté dans <strong style={{color:"#E8C87A"}}>2 minutes</strong>.
            </p>
            <button onClick={() => {
              setShowInactiveWarning(false);
              clearTimeout(inactiveTimer.current); clearTimeout(warningTimer.current);
              warningTimer.current  = setTimeout(() => setShowInactiveWarning(true), INACTIVE_LIMIT - WARNING_BEFORE);
              inactiveTimer.current = setTimeout(() => signOut(auth), INACTIVE_LIMIT);
            }} style={{background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"12px 28px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:20}}>
              Je suis toujours là →
            </button>
          </div>
        </div>
      )}

      {/* ── Modale édition programme ─────────────────────────────────────────── */}
      {showEditProg && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem"}}>
          <div style={{background:"#111",border:"0.5px solid #242424",padding:"1.5rem",width:"100%",maxWidth:640,borderRadius:4,display:"flex",flexDirection:"column",gap:12,maxHeight:"85vh"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C"}}>— Programme de {selectedClient?.nom}</div>
              <button onClick={()=>setShowEditProg(false)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
            </div>
            <div style={{fontSize:11,color:"#444"}}>Modifie le programme texte. Les séances structurées (JSON) ne sont pas modifiées ici.</div>
            <textarea
              value={editProgText}
              onChange={e=>setEditProgText(e.target.value)}
              style={{flex:1,minHeight:320,background:"#0D0D0D",border:"0.5px solid #242424",color:"#C8C4BC",fontFamily:"'Courier New',monospace",fontSize:12,padding:"14px",resize:"vertical",outline:"none",lineHeight:1.8,borderRadius:4}}
            />
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowEditProg(false)} style={{background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"10px 20px",cursor:"pointer",borderRadius:2}}>Annuler</button>
              <button onClick={saveEditedProg} disabled={editProgSaving} style={{background:editProgSaving?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",padding:"10px 24px",cursor:editProgSaving?"not-allowed":"pointer",borderRadius:2}}>
                {editProgSaving?"Sauvegarde...":"Sauvegarder →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav principale ─────────────────────────────────────────────────── */}
      <nav style={{display:"flex",alignItems:"center",gap:12,padding:"10px 20px",borderBottom:"0.5px solid #1A1A1A",background:"rgba(10,10,10,0.98)",backdropFilter:"blur(12px)",flexShrink:0,zIndex:50}}>
        {/* Logo */}
        <div style={{fontSize:16,fontWeight:800,letterSpacing:5,cursor:"pointer",marginRight:8}} onClick={() => router.push("/")}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div style={{width:1,height:18,background:"#1E1E1E"}}/>
        <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C",paddingLeft:8}}>Coach</div>

        {/* Onglets */}
        <div style={{display:"flex",gap:4,marginLeft:16}}>
          {[
            ["messages", "💬", `Messages${totalUnread > 0 ? ` (${totalUnread})` : ""}`],
            ["stats",    "📊", "Statistiques"],
            ["programme","📋", "Templates"],
          ].map(([tab, icon, label]) => (
            <button key={tab} className={`tab-pill${activeTab===tab?" active":""}`} onClick={() => setActiveTab(tab)}>
              <span>{icon}</span> {label}
              {tab==="messages" && totalUnread > 0 && (
                <span style={{background:"#C9A84C",color:"#0A0A0A",fontSize:9,fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",animation:"badgePop 0.3s ease",flexShrink:0}}>
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions droite */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:"#444",letterSpacing:"1px"}}>
            {clients.length} client{clients.length > 1 ? "s" : ""}
          </span>
          <button className="nav-btn" onClick={() => setShowAddClient(true)}>
            ➕ Client
          </button>
          <button className="nav-btn" onClick={exportCSV} disabled={exporting}>
            {exporting ? <span style={{width:10,height:10,border:"1.5px solid #333",borderTopColor:"#C9A84C",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/> : "⬇️"} CSV
          </button>
          <button className="nav-btn" onClick={() => router.push("/recettes")}>
            🍽 Recettes
          </button>
          <button className="nav-btn" onClick={() => signOut(auth)}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ── Corps principal ──────────────────────────────────────────────── */}
      <div style={{flex:1,overflow:"hidden",display:"flex"}}>

        {/* ── TAB MESSAGES ──────────────────────────────────────────────── */}
        {activeTab === "messages" && (
          <div style={{display:"flex",flex:1,overflow:"hidden"}}>

            {/* Sidebar clients */}
            <div style={{width:280,flexShrink:0,borderRight:"0.5px solid #1A1A1A",display:"flex",flexDirection:"column",overflow:"hidden",background:"#080808"}}>

              {/* Filtres */}
              <div style={{padding:"10px 12px",borderBottom:"0.5px solid #111",flexShrink:0}}>
                {/* Recherche */}
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#111",border:"0.5px solid #1A1A1A",borderRadius:20,padding:"7px 12px",marginBottom:8}}>
                  <span style={{color:"#444",fontSize:12,flexShrink:0}}>🔍</span>
                  <input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                    placeholder="Rechercher..."
                    style={{flex:1,background:"transparent",border:"none",color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:11,outline:"none"}}/>
                  {clientSearch && <button onClick={() => setClientSearch("")} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:12,flexShrink:0}}>✕</button>}
                </div>
                {/* Filtres plan */}
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
                  {[["all","Tous"],["starter","S"],["forge","F"],["elite","E"]].map(([val,label]) => (
                    <button key={val} onClick={() => setClientFilter(val)} style={{
                      fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'Syne',sans-serif",
                      padding:"4px 10px",cursor:"pointer",borderRadius:20,transition:"all 0.15s",
                      background:clientFilter===val?`rgba(${val==="starter"?"122,224,122":val==="forge"?"201,168,76":val==="elite"?"232,200,122":"201,168,76"},0.12)`:"transparent",
                      border:`0.5px solid ${clientFilter===val?PLAN_COLORS[val]||"#C9A84C":"#1E1E1E"}`,
                      color:clientFilter===val?PLAN_COLORS[val]||"#C9A84C":"#555",
                    }}>{label}</button>
                  ))}
                  <select value={clientSort} onChange={e => setClientSort(e.target.value)} style={{
                    marginLeft:"auto",background:"transparent",border:"none",color:"#444",
                    fontFamily:"'Syne',sans-serif",fontSize:9,letterSpacing:"1px",cursor:"pointer",outline:"none",
                  }}>
                    <option value="recent">Récents</option>
                    <option value="activity">Activité</option>
                    <option value="name">A-Z</option>
                  </select>
                </div>
                <div style={{fontSize:9,color:"#2A2A2A",letterSpacing:"1.5px",textTransform:"uppercase"}}>
                  {filteredClients.length}/{clients.length} clients
                </div>
              </div>

              {/* Liste clients */}
              <div style={{flex:1,overflowY:"auto"}}>
                {filteredClients.length === 0 ? (
                  <div style={{padding:"2rem",textAlign:"center",color:"#333",fontSize:13,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>
                    {clientSearch ? `Aucun résultat pour "${clientSearch}"` : "Aucun client"}
                  </div>
                ) : filteredClients.map(client => {
                  const unread    = unreadCount(client.id);
                  const isActive  = selectedClient?.id === client.id;
                  const daysInact = daysSince(client.lastActiveDate);
                  const isInactive = daysInact !== null && daysInact > 7;
                  const planColor = PLAN_COLORS[client.plan?.toLowerCase()] || "#555";

                  return (
                    <div key={client.id} className={`client-row${isActive?" active":""}`}
                      onClick={() => setSelectedClient(client)}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {/* Avatar */}
                        <div style={{
                          width:34,height:34,borderRadius:"50%",flexShrink:0,
                          background:`rgba(${planColor==="#7AE07A"?"122,224,122":planColor==="#C9A84C"?"201,168,76":"232,200,122"},0.12)`,
                          border:`1.5px solid ${isActive?planColor:"#1E1E1E"}`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:13,fontWeight:700,color:planColor,
                          transition:"border-color 0.2s",
                        }}>
                          {client.nom?.charAt(0).toUpperCase() || "?"}
                        </div>
                        {/* Infos */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                            <span style={{fontSize:12,fontWeight:700,color:isActive?"#E8C87A":"#F0EDE8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {client.nom || client.email}
                            </span>
                            {unread > 0 && (
                              <span style={{background:"#C9A84C",color:"#0A0A0A",fontSize:9,fontWeight:700,minWidth:16,height:16,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",animation:"badgePop 0.3s ease",flexShrink:0}}>
                                {unread}
                              </span>
                            )}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{
                              fontSize:8,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",
                              color:planColor,background:`rgba(${planColor==="#7AE07A"?"122,224,122":planColor==="#C9A84C"?"201,168,76":"232,200,122"},0.1)`,
                              padding:"1px 6px",borderRadius:6,
                            }}>{client.plan || "—"}</span>
                            <span style={{fontSize:10,color:isInactive?"#E07070":"#444",display:"flex",alignItems:"center",gap:3}}>
                              <span style={{width:5,height:5,borderRadius:"50%",background:isInactive?"#E07070":daysInact===0?"#7AE07A":"#444",flexShrink:0,display:"inline-block"}}/>
                              {daysInact === null ? "jamais" : daysInact === 0 ? "auj." : `${daysInact}j`}
                            </span>
                            {client.streakDays > 0 && (
                              <span style={{fontSize:10,color:"#C9A84C"}}>🔥{client.streakDays}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zone centrale messages */}
            {!selectedClient ? (
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,color:"#222"}}>
                <div style={{fontSize:48}}>💬</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:"#333"}}>
                  Sélectionne un client
                </div>
                <div style={{fontSize:11,color:"#2A2A2A",letterSpacing:"2px",textTransform:"uppercase"}}>
                  {filteredClients.length} client{filteredClients.length>1?"s":""} · {totalUnread} message{totalUnread>1?"s":""} non lu{totalUnread>1?"s":""}
                </div>
              </div>
            ) : (
              <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 280px",overflow:"hidden"}}>

                {/* Colonne messages */}
                <div style={{display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"0.5px solid #1A1A1A"}}>

                  {/* Header client */}
                  <div style={{padding:"12px 18px",borderBottom:"0.5px solid #1A1A1A",display:"flex",alignItems:"center",gap:12,flexShrink:0,background:"#0A0A0A"}}>
                    <div style={{
                      width:38,height:38,borderRadius:"50%",
                      background:"rgba(201,168,76,0.1)",border:"1.5px solid #C9A84C",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:15,fontWeight:700,color:"#C9A84C",flexShrink:0,
                    }}>
                      {selectedClient.nom?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                        <span style={{fontSize:14,fontWeight:700,color:"#F0EDE8"}}>{selectedClient.nom}</span>
                        <span style={{
                          fontSize:9,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",
                          color:PLAN_COLORS[selectedClient.plan?.toLowerCase()]||"#555",
                          background:PLAN_BG[selectedClient.plan?.toLowerCase()]||"transparent",
                          padding:"2px 8px",borderRadius:10,
                        }}>
                          Plan {selectedClient.plan}
                        </span>
                      </div>
                      <div style={{fontSize:11,color:"#444",letterSpacing:"0.5px"}}>
                        {selectedClient.email}
                        {selectedClient.createdAt && ` · Client depuis le ${new Date(selectedClient.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}`}
                      </div>
                    </div>
                    {/* Indicateurs rapides */}
                    <div style={{display:"flex",gap:10,flexShrink:0}}>
                      {clientData?.streakDays > 0 && (
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:14,fontWeight:700,color:"#C9A84C"}}>🔥{clientData.streakDays}</div>
                          <div style={{fontSize:8,color:"#444",letterSpacing:"1px",textTransform:"uppercase"}}>streak</div>
                        </div>
                      )}
                      {clientData?.programmeData?.objectif_principal && (
                        <div style={{maxWidth:120,fontSize:11,color:"#555",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",lineHeight:1.4}}>
                          {clientData.programmeData.objectif_principal}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Zone messages scrollable */}
                  <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
                    {clientMessages.length === 0 ? (
                      <div style={{textAlign:"center",padding:"3rem 2rem",color:"#333",fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontStyle:"italic",lineHeight:1.7}}>
                        Pas encore de messages avec {selectedClient.nom?.split(" ")[0]}.<br/>
                        Envoie un message de bienvenue !
                      </div>
                    ) : (
                      <>
                        {clientMessages.map(msg => <Bubble key={msg.id} msg={msg}/>)}
                        {isTyping && (
                          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
                            <div style={{padding:"8px 14px",background:"rgba(201,168,76,0.06)",border:"0.5px solid rgba(201,168,76,0.15)",borderRadius:"14px 14px 4px 14px",display:"flex",gap:4,alignItems:"center"}}>
                              {[0,1,2].map(i => (
                                <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#C9A84C",opacity:0.5,animation:`pulse 1s ease ${i*0.2}s infinite`}}/>
                              ))}
                            </div>
                          </div>
                        )}
                        <div ref={bottomRef}/>
                      </>
                    )}
                  </div>

                  {/* Templates rapides */}
                  {showTemplates && (
                    <div style={{padding:"10px 16px",borderTop:"0.5px solid #1A1A1A",background:"#080808",display:"flex",flexWrap:"wrap",gap:6,flexShrink:0}}>
                      <div style={{width:"100%",fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#333",marginBottom:4}}>Réponses rapides</div>
                      {TEMPLATES.map((t,i) => (
                        <button key={i} className="template-pill" onClick={() => { setNewMsg(t.text); setShowTemplates(false); }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input envoi */}
                  {sendError && <div style={{padding:"4px 18px",fontSize:11,color:"#E07070",background:"rgba(224,112,112,0.06)"}}>{sendError}</div>}
                  <div style={{padding:"10px 14px",borderTop:"0.5px solid #1A1A1A",display:"flex",gap:8,alignItems:"flex-end",flexShrink:0,background:"#080808"}}>
                    <button onClick={() => setShowTemplates(p=>!p)}
                      style={{background:showTemplates?"rgba(201,168,76,0.1)":"transparent",border:`0.5px solid ${showTemplates?"rgba(201,168,76,0.35)":"#1E1E1E"}`,color:showTemplates?"#C9A84C":"#444",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:14,transition:"all 0.2s",flexShrink:0}}>
                      ⚡
                    </button>
                    <textarea
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder={`Message à ${selectedClient.nom?.split(" ")[0]}... (Entrée pour envoyer)`}
                      rows={1}
                      style={{
                        flex:1,background:"#111",border:"0.5px solid #1A1A1A",
                        color:"#F0EDE8",fontFamily:"'Syne',sans-serif",fontSize:13,
                        padding:"9px 14px",resize:"none",minHeight:36,maxHeight:100,
                        outline:"none",borderRadius:18,lineHeight:1.5,
                        transition:"border-color 0.2s",
                      }}
                    />
                    <button onClick={sendMessage} disabled={!newMsg.trim()||sending} className="send-btn">
                      {sending ? <div style={{width:14,height:14,border:"2px solid rgba(0,0,0,0.3)",borderTopColor:"#0A0A0A",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> : "↑"}
                    </button>
                  </div>
                </div>

                {/* Panneau infos client */}
                <div style={{display:"flex",flexDirection:"column",overflow:"hidden",background:"#080808"}}>

                  {/* Stats client */}
                  <div style={{padding:"14px",borderBottom:"0.5px solid #1A1A1A",flexShrink:0}}>
                    <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:10}}>Données client</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {[
                        {label:"Streak",    val:clientData?.streakDays>0?`${clientData.streakDays}j`:"0j",    color:"#C9A84C"},
                        {label:"Calories",  val:clientData?.programmeData?.nutrition?.calories_jour?`${clientData.programmeData.nutrition.calories_jour}`:clientData?.nutrition?.calories_jour?`${clientData.nutrition.calories_jour} kcal`:"—", color:"#7AE07A"},
                        {label:"Séances",   val:clientData?.programmeData?.seances_par_semaine?`${clientData.programmeData.seances_par_semaine}/sem`:"—", color:"#5DCAA5"},
                        {label:"Durée",     val:clientData?.programmeData?.duree_programme_semaines?`${clientData.programmeData.duree_programme_semaines}W`:"—", color:"#E8C87A"},
                        {label:"Check-in",  val:clientData?.lastCheckinResponse||"—", color:"#5DCAA5"},
                      ].map((s,i) => (
                        <div key={i} className="stat-card">
                          <div style={{position:"absolute",top:0,left:8,right:8,height:2,background:s.color,opacity:0.6,borderRadius:"0 0 2px 2px"}}/>
                          <div style={{fontSize:16,fontWeight:700,color:s.color,marginTop:4}}>{s.val}</div>
                          <div style={{fontSize:8,letterSpacing:"1.5px",textTransform:"uppercase",color:"#444",marginTop:2}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Programme aperçu */}
                  {clientData?.programmeData && (
                    <div style={{padding:"12px 14px",borderBottom:"0.5px solid #1A1A1A",flexShrink:0}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#555"}}>Programme</div>
                        <button onClick={()=>{ setEditProgText(clientData?.programme||""); setShowEditProg(true); }} style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",background:"rgba(201,168,76,0.08)",border:"0.5px solid rgba(201,168,76,0.2)",color:"#C9A84C",padding:"3px 10px",cursor:"pointer",borderRadius:10,fontFamily:"'Syne',sans-serif",transition:"all 0.2s"}}>✏️ Modifier</button>
                      </div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"#888",lineHeight:1.7}}>
                        {clientData.programmeData.objectif_principal}
                      </div>
                      {clientData.programmeData.nutrition && (
                        <div style={{display:"flex",gap:6,marginTop:8}}>
                          {[
                            {k:"P",v:`${clientData.programmeData.nutrition.proteines_g}g`,c:"#7AE07A"},
                            {k:"G",v:`${clientData.programmeData.nutrition.glucides_g}g`,c:"#C9A84C"},
                            {k:"L",v:`${clientData.programmeData.nutrition.lipides_g}g`,c:"#5DCAA5"},
                          ].map((m,i) => (
                            <span key={i} style={{fontSize:10,color:m.c,background:`rgba(${m.c==="#7AE07A"?"122,224,122":m.c==="#C9A84C"?"201,168,76":"93,202,165"},0.08)`,padding:"2px 8px",borderRadius:10,fontWeight:700}}>
                              {m.k} {m.v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Objectifs semaine */}
                  <ObjectifsCoach clientId={selectedClient?.id} token={user?.getIdToken} addToast={addToast} />

                  {/* Alerte adaptation programme */}
                  {(() => {
                    const ratings = clientData?.sessionRatings || [];
                    const last7 = ratings.filter(r => new Date(r.date) > new Date(Date.now() - 7*86400000));
                    const tooHard = last7.filter(r => r.difficulte >= 4).length;
                    const tooEasy = last7.filter(r => r.difficulte <= 2).length;
                    if (tooHard >= 3 || tooEasy >= 3) {
                      return (
                        <div style={{margin:"8px 14px",padding:"10px 12px",background:"rgba(201,168,76,0.06)",border:"0.5px solid rgba(201,168,76,0.3)",borderRadius:10}}>
                          <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C",marginBottom:4}}>⚡ Suggestion adaptation</div>
                          <div style={{fontSize:11,color:"#888",lineHeight:1.6}}>
                            {tooHard >= 3 ? `${tooHard} séances notées "trop difficile" cette semaine — considère d'alléger les charges.` : `${tooEasy} séances notées "trop facile" — augmentation recommandée.`}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Notes privées */}
                  <div style={{flex:1,display:"flex",flexDirection:"column",padding:"12px 14px",overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                      <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#555"}}>Notes privées</div>
                      <button onClick={saveNotes} disabled={notesSaving} style={{
                        fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",
                        background:notesSaved?"rgba(122,224,122,0.08)":"rgba(201,168,76,0.08)",
                        border:`0.5px solid ${notesSaved?"rgba(122,224,122,0.3)":"rgba(201,168,76,0.2)"}`,
                        color:notesSaved?"#7AE07A":"#C9A84C",
                        padding:"4px 10px",cursor:"pointer",borderRadius:10,transition:"all 0.2s",
                        fontFamily:"'Syne',sans-serif",
                      }}>
                        {notesSaved?"✓ OK":notesSaving?"...":"Sauver"}
                      </button>
                    </div>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder={`Notes sur ${selectedClient.nom}...\nProgression, observations, prochains objectifs...`}
                      style={{
                        flex:1,background:"#0D0D0D",border:"0.5px solid #1A1A1A",
                        color:"#888",fontFamily:"'Cormorant Garamond',serif",fontSize:13,
                        padding:"10px 12px",resize:"none",outline:"none",lineHeight:1.8,
                        borderRadius:8,transition:"border-color 0.2s",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB STATISTIQUES ─────────────────────────────────────────── */}
        {activeTab === "stats" && (
          <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
            <StatsView clients={clients} allMsgsCount={allMsgsCount}/>
          </div>
        )}

        {/* ── TAB TEMPLATES ─────────────────────────────────────────────── */}
        {activeTab === "programme" && (
          <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
            <TemplatesView onSelect={(text) => { setNewMsg(text); setActiveTab("messages"); addToast("Template copié dans l'éditeur"); }}/>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Objectifs hebdo coach ────────────────────────────────────────────────────
function ObjectifsCoach({ clientId, token, addToast }) {
  const [objectifs, setObjectifs] = useState([]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!clientId || !open) return;
    setLoading(true);
    (async () => {
      try {
        const tok = await token();
        const res = await fetch(`/api/objectifs?clientId=${clientId}`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        const data = await res.json();
        setObjectifs((data.objectifs || []).map(o => o.texte));
      } catch {}
      setLoading(false);
    })();
  }, [clientId, open, token]);

  const ajouter = () => {
    if (!input.trim() || objectifs.length >= 5) return;
    setObjectifs(prev => [...prev, input.trim()]);
    setInput("");
  };

  const retirer = (i) => setObjectifs(prev => prev.filter((_,j) => j !== i));

  const sauvegarder = async () => {
    if (!clientId || saving || objectifs.length === 0) return;
    setSaving(true);
    try {
      const tok = await token();
      const res = await fetch("/api/objectifs", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok}` },
        body: JSON.stringify({ clientId, objectifs }),
      });
      if (res.ok) {
        addToast?.("Objectifs envoyés ✓");
        setOpen(false);
      } else {
        const d = await res.json();
        addToast?.(d.error || "Erreur", "error");
      }
    } catch { addToast?.("Erreur réseau", "error"); }
    setSaving(false);
  };

  return (
    <div style={{ padding:"8px 14px", borderBottom:"0.5px solid #1A1A1A" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: open ? 8 : 0 }}>
        <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>🎯 Objectifs semaine</div>
        <button onClick={() => setOpen(p=>!p)} style={{ fontSize:9, letterSpacing:"1px", textTransform:"uppercase", background:"rgba(201,168,76,0.08)", border:"0.5px solid rgba(201,168,76,0.2)", color:"#C9A84C", padding:"3px 10px", cursor:"pointer", borderRadius:10, fontFamily:"'Syne',sans-serif" }}>
          {open ? "Fermer" : "Définir"}
        </button>
      </div>
      {open && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {loading ? <div style={{ fontSize:11, color:"#333" }}>Chargement...</div> : (
            <>
              {objectifs.map((o,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, background:"#0D0D0D", borderRadius:8, padding:"6px 10px" }}>
                  <span style={{ flex:1, fontSize:11, color:"#888" }}>{o}</span>
                  <button onClick={() => retirer(i)} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:12, lineHeight:1 }}>✕</button>
                </div>
              ))}
              {objectifs.length < 5 && (
                <div style={{ display:"flex", gap:6 }}>
                  <input value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&ajouter()}
                    placeholder={`Objectif ${objectifs.length+1}/5...`}
                    style={{ flex:1, background:"#0D0D0D", border:"0.5px solid #1A1A1A", borderRadius:8, padding:"6px 10px", color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:11, outline:"none" }}
                  />
                  <button onClick={ajouter} disabled={!input.trim()} style={{ background:"rgba(201,168,76,0.1)", border:"0.5px solid rgba(201,168,76,0.3)", color:"#C9A84C", borderRadius:8, width:30, cursor:"pointer" }}>+</button>
                </div>
              )}
              {objectifs.length > 0 && (
                <button onClick={sauvegarder} disabled={saving} style={{ background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none", color:"#0A0A0A", fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", padding:"7px", borderRadius:8, cursor:"pointer" }}>
                  {saving ? "..." : "Envoyer →"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Graphique mini SVG ───────────────────────────────────────────────────────
function MiniSparkline({ data, color = "#C9A84C" }) {
  if (data.length < 2) return null;
  const W = 200, H = 40, PAD = 4;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [
    PAD + (i / (data.length - 1)) * (W - PAD * 2),
    PAD + (H - PAD * 2) - (v / max) * (H - PAD * 2)
  ]);
  const d = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", opacity: 0.8 }}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${d} L ${pts[pts.length-1][0]} ${H} L ${pts[0][0]} ${H} Z`} fill={`url(#sg${color.replace('#','')})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="2.5" fill={color}/>)}
    </svg>
  );
}

// ── StatsView ────────────────────────────────────────────────────────────────
function StatsView({ clients, allMsgsCount }) {
  const now = Date.now();
  const recentClients  = clients.filter(c => c.createdAt && (now - new Date(c.createdAt).getTime()) < 30*24*3600*1000).length;
  const activeClients  = clients.filter(c => c.lastActiveDate && (now - new Date(c.lastActiveDate).getTime()) < 7*24*3600*1000).length;
  const inactiveClients= clients.filter(c => !c.lastActiveDate || (now - new Date(c.lastActiveDate).getTime()) > 7*24*3600*1000).length;
  const avgStreak      = clients.length > 0 ? Math.round(clients.reduce((s,c) => s+(c.streakDays||0),0)/clients.length) : 0;
  const renewalDue     = clients.filter(c => { if (!c.createdAt) return false; const d = now - new Date(c.createdAt).getTime(); return d > 24*24*3600*1000 && d < 30*24*3600*1000 && !c.recapJ28SentAt; }).length;
  const plans          = clients.reduce((acc,c) => { const p=(c.plan||"?").toLowerCase(); acc[p]=(acc[p]||0)+1; return acc; }, {});
  const planPrices     = { starter:49, forge:129, elite:249 };
  const totalRevenue   = clients.reduce((s,c) => s+(planPrices[c.plan?.toLowerCase()]||0),0);

  const METRICS = [
    {label:"Total clients",      val:clients.length,   icon:"👥",  color:"#C9A84C"},
    {label:"Nouveaux ce mois",   val:recentClients,    icon:"🆕",  color:"#7AE07A"},
    {label:"Actifs cette sem.",  val:activeClients,    icon:"🔥",  color:"#E8C87A"},
    {label:"À relancer",        val:inactiveClients,  icon:"⚠️",  color:"#E07070"},
    {label:"Messages total",    val:allMsgsCount,     icon:"💬",  color:"#F0EDE8"},
    {label:"Streak moyen",      val:`${avgStreak}j`,  icon:"⚡",  color:"#5DCAA5"},
    {label:"Renouvellements J28",val:renewalDue,       icon:"🔄",  color:"#C9A84C"},
    {label:"Revenus estimés",   val:`${totalRevenue}€`,icon:"💰",  color:"#E8C87A"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:900,margin:"0 auto",animation:"fadeUp 0.3s ease forwards"}}>
      <div>
        <div style={{fontSize:10,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:6}}>— Tableau de bord</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,color:"#F0EDE8"}}>
          Vue d'ensemble
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {METRICS.map((m,i) => (
          <div key={i} style={{
            background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:14,padding:"16px",
            position:"relative",overflow:"hidden",animation:`fadeUp 0.3s ease ${i*0.05}s both`,
          }}>
            <div style={{position:"absolute",top:0,left:12,right:12,height:2,background:m.color,opacity:0.6,borderRadius:"0 0 2px 2px"}}/>
            <div style={{fontSize:20,marginBottom:10,marginTop:4}}>{m.icon}</div>
            <div style={{fontSize:22,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4}}>{m.val}</div>
            <div style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",color:"#444"}}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Courbe nouvelles inscriptions (7 dernières semaines) */}
      {clients.length >= 3 && (() => {
        const weeks = Array.from({length:7}, (_,i) => {
          const weekStart = now - (6-i)*7*24*3600*1000;
          const weekEnd   = weekStart + 7*24*3600*1000;
          return clients.filter(c => {
            const t = c.createdAt ? new Date(c.createdAt).getTime() : 0;
            return t >= weekStart && t < weekEnd;
          }).length;
        });
        const labels = Array.from({length:7}, (_,i) => {
          const d = new Date(now - (6-i)*7*24*3600*1000);
          return d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
        });
        return (
          <div style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:14,padding:"18px 20px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555"}}>Nouvelles inscriptions</div>
              <div style={{fontSize:11,fontWeight:700,color:"#C9A84C"}}>7 dernières semaines</div>
            </div>
            <MiniSparkline data={weeks} color="#C9A84C"/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{fontSize:9,color:"#333"}}>{labels[0]}</span>
              <span style={{fontSize:9,color:"#333"}}>{labels[3]}</span>
              <span style={{fontSize:9,color:"#333"}}>{labels[6]}</span>
            </div>
          </div>
        );
      })()}

      {/* Répartition plans */}
      <div style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:14,padding:"18px 20px"}}>
        <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:14}}>Répartition des plans</div>
        {Object.entries(plans).sort((a,b)=>b[1]-a[1]).map(([plan,count]) => {
          const color = PLAN_COLORS[plan] || "#555";
          const pct   = Math.round((count/Math.max(clients.length,1))*100);
          return (
            <div key={plan} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <span style={{
                fontSize:9,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",
                color,width:50,flexShrink:0,fontFamily:"'Syne',sans-serif",
              }}>{plan}</span>
              <div style={{flex:1,height:6,background:"#1A1A1A",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",background:color,borderRadius:4,width:`${pct}%`,transition:"width 1.2s ease"}}/>
              </div>
              <span style={{fontSize:11,color:"#F0EDE8",fontWeight:700,width:24,textAlign:"right"}}>{count}</span>
              <span style={{fontSize:10,color:"#444",width:36,textAlign:"right"}}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Clients inactifs */}
      {inactiveClients > 0 && (
        <div style={{background:"rgba(224,112,112,0.04)",border:"0.5px solid rgba(224,112,112,0.2)",borderRadius:14,padding:"16px 18px"}}>
          <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#E07070",marginBottom:12}}>⚠️ Clients inactifs (+7 jours)</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {clients.filter(c => !c.lastActiveDate || (Date.now()-new Date(c.lastActiveDate).getTime())>7*24*3600*1000).slice(0,6).map(c => {
              const d = c.lastActiveDate ? Math.floor((Date.now()-new Date(c.lastActiveDate).getTime())/86400000) : null;
              return (
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(224,112,112,0.08)",border:"1px solid rgba(224,112,112,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#E07070",flexShrink:0}}>
                    {c.nom?.charAt(0)||"?"}
                  </div>
                  <span style={{flex:1,color:"#F0EDE8",fontSize:12,fontWeight:600}}>{c.nom||c.email}</span>
                  <span style={{fontSize:10,color:"#555"}}>{c.plan||"—"}</span>
                  <span style={{fontSize:10,color:"#E07070",fontWeight:700}}>{d===null?"Jamais connecté":`${d}j inactif`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TemplatesView ────────────────────────────────────────────────────────────
const PROGRAM_TEMPLATES = [
  {
    name:"Full Body Débutant",freq:"3×/sem",
    color:"#7AE07A",
    desc:"Programme full body 3 séances par semaine. Squat gobelet, développé incliné, tirage vertical, shoulder press. Progression linéaire sur 4 semaines.",
    preview:"Séance A : Squat gobelet 4×12 / Développé incliné 3×12 / Tirage vertical 4×10 / Gainage 3×45s",
  },
  {
    name:"PPL Intermédiaire",freq:"6×/sem",
    color:"#C9A84C",
    desc:"Push Pull Legs sur 6 séances par semaine. Chest+triceps, Back+biceps, Legs. Adapté aux pratiquants avec 1-3 ans d'expérience.",
    preview:"Lun Push / Mar Pull / Mer Legs / Jeu Push / Ven Pull / Sam Legs",
  },
  {
    name:"Programme Sèche",freq:"4×/sem",
    color:"#5DCAA5",
    desc:"Préservation musculaire en déficit calorique. Volume réduit, intensité maintenue. Cardio optionnel 2×/sem pour accélérer la perte.",
    preview:"Déficit 400 kcal / Protéines 2.2g/kg / Force maintenue / HIIT 2×15min",
  },
  {
    name:"Femme — Fessiers & Cuisses",freq:"3×/sem",
    color:"#E8C87A",
    desc:"3 séances avec focus fessiers et cuisses. Hip thrust, squat gobelet, RDL, fentes, abductions. Adapté débutante à intermédiaire.",
    preview:"Séance A : Hip thrust 4×12 / Squat gobelet 4×12 / RDL 3×12 / Fentes 3×10",
  },
  {
    name:"Force Pure — 5×5",freq:"3×/sem",
    color:"#E07070",
    desc:"StrongLifts 5×5. Squat, développé couché, soulevé de terre, militaire, rowing. +2.5kg par séance. Adapté après 3 mois de base.",
    preview:"Lun: Squat / Développé / Rowing · Mer: Squat / Militaire / Deadlift",
  },
];

function TemplatesView({ onSelect }) {
  const [copied, setCopied] = useState(null);
  const copy = (i, text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(i); setTimeout(() => setCopied(null), 2000);
    }).catch(() => {});
    onSelect(text);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:900,margin:"0 auto",animation:"fadeUp 0.3s ease forwards"}}>
      <div>
        <div style={{fontSize:10,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:6}}>— Bibliothèque</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,color:"#F0EDE8",marginBottom:4}}>
          Templates de programmes
        </div>
        <p style={{fontSize:12,color:"#555",lineHeight:1.7}}>
          Clique sur un template pour le copier dans l'éditeur de message.
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {PROGRAM_TEMPLATES.map((t,i) => (
          <div key={i} style={{
            background:"#0D0D0D",border:`0.5px solid ${copied===i?"rgba(122,224,122,0.4)":"#1A1A1A"}`,
            borderRadius:14,padding:"18px 20px",cursor:"pointer",
            transition:"all 0.2s",animation:`fadeUp 0.3s ease ${i*0.06}s both`,
            position:"relative",overflow:"hidden",
          }}
          onClick={() => copy(i, `Programme : ${t.name}\nFréquence : ${t.freq}\n\n${t.desc}\n\nAperçu :\n${t.preview}\n\nAdapté à ton niveau et tes objectifs définis lors du bilan.`)}
          onMouseEnter={e => e.currentTarget.style.borderColor=t.color}
          onMouseLeave={e => e.currentTarget.style.borderColor=copied===i?"rgba(122,224,122,0.4)":"#1A1A1A"}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:t.color,opacity:0.7}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:700,color:"#F0EDE8",fontFamily:"'Syne',sans-serif"}}>{t.name}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{
                  fontSize:9,letterSpacing:"2px",textTransform:"uppercase",
                  color:t.color,background:`rgba(${t.color==="#7AE07A"?"122,224,122":t.color==="#C9A84C"?"201,168,76":t.color==="#5DCAA5"?"93,202,165":t.color==="#E8C87A"?"232,200,122":"224,112,112"},0.1)`,
                  padding:"3px 10px",borderRadius:20,fontFamily:"'Syne',sans-serif",
                }}>{t.freq}</span>
                <span style={{fontSize:11,color:copied===i?"#7AE07A":"#444",transition:"color 0.2s"}}>
                  {copied===i?"✓ Copié":"→"}
                </span>
              </div>
            </div>
            <p style={{fontSize:13,color:"#555",lineHeight:1.7,marginBottom:12}}>{t.desc}</p>
            <div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#444",fontFamily:"'Courier New',monospace",lineHeight:1.7}}>
              {t.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
