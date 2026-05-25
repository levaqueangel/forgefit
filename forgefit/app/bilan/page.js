"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"7px 13px", border:`0.5px solid ${active?"#C9A84C":"#242424"}`,
      borderRadius:2, fontSize:12, cursor:"pointer",
      background:active?"rgba(201,168,76,0.1)":"transparent",
      color:active?"#E8C87A":"#888",
      fontFamily:"'Syne',sans-serif", fontWeight:active?600:400,
      letterSpacing:"0.3px", transition:"all 0.15s",
    }}>{label}</button>
  );
}

function Label({ children }) {
  return <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:7}}>{children}</div>;
}

function Spinner() {
  return <span style={{width:14,height:14,border:"2px solid #242424",borderTopColor:"#C9A84C",
    borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>;
}

function GoldBtn({ onClick, disabled, loading, children, ghost }) {
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      padding:"13px 28px", border:`0.5px solid ${ghost?"#242424":"#C9A84C"}`,
      background:ghost?"transparent":(disabled||loading)?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",
      color:ghost?"#555":(disabled||loading)?"#555":"#0A0A0A",
      fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700,
      letterSpacing:"3px", textTransform:"uppercase",
      cursor:(disabled||loading)?"not-allowed":"pointer",
      display:"flex", alignItems:"center", gap:8,
    }}>
      {loading&&<Spinner/>}{children}
    </button>
  );
}

