"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function calcBMR(poids, taille, age, genre) {
  if (genre === "femme") return 447.593 + (9.247*poids) + (3.098*taille) - (4.330*age);
  return 88.362 + (13.397*poids) + (4.799*taille) - (5.677*age);
}

const CALC_ACTIVITY = [
  { label: "Sédentaire", mult: 1.2 },
  { label: "Légèrement actif (1-2/sem)", mult: 1.375 },
  { label: "Modérément actif (3-4/sem)", mult: 1.55 },
  { label: "Très actif (5-6/sem)", mult: 1.65 },
  { label: "Extrêmement actif", mult: 1.725 },
];

const CALC_GOALS = [
  { id:"perte",  label:"Perte de gras",  delta:-400 },
  { id:"recomp", label:"Remise en forme", delta:0 },
  { id:"masse",  label:"Prise de masse", delta:250 },
];

export function InlineCalculateur({ T, theme }) {
  const router = useRouter();

  useEffect(() => {
    const els = document.querySelectorAll('.calc-reveal,.calc-reveal-l,.calc-reveal-r,.calc-reveal-scale');
    const obs = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('calc-visible'); obs.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const [genre, setGenre] = useState("homme");
  const [activite, setActivite] = useState(2);
  const [objectif, setObjectif] = useState("recomp");
  const [poids, setPoids] = useState(75);
  const [taille, setTaille] = useState(175);
  const [age, setAge] = useState(25);
  const [result, setResult] = useState(null);

  const calculate = () => {
    const bmr = calcBMR(poids, taille, age, genre);
    const tdee = Math.round(bmr * CALC_ACTIVITY[activite].mult);
    const goal = CALC_GOALS.find(g => g.id === objectif);
    const calories = Math.round((tdee + goal.delta) / 50) * 50;
    const imc = poids / ((taille/100)**2);
    let proteines, lipides;
    if (objectif==="perte")  { proteines=Math.round(poids*2.2); lipides=Math.round(poids*0.8); }
    else if (objectif==="masse") { proteines=Math.round(poids*2.0); lipides=Math.round(poids*1.0); }
    else { proteines=Math.round(poids*1.8); lipides=Math.round(poids*0.9); }
    const glucides = Math.round(Math.max(0, calories - proteines*4 - lipides*9)/4);
    setResult({ calories, imc: imc.toFixed(1), proteines, glucides, lipides, tdee: Math.round(tdee) });
  };

  const imcColor = result ? (result.imc<18.5?"#88A0E0":result.imc<25?"#7AE07A":result.imc<30?"#F5C832":"#E07070") : "#E8B000";
  const imcLabel = result ? (result.imc<18.5?"Sous-poids":result.imc<25?"Poids normal":result.imc<30?"Surpoids":"Obésité") : "";

  return (
    <div style={{padding:"5rem clamp(2rem,6vw,5rem)", maxWidth:1400, margin:"0 auto"}}>
      <div className="calc-reveal" style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:"1.5rem",marginBottom:"3rem"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:"5px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1rem"}}>— Outil gratuit</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(32px,5vw,72px)",lineHeight:0.88,textTransform:"uppercase",letterSpacing:"-0.02em",color:T.fg}}>
            CALCULATEUR<br/><span style={{color:"#E8B000"}}>MÉTABOLIQUE.</span>
          </h2>
        </div>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:T.muted,maxWidth:300,lineHeight:1.9}}>
          Découvre tes besoins caloriques réels et tes macros optimales en 30 secondes.
        </p>
      </div>

      <div className="calc-inputs-grid calc-reveal-scale" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:1,background:T.border}}>
        <div className="calc-reveal-l" style={{background:T.bg,padding:"2rem",animationDelay:"0.1s"}}>
          <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1.5rem"}}>01 — Profil</div>
          <div style={{marginBottom:"1.5rem"}}>
            <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Genre</div>
            <div style={{display:"flex",gap:6}}>
              {[["homme","Homme"],["femme","Femme"]].map(([v,l])=>(
                <button key={v} onClick={()=>setGenre(v)} style={{
                  flex:1,padding:"10px 6px",
                  background:genre===v?"rgba(232,176,0,0.12)":T.card,
                  border:`0.5px solid ${genre===v?"#E8B000":T.border}`,
                  color:genre===v?"#E8B000":T.muted,
                  fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"1px",cursor:"pointer",transition:"all 0.2s",
                }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Objectif</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {CALC_GOALS.map(g=>(
                <button key={g.id} onClick={()=>setObjectif(g.id)} style={{
                  padding:"11px 12px",textAlign:"left",
                  background:objectif===g.id?"rgba(232,176,0,0.1)":T.card,
                  border:`0.5px solid ${objectif===g.id?"#E8B000":T.border}`,
                  color:objectif===g.id?"#E8B000":T.muted,
                  fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.5px",
                  cursor:"pointer",transition:"all 0.2s",
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                }}>
                  {g.label}
                  {objectif===g.id&&<span style={{fontSize:9,color:"#E8B000"}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="calc-reveal" style={{background:T.bg2,padding:"2rem",animationDelay:"0.2s"}}>
          <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1.5rem"}}>02 — Mesures</div>
          {[
            {label:"Poids",  value:poids,  setValue:setPoids,  min:40, max:150, unit:"kg", step:0.5},
            {label:"Taille", value:taille, setValue:setTaille, min:140, max:220, unit:"cm"},
            {label:"Âge",    value:age,    setValue:setAge,    min:14, max:80,  unit:"ans"},
          ].map(({label,value,setValue,min,max,unit,step=1})=>(
            <div key={label} style={{marginBottom:"1.5rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                <span style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:T.muted}}>{label}</span>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,color:"#E8B000",lineHeight:1}}>
                  {value}<span style={{fontSize:10,color:T.muted,fontWeight:400,marginLeft:3}}>{unit}</span>
                </span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={e=>setValue(parseFloat(e.target.value))}
                style={{width:"100%",accentColor:"#E8B000",cursor:"pointer",margin:"4px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:9,color:"#333"}}>{min}</span>
                <span style={{fontSize:9,color:"#333"}}>{max}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="calc-reveal-r" style={{background:T.bg,padding:"2rem",animationDelay:"0.3s"}}>
          <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"1.5rem"}}>03 — Activité</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {CALC_ACTIVITY.map((a,i)=>(
              <button key={i} onClick={()=>setActivite(i)} style={{
                padding:"12px 14px",textAlign:"left",
                background:activite===i?"rgba(232,176,0,0.1)":T.card,
                border:`0.5px solid ${activite===i?"#E8B000":T.border}`,
                color:activite===i?"#E8B000":T.muted,
                fontFamily:"'Syne',sans-serif",fontSize:11,letterSpacing:"0.3px",
                cursor:"pointer",transition:"all 0.2s",
                display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,
              }}>
                <span>{a.label}</span>
                <span style={{fontSize:10,color:activite===i?"rgba(232,176,0,0.6)":"#333",flexShrink:0}}>×{a.mult}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={calculate} className="calc-reveal" style={{
        width:"100%",padding:"18px",
        background:"linear-gradient(135deg,#E8B000,#C49200)",
        border:"none",color:"#0A0A0A",
        fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,
        letterSpacing:"4px",textTransform:"uppercase",cursor:"pointer",
        boxShadow:"0 4px 24px rgba(232,176,0,0.2)",transition:"all 0.3s",
        marginTop:1,
      }}>
        Calculer mes besoins →
      </button>

      {result && (
        <div className="calc-reveal-scale" style={{marginTop:1,animation:"fadeUp 0.5s ease both"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:1,background:T.border}} className="calc-results-grid">
            <div style={{background:T.card,padding:"2rem",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#E8B000,#F5C832)"}}/>
              <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:"#E8B000",marginBottom:"0.75rem"}}>Calories / jour</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(48px,5vw,80px)",color:"#E8B000",lineHeight:0.9,marginBottom:8}}>
                {result.calories.toLocaleString()}
              </div>
              <div style={{fontSize:11,color:T.muted}}>TDEE {result.tdee.toLocaleString()} kcal</div>
              <div style={{fontSize:10,color:"rgba(232,176,0,0.7)",marginTop:4}}>{CALC_GOALS.find(g=>g.id===objectif)?.label}</div>
            </div>
            {[
              {label:"Protéines",val:result.proteines,sub:"grammes",color:"#7AE07A"},
              {label:"Glucides", val:result.glucides, sub:"grammes",color:"#E8B000"},
              {label:"Lipides",  val:result.lipides,  sub:"grammes",color:"#5DCAA5"},
              {label:"IMC",      val:result.imc,      sub:imcLabel, color:imcColor},
            ].map((m,i)=>(
              <div key={i} style={{background:T.bg2,padding:"2rem",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                <div style={{fontSize:9,letterSpacing:"3px",textTransform:"uppercase",color:T.muted,marginBottom:"0.5rem"}}>{m.label}</div>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:36,color:m.color,lineHeight:0.9}}>{m.val}</div>
                  <div style={{fontSize:9,color:m.label==="IMC"?m.color:T.muted,marginTop:6}}>{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:T.bg2,borderTop:`0.5px solid rgba(232,176,0,0.15)`,padding:"2rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1.5rem"}}>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:T.fg,lineHeight:1.5}}>
                Ces chiffres sont un point de départ — un programme sur mesure va bien plus loin.
              </div>
              <div style={{fontSize:11,color:T.muted,marginTop:4}}>Historique, équipement, contraintes, progressions sur 12 semaines.</div>
            </div>
            <button onClick={()=>router.push("/bilan")} style={{
              background:"linear-gradient(135deg,#E8B000,#C49200)",border:"none",color:"#0A0A0A",
              padding:"14px 32px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:800,
              letterSpacing:"3px",textTransform:"uppercase",cursor:"pointer",flexShrink:0,
              boxShadow:"0 4px 16px rgba(232,176,0,0.2)",
            }}>
              Obtenir mon programme →
            </button>
          </div>
        </div>
      )}

      <style>{`
        .calc-inputs-grid{grid-template-columns:1fr 1fr 1fr !important}
        .calc-results-grid{grid-template-columns:2fr 1fr 1fr 1fr 1fr !important}
        @media(max-width:900px){
          .calc-inputs-grid{grid-template-columns:1fr !important}
          .calc-results-grid{grid-template-columns:1fr 1fr !important}
        }
        @keyframes calcFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes calcFadeLeft{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes calcFadeRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes calcScaleIn{from{opacity:0;transform:scaleX(0.92) translateY(12px)}to{opacity:1;transform:scaleX(1) translateY(0)}}
        .calc-reveal{opacity:0;transform:translateY(28px)}
        .calc-reveal.calc-visible{animation:calcFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both}
        .calc-reveal-l{opacity:0;transform:translateX(-24px)}
        .calc-reveal-l.calc-visible{animation:calcFadeLeft 0.6s cubic-bezier(0.16,1,0.3,1) both}
        .calc-reveal-r{opacity:0;transform:translateX(24px)}
        .calc-reveal-r.calc-visible{animation:calcFadeRight 0.6s cubic-bezier(0.16,1,0.3,1) both}
        .calc-reveal-scale{opacity:0;transform:scaleX(0.92) translateY(12px)}
        .calc-reveal-scale.calc-visible{animation:calcScaleIn 0.7s cubic-bezier(0.16,1,0.3,1) both}
      `}</style>
    </div>
  );
}
