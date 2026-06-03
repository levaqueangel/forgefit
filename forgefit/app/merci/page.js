"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "../useLang";

const TRANSLATIONS = {
  fr: {
    badge: "Plan {plan} — Activé",
    welcome: "Bienvenue {prenom} !",
    welcome_no_name: "Bienvenue !",
    subtitle: "C est parti.",
    lead: "Ton achat est confirmé. Voici ce qui se passe maintenant.",
    steps: [
      ["✓",  "Paiement confirmé",       "Ta commande est enregistrée."],
      ["⚡", "Programme en génération", "L IA calibre ton programme sur mesure."],
      ["📧", "Email envoyé",            "Tes identifiants arrivent sur {email}."],
      ["🚀", "Ton espace est prêt",     "Tu peux accéder à ton programme dès maintenant."],
    ],
    access_cta: "Accéder à mon espace →",
    bilan_cta: "Compléter mon bilan",
    recap_title: "Récapitulatif",
    recap: [["Plan","{plan}"],["Email","{email}"],["Accès","Immédiat via /client"],["Support","levaqueangel@gmail.com"]],
  },
  en: {
    badge: "{plan} Plan — Activated",
    welcome: "Welcome {prenom}!",
    welcome_no_name: "Welcome!",
    subtitle: "Let's go.",
    lead: "Your purchase is confirmed. Here is what happens next.",
    steps: [
      ["✓",  "Payment confirmed",      "Your order has been recorded."],
      ["⚡", "Programme generating",   "AI is calibrating your custom plan."],
      ["📧", "Email sent",             "Your credentials are on their way to {email}."],
      ["🚀", "Your space is ready",    "You can access your programme right now."],
    ],
    access_cta: "Access my space →",
    bilan_cta: "Complete my assessment",
    recap_title: "Summary",
    recap: [["Plan","{plan}"],["Email","{email}"],["Access","Immediate via /client"],["Support","levaqueangel@gmail.com"]],
  },
  de: {
    badge: "Plan {plan} — Aktiviert",
    welcome: "Willkommen {prenom}!",
    welcome_no_name: "Willkommen!",
    subtitle: "Los geht es.",
    lead: "Dein Kauf wurde bestätigt. Hier ist, was als nächstes passiert.",
    steps: [
      ["✓",  "Zahlung bestätigt",      "Deine Bestellung wurde erfasst."],
      ["⚡", "Programm wird erstellt", "KI kalibriert deinen persönlichen Plan."],
      ["📧", "E-Mail gesendet",        "Deine Zugangsdaten gehen an {email}."],
      ["🚀", "Dein Bereich ist bereit","Du kannst jetzt auf dein Programm zugreifen."],
    ],
    access_cta: "Zu meinem Bereich →",
    bilan_cta: "Assessment ausfüllen",
    recap_title: "Zusammenfassung",
    recap: [["Plan","{plan}"],["E-Mail","{email}"],["Zugang","Sofort über /client"],["Support","levaqueangel@gmail.com"]],
  },
  es: {
    badge: "Plan {plan} — Activado",
    welcome: "¡Bienvenido {prenom}!",
    welcome_no_name: "¡Bienvenido!",
    subtitle: "¡Vamos!",
    lead: "Tu compra está confirmada. Esto es lo que sucede ahora.",
    steps: [
      ["✓",  "Pago confirmado",        "Tu pedido ha sido registrado."],
      ["⚡", "Programa generándose",   "La IA calibra tu plan personalizado."],
      ["📧", "Email enviado",          "Tus credenciales llegan a {email}."],
      ["🚀", "Tu espacio está listo",  "Puedes acceder a tu programa ahora."],
    ],
    access_cta: "Acceder a mi espacio →",
    bilan_cta: "Completar mi evaluación",
    recap_title: "Resumen",
    recap: [["Plan","{plan}"],["Email","{email}"],["Acceso","Inmediato via /client"],["Soporte","levaqueangel@gmail.com"]],
  },
};

function MerciContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { lang } = useLang();
  const plan   = params.get("plan") || "forge";
  const prenom = params.get("prenom") || "";
  const email  = params.get("email") || "";
  const [step, setStep] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStep(s => { if (s >= 3) { clearInterval(intervalRef.current); return s; } return s + 1; });
    }, 600);
    return () => clearInterval(intervalRef.current);
  }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  const fill = (str) => str.replace("{plan}", plan.charAt(0).toUpperCase()+plan.slice(1))
                            .replace("{prenom}", prenom)
                            .replace("{email}", email || "ton email");

  const PLAN_COLORS = { starter:"#7AE07A", forge:"#C9A84C", elite:"#E8C87A" };
  const planColor = PLAN_COLORS[plan.toLowerCase()] || "#C9A84C";

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh",
      fontFamily:"'Syne',sans-serif", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"2rem",
      textAlign:"center", position:"relative", overflow:"hidden" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .a1{animation:fadeUp 0.5s ease 0.1s both}.a2{animation:fadeUp 0.5s ease 0.3s both}
        .a3{animation:fadeUp 0.5s ease 0.5s both}.a4{animation:fadeUp 0.5s ease 0.7s both}
        .btn-cta{background:linear-gradient(135deg,#C9A84C,#A67C2E);border:none;color:#0A0A0A;padding:16px 40px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer}
        .btn-sec{background:transparent;border:0.5px solid #242424;color:#555;padding:14px 28px;font-family:'Syne',sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer}
      `}</style>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.06) 0%, transparent 60%)`, pointerEvents:"none" }}/>
      <div style={{ position:"relative", zIndex:1, maxWidth:540, width:"100%" }}>
        <div className="a1" style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:"2rem",
          background:"rgba(201,168,76,0.1)", border:`0.5px solid ${planColor}`, padding:"6px 18px" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:planColor }}/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:planColor }}>
            {fill(t.badge)}
          </span>
        </div>
        <div className="a2" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,6vw,60px)", fontWeight:600, lineHeight:1.05, marginBottom:"0.75rem" }}>
          {prenom ? fill(t.welcome) : t.welcome_no_name}<br/>
          <em style={{ fontStyle:"italic", color:planColor }}>{t.subtitle}</em>
        </div>
        <div className="a2" style={{ width:48, height:1, background:`linear-gradient(90deg,${planColor},transparent)`, margin:"0 auto 1.5rem" }}/>
        <p className="a3" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", lineHeight:1.9, marginBottom:"2.5rem" }}>
          {t.lead}
        </p>
        <div className="a3" style={{ background:"#0D0D0D", border:"0.5px solid #1A1A1A", padding:"6px 20px", marginBottom:"2.5rem", textAlign:"left" }}>
          {t.steps.map(([icon, label, desc], i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:16, padding:"14px 0",
              borderBottom:i<3?"0.5px solid #111":"none", opacity:step>i?1:0.2, transition:"opacity 0.4s" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
                background:step>i?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.03)",
                border:`1.5px solid ${step>i?planColor:"#1A1A1A"}`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, transition:"all 0.4s" }}>
                {step>i ? icon : i===step ? <div style={{ width:12, height:12, border:`2px solid ${planColor}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/> : <div style={{ width:8, height:8, borderRadius:"50%", background:"#1A1A1A" }}/>}
              </div>
              <div style={{ paddingTop:4 }}>
                <div style={{ fontSize:13, fontWeight:700, color:step>i?"#F0EDE8":"#333", marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:12, color:step>i?"#555":"#222" }}>{fill(desc)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="a4" style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:"3rem" }}>
          <button className="btn-cta" onClick={() => router.push("/client")}>{t.access_cta}</button>
          <button className="btn-sec" onClick={() => router.push("/bilan")}>{t.bilan_cta}</button>
        </div>
        <div className="a4" style={{ background:"rgba(255,255,255,0.02)", border:"0.5px solid #1A1A1A", padding:"16px 20px", textAlign:"left" }}>
          <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#444", marginBottom:12 }}>{t.recap_title}</div>
          {t.recap.map(([k, v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:11, color:"#444", letterSpacing:"1px", textTransform:"uppercase" }}>{k}</span>
              <span style={{ fontSize:12, color:"#F0EDE8", fontWeight:600 }}>{fill(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MerciPage() {
  return (
    <Suspense fallback={<div style={{ background:"#0A0A0A", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ width:20, height:20, border:"2px solid rgba(201,168,76,0.2)", borderTopColor:"#C9A84C", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/></div>}>
      <MerciContent />
    </Suspense>
  );
}
