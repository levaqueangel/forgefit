"use client";
import { trackEvent } from "../GoogleAnalytics";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 13px", border: `0.5px solid ${active ? "#C9A84C" : "#242424"}`,
      borderRadius: 2, fontSize: 12, cursor: "pointer",
      background: active ? "rgba(201,168,76,0.1)" : "transparent",
      color: active ? "#E8C87A" : "#888",
      fontFamily: "'Syne',sans-serif", fontWeight: active ? 600 : 400,
      letterSpacing: "0.3px", transition: "all 0.15s",
    }}>{label}</button>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 7 }}>{children}</div>;
}

function Spinner() {
  return <span style={{ width: 14, height: 14, border: "2px solid #242424", borderTopColor: "#C9A84C", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

function GoldBtn({ onClick, disabled, loading, children, ghost }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      padding: "13px 28px", border: `0.5px solid ${ghost ? "#242424" : "#C9A84C"}`,
      background: ghost ? "transparent" : (disabled || loading) ? "#181818" : "linear-gradient(135deg,#C9A84C,#A67C2E)",
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

  async function handleGenerate() {
    setStatus("generating"); setErrMsg(""); setProg("");
    try {
      const genRes = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...sel, plan: planId, lang }),
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
          body: JSON.stringify({ email: form.email, nom: form.prenom, plan: planId, programme: genData.programme, programmeData: genData.programmeData || null }),
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

  return (
    <div style={{ background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh", fontFamily: "'Syne',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.4s ease forwards}
        input::placeholder,textarea::placeholder{color:#2E2E2E}
        input:focus,textarea:focus,select:focus{border-color:#C9A84C !important;outline:none}
        *{box-sizing:border-box}
      `}</style>

      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "0.5px solid #242424" }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, cursor: "pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color: "#C9A84C" }}>NESS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", background: "rgba(201,168,76,0.1)", border: "0.5px solid #C9A84C", color: "#C9A84C", padding: "4px 12px" }}>
            {tb.badge} {planId.charAt(0).toUpperCase() + planId.slice(1)} — {price}€
          </div>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono',monospace" }}>{tb.step} {step} {tb.of} 5</div>
        </div>
      </div>

      {/* Barre progression + Stepper */}
      <div style={{ height: 2, background: "#181818" }}>
        <div style={{ height: 2, width: `${pct}%`, background: "linear-gradient(90deg,#C9A84C,#E8C87A)", transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, padding:"16px 28px 0", maxWidth:640, margin:"0 auto" }}>
        {[
          { n:1, label:"Profil" },
          { n:2, label:"Objectifs" },
          { n:3, label:"Entraînement" },
          { n:4, label:"Contraintes" },
          { n:5, label:"Résultat" },
        ].map(({ n, label }, i) => {
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} style={{ display:"flex", alignItems:"center", flex: i < 4 ? 1 : "none" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  background: done ? "#C9A84C" : active ? "transparent" : "transparent",
                  border: `1.5px solid ${done ? "#C9A84C" : active ? "#C9A84C" : "#242424"}`,
                  color: done ? "#0A0A0A" : active ? "#C9A84C" : "#444",
                  fontSize:11, fontWeight:700, transition:"all 0.3s",
                  flexShrink:0,
                }}>
                  {done ? "✓" : n}
                </div>
                <div style={{ fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase", color: active ? "#C9A84C" : done ? "#666" : "#333", whiteSpace:"nowrap", transition:"color 0.3s" }}>
                  {label}
                </div>
              </div>
              {i < 4 && (
                <div style={{ flex:1, height:1, background: step > n ? "#C9A84C" : "#1A1A1A", margin:"0 6px", marginBottom:18, transition:"background 0.4s" }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "28px 28px 60px", maxWidth: 640, margin: "0 auto" }}>

        {/* ÉTAPE 1 */}
        {step === 1 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, marginBottom: 6 }}>
              {tb.identity.title}<em style={{ color: "#C9A84C", fontStyle: "italic" }}>{tb.identity.em}</em>
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 24 }}>{tb.identity.sub}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 1 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 1 }}>
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
              {tb.objectif.title}<em style={{ color: "#C9A84C", fontStyle: "italic" }}>{tb.objectif.em}</em>
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 24 }}>{tb.objectif.sub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {chipBlock("obj", tb.labels.obj)}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                {chipBlock("seances", tb.labels.seances)}
                {chipBlock("duree", tb.labels.duree)}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <GoldBtn ghost onClick={() => setStep(1)}>{tb.back}</GoldBtn>
              <GoldBtn onClick={() => setStep(3)}>{tb.next}</GoldBtn>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 */}
        {step === 3 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, marginBottom: 6 }}>
              {tb.entrainement.title}<em style={{ color: "#C9A84C", fontStyle: "italic" }}>{tb.entrainement.em}</em>
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 24 }}>{tb.entrainement.sub}</div>
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
        // Validation étape 3 — vérifier que les champs obligatoires sont remplis
        if (!form.prenom || !form.prenom.trim()) {
          alert(tb.error_prenom || "Merci de renseigner ton prénom."); return;
        }
        if (!form.email || !form.email.includes("@") || !form.email.includes(".")) {
          alert(tb.error_email || "Merci de renseigner un email valide."); return;
        }
        // Enregistrer l'abandon potentiel
        fetch("/api/save-abandon", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ email:form.email, prenom:form.prenom, plan:planId, step:3 }),
        }).catch(()=>{});
        setStep(4);
      }}>{tb.next}</GoldBtn>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 */}
        {step === 4 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, marginBottom: 6 }}>
              {tb.lifestyle.title}<em style={{ color: "#C9A84C", fontStyle: "italic" }}>{tb.lifestyle.em}</em>
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 24 }}>{tb.lifestyle.sub}</div>
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
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, marginBottom: 6 }}>
              {tb.recap.title}<em style={{ color: "#C9A84C", fontStyle: "italic" }}>{tb.recap.em}</em>
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 24 }}>{tb.recap.sub}</div>
            {[
              { title: tb.recap.sections[0], rows: [[tb.fields.prenom, form.prenom], [tb.fields.age, form.age + " ans"], [tb.fields.email, form.email], [tb.fields.genre, form.genre]] },
              { title: tb.recap.sections[1], rows: [[tb.labels.obj, sel.obj], [tb.labels.niv, sel.niv], [tb.labels.lieu, sel.lieu], [tb.labels.seances, sel.seances], [tb.labels.duree, sel.duree]] },
              { title: tb.recap.sections[2], rows: [[tb.labels.regime, sel.regime], [tb.labels.contraintes, form.contraintes || "—"], [tb.labels.motivation, form.motivation || "—"]] },
            ].map(section => (
              <div key={section.title} style={{ background: "#111", border: "0.5px solid #242424", padding: "16px", marginBottom: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: 12 }}>{section.title}</div>
                {section.rows.filter(r => r[1]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid #242424", fontSize: 13 }}>
                    <span style={{ color: "#555" }}>{k}</span>
                    <span style={{ color: "#F0EDE8", fontWeight: 500, maxWidth: "55%", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ background: "#181818", border: "0.5px solid #C9A84C", padding: "14px 16px", marginTop: 1, fontSize: 12, color: "#555" }}>
              📧 {tb.recap.emailNotice} <strong style={{ color: "#E8C87A" }}>{form.email}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <GoldBtn ghost onClick={() => setStep(4)}>{tb.modify}</GoldBtn>
              <GoldBtn onClick={handleGenerate} loading={status === "generating" || status === "sending"}>
                {status === "generating" ? tb.generating : status === "sending" ? tb.sending : tb.generate}
              </GoldBtn>
            </div>
            {errMsg && <div style={{ marginTop: 16, padding: "12px 16px", background: "#1A0808", border: "0.5px solid #5A1A1A", color: "#E07070", fontSize: 13, fontFamily: "monospace" }}>✕ {errMsg}</div>}
          </div>
        )}

        {/* SUCCÈS */}
        {step === 5 && status === "done" && (
          <div className="fade-up" style={{ textAlign: "center", paddingTop: 20 }}>
            <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,#C9A84C,#A67C2E)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>✓</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
              {tb.success.title}<em style={{ color: "#C9A84C", fontStyle: "italic" }}>{tb.success.em}</em>
            </div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 32, lineHeight: 1.8 }}>
              {form.prenom}, {tb.success.sentTo}<br /><strong style={{ color: "#E8C87A" }}>{form.email}</strong>
            </div>

            {/* Statut compte client */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 24,
              padding: "12px 20px", border: `0.5px solid ${clientCreated === false ? "#5A1A1A" : "#1A3A1A"}`,
              background: clientCreated === false ? "#1A0808" : "#081A08", fontSize: 13 }}>
              <span style={{ fontSize: 18 }}>{clientCreated === false ? "⚠️" : "✓"}</span>
              {clientCreated === false ? (
                <span style={{ color: "#E07070" }}>
                  Erreur création espace client — <a href="mailto:levaqueangel@gmail.com" style={{ color: "#E8C87A" }}>contacte le coach</a>
                </span>
              ) : (
                <span style={{ color: "#7AE07A" }}>
                  Tes identifiants ont été envoyés à <strong style={{ color: "#E8C87A" }}>{form.email}</strong>
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 32, lineHeight: 1.8 }}>
            </div>
            <div style={{ background: "#111", border: "0.5px solid #242424", padding: "20px", textAlign: "left", marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: 12 }}>{tb.success.preview}</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 2, color: "#888", whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto" }}>{prog}</div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => router.push("/client")} style={{
                background: "linear-gradient(135deg,#C9A84C,#A67C2E)", border: "none", color: "#0A0A0A",
                fontFamily: "'Syne',sans-serif", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase",
                padding: "13px 24px", cursor: "pointer", fontWeight: 700 }}>
                Accéder à mon espace →
              </button>
              <button onClick={() => router.push("/")} style={{ background: "transparent", border: "0.5px solid #242424", color: "#555", fontFamily: "'Syne',sans-serif", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", padding: "11px 24px", cursor: "pointer" }}>
                {tb.success.backHome}
              </button>
            </div>
          </div>
        )}
      </div>
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
