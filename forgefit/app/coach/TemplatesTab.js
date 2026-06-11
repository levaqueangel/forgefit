"use client";
import { useState } from "react";

const PROGRAM_TEMPLATES = [
  {
    name:"Full Body Débutant",freq:"3×/sem",
    color:"#7AE07A",
    desc:"Programme full body 3 séances par semaine. Squat gobelet, développé incliné, tirage vertical, shoulder press. Progression linéaire sur 4 semaines.",
    preview:"Séance A : Squat gobelet 4×12 / Développé incliné 3×12 / Tirage vertical 4×10 / Gainage 3×45s",
  },
  {
    name:"PPL Intermédiaire",freq:"6×/sem",
    color:"#E8B000",
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
    color:"#F5C832",
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

export function TemplatesView({ onSelect }) {
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
        <div style={{fontSize:10,letterSpacing:"4px",textTransform:"uppercase",color:"#E8B000",marginBottom:6}}>— Bibliothèque</div>
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
                  color:t.color,background:`rgba(${t.color==="#7AE07A"?"122,224,122":t.color==="#E8B000"?"232,176,0":t.color==="#5DCAA5"?"93,202,165":t.color==="#F5C832"?"232,200,122":"224,112,112"},0.1)`,
                  padding:"3px 10px",borderRadius:20,fontFamily:"'Syne',sans-serif",
                }}>{t.freq}</span>
                <span style={{fontSize:11,color:copied===i?"#7AE07A":"#444",transition:"color 0.2s"}}>
                  {copied===i?"✓ Copié":"→"}
                </span>
              </div>
            </div>
            <p style={{fontSize:13,color:"#555",lineHeight:1.7,marginBottom:12}}>{t.desc}</p>
            <div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#777",fontFamily:"'Courier New',monospace",lineHeight:1.7}}>
              {t.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
