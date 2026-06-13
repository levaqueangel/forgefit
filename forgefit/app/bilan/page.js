"use client";
import { trackEvent } from "../GoogleAnalytics";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 13px", border: `0.5px solid ${active ? "#E8B000" : "#242424"}`,
      borderRadius: 2, fontSize: 12, cursor: "pointer",
      background: active ? "rgba(232,176,0,0.1)" : "transparent",
      color: active ? "#F5C832" : "#888",
      fontFamily: "'Syne',sans-serif", fontWeight: active ? 600 : 400,
      letterSpacing: "0.3px", transition: "all 0.15s",
    }}>{label}</button>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 7 }}>{children}</div>;
}

function Spinner() {
  return <span style={{ width: 14, height: 14, border: "2px solid #242424", borderTopColor: "#E8B000", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

function GoldBtn({ onClick, disabled, loading, children, ghost }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      padding: "13px 28px", border: `0.5px solid ${ghost ? "#242424" : "#E8B000"}`,
      background: ghost ? "transparent" : (disabled || loading) ? "#181818" : "linear-gradient(135deg,#E8B000,#C49200)",
      color: ghost ? "#555" : (disabled || loading) ? "#555" : "#0A0A0A",
      fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
      letterSpacing: "3px", textTransform: "uppercase",
      cursor: (disabled || loading) ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {loading && <Spinner />}{children}
    </button>
  );
}

function BilanForm() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("plan") || "forge";
  const price = params.get("price") || "129";
  const { lang, setLang, t, LANGS } = useLang();
  const tb = t.bilan;

  const [step, setStep] = useState(1);
  const [billing, setBilling] = useState("annual");
  const [form, setForm] = useState({ prenom: "", age: "", email: "", genre: "", poids: "", taille: "", contraintes: "", motivation: "" });
  const [sel, setSel] = useState({});
  const [prog, setProg] = useState("");
  const [progData, setProgData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");
  const [clientCreated, setClientCreated] = useState(null); // null=pending, true=ok, false=erreur
  const [fieldErrors, setFieldErrors] = useState({});

  const inp = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const pick = (k, v) => setSel(s => ({ ...s, [k]: v }));
  const pct = Math.round((step / 5) * 100);

  // Tracker les étapes clés du bilan pour GA4
  const prevStep = useRef(0);
  useEffect(() => {
    if (step > prevStep.current) {
      try { trackEvent("bilan_step", { step, plan: sel.plan || "unknown" }); } catch {}
      prevStep.current = step;
    }
  }, [step]);

  // Charger le script reCAPTCHA v3 une seule fois
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || document.getElementById("recaptcha-script")) return;
    const script = document.createElement("script");
    script.id = "recaptcha-script";
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // ── Persistance locale du formulaire ─────────────────────────────
  // Restaurer la progression au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apx_bilan_progress");
      if (!saved) return;
      const { form: f, sel: s, step: st } = JSON.parse(saved);
      if (f) setForm(prev => ({ ...prev, ...f }));
      if (s) setSel(s);
      if (st && st >= 1 && st <= 4) setStep(st);
    } catch {}
  }, []);

  // Sauvegarder à chaque changement (sauf étape finale)
  useEffect(() => {
    if (status === "done") {
      try { localStorage.removeItem("apx_bilan_progress"); } catch {}
      return;
    }
    if (step >= 1 && step <= 4) {
      try {
        localStorage.setItem("apx_bilan_progress", JSON.stringify({ form, sel, step }));
      } catch {}
    }
  }, [form, sel, step, status]);

  const inputStyle = {
    width: "100%", background: "#111", border: "0.5px solid #242424",
    color: "#F0EDE8", fontFamily: "'Syne',sans-serif", fontSize: 13,
    padding: "10px 14px", outline: "none", borderRadius: 0,
  };

  async function getRecaptchaToken() {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return null;
    return new Promise((resolve) => {
      if (window.grecaptcha?.ready) {
        window.grecaptcha.ready(() =>
          window.grecaptcha.execute(siteKey, { action: "bilan_generate" })
            .then(resolve).catch(() => resolve(null))
        );
      } else {
        resolve(null);
      }
    });
  }

  async function handleGenerate() {
    setStatus("generating"); setErrMsg(""); setProg("");
    try {
      const recaptchaToken = await getRecaptchaToken();
      const genRes = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...sel, plan: planId, lang, recaptchaToken }),
      });
      const genData = await genRes.json();
      if (genData.error) throw new Error(genData.error);
      setProg(genData.programme);
      setProgData(genData.programmeData || null);
      setStatus("sending");
      // Envoyer l'email programme
      const mailRes = await fetch("/api/send-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: form.email, nom: form.prenom, plan: planId, programme: genData.programme }),
      });
      const mailData = await mailRes.json();
      if (mailData.error) throw new Error(mailData.error);
      // Créer le compte client + envoyer les identifiants
      try {
        const clientRes = await fetch("/api/create-client", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, nom: form.prenom, plan: planId, billing, programme: genData.programme, programmeData: genData.programmeData || null, telephone: form.telephone || null }),
        });
        const clientData = await clientRes.json();
        setClientCreated(clientData.success === true);
      } catch {
        setClientCreated(false);
      }
      setStatus("done"); setStep(5);
      try { localStorage.removeItem("apx_bilan_progress"); } catch {}
      // Supprimer l'abandon car le bilan est terminé
      if (form.email) {
        fetch("/api/save-abandon", {
          method:"DELETE", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ email: form.email }),
        }).catch(()=>{});
      }
      try { trackEvent("bilan_complete", { plan: planId || "unknown", nom: form.prenom }); } catch {}
    } catch (e) {
      setErrMsg(e.message); setStatus("error");
    }
  }

  const chipBlock = (key, label) => (
    <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424" }}>
      <Label>{label}</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
        {tb.chips[key].map(v => <Chip key={v} label={v} active={sel[key] === v} onClick={() => pick(key, v)} />)}
      </div>
    </div>
  );

  const PLAN_INFO = {
    starter: { name:"Starter", monthly:18.99, annual:189.90, features:["Programme musculation personnalisé","Plan nutrition + macros","Bilan en ligne complet","Livraison par email en 48h"] },
    forge:   { name:"Forge",   monthly:38.99, annual:389.90, features:["Programme musculation personnalisé","Plan nutrition + macros","Bilan en ligne complet","Suivi mensuel & ajustements","Accès espace client privé"] },
    elite:   { name:"Elite",   monthly:68.99, annual:689.90, features:["Programme musculation personnalisé","Plan nutrition + macros","Bilan en ligne complet","Suivi mensuel & ajustements","Accès espace client privé","Messagerie directe coach","Révisions illimitées"] },
  };
  const plan = PLAN_INFO[planId] || PLAN_INFO.forge;
  const planSavings = (plan.monthly * 12 - plan.annual).toFixed(2).replace(".", ",");
  const displayPrice = billing === "annual"
    ? `${(plan.annual / 12).toFixed(2).replace(".", ",")}€/mois`
    : `${plan.monthly.toFixed(2).replace(".", ",")}€/mois`;

  const STEP_META = [
    { label:"Profil",        hint:"2 min · Informations de base" },
    { label:"Objectifs",     hint:"1 min · Ce que tu veux atteindre" },
    { label:"Entraînement",  hint:"1 min · Ton niveau et ton équipement" },
    { label:"Contraintes",   hint:"1 min · Pour personnaliser au max" },
    { label:"Résultat",      hint:"Génère ton programme 100% sur mesure" },
  ];

  return (
    <div style={{ background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh", fontFamily: "'Syne',sans-serif" }}>
      <style>{`
@keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes celebrate{0%,100%{transform:scale(1)}40%{transform:scale(1.12)}70%{transform:scale(0.95)}}
        @keyframes confettiDrop{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(120px) rotate(720deg);opacity:0}}
        .fade-up{animation:fadeUp 0.4s ease forwards}
        input::placeholder,textarea::placeholder{color:#2E2E2E}
        input:focus,textarea:focus,select:focus{border-color:#E8B000 !important;outline:none}
        *{box-sizing:border-box}
        .sidebar-sticky{position:sticky;top:80px;align-self:start}
        .feat-row{display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:0.5px solid #1A1A1A;font-size:12px;color:#888}
        .feat-row:last-child{border-bottom:none}
        .bilan-grid{display:grid;grid-template-columns:1fr 320px;gap:1px;background:#1A1A1A;max-width:1060px;margin:0 auto}
        @media(max-width:860px){.bilan-grid{grid-template-columns:1fr !important}.sidebar-sticky{display:none}}
        .step-pill{display:inline-flex;align-items:center;gap:6px;font-size:10px;letter-spacing:"2px";text-transform:uppercase;color:#555;margin-bottom:16px}
        @media(max-width:600px){
          .bilan-nav{padding:14px 16px !important}
          .bilan-plan-badge{font-size:9px !important;padding:3px 8px !important;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .bilan-form-col{padding:20px 16px 60px !important}
          .bilan-step-label{display:none}
          .bilan-step-stepper{gap:0 !important;padding:12px 16px 0 !important}
          .form-2col{grid-template-columns:1fr !important}
        }
      `}</style>

      {/* Nav */}
      <div className="bilan-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "0.5px solid #242424", position:"sticky", top:0, background:"#0A0A0A", zIndex:50 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, cursor: "pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color: "#E8B000" }}>NESS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="bilan-plan-badge" style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", background: "rgba(232,176,0,0.1)", border: "0.5px solid #E8B000", color: "#E8B000", padding: "4px 12px" }}>
            Plan {plan.name} — {displayPrice}{billing === "annual" && " · annuel"}
          </div>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
        </div>
      </div>

      {/* Barre progression */}
      <div style={{ height: 2, background: "#181818" }}>
        <div style={{ height: 2, width: `${pct}%`, background: "linear-gradient(90deg,#E8B000,#F5C832)", transition: "width 0.5s ease" }} />
      </div>

      {/* Stepper */}
      <div className="bilan-step-stepper" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, padding:"16px 28px 0", maxWidth:640, margin:"0 auto" }}>
        {STEP_META.map(({ label }, i) => {
          const n = i+1; const done = step > n; const active = step === n;
          return (
            <div key={n} style={{ display:"flex", alignItems:"center", flex: i < 4 ? 1 : "none" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  background: done ? "#E8B000" : "transparent",
                  border: `1.5px solid ${done ? "#E8B000" : active ? "#E8B000" : "#242424"}`,
                  color: done ? "#0A0A0A" : active ? "#E8B000" : "#444",
                  fontSize:11, fontWeight:700, transition:"all 0.3s", flexShrink:0,
                }}>
                  {done ? "✓" : n}
                </div>
                <div className="bilan-step-label" style={{ fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase", color: active ? "#E8B000" : done ? "#666" : "#333", whiteSpace:"nowrap", transition:"color 0.3s" }}>
                  {label}
                </div>
              </div>
              {i < 4 && <div style={{ flex:1, height:1, background: step > n ? "#E8B000" : "#1A1A1A", margin:"0 6px", marginBottom:18, transition:"background 0.4s" }} />}
            </div>
          );
        })}
      </div>

      {/* Layout 2 colonnes */}
      <div style={{ padding:"8px 28px 0" }}>
        <div className="bilan-grid">

          {/* Colonne form */}
          <div className="bilan-form-col" style={{ padding: "28px 28px 60px", background:"#0A0A0A" }}>

        {/* ÉTAPE 1 */}
        {step === 1 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, marginBottom: 6 }}>
              {tb.identity.title}<em style={{ color: "#E8B000", fontStyle: "italic" }}>{tb.identity.em}</em>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>{tb.identity.sub}</div>
            <div className="form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 1 }}>
              <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424" }}>
                <Label>{tb.fields.prenom}</Label>
                <input style={{...inputStyle, borderColor: fieldErrors.prenom ? "#E07070" : "#242424"}} placeholder={tb.placeholders.prenom} value={form.prenom} onChange={e => { inp("prenom")(e); setFieldErrors(f => ({...f, prenom: ""})); }} />
                {fieldErrors.prenom && <div style={{fontSize:11,color:"#E07070",marginTop:4}}>{fieldErrors.prenom}</div>}
              </div>
              <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424" }}>
                <Label>{tb.fields.age}</Label><input style={inputStyle} type="number" placeholder={tb.placeholders.age} value={form.age} onChange={inp("age")} />
              </div>
            </div>
            <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424", marginBottom: 1 }}>
              <Label>{tb.fields.email}</Label>
                <input style={{...inputStyle, borderColor: fieldErrors.email ? "#E07070" : "#242424"}} type="email" placeholder={tb.placeholders.email} value={form.email} onChange={e => { inp("email")(e); setFieldErrors(f => ({...f, email: ""})); }} />
                {fieldErrors.email && <div style={{fontSize:11,color:"#E07070",marginTop:4}}>{fieldErrors.email}</div>}
            </div>
            <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424", marginBottom: 1 }}>
              <Label>Téléphone <span style={{color:"#333",fontSize:9,letterSpacing:"1px"}}>(optionnel · SMS de suivi)</span></Label>
              <input style={inputStyle} type="tel" placeholder="06 12 34 56 78" value={form.telephone || ""} onChange={inp("telephone")} />
            </div>
            <div className="form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 1 }}>
              <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424" }}>
                <Label>{tb.fields.genre}</Label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.genre} onChange={inp("genre")}>
                  {tb.fields.genreOptions.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424" }}>
                <Label>{tb.fields.poids}</Label><input style={inputStyle} type="number" placeholder={tb.placeholders.poids} value={form.poids} onChange={inp("poids")} />
              </div>
            </div>
            <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424" }}>
              <Label>{tb.fields.taille}</Label><input style={inputStyle} type="number" placeholder={tb.placeholders.taille} value={form.taille} onChange={inp("taille")} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <GoldBtn onClick={() => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const errors = {};
                if (!form.prenom.trim()) errors.prenom = "Prénom requis";
                if (!form.email.trim()) errors.email = "Email requis";
                else if (!emailRegex.test(form.email)) errors.email = "Email invalide";
                if (form.age && (Number(form.age) < 10 || Number(form.age) > 100)) errors.age = "Entre 10 et 100 ans";
                if (form.poids && (Number(form.poids) < 30 || Number(form.poids) > 300)) errors.poids = "Entre 30 et 300 kg";
                if (form.taille && (Number(form.taille) < 100 || Number(form.taille) > 250)) errors.taille = "Entre 100 et 250 cm";
                if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
                setFieldErrors({});
                setStep(2);
              }}>{tb.next}</GoldBtn>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 */}
        {step === 2 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, marginBottom: 6 }}>
              {tb.objectif.title}<em style={{ color: "#E8B000", fontStyle: "italic" }}>{tb.objectif.em}</em>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>{tb.objectif.sub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {chipBlock("obj", tb.labels.obj)}
              <div className="form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                {chipBlock("seances", tb.labels.seances)}
                {chipBlock("duree", tb.labels.duree)}
              </div>
            </div>
            {!sel.obj && <div style={{ fontSize: 11, color: "#E07070", marginTop: 12, letterSpacing: "0.5px" }}>Sélectionne ton objectif principal pour continuer.</div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <GoldBtn ghost onClick={() => setStep(1)}>{tb.back}</GoldBtn>
              <GoldBtn onClick={() => { if (!sel.obj) return; setStep(3); }}>{tb.next}</GoldBtn>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 */}
        {step === 3 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, marginBottom: 6 }}>
              {tb.entrainement.title}<em style={{ color: "#E8B000", fontStyle: "italic" }}>{tb.entrainement.em}</em>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>{tb.entrainement.sub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {chipBlock("niv", tb.labels.niv)}
              {chipBlock("lieu", tb.labels.lieu)}
              <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424" }}>
                <Label>{tb.labels.contraintes}</Label>
                <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={form.contraintes} onChange={inp("contraintes")} placeholder={tb.placeholders.contraintes} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <GoldBtn ghost onClick={() => setStep(2)}>{tb.back}</GoldBtn>
              <GoldBtn onClick={() => {
        // Enregistrer l'abandon potentiel
        if (form.email) {
          fetch("/api/save-abandon", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ email:form.email, prenom:form.prenom, plan:planId, step:3 }),
          }).catch(()=>{});
        }
        setStep(4);
      }}>{tb.next}</GoldBtn>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 */}
        {step === 4 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, marginBottom: 6 }}>
              {tb.lifestyle.title}<em style={{ color: "#E8B000", fontStyle: "italic" }}>{tb.lifestyle.em}</em>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>{tb.lifestyle.sub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {chipBlock("regime", tb.labels.regime)}
              <div style={{ background: "#111", padding: "14px 16px", border: "0.5px solid #242424" }}>
                <Label>{tb.labels.motivation}</Label>
                <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={form.motivation} onChange={inp("motivation")} placeholder={tb.placeholders.motivation} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <GoldBtn ghost onClick={() => setStep(3)}>{tb.back}</GoldBtn>
              <GoldBtn onClick={() => setStep(5)}>{tb.next}</GoldBtn>
            </div>
          </div>
        )}

        {/* ÉTAPE 5 — Récap */}
        {step === 5 && status !== "done" && (
          <div className="fade-up">
            {/* Header impact */}
            <div style={{ borderLeft:"2px solid #E8B000", paddingLeft:"1rem", marginBottom:"1.5rem" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, fontWeight:600, lineHeight:1.1 }}>
                {tb.recap.title}<em style={{ color:"#E8B000", fontStyle:"italic" }}>{tb.recap.em}</em>
              </div>
              <div style={{ fontSize:12, color:"#888", marginTop:6 }}>Génération IA personnalisée en ~30 secondes</div>
            </div>

            {/* Récap visuel */}
            {[
              { title:tb.recap.sections[0], icon:"👤", rows:[[tb.fields.prenom,form.prenom],[tb.fields.age,form.age+" ans"],[tb.fields.email,form.email],[tb.fields.genre,form.genre]] },
              { title:tb.recap.sections[1], icon:"🎯", rows:[[tb.labels.obj,sel.obj],[tb.labels.niv,sel.niv],[tb.labels.lieu,sel.lieu],[tb.labels.seances,sel.seances],[tb.labels.duree,sel.duree]] },
              { title:tb.recap.sections[2], icon:"🥗", rows:[[tb.labels.regime,sel.regime],[tb.labels.contraintes,form.contraintes||"—"],[tb.labels.motivation,form.motivation||"—"]] },
            ].map(section => (
              <div key={section.title} style={{ background:"#111", border:"0.5px solid #1A1A1A", padding:"1rem 1.25rem", marginBottom:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ fontSize:14 }}>{section.icon}</span>
                  <span style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#E8B000" }}>{section.title}</span>
                </div>
                {section.rows.filter(r=>r[1]).map(([k,v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"0.5px solid #181818", fontSize:12 }}>
                    <span style={{ color:"#444" }}>{k}</span>
                    <span style={{ color:"#F0EDE8", fontWeight:600, maxWidth:"55%", textAlign:"right" }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}

            {/* Email notice */}
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(232,176,0,0.05)", border:"0.5px solid rgba(232,176,0,0.2)", padding:"12px 16px", marginBottom:1 }}>
              <span style={{ color:"#E8B000", fontSize:16 }}>✉</span>
              <span style={{ fontSize:12, color:"#666" }}>Programme envoyé à <strong style={{ color:"#F5C832" }}>{form.email}</strong></span>
            </div>

            {/* CTA générer */}
            <div style={{ marginTop:1 }}>
              <GoldBtn onClick={handleGenerate} loading={status==="generating"||status==="sending"}>
                {status==="generating" ? tb.generating : status==="sending" ? tb.sending : "✦ Générer mon programme"}
              </GoldBtn>
              <button onClick={()=>setStep(4)} style={{ background:"transparent", border:"none", color:"#333", fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:"1px", cursor:"pointer", marginTop:10, display:"block", textDecoration:"underline", textUnderlineOffset:3 }}>
                ← Modifier mes réponses
              </button>
            </div>
            {errMsg && <div style={{ marginTop:16, padding:"12px 16px", background:"#1A0808", border:"0.5px solid #5A1A1A", color:"#E07070", fontSize:13, fontFamily:"monospace" }}>✕ {errMsg}</div>}
          </div>
        )}

        {/* SUCCÈS */}
        {step === 5 && status === "done" && (
          <div className="fade-up">
            {/* Header succès */}
            <div style={{ textAlign:"center", padding:"2rem 0 1.5rem", borderBottom:"0.5px solid #1A1A1A", marginBottom:"1.5rem" }}>
              <div style={{ width:64, height:64, background:"linear-gradient(135deg,#E8B000,#C49200)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem", fontSize:28, animation:"celebrate 0.6s ease both" }}>✓</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:38, fontWeight:600, lineHeight:1.1, marginBottom:8 }}>
                Programme généré,<br/><em style={{ color:"#E8B000", fontStyle:"italic" }}>{form.prenom} !</em>
              </div>
              <div style={{ fontSize:13, color:"#888", lineHeight:1.8 }}>
                Envoyé à <strong style={{ color:"#F5C832" }}>{form.email}</strong>
              </div>
            </div>

            {/* 3 étapes suivantes */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, marginBottom:1 }}>
              {[
                { n:"01", title:"Vérifie ta boîte mail", desc:"Ton programme complet + tes identifiants t'ont été envoyés" },
                { n:"02", title:"Accède à ton espace", desc:"Suis ta progression, consulte ton plan et contacte le coach" },
                { n:"03", title:"Commence dès aujourd'hui", desc:"Ta première séance t'attend — plus d'excuse !" },
              ].map(s => (
                <div key={s.n} style={{ background:"#111", padding:"1.25rem 1rem", border:"0.5px solid #1A1A1A" }}>
                  <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#E8B000", marginBottom:8 }}>{s.n}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#F0EDE8", marginBottom:6, lineHeight:1.3 }}>{s.title}</div>
                  <div style={{ fontSize:11, color:"#888", lineHeight:1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Statut compte */}
            <div style={{ display:"flex", alignItems:"center", gap:10,
              padding:"12px 16px", border:`0.5px solid ${clientCreated===false?"#5A1A1A":clientCreated===true?"#1A3A1A":"#242424"}`,
              background:clientCreated===false?"#1A0808":clientCreated===true?"#081A08":"#111", fontSize:12, marginBottom:1 }}>
              <span>{clientCreated===false?"⚠":clientCreated===true?"✓":"⏳"}</span>
              {clientCreated===false ? (
                <span style={{ color:"#E07070" }}>Erreur création espace client — <a href="mailto:coach.apxfitness11@gmail.com" style={{ color:"#F5C832" }}>contacte le coach</a></span>
              ) : clientCreated===true ? (
                <span style={{ color:"#7AE07A" }}>Tes identifiants ont été envoyés à <strong style={{ color:"#F5C832" }}>{form.email}</strong></span>
              ) : (
                <span style={{ color:"#888" }}>Création de ton espace en cours…</span>
              )}
            </div>

            {/* CTA principal */}
            <button onClick={() => router.push("/client")} style={{
              width:"100%", background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A",
              fontFamily:"'Syne',sans-serif", fontSize:13, letterSpacing:"3px", textTransform:"uppercase",
              padding:"16px", cursor:"pointer", fontWeight:800, marginTop:1,
              boxShadow:"0 4px 24px rgba(232,176,0,0.25)",
            }}>
              Accéder à mon espace client →
            </button>

            {/* Aperçu programme */}
            <div style={{ marginTop:1 }}>
              <div style={{ background:"#111", border:"0.5px solid #242424", padding:"1.25rem" }}>
                <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#E8B000", marginBottom:10 }}>Aperçu de ton programme</div>
                <div style={{ fontFamily:"monospace", fontSize:11, lineHeight:1.9, color:"#666", whiteSpace:"pre-wrap", maxHeight:260, overflow:"auto" }}>{prog}</div>
              </div>
            </div>

            <div style={{ textAlign:"center", marginTop:16 }}>
              <button onClick={() => router.push("/")} style={{ background:"transparent", border:"none", color:"#333", fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:"1px", cursor:"pointer", textDecoration:"underline", textUnderlineOffset:3 }}>
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}

          </div>{/* fin colonne form */}

          {/* ── Sidebar ── */}
          <div style={{ background:"#0D0D0D", borderLeft:"0.5px solid #1A1A1A" }}>
            <div className="sidebar-sticky" style={{ padding:"2rem 1.5rem" }}>

              {/* Toggle mensuel / annuel */}
              <div style={{ background:"#111", border:"0.5px solid #1A1A1A", padding:"1.25rem", marginBottom:1 }}>
                <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:12 }}>Fréquence de facturation</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1 }}>
                  {[
                    { key:"monthly", label:"Mensuel", sub:`${plan.monthly.toFixed(2).replace(".",",")}€/mois` },
                    { key:"annual",  label:"Annuel",  sub:`${(plan.annual/12).toFixed(2).replace(".",",")}€/mois` },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setBilling(opt.key)} style={{
                      background: billing === opt.key ? "rgba(232,176,0,0.1)" : "transparent",
                      border: `0.5px solid ${billing === opt.key ? "#E8B000" : "#242424"}`,
                      padding:"10px 8px", cursor:"pointer", textAlign:"center", transition:"all 0.2s",
                    }}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color: billing === opt.key ? "#E8B000" : "#555", fontFamily:"'Syne',sans-serif" }}>{opt.label}</div>
                      <div style={{ fontSize:11, color: billing === opt.key ? "#E8B000" : "#333", marginTop:3, fontFamily:"'Syne',sans-serif" }}>{opt.sub}</div>
                    </button>
                  ))}
                </div>
                {billing === "annual" && (
                  <div style={{ marginTop:10, background:"rgba(122,224,122,0.07)", border:"0.5px solid rgba(122,224,122,0.2)", padding:"8px 12px", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ color:"#7AE07A", fontSize:13 }}>✓</span>
                    <span style={{ fontSize:11, color:"#7AE07A" }}>
                      <strong>{planSavings}€ économisés</strong> — 2 mois offerts
                    </span>
                  </div>
                )}
              </div>

              {/* Plan card */}
              <div style={{ background:"#111", border:"0.5px solid rgba(232,176,0,0.3)", padding:"1.25rem", marginBottom:1, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#E8B000,#F5C832)" }}/>
                <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#E8B000", marginBottom:8 }}>Plan sélectionné</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"#F0EDE8", marginBottom:4 }}>{plan.name}</div>
                <div style={{ fontSize:13, color:"#E8B000", fontWeight:700 }}>{displayPrice}</div>
                {billing === "annual" && (
                  <div style={{ fontSize:10, color:"#666", marginTop:4 }}>facturé {plan.annual.toFixed(2).replace(".",",")}€/an</div>
                )}
              </div>

              {/* Ce qui est inclus */}
              <div style={{ background:"#111", border:"0.5px solid #1A1A1A", padding:"1.25rem", marginBottom:1 }}>
                <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:12 }}>Inclus dans ton plan</div>
                {plan.features.map((f,i) => (
                  <div key={i} className="feat-row">
                    <span style={{ color:"#E8B000", flexShrink:0, marginTop:1 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Témoignage */}
              <div style={{ background:"#111", border:"0.5px solid #1A1A1A", padding:"1.25rem", marginBottom:1 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:"#888", lineHeight:1.8, fontStyle:"italic", marginBottom:12 }}>
                  "J'avais essayé plein de programmes YouTube. Là c'est la première fois que j'ai quelque chose adapté à MOI — j'ai pris 4 kg de muscle en 3 mois."
                </div>
                <div style={{ fontSize:11, color:"#555" }}>— Thomas M., Plan Forge</div>
                <div style={{ display:"flex", gap:2, marginTop:6 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color:"#E8B000", fontSize:11 }}>★</span>)}
                </div>
              </div>

              {/* Garantie */}
              <div style={{ border:"0.5px solid rgba(122,224,122,0.2)", background:"rgba(122,224,122,0.04)", padding:"1rem", textAlign:"center" }}>
                <div style={{ fontSize:18, marginBottom:6 }}>🛡</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#7AE07A", letterSpacing:"1px", textTransform:"uppercase", marginBottom:4 }}>Satisfait ou remboursé</div>
                <div style={{ fontSize:11, color:"#555", lineHeight:1.6 }}>14 jours pour essayer. Si tu n'es pas satisfait, on te rembourse.</div>
              </div>

              {/* Social proof */}
              <div style={{ marginTop:1, padding:"0.75rem 1rem", background:"#111", border:"0.5px solid #1A1A1A", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ display:"flex" }}>
                  {["#5DCAA5","#E8B000","#88A0E0"].map((c,i) => (
                    <div key={i} style={{ width:24, height:24, borderRadius:"50%", background:c, border:"2px solid #0A0A0A", marginLeft:i>0?-6:0 }}/>
                  ))}
                </div>
                <div style={{ fontSize:11, color:"#555", lineHeight:1.5 }}>
                  <strong style={{ color:"#888" }}>+340 personnes</strong><br/>ont complété leur bilan ce mois
                </div>
              </div>

            </div>
          </div>{/* fin sidebar */}

        </div>{/* fin bilan-grid */}
      </div>{/* fin padding wrapper */}
    </div>
  );
}

export default function BilanPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0A0A0A", minHeight: "100vh" }} />}>
      <BilanForm />
    </Suspense>
  );
}
