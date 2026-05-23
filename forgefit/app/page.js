"use client";
import { useState } from "react";

const G = {
  dark:"#0A0A0A", dark2:"#111111", dark3:"#181818",
  border:"#242424", gold:"#C9A84C", goldL:"#E8C87A",
  text:"#F0EDE8", muted:"#555555", mut2:"#888888",
};

const CHIPS = {
  obj:     ["Perdre du poids","Prise de masse","Remise en forme","Tonification","Performance"],
  niv:     ["Débutant","Intermédiaire","Avancé"],
  lieu:    ["Salle de sport","Maison avec matériel","Maison sans matériel","Extérieur"],
  seances: ["2","3","4","5+"],
  duree:   ["30 min","45 min","1h","1h30+"],
  regime:  ["Omnivore","Végétarien","Vegan","Sans gluten"],
};

function Label({ children }) {
  return (
    <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",
      color:G.muted,marginBottom:7,fontFamily:"'Syne',sans-serif"}}>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"7px 13px", border:`0.5px solid ${active ? G.gold : G.border}`,
      borderRadius:2, fontSize:12, cursor:"pointer",
      background: active ? "rgba(201,168,76,0.1)" : "transparent",
      color: active ? G.goldL : G.mut2,
      fontFamily:"'Syne',sans-serif", fontWeight: active ? 600 : 400,
      letterSpacing:"0.3px", transition:"all 0.15s",
    }}>{label}</button>
  );
}

function Spinner() {
  return <span style={{width:14,height:14,border:`2px solid ${G.border}`,
    borderTopColor:G.gold,borderRadius:"50%",display:"inline-block",
    animation:"spin 0.7s linear infinite"}}/>;
}

function GoldBtn({ onClick, disabled, loading, children, ghost }) {
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      padding:"13px 28px", border:`0.5px solid ${ghost ? G.border : G.gold}`,
      background: ghost ? "transparent" : (disabled||loading) ? G.dark3
        : `linear-gradient(135deg,${G.gold},#A67C2E)`,
      color: ghost ? G.muted : (disabled||loading) ? G.muted : G.dark,
      fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700,
      letterSpacing:"3px", textTransform:"uppercase",
      cursor:(disabled||loading)?"not-allowed":"pointer",
      display:"flex", alignItems:"center", gap:8, transition:"opacity 0.2s",
    }}>
      {loading && <Spinner/>}
      {children}
    </button>
  );
}

