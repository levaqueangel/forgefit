"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp, where, getDoc, getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { RapportHebdo } from "../client/RapportHebdo";
import { ProgrammeManuelEditor } from "./ProgrammeManuelEditor";
import { ClientProgressCharts } from "./ClientProgressCharts";
import { ObjectifsCoach } from "./ObjectifsCoach";
import { StatsView } from "./StatsTab";
import { CommandesView } from "./CommandesTab";
import { TemplatesView } from "./TemplatesTab";

// ── Constantes ─────────────────────────────────────────────────────────────
const COACH_EMAIL = process.env.NEXT_PUBLIC_COACH_EMAIL || "coach.apxfitness11@gmail.com";
const INACTIVE_LIMIT   = 15 * 60 * 1000;
const WARNING_BEFORE   =  2 * 60 * 1000;

const PLAN_COLORS = { starter:"#7AE07A", forge:"#E8B000", elite:"#F5C832" };
const PLAN_BG     = { starter:"rgba(122,224,122,0.08)", forge:"rgba(232,176,0,0.08)", elite:"rgba(232,200,122,0.08)" };

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
      <div style={{fontSize:22,fontWeight:800,letterSpacing:6,marginBottom:"3rem"}}>APXFIT<span style={{color:"#E8B000"}}>NESS</span></div>
      <div style={{width:"100%",maxWidth:360,padding:"0 1rem"}}>
        <div style={{fontSize:10,letterSpacing:"4px",textTransform:"uppercase",color:"#E8B000",marginBottom:"0.75rem"}}>— Interface coach</div>
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
          <button type="submit" disabled={loading} style={{background:loading?"#181818":"linear-gradient(135deg,#E8B000,#C49200)",border:"none",color:"#0A0A0A",padding:"14px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",marginTop:2}}>
            {loading ? "Connexion..." : "Accéder →"}
          </button>
        </form>
        <button onClick={handleReset} disabled={resetLoading || resetSent}
          style={{marginTop:16,background:"none",border:"none",color:resetSent?"#555":"#E8B000",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",cursor:resetSent?"default":"pointer",textDecoration:"underline",width:"100%",textAlign:"center",opacity:resetLoading?0.5:1}}>
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
          border:`0.5px solid ${t.type==="error"?"rgba(200,60,60,0.3)":t.type==="gold"?"rgba(232,176,0,0.4)":"rgba(90,186,90,0.3)"}`,
          borderRadius:24,padding:"9px 18px",display:"flex",alignItems:"center",gap:10,
          fontFamily:"'Syne',sans-serif",fontSize:12,color:"#F0EDE8",
          backdropFilter:"blur(10px)",animation:"toastIn 0.3s ease forwards",
        }}>
          <span style={{color:t.type==="error"?"#E07070":t.type==="gold"?"#F5C832":"#7AE07A",fontSize:14,fontWeight:700}}>
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
        background:isCoach?"rgba(232,176,0,0.1)":"#181818",
        border:`0.5px solid ${isCoach?"rgba(232,176,0,0.3)":"#242424"}`,
        fontSize:13,lineHeight:1.7,
        color:isCoach?"#F5C832":"#C8C4BC",
        borderRadius:isCoach?"14px 14px 4px 14px":"14px 14px 14px 4px",
      }}>{msg.text}</div>
      <span style={{fontSize:10,color:"#555",marginTop:3,fontFamily:"'Syne',sans-serif"}}>
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
  const [activeTab, setActiveTab] = useState("messages"); // messages | stats | programme | commandes

  // Commandes Stripe
  const [orders, setOrders] = useState([]);
  const [activatingOrder, setActivatingOrder] = useState(null); // orderId en cours d'activation

  // Notes
  const [notes, setNotes]           = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Rapport hebdo
  const [showRapport, setShowRapport] = useState(false);

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

  // ── Commandes Stripe ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      const msgs = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      setClientMessages(msgs);
      if (!isFirst) setAllMsgsCount(c => c + snap.docChanges().filter(ch=>ch.type==="added").length);
      isFirst = false;
      // Marquer tous les messages client comme lus à l'ouverture
      snap.docs
        .filter(d => d.data().sender === "client" && !d.data().read)
        .forEach(d => updateDoc(doc(db,"messages",d.id), { read: true }).catch(()=>{}));
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

  // ── Génération programme IA ──────────────────────────────────────────────────
  const [showProgModal, setShowProgModal]     = useState(false);
  const [progMode, setProgMode]               = useState("ia"); // "ia" | "manuel"
  const [progGenerating, setProgGenerating]   = useState(false);
  const [progGenerated, setProgGenerated]     = useState(null); // programmeData généré
  const [progSaving, setProgSaving]           = useState(false);
  const [progForm, setProgForm] = useState({
    objectif:"prise de masse", niveau:"intermédiaire",
    seances_par_semaine:3, duree_semaines:8,
    materiel:"salle complète", blessures:"aucune",
    regime:"standard", age:"", poids:"", taille:"", sexe:"homme",
  });

  const genererProgramme = async () => {
    if (!selectedClient || progGenerating) return;
    setProgGenerating(true);
    setProgGenerated(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/generate-programme", {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({ nom: selectedClient.nom, ...progForm }),
      });
      const data = await res.json();
      if (data.success) {
        setProgGenerated(data.programmeData);
        addToast("Programme généré ✓ — Vérifie et sauvegarde");
      } else {
        addToast(data.error || "Erreur de génération", "error");
      }
    } catch (e) { addToast("Erreur réseau : " + e.message, "error"); }
    setProgGenerating(false);
  };

  const sauvegarderProgrammeManuel = async (programmeData) => {
    if (!selectedClient || progSaving) return;
    setProgSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/save-programme", {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({ clientUid: selectedClient.id, programmeData }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`✅ Programme de ${selectedClient.nom?.split(" ")[0]} sauvegardé !`);
        setShowProgModal(false);
        const snap = await getDoc(doc(db, "clients", selectedClient.id));
        if (snap.exists()) setClientData(snap.data());
      } else {
        addToast(data.error || "Erreur de sauvegarde", "error");
      }
    } catch (e) { addToast("Erreur : " + e.message, "error"); }
    setProgSaving(false);
  };

  const sauvegarderProgramme = async () => {
    if (!selectedClient || !progGenerated || progSaving) return;
    setProgSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/save-programme", {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({
          clientUid: selectedClient.id,
          programmeData: progGenerated,
          profil: { age: progForm.age, genre: progForm.sexe, poids: progForm.poids, taille: progForm.taille },
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`✅ Programme de ${selectedClient.nom?.split(" ")[0]} sauvegardé !`);
        setShowProgModal(false);
        setProgGenerated(null);
        // Rafraîchir clientData
        const snap = await import("firebase/firestore").then(m => m.getDoc(m.doc(db,"clients",selectedClient.id)));
        if (snap.exists()) setClientData(snap.data());
      } else {
        addToast(data.error || "Erreur de sauvegarde", "error");
      }
    } catch (e) { addToast("Erreur : " + e.message, "error"); }
    setProgSaving(false);
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
      const res = await fetch("/api/activate-client", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ nom: nom.trim(), email: email.trim().toLowerCase(), plan }),
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
      <div style={{width:20,height:20,border:"2px solid rgba(232,176,0,0.2)",borderTopColor:"#E8B000",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
    </div>
  );
  if (!user) return <LoginCoach />;

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",height:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        textarea:focus,input:focus{border-color:#E8B000 !important;outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(0.94)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes badgePop{0%{transform:scale(0)}70%{transform:scale(1.3)}100%{transform:scale(1)}}
        .client-row{padding:12px 14px;cursor:pointer;transition:all 0.15s;border-bottom:0.5px solid #0F0F0F;position:relative}
        .client-row:hover{background:#0D0D0D}
        .client-row.active{background:#111;border-left:2px solid #E8B000}
        .tab-pill{background:transparent;border:none;color:#555;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;padding:7px 16px;border-radius:20px;transition:all 0.2s;white-space:nowrap;display:flex;align-items:center;gap:6px}
        .tab-pill.active{background:rgba(232,176,0,0.12);color:#F5C832;border:0.5px solid rgba(232,176,0,0.3)}
        .tab-pill:hover:not(.active){background:rgba(255,255,255,0.04);color:#888}
        .nav-btn{background:transparent;border:0.5px solid #1E1E1E;color:#555;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 14px;cursor:pointer;transition:all 0.2s;border-radius:20px}
        .nav-btn:hover{border-color:#333;color:#888}
        .template-pill{background:#111;border:0.5px solid #1A1A1A;color:#888;font-family:'Syne',sans-serif;font-size:11px;padding:6px 12px;cursor:pointer;transition:all 0.15s;border-radius:20px}
        .template-pill:hover{border-color:#E8B000;color:#F5C832;background:rgba(232,176,0,0.06)}
        .send-btn{background:linear-gradient(135deg,#E8B000,#C49200);border:none;color:#0A0A0A;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
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
          <div style={{background:"#111",border:"0.5px solid #E8B000",padding:"2rem",maxWidth:360,width:"90%",textAlign:"center",borderRadius:14}}>
            <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:14,fontWeight:700,color:"#F5C832",marginBottom:8}}>Inactivité détectée</div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#888",lineHeight:1.7,marginBottom:"1.5rem"}}>
              Tu vas être déconnecté dans <strong style={{color:"#F5C832"}}>2 minutes</strong>.
            </p>
            <button onClick={() => {
              setShowInactiveWarning(false);
              clearTimeout(inactiveTimer.current); clearTimeout(warningTimer.current);
              warningTimer.current  = setTimeout(() => setShowInactiveWarning(true), INACTIVE_LIMIT - WARNING_BEFORE);
              inactiveTimer.current = setTimeout(() => signOut(auth), INACTIVE_LIMIT);
            }} style={{background:"linear-gradient(135deg,#E8B000,#C49200)",border:"none",color:"#0A0A0A",padding:"12px 28px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",borderRadius:20}}>
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
              <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000"}}>— Programme de {selectedClient?.nom}</div>
              <button onClick={()=>setShowEditProg(false)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
            </div>
            <div style={{fontSize:11,color:"#666"}}>Modifie le programme texte. Les séances structurées (JSON) ne sont pas modifiées ici.</div>
            <textarea
              value={editProgText}
              onChange={e=>setEditProgText(e.target.value)}
              style={{flex:1,minHeight:320,background:"#0D0D0D",border:"0.5px solid #242424",color:"#C8C4BC",fontFamily:"'Courier New',monospace",fontSize:12,padding:"14px",resize:"vertical",outline:"none",lineHeight:1.8,borderRadius:4}}
            />
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowEditProg(false)} style={{background:"transparent",border:"0.5px solid #242424",color:"#555",fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"10px 20px",cursor:"pointer",borderRadius:2}}>Annuler</button>
              <button onClick={saveEditedProg} disabled={editProgSaving} style={{background:editProgSaving?"#181818":"linear-gradient(135deg,#E8B000,#C49200)",border:"none",color:"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",padding:"10px 24px",cursor:editProgSaving?"not-allowed":"pointer",borderRadius:2}}>
                {editProgSaving?"Sauvegarde...":"Sauvegarder →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale génération programme IA ──────────────────────────────────── */}
      {showProgModal && selectedClient && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}>
          <div style={{background:"#0D0D0D",border:"0.5px solid #242424",width:"100%",maxWidth:600,borderRadius:8,maxHeight:"95vh",overflowY:"auto"}}>
            {/* Header */}
            <div style={{padding:"20px 24px",borderBottom:"0.5px solid #1A1A1A",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#0D0D0D",zIndex:1}}>
              <div>
                <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000"}}>— Programme</div>
                <div style={{fontSize:15,fontWeight:700,color:"#F0EDE8",fontFamily:"'Syne',sans-serif",marginTop:2}}>{selectedClient.nom}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {/* Toggle IA / Manuel */}
                <div style={{display:"flex",background:"#111",border:"0.5px solid #242424",borderRadius:6,overflow:"hidden"}}>
                  {[{key:"ia",label:"🤖 IA"},{key:"manuel",label:"✏️ Manuel"}].map(m => (
                    <button key={m.key} onClick={() => { setProgMode(m.key); setProgGenerated(null); }}
                      style={{background:progMode===m.key?"rgba(232,176,0,0.15)":"none",border:"none",
                        color:progMode===m.key?"#E8B000":"#555",padding:"6px 12px",
                        fontSize:11,fontFamily:"'Syne',sans-serif",cursor:"pointer",
                        borderRight:m.key==="ia"?"0.5px solid #242424":"none"}}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowProgModal(false); setProgGenerated(null); }} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:20}}>×</button>
              </div>
            </div>

            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>

              {/* ── Mode Manuel ─────────────────────────────────────────────── */}
              {progMode === "manuel" && (
                <ProgrammeManuelEditor
                  clientNom={selectedClient.nom}
                  onSave={sauvegarderProgrammeManuel}
                  saving={progSaving}
                />
              )}

              {/* ── Mode IA ─────────────────────────────────────────────────── */}
              {/* Formulaire profil */}
              {progMode === "ia" && !progGenerated && (
                <>
                  <div style={{fontSize:10,color:"#555",letterSpacing:"2px",textTransform:"uppercase"}}>— Profil client</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {label:"Sexe", key:"sexe", type:"select", options:["homme","femme"]},
                      {label:"Âge", key:"age", type:"number", placeholder:"Ex: 28"},
                      {label:"Poids (kg)", key:"poids", type:"number", placeholder:"Ex: 80"},
                      {label:"Taille (cm)", key:"taille", type:"number", placeholder:"Ex: 178"},
                    ].map(f => (
                      <div key={f.key}>
                        <div style={{fontSize:10,color:"#555",marginBottom:4}}>{f.label}</div>
                        {f.type === "select" ? (
                          <select value={progForm[f.key]} onChange={e => setProgForm(p=>({...p,[f.key]:e.target.value}))}
                            style={{width:"100%",background:"#111",border:"0.5px solid #242424",color:"#F0EDE8",padding:"8px 10px",borderRadius:6,fontSize:12,outline:"none"}}>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} value={progForm[f.key]} placeholder={f.placeholder}
                            onChange={e => setProgForm(p=>({...p,[f.key]:e.target.value}))}
                            style={{width:"100%",boxSizing:"border-box",background:"#111",border:"0.5px solid #242424",color:"#F0EDE8",padding:"8px 10px",borderRadius:6,fontSize:12,outline:"none"}} />
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{fontSize:10,color:"#555",letterSpacing:"2px",textTransform:"uppercase",marginTop:4}}>— Programme</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {label:"Objectif", key:"objectif", type:"select", options:["prise de masse","perte de poids","remise en forme","force","endurance","sèche"]},
                      {label:"Niveau", key:"niveau", type:"select", options:["débutant","intermédiaire","avancé"]},
                      {label:"Séances/semaine", key:"seances_par_semaine", type:"select", options:[2,3,4,5,6]},
                      {label:"Durée (semaines)", key:"duree_semaines", type:"select", options:[4,6,8,12,16]},
                      {label:"Matériel", key:"materiel", type:"select", options:["salle complète","haltères seulement","maison sans matériel","crossfit","haltères + barre"]},
                      {label:"Régime", key:"regime", type:"select", options:["standard","végétarien","végétalien","sans gluten","prise de masse","keto"]},
                    ].map(f => (
                      <div key={f.key}>
                        <div style={{fontSize:10,color:"#555",marginBottom:4}}>{f.label}</div>
                        <select value={progForm[f.key]} onChange={e => setProgForm(p=>({...p,[f.key]:e.target.value}))}
                          style={{width:"100%",background:"#111",border:"0.5px solid #242424",color:"#F0EDE8",padding:"8px 10px",borderRadius:6,fontSize:12,outline:"none"}}>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{fontSize:10,color:"#555",marginBottom:4}}>Blessures / contre-indications</div>
                    <input value={progForm.blessures} onChange={e => setProgForm(p=>({...p,blessures:e.target.value}))}
                      placeholder="Ex: douleur épaule droite, pas de squat lourd"
                      style={{width:"100%",boxSizing:"border-box",background:"#111",border:"0.5px solid #242424",color:"#F0EDE8",padding:"8px 10px",borderRadius:6,fontSize:12,outline:"none"}} />
                  </div>

                  <button onClick={genererProgramme} disabled={progGenerating} style={{
                    background:progGenerating?"#181818":"linear-gradient(135deg,#E8B000,#C49200)",
                    border:"none",color:"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,
                    letterSpacing:"2px",textTransform:"uppercase",padding:"14px",cursor:progGenerating?"not-allowed":"pointer",
                    borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  }}>
                    {progGenerating ? (
                      <>
                        <div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#E8B000",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                        Génération en cours (15-30s)...
                      </>
                    ) : "🤖 Générer le programme avec l'IA"}
                  </button>
                </>
              )}

              {/* Aperçu du programme généré (mode IA uniquement) */}
              {progMode === "ia" && progGenerated && (
                <>
                  <div style={{background:"rgba(122,224,122,0.06)",border:"0.5px solid rgba(122,224,122,0.2)",borderRadius:8,padding:"12px 16px"}}>
                    <div style={{fontSize:10,color:"#7AE07A",letterSpacing:"2px",textTransform:"uppercase",marginBottom:6}}>✓ Programme généré</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#F0EDE8",fontFamily:"'Syne',sans-serif"}}>{progGenerated.objectif_principal}</div>
                    <div style={{fontSize:12,color:"#555",marginTop:4}}>
                      {progGenerated.seances_par_semaine} séances/sem · {progGenerated.duree_programme_semaines} semaines · niveau {progGenerated.niveau}
                    </div>
                  </div>

                  {/* Macros */}
                  {progGenerated.nutrition && (
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                      {[
                        {l:"Calories",v:progGenerated.nutrition.calories_jour,u:"kcal",c:"#E8B000"},
                        {l:"Protéines",v:progGenerated.nutrition.proteines_g,u:"g",c:"#7AE07A"},
                        {l:"Glucides",v:progGenerated.nutrition.glucides_g,u:"g",c:"#5DCAA5"},
                        {l:"Lipides",v:progGenerated.nutrition.lipides_g,u:"g",c:"#E07070"},
                      ].map(m => (
                        <div key={m.l} style={{background:"#111",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                          <div style={{fontSize:16,fontWeight:700,color:m.c}}>{m.v}</div>
                          <div style={{fontSize:9,color:"#555",textTransform:"uppercase"}}>{m.u}</div>
                          <div style={{fontSize:9,color:"#333",marginTop:2}}>{m.l}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Séances */}
                  <div style={{fontSize:10,color:"#555",letterSpacing:"2px",textTransform:"uppercase"}}>— Séances ({progGenerated.seances?.length})</div>
                  {progGenerated.seances?.map((s,i) => (
                    <div key={i} style={{background:"#111",border:"0.5px solid #1A1A1A",borderRadius:8,padding:"12px 16px"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#F0EDE8",marginBottom:4}}>{s.nom}</div>
                      <div style={{fontSize:10,color:"#555",marginBottom:8}}>{s.jour_type} · {s.duree_min} min · semaines {s.semaines}</div>
                      {s.exercices?.map((e,j) => (
                        <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid #1A1A1A",fontSize:11}}>
                          <span style={{color:"#888"}}>{e.nom}</span>
                          <span style={{color:"#E8B000",fontFamily:"'Syne',sans-serif",fontWeight:700}}>{e.series}×{e.reps}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  {progGenerated.conseils_generaux && (
                    <div style={{background:"#111",borderRadius:8,padding:"12px 16px"}}>
                      <div style={{fontSize:10,color:"#E8B000",letterSpacing:"2px",textTransform:"uppercase",marginBottom:6}}>— Conseils</div>
                      <div style={{fontSize:12,color:"#666",lineHeight:1.7}}>{progGenerated.conseils_generaux}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{display:"flex",gap:10,marginTop:4}}>
                    <button onClick={() => { setProgGenerated(null); }} style={{
                      flex:1,background:"transparent",border:"0.5px solid #333",color:"#555",
                      fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"2px",
                      textTransform:"uppercase",padding:"12px",cursor:"pointer",borderRadius:6,
                    }}>
                      ↺ Régénérer
                    </button>
                    <button onClick={sauvegarderProgramme} disabled={progSaving} style={{
                      flex:2,background:progSaving?"#181818":"linear-gradient(135deg,#7AE07A,#5AB85A)",
                      border:"none",color:"#0A0A0A",fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,
                      letterSpacing:"2px",textTransform:"uppercase",padding:"12px",cursor:progSaving?"not-allowed":"pointer",borderRadius:6,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    }}>
                      {progSaving ? "Sauvegarde..." : "✓ Sauvegarder dans l'espace client"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Nav principale ─────────────────────────────────────────────────── */}
      <nav style={{display:"flex",alignItems:"center",gap:12,padding:"10px 20px",borderBottom:"0.5px solid #1A1A1A",background:"rgba(10,10,10,0.98)",backdropFilter:"blur(12px)",flexShrink:0,zIndex:50}}>
        {/* Logo */}
        <div style={{fontSize:16,fontWeight:800,letterSpacing:5,cursor:"pointer",marginRight:8}} onClick={() => router.push("/")}>
          APXFIT<span style={{color:"#E8B000"}}>NESS</span>
        </div>
        <div style={{width:1,height:18,background:"#1E1E1E"}}/>
        <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#E8B000",paddingLeft:8}}>Coach</div>

        {/* Onglets */}
        <div style={{display:"flex",gap:4,marginLeft:16}}>
          {[
            ["messages",  "💬", `Messages${totalUnread > 0 ? ` (${totalUnread})` : ""}`, null],
            ["commandes", "💳", "Commandes", orders.filter(o => !o.clientActivated).length || null],
            ["stats",     "📊", "Statistiques", null],
            ["programme", "📋", "Templates", null],
          ].map(([tab, icon, label, badge]) => (
            <button key={tab} className={`tab-pill${activeTab===tab?" active":""}`} onClick={() => setActiveTab(tab)}>
              <span>{icon}</span> {label}
              {tab==="messages" && totalUnread > 0 && (
                <span style={{background:"#E8B000",color:"#0A0A0A",fontSize:9,fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",animation:"badgePop 0.3s ease",flexShrink:0}}>
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
              {tab==="commandes" && badge > 0 && (
                <span style={{background:"#E07070",color:"#fff",fontSize:9,fontWeight:700,minWidth:16,height:16,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",flexShrink:0}}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions droite */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:"#777",letterSpacing:"1px"}}>
            {clients.length} client{clients.length > 1 ? "s" : ""}
          </span>
          <button className="nav-btn" onClick={() => setShowAddClient(true)}>
            ➕ Client
          </button>
          <button className="nav-btn" onClick={exportCSV} disabled={exporting}>
            {exporting ? <span style={{width:10,height:10,border:"1.5px solid #333",borderTopColor:"#E8B000",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/> : "⬇️"} CSV
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
                      background:clientFilter===val?`rgba(${val==="starter"?"122,224,122":val==="forge"?"232,176,0":val==="elite"?"232,200,122":"232,176,0"},0.12)`:"transparent",
                      border:`0.5px solid ${clientFilter===val?PLAN_COLORS[val]||"#E8B000":"#1E1E1E"}`,
                      color:clientFilter===val?PLAN_COLORS[val]||"#E8B000":"#555",
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
                <div style={{fontSize:10,color:"#666",letterSpacing:"1.5px",textTransform:"uppercase"}}>
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
                      onClick={() => { setSelectedClient(client); setShowRapport(false); }}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {/* Avatar */}
                        <div style={{
                          width:34,height:34,borderRadius:"50%",flexShrink:0,
                          background:`rgba(${planColor==="#7AE07A"?"122,224,122":planColor==="#E8B000"?"232,176,0":"232,200,122"},0.12)`,
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
                            <span style={{fontSize:12,fontWeight:700,color:isActive?"#F5C832":"#F0EDE8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {client.nom || client.email}
                            </span>
                            {unread > 0 && (
                              <span style={{background:"#E8B000",color:"#0A0A0A",fontSize:9,fontWeight:700,minWidth:16,height:16,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",animation:"badgePop 0.3s ease",flexShrink:0}}>
                                {unread}
                              </span>
                            )}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{
                              fontSize:8,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",
                              color:planColor,background:`rgba(${planColor==="#7AE07A"?"122,224,122":planColor==="#E8B000"?"232,176,0":"232,200,122"},0.1)`,
                              padding:"1px 6px",borderRadius:6,
                            }}>{client.plan || "—"}</span>
                            <span style={{fontSize:10,color:isInactive?"#E07070":"#444",display:"flex",alignItems:"center",gap:3}}>
                              <span style={{width:5,height:5,borderRadius:"50%",background:isInactive?"#E07070":daysInact===0?"#7AE07A":"#444",flexShrink:0,display:"inline-block"}}/>
                              {daysInact === null ? "jamais" : daysInact === 0 ? "auj." : `${daysInact}j`}
                            </span>
                            {client.streakDays > 0 && (
                              <span style={{fontSize:10,color:"#E8B000"}}>🔥{client.streakDays}</span>
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
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,color:"#555"}}>
                <div style={{fontSize:48}}>💬</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:"#888"}}>
                  Sélectionne un client
                </div>
                <div style={{fontSize:11,color:"#555",letterSpacing:"2px",textTransform:"uppercase"}}>
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
                      background:"rgba(232,176,0,0.1)",border:"1.5px solid #E8B000",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:15,fontWeight:700,color:"#E8B000",flexShrink:0,
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
                      <div style={{fontSize:11,color:"#666",letterSpacing:"0.5px"}}>
                        {selectedClient.email}
                        {selectedClient.createdAt && ` · Client depuis le ${new Date(selectedClient.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}`}
                      </div>
                    </div>
                    {/* Indicateurs rapides */}
                    <div style={{display:"flex",gap:10,flexShrink:0}}>
                      {clientData?.streakDays > 0 && (
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:14,fontWeight:700,color:"#E8B000"}}>🔥{clientData.streakDays}</div>
                          <div style={{fontSize:9,color:"#666",letterSpacing:"1px",textTransform:"uppercase"}}>streak</div>
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
                      <div style={{textAlign:"center",padding:"3rem 2rem",color:"#666",fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontStyle:"italic",lineHeight:1.7}}>
                        Pas encore de messages avec {selectedClient.nom?.split(" ")[0]}.<br/>
                        Envoie un message de bienvenue !
                      </div>
                    ) : (
                      <>
                        {clientMessages.map(msg => <Bubble key={msg.id} msg={msg}/>)}
                        {isTyping && (
                          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
                            <div style={{padding:"8px 14px",background:"rgba(232,176,0,0.06)",border:"0.5px solid rgba(232,176,0,0.15)",borderRadius:"14px 14px 4px 14px",display:"flex",gap:4,alignItems:"center"}}>
                              {[0,1,2].map(i => (
                                <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#E8B000",opacity:0.5,animation:`pulse 1s ease ${i*0.2}s infinite`}}/>
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
                      <div style={{width:"100%",fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#666",marginBottom:4}}>Réponses rapides</div>
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
                      style={{background:showTemplates?"rgba(232,176,0,0.1)":"transparent",border:`0.5px solid ${showTemplates?"rgba(232,176,0,0.35)":"#1E1E1E"}`,color:showTemplates?"#E8B000":"#444",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:14,transition:"all 0.2s",flexShrink:0}}>
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
                    <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:10}}>Données client</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {[
                        {label:"Streak",    val:clientData?.streakDays>0?`${clientData.streakDays}j`:"0j",    color:"#E8B000"},
                        {label:"Calories",  val:clientData?.programmeData?.nutrition?.calories_jour?`${clientData.programmeData.nutrition.calories_jour}`:clientData?.nutrition?.calories_jour?`${clientData.nutrition.calories_jour} kcal`:"—", color:"#7AE07A"},
                        {label:"Séances",   val:clientData?.programmeData?.seances_par_semaine?`${clientData.programmeData.seances_par_semaine}/sem`:"—", color:"#5DCAA5"},
                        {label:"Durée",     val:clientData?.programmeData?.duree_programme_semaines?`${clientData.programmeData.duree_programme_semaines}W`:"—", color:"#F5C832"},
                        {label:"Check-in",  val:clientData?.lastCheckinResponse||"—", color:"#5DCAA5"},
                      ].map((s,i) => (
                        <div key={i} className="stat-card">
                          <div style={{position:"absolute",top:0,left:8,right:8,height:2,background:s.color,opacity:0.6,borderRadius:"0 0 2px 2px"}}/>
                          <div style={{fontSize:16,fontWeight:700,color:s.color,marginTop:4}}>{s.val}</div>
                          <div style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",color:"#666",marginTop:2}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Programme aperçu */}
                  {clientData?.programmeData && (
                    <div style={{padding:"12px 14px",borderBottom:"0.5px solid #1A1A1A",flexShrink:0}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#555"}}>Programme</div>
                        <button onClick={()=>{ setEditProgText(clientData?.programme||""); setShowEditProg(true); }} style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",background:"rgba(232,176,0,0.08)",border:"0.5px solid rgba(232,176,0,0.2)",color:"#E8B000",padding:"3px 10px",cursor:"pointer",borderRadius:10,fontFamily:"'Syne',sans-serif",transition:"all 0.2s"}}>✏️ Modifier</button>
                      </div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"#888",lineHeight:1.7}}>
                        {clientData.programmeData.objectif_principal}
                      </div>
                      {clientData.programmeData.nutrition && (
                        <div style={{display:"flex",gap:6,marginTop:8}}>
                          {[
                            {k:"P",v:`${clientData.programmeData.nutrition.proteines_g}g`,c:"#7AE07A"},
                            {k:"G",v:`${clientData.programmeData.nutrition.glucides_g}g`,c:"#E8B000"},
                            {k:"L",v:`${clientData.programmeData.nutrition.lipides_g}g`,c:"#5DCAA5"},
                          ].map((m,i) => (
                            <span key={i} style={{fontSize:10,color:m.c,background:`rgba(${m.c==="#7AE07A"?"122,224,122":m.c==="#E8B000"?"232,176,0":"93,202,165"},0.08)`,padding:"2px 8px",borderRadius:10,fontWeight:700}}>
                              {m.k} {m.v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bouton programme IA */}
                  <div style={{padding:"8px 14px 4px"}}>
                    <button onClick={() => setShowProgModal(true)} style={{
                      width:"100%", background:"linear-gradient(135deg,rgba(232,176,0,0.12),rgba(232,176,0,0.06))",
                      border:"0.5px solid rgba(232,176,0,0.4)", color:"#E8B000",
                      fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
                      letterSpacing:"1.5px", textTransform:"uppercase",
                      padding:"10px 0", cursor:"pointer", transition:"all 0.15s",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    }}>
                      🤖 Générer programme IA
                    </button>
                  </div>

                  {/* Rapport hebdomadaire */}
                  <div style={{padding:"4px 14px 8px"}}>
                    <button onClick={() => setShowRapport(true)} style={{
                      width:"100%", background:"rgba(232,176,0,0.06)",
                      border:"0.5px solid rgba(232,176,0,0.25)", color:"#E8B000",
                      fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
                      letterSpacing:"1.5px", textTransform:"uppercase",
                      padding:"10px 0", cursor:"pointer", transition:"all 0.15s",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    }}>
                      📊 Bilan de la semaine
                    </button>
                  </div>

                  {/* Modal rapport */}
                  {showRapport && selectedClient && (
                    <div style={{
                      position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
                      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center",
                      padding:16,
                    }} onClick={e => e.target === e.currentTarget && setShowRapport(false)}>
                      <div style={{
                        background:"#0D0D0D", border:"0.5px solid #1A1A1A",
                        width:"100%", maxWidth:520, maxHeight:"90vh",
                        overflow:"hidden", display:"flex", flexDirection:"column",
                      }}>
                        <RapportHebdo
                          clientId={selectedClient.id}
                          user={user}
                          isCoach={true}
                          onClose={() => setShowRapport(false)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Objectifs semaine */}
                  <ObjectifsCoach clientId={selectedClient?.id} token={user?.getIdToken} addToast={addToast} />

                  {/* Graphiques progression */}
                  <ClientProgressCharts clientId={selectedClient?.id} />

                  {/* Alerte adaptation programme */}
                  {(() => {
                    const ratings = clientData?.sessionRatings || [];
                    const last7 = ratings.filter(r => new Date(r.date) > new Date(Date.now() - 7*86400000));
                    const tooHard = last7.filter(r => r.difficulte >= 4).length;
                    const tooEasy = last7.filter(r => r.difficulte <= 2).length;
                    if (tooHard >= 3 || tooEasy >= 3) {
                      return (
                        <div style={{margin:"8px 14px",padding:"10px 12px",background:"rgba(232,176,0,0.06)",border:"0.5px solid rgba(232,176,0,0.3)",borderRadius:10}}>
                          <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#E8B000",marginBottom:4}}>⚡ Suggestion adaptation</div>
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
                        background:notesSaved?"rgba(122,224,122,0.08)":"rgba(232,176,0,0.08)",
                        border:`0.5px solid ${notesSaved?"rgba(122,224,122,0.3)":"rgba(232,176,0,0.2)"}`,
                        color:notesSaved?"#7AE07A":"#E8B000",
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

        {/* ── TAB COMMANDES ─────────────────────────────────────────────── */}
        {activeTab === "commandes" && (
          <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
            <CommandesView
              orders={orders}
              clients={clients}
              user={user}
              activatingOrder={activatingOrder}
              setActivatingOrder={setActivatingOrder}
              addToast={addToast}
            />
          </div>
        )}

      </div>
    </div>
  );
}

// ── Composants extraits ──────────────────────────────────────────────────────
// ObjectifsCoach → ObjectifsCoach.js
// MiniSparkline + StatsView → StatsTab.js
// CommandesView → CommandesTab.js
// TemplatesView → TemplatesTab.js
// (tous importés en haut du fichier)