function BilanForm() {
  const router = useRouter();
  const params = useSearchParams();
  const plan   = params.get("plan") || "forge";
  const price  = params.get("price") || "129";

  const [step,   setStep]   = useState(1);
  const [form,   setForm]   = useState({prenom:"",age:"",email:"",genre:"",poids:"",taille:"",contraintes:"",motivation:""});
  const [sel,    setSel]    = useState({});
  const [prog,   setProg]   = useState("");
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const inp  = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const pick = (k,v) => setSel(s=>({...s,[k]:v}));
  const pct  = Math.round((step/5)*100);

  const inputStyle = {
    width:"100%", background:"#111", border:"0.5px solid #242424",
    color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:13,
    padding:"10px 14px", outline:"none", borderRadius:0,
  };

  async function handleGenerate() {
    setStatus("generating"); setErrMsg(""); setProg("");
    try {
      const genRes = await fetch("/api/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...form,...sel,plan}),
      });
      const genData = await genRes.json();
      if (genData.error) throw new Error(genData.error);
      setProg(genData.programme);

      setStatus("sending");
      const mailRes = await fetch("/api/send-email", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({to:form.email, nom:form.prenom, plan, programme:genData.programme}),
      });
      const mailData = await mailRes.json();
      if (mailData.error) throw new Error(mailData.error);

      setStatus("done"); setStep(5);
    } catch(e) {
      setErrMsg(e.message); setStatus("error");
    }
  }

  const chipBlock = (key, label) => (
    <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
      <Label>{label}</Label>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
        {CHIPS[key].map(v=><Chip key={v} label={v} active={sel[key]===v} onClick={()=>pick(key,v)}/>)}
      </div>
    </div>
  );

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp 0.4s ease forwards} input::placeholder,textarea::placeholder{color:#2E2E2E} input:focus,textarea:focus,select:focus{border-color:#C9A84C!important;outline:none} *{box-sizing:border-box}`}</style>

      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"18px 28px",borderBottom:"0.5px solid #242424"}}>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:5,cursor:"pointer"}} onClick={()=>router.push("/")}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",
            background:"rgba(201,168,76,0.1)",border:"0.5px solid #C9A84C",
            color:"#C9A84C",padding:"4px 12px"}}>
            Plan {plan.charAt(0).toUpperCase()+plan.slice(1)} — {price}€
          </div>
          <div style={{fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace"}}>Étape {step} / 5</div>
        </div>
      </div>

      {/* Barre progression */}
      <div style={{height:2,background:"#181818"}}>
        <div style={{height:2,width:`${pct}%`,background:"linear-gradient(90deg,#C9A84C,#E8C87A)",transition:"width 0.4s ease"}}/>
      </div>

      <div style={{padding:"28px 28px 60px",maxWidth:640,margin:"0 auto"}}>

        {/* ÉTAPE 1 — Identité */}
        {step===1&&(
          <div className="fade-up">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,marginBottom:6}}>
              Qui es-<em style={{color:"#C9A84C",fontStyle:"italic"}}>tu ?</em>
            </div>
            <div style={{fontSize:12,color:"#555",marginBottom:24}}>Quelques infos pour personnaliser ton programme.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,marginBottom:1}}>
              <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
                <Label>Prénom</Label><input style={inputStyle} placeholder="ex. Sarah" value={form.prenom} onChange={inp("prenom")}/>
              </div>
              <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
                <Label>Âge</Label><input style={inputStyle} type="number" placeholder="ex. 28" value={form.age} onChange={inp("age")}/>
              </div>
            </div>
            <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424",marginBottom:1}}>
              <Label>Email</Label><input style={inputStyle} type="email" placeholder="ton@email.com" value={form.email} onChange={inp("email")}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,marginBottom:1}}>
              <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
                <Label>Genre</Label>
                <select style={{...inputStyle,cursor:"pointer"}} value={form.genre} onChange={inp("genre")}>
                  <option value="">—</option><option>Homme</option><option>Femme</option><option>Autre</option>
                </select>
              </div>
              <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
                <Label>Poids (kg)</Label><input style={inputStyle} type="number" placeholder="ex. 68" value={form.poids} onChange={inp("poids")}/>
              </div>
            </div>
            <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
              <Label>Taille (cm)</Label><input style={inputStyle} type="number" placeholder="ex. 165" value={form.taille} onChange={inp("taille")}/>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
              <GoldBtn onClick={()=>{if(!form.prenom||!form.email){alert("Prénom et email requis");return;}setStep(2);}}>Suivant →</GoldBtn>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — Objectifs & entraînement */}
        {step===2&&(
          <div className="fade-up">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,marginBottom:6}}>
              Ton <em style={{color:"#C9A84C",fontStyle:"italic"}}>entraînement</em>
            </div>
            <div style={{fontSize:12,color:"#555",marginBottom:24}}>Ton objectif, ton niveau et ton environnement.</div>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              {chipBlock("obj","Objectif principal")}
              {chipBlock("niv","Niveau actuel")}
              {chipBlock("lieu","Lieu d'entraînement")}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1}}>
                {chipBlock("seances","Séances / semaine")}
                {chipBlock("duree","Durée par séance")}
              </div>
              <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
                <Label>Blessures / contraintes (optionnel)</Label>
                <textarea style={{...inputStyle,minHeight:64,resize:"vertical"}} value={form.contraintes} onChange={inp("contraintes")} placeholder="ex. douleur genou gauche..."/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
              <GoldBtn ghost onClick={()=>setStep(1)}>← Retour</GoldBtn>
              <GoldBtn onClick={()=>setStep(3)}>Suivant →</GoldBtn>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — Mode de vie */}
        {step===3&&(
          <div className="fade-up">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,marginBottom:6}}>
              Mode de <em style={{color:"#C9A84C",fontStyle:"italic"}}>vie</em>
            </div>
            <div style={{fontSize:12,color:"#555",marginBottom:24}}>Pour un programme qui s'adapte à ta réalité.</div>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              {chipBlock("regime","Alimentation")}
              <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
                <Label>Ta motivation profonde (optionnel)</Label>
                <textarea style={{...inputStyle,minHeight:64,resize:"vertical"}} value={form.motivation} onChange={inp("motivation")} placeholder="ex. me sentir bien dans mon corps..."/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
              <GoldBtn ghost onClick={()=>setStep(2)}>← Retour</GoldBtn>
              <GoldBtn onClick={()=>setStep(4)}>Voir le récap →</GoldBtn>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 — Récapitulatif */}
        {step===4&&(
          <div className="fade-up">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,marginBottom:6}}>
              Tout est <em style={{color:"#C9A84C",fontStyle:"italic"}}>prêt</em>
            </div>
            <div style={{fontSize:12,color:"#555",marginBottom:24}}>Vérifie tes infos avant de générer.</div>
            {[
              {title:"Identité",    rows:[["Prénom",form.prenom],["Âge",form.age+" ans"],["Email",form.email],["Genre",form.genre]]},
              {title:"Programme",  rows:[["Objectif",sel.obj],["Niveau",sel.niv],["Lieu",sel.lieu],["Séances",sel.seances+" / sem"],["Durée",sel.duree]]},
              {title:"Mode de vie",rows:[["Régime",sel.regime],["Contraintes",form.contraintes||"—"],["Motivation",form.motivation||"—"]]},
            ].map(section=>(
              <div key={section.title} style={{background:"#111",border:"0.5px solid #242424",padding:"16px",marginBottom:1}}>
                <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:12}}>{section.title}</div>
                {section.rows.filter(r=>r[1]).map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"0.5px solid #242424",fontSize:13}}>
                    <span style={{color:"#555"}}>{k}</span>
                    <span style={{color:"#F0EDE8",fontWeight:500,maxWidth:"55%",textAlign:"right"}}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{background:"#181818",border:"0.5px solid #C9A84C",padding:"14px 16px",marginTop:1,fontSize:12,color:"#555"}}>
              📧 Programme envoyé à <strong style={{color:"#E8C87A"}}>{form.email}</strong>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
              <GoldBtn ghost onClick={()=>setStep(3)}>← Modifier</GoldBtn>
              <GoldBtn onClick={handleGenerate} loading={status==="generating"||status==="sending"}>
                {status==="generating"?"Génération IA...":status==="sending"?"Envoi email...":"⚡ Générer & Envoyer"}
              </GoldBtn>
            </div>
            {errMsg&&<div style={{marginTop:16,padding:"12px 16px",background:"#1A0808",border:"0.5px solid #5A1A1A",color:"#E07070",fontSize:13,fontFamily:"monospace"}}>✕ {errMsg}</div>}
          </div>
        )}

        {/* ÉTAPE 5 — Succès */}
        {step===5&&status==="done"&&(
          <div className="fade-up" style={{textAlign:"center",paddingTop:20}}>
            <div style={{width:56,height:56,background:"linear-gradient(135deg,#C9A84C,#A67C2E)",borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>✓</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,marginBottom:8}}>
              Programme <em style={{color:"#C9A84C",fontStyle:"italic"}}>envoyé !</em>
            </div>
            <div style={{fontSize:13,color:"#555",marginBottom:32,lineHeight:1.8}}>
              {form.prenom}, ton programme a été envoyé à<br/><strong style={{color:"#E8C87A"}}>{form.email}</strong>
            </div>
            <div style={{background:"#111",border:"0.5px solid #242424",padding:"20px",textAlign:"left",marginBottom:24}}>
              <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:12}}>Aperçu du programme</div>
              <div style={{fontFamily:"monospace",fontSize:12,lineHeight:2,color:"#888",whiteSpace:"pre-wrap",maxHeight:300,overflow:"auto"}}>{prog}</div>
            </div>
            <button onClick={()=>router.push("/")} style={{background:"transparent",border:"0.5px solid #242424",
              color:"#555",fontFamily:"'Syne',sans-serif",fontSize:12,letterSpacing:"2px",
              textTransform:"uppercase",padding:"11px 24px",cursor:"pointer"}}>
              Retour à l'accueil →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BilanPage() {
  return (
    <Suspense fallback={<div style={{background:"#0A0A0A",minHeight:"100vh"}}/>}>
      <BilanForm/>
    </Suspense>
  );
}