export default function Home() {
  const [step,   setStep]   = useState(1);
  const [form,   setForm]   = useState({prenom:"",age:"",email:"",genre:"",poids:"",taille:"",contraintes:"",motivation:""});
  const [sel,    setSel]    = useState({});
  const [prog,   setProg]   = useState("");
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const inp  = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const pick = (k,v) => setSel(s=>({...s,[k]:v}));
  const pct  = Math.round((step/6)*100);

  const inputStyle = {
    width:"100%", background:G.dark2, border:`0.5px solid ${G.border}`,
    color:G.text, fontFamily:"'Syne',sans-serif", fontSize:13,
    padding:"10px 14px", outline:"none", borderRadius:0,
  };

  async function handleGenerate() {
    setStatus("generating"); setErrMsg(""); setProg("");
    try {
      // 1. Générer le programme
      const genRes = await fetch("/api/generate", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({...form,...sel}),
      });
      const genData = await genRes.json();
      if (genData.error) throw new Error(genData.error);
      const programme = genData.programme;
      setProg(programme);

      // 2. Envoyer l'email
      setStatus("sending");
      const mailRes = await fetch("/api/send-email", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ to:form.email, nom:form.prenom, plan:sel.obj||"personnalisé", programme }),
      });
      const mailData = await mailRes.json();
      if (mailData.error) throw new Error(mailData.error);

      setStatus("done");
      setStep(6);
    } catch(e) {
      setErrMsg(e.message);
      setStatus("error");
    }
  }

  const chipBlock = (key, label) => (
    <div style={{background:G.dark2,padding:"14px 16px",border:`0.5px solid ${G.border}`}}>
      <Label>{label}</Label>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
        {CHIPS[key].map(v=><Chip key={v} label={v} active={sel[key]===v} onClick={()=>pick(key,v)}/>)}
      </div>
    </div>
  );

  const fieldBlock = (id, label, ph, type="text") => (
    <div style={{background:G.dark2,padding:"14px 16px",border:`0.5px solid ${G.border}`}}>
      <Label>{label}</Label>
      <input style={inputStyle} type={type} placeholder={ph} value={form[id]} onChange={inp(id)}/>
    </div>
  );

  return (
    <div style={{background:G.dark,color:G.text,minHeight:"100vh",fontFamily:"'Syne',sans-serif"}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.4s ease forwards}
        input::placeholder,textarea::placeholder{color:#2E2E2E}
        input:focus,textarea:focus,select:focus{border-color:${G.gold}!important;outline:none}
        * { box-sizing:border-box; }
      `}</style>

      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"18px 28px",borderBottom:`0.5px solid ${G.border}`}}>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:5}}>
          FORGE<span style={{color:G.gold}}>FIT</span>
        </div>
        <div style={{fontSize:11,color:G.muted,fontFamily:"'DM Mono',monospace",letterSpacing:"1px"}}>
          Étape {step} / 6
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{height:2,background:G.dark3}}>
        <div style={{height:2,width:`${pct}%`,
          background:`linear-gradient(90deg,${G.gold},${G.goldL})`,
          transition:"width 0.4s ease"}}/>
      </div>

      <div style={{padding:"28px 28px 60px",maxWidth:640,margin:"0 auto"}}>

        {/* ── ÉTAPE 1 — Identité ── */}
        {step===1 && (
          <div className="fade-up">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,marginBottom:6}}>
              Qui es-<em style={{color:G.gold,fontStyle:"italic"}}>tu ?</em>
            </div>
            <div style={{fontSize:12,color:G.muted,marginBottom:24}}>
              Quelques infos pour personnaliser ton programme.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,marginBottom:1}}>
              {fieldBlock("prenom","Prénom","ex. Sarah")}
              {fieldBlock("age","Âge","ex. 28","number")}
            </div>
            {fieldBlock("email","Email","ton@email.com","email")}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,marginTop:1}}>
              <div style={{background:G.dark2,padding:"14px 16px",border:`0.5px solid ${G.border}`}}>
                <Label>Genre</Label>
                <select style={{...inputStyle,cursor:"pointer"}} value={form.genre} onChange={inp("genre")}>
                  <option value="">—</option>
                  <option>Homme</option><option>Femme</option><option>Autre</option>
                </select>
              </div>
              {fieldBlock("poids","Poids (kg)","ex. 68","number")}
            </div>
            <div style={{marginTop:1}}>{fieldBlock("taille","Taille (cm)","ex. 165","number")}</div>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
              <GoldBtn onClick={()=>{
                if(!form.prenom||!form.email){alert("Prénom et email requis");return;}
                setStep(2);
              }}>Suivant →</GoldBtn>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 — Objectifs ── */}
        {step===2 && (
          <div className="fade-up">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,marginBottom:6}}>
              Ton <em style={{color:G.gold,fontStyle:"italic"}}>objectif</em>
            </div>
            <div style={{fontSize:12,color:G.muted,marginBottom:24}}>Qu'est-ce que tu veux accomplir ?</div>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              {chipBlock("obj","Objectif principal")}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1}}>
                {chipBlock("seances","Séances / semaine")}
                {chipBlock("duree","Durée par séance")}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
              <GoldBtn ghost onClick={()=>setStep(1)}>← Retour</GoldBtn>
              <GoldBtn onClick={()=>setStep(3)}>Suivant →</GoldBtn>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 — Entraînement ── */}
        {step===3 && (
          <div className="fade-up">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,marginBottom:6}}>
              Ton <em style={{color:G.gold,fontStyle:"italic"}}>entraînement</em>
            </div>
            <div style={{fontSize:12,color:G.muted,marginBottom:24}}>Ton niveau et ton environnement.</div>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              {chipBlock("niv","Niveau actuel")}
              {chipBlock("lieu","Lieu d'entraînement")}
              <div style={{background:G.dark2,padding:"14px 16px",border:`0.5px solid ${G.border}`}}>
                <Label>Blessures / contraintes (optionnel)</Label>
                <textarea style={{...inputStyle,minHeight:64,resize:"vertical"}}
                  value={form.contraintes} onChange={inp("contraintes")}
                  placeholder="ex. douleur genou gauche, pas de sauts..."/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
              <GoldBtn ghost onClick={()=>setStep(2)}>← Retour</GoldBtn>
              <GoldBtn onClick={()=>setStep(4)}>Suivant →</GoldBtn>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 — Mode de vie ── */}
        {step===4 && (
          <div className="fade-up">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,marginBottom:6}}>
              Mode de <em style={{color:G.gold,fontStyle:"italic"}}>vie</em>
            </div>
            <div style={{fontSize:12,color:G.muted,marginBottom:24}}>Pour un programme qui s'adapte à ta réalité.</div>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              {chipBlock("regime","Alimentation")}
              <div style={{background:G.dark2,padding:"14px 16px",border:`0.5px solid ${G.border}`}}>
                <Label>Ta motivation profonde (optionnel)</Label>
                <textarea style={{...inputStyle,minHeight:64,resize:"vertical"}}
                  value={form.motivation} onChange={inp("motivation")}
                  placeholder="ex. me sentir bien dans mon corps, être en forme pour mes enfants..."/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
              <GoldBtn ghost onClick={()=>setStep(3)}>← Retour</GoldBtn>
              <GoldBtn onClick={()=>setStep(5)}>Voir le récap →</GoldBtn>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 5 — Récapitulatif ── */}
        {step===5 && (
          <div className="fade-up">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,marginBottom:6}}>
              Tout est <em style={{color:G.gold,fontStyle:"italic"}}>prêt</em>
            </div>
            <div style={{fontSize:12,color:G.muted,marginBottom:24}}>Vérifie tes infos avant de générer.</div>

            {[
              {title:"Identité",    rows:[["Prénom",form.prenom],["Âge",form.age+" ans"],["Email",form.email],["Genre",form.genre]]},
              {title:"Programme",  rows:[["Objectif",sel.obj],["Niveau",sel.niv],["Lieu",sel.lieu],["Séances",sel.seances+" / sem"],["Durée",sel.duree]]},
              {title:"Mode de vie",rows:[["Régime",sel.regime],["Contraintes",form.contraintes||"—"],["Motivation",form.motivation||"—"]]},
            ].map(section=>(
              <div key={section.title} style={{background:G.dark2,border:`0.5px solid ${G.border}`,padding:"16px",marginBottom:1}}>
                <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:G.gold,marginBottom:12}}>{section.title}</div>
                {section.rows.filter(r=>r[1]).map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",
                    borderBottom:`0.5px solid ${G.border}`,fontSize:13}}>
                    <span style={{color:G.muted}}>{k}</span>
                    <span style={{color:G.text,fontWeight:500,maxWidth:"55%",textAlign:"right"}}>{v}</span>
                  </div>
                ))}
              </div>
            ))}

            <div style={{background:G.dark3,border:`0.5px solid ${G.gold}`,
              padding:"14px 16px",marginTop:1,fontSize:12,color:G.muted}}>
              📧 Le programme sera envoyé à <strong style={{color:G.goldL}}>{form.email}</strong>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
              <GoldBtn ghost onClick={()=>setStep(4)}>← Modifier</GoldBtn>
              <GoldBtn
                onClick={handleGenerate}
                loading={status==="generating"||status==="sending"}
              >
                {status==="generating" ? "Génération IA..." :
                 status==="sending"    ? "Envoi email..."   :
                 "⚡ Générer & Envoyer"}
              </GoldBtn>
            </div>

            {errMsg && (
              <div style={{marginTop:16,padding:"12px 16px",background:"#1A0808",
                border:"0.5px solid #5A1A1A",color:"#E07070",fontSize:13,
                fontFamily:"'DM Mono',monospace"}}>
                ✕ {errMsg}
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 6 — Succès ── */}
        {step===6 && status==="done" && (
          <div className="fade-up" style={{textAlign:"center",paddingTop:20}}>
            <div style={{width:56,height:56,
              background:`linear-gradient(135deg,${G.gold},#A67C2E)`,
              borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
              margin:"0 auto 20px",fontSize:24}}>
              ✓
            </div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,marginBottom:8}}>
              Programme <em style={{color:G.gold,fontStyle:"italic"}}>envoyé !</em>
            </div>
            <div style={{fontSize:13,color:G.muted,marginBottom:32,lineHeight:1.8}}>
              {form.prenom}, ton programme a été envoyé à<br/>
              <strong style={{color:G.goldL}}>{form.email}</strong>
            </div>

            <div style={{background:G.dark2,border:`0.5px solid ${G.border}`,
              padding:"20px",textAlign:"left",marginBottom:24}}>
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",
                color:G.gold,marginBottom:12}}>Aperçu du programme</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,lineHeight:2,
                color:G.mut2,whiteSpace:"pre-wrap",maxHeight:300,overflow:"auto"}}>
                {prog}
              </div>
            </div>

            <button onClick={()=>{
              setStep(1); setProg(""); setStatus("idle"); setErrMsg("");
              setForm({prenom:"",age:"",email:"",genre:"",poids:"",taille:"",contraintes:"",motivation:""});
              setSel({});
            }} style={{background:"transparent",border:`0.5px solid ${G.border}`,
              color:G.muted,fontFamily:"'Syne',sans-serif",fontSize:12,
              letterSpacing:"2px",textTransform:"uppercase",padding:"11px 24px",cursor:"pointer"}}>
              Nouveau client →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
