"use client";
import { useRouter } from "next/navigation";

const G = {
  dark:"#0A0A0A", dark2:"#111111", dark3:"#181818",
  border:"#242424", gold:"#C9A84C", goldL:"#E8C87A",
  text:"#F0EDE8", muted:"#555555", mut2:"#888888",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .card-hover{transition:all 0.2s ease}
  .card-hover:hover{border-color:#C9A84C!important;transform:translateY(-3px)}
  .btn-hover{transition:opacity 0.2s}
  .btn-hover:hover{opacity:0.85}
`;

const PLANS = [
  {
    id:"starter", name:"Starter", price:49, tag:null,
    desc:"Idéal pour démarrer avec une base solide.",
    features:["Bilan morphologique complet","Programme 4 semaines sur mesure","Plan nutritionnel de base","Livraison par email sous 48h"],
  },
  {
    id:"forge", name:"Forge", price:129, tag:"⚡ Populaire",
    desc:"Le plan complet avec suivi sur 3 mois.",
    features:["Tout le plan Starter","Suivi mensuel personnalisé","Réévaluation & ajustements","Messagerie directe coach","Vidéos techniques incluses"],
  },
  {
    id:"elite", name:"Elite", price:249, tag:null,
    desc:"Accompagnement premium sur 6 mois.",
    features:["Tout le plan Forge","Appels visio hebdomadaires","Suivi nutrition avancé","Réponse prioritaire 24h","Programme salle + maison"],
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif"}}>
      <style>{css}</style>

      {/* Nav */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"20px 32px",borderBottom:"0.5px solid #242424",
        position:"sticky",top:0,background:"#0A0A0A",zIndex:100}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:5}}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div style={{display:"flex",gap:"2rem",fontSize:13,letterSpacing:"1px",color:"#555"}}>
          <span style={{cursor:"pointer"}} onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})}>Programmes</span>
          <span style={{cursor:"pointer"}} onClick={()=>document.getElementById("methode").scrollIntoView({behavior:"smooth"})}>Méthode</span>
          <span style={{cursor:"pointer"}} onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})}>Tarifs</span>
        </div>
        <button className="btn-hover" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
          background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",
          padding:"10px 24px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
          letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
          Commencer
        </button>
      </nav>

      {/* Hero */}
      <section style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:"520px",borderBottom:"0.5px solid #242424"}}>
        <div style={{padding:"5rem 3rem",display:"flex",flexDirection:"column",justifyContent:"center",borderRight:"0.5px solid #242424"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"1.5rem"}}>— Coaching sur mesure</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:72,fontWeight:600,lineHeight:0.95,marginBottom:"1.5rem"}}>
            Ton corps.<br/><em style={{fontStyle:"italic",color:"#C9A84C",fontSize:64}}>Ton plan.</em><br/>Tes règles.
          </h1>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#555",lineHeight:1.7,maxWidth:380,marginBottom:"2.5rem"}}>
            Des programmes de musculation et remise en forme conçus uniquement pour toi.
          </p>
          <div style={{display:"flex",gap:"1rem",alignItems:"center"}}>
            <button className="btn-hover" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
              background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",
              padding:"14px 32px",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,
              letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
              Obtenir mon plan ↗
            </button>
            <button onClick={()=>document.getElementById("methode").scrollIntoView({behavior:"smooth"})} style={{
              background:"none",border:"none",color:"#555",fontFamily:"'Syne',sans-serif",
              fontSize:12,letterSpacing:"1px",cursor:"pointer"}}>
              Voir la méthode →
            </button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateRows:"1fr 1fr",background:"#111"}}>
          {[["100%","Personnalisé pour toi"],["+340","Clients transformés"]].map(([num,label])=>(
            <div key={label} style={{padding:"2.5rem",borderBottom:"0.5px solid #242424",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:80,fontWeight:600,lineHeight:1,color:"#C9A84C"}}>{num}</div>
              <div style={{fontSize:12,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginTop:6}}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Strip */}
      <div style={{overflow:"hidden",borderBottom:"0.5px solid #242424",background:"#C9A84C",padding:"12px 0"}}>
        <div style={{display:"flex",gap:"3rem",animation:"marquee 18s linear infinite",whiteSpace:"nowrap"}}>
          {["Musculation","Perte de poids","Remise en forme","Prise de masse","Cardio ciblé","Tonification","Mobilité",
            "Musculation","Perte de poids","Remise en forme","Prise de masse","Cardio ciblé","Tonification","Mobilité"].map((t,i)=>(
            <span key={i} style={{fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:"#0A0A0A"}}>{t}</span>
          ))}
        </div>
      </div>

      {/* Méthode */}
      <section id="methode" style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"0.5px solid #242424"}}>
        <div style={{padding:"4rem 3rem",borderRight:"0.5px solid #242424"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.5rem"}}>— Comment ça marche</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:600,lineHeight:1.1,marginBottom:"2rem"}}>
            4 étapes vers ta<br/><em style={{fontStyle:"italic",color:"#555"}}>version optimale</em>
          </div>
          {[
            ["01","Choisis ton plan","Sélectionne la formule qui correspond à tes objectifs."],
            ["02","Remplis ton bilan","Un questionnaire complet sur ton corps et tes objectifs."],
            ["03","Reçois ton programme","L'IA génère ton plan et tu le reçois par email sous 48h."],
            ["04","Progresse & évolue","Suis ton programme et reviens pour l'adapter."],
          ].map(([num,title,desc])=>(
            <div key={num} style={{display:"flex",gap:"1.5rem",padding:"1.5rem 0",borderBottom:"0.5px solid #242424"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:600,color:"#242424",lineHeight:1,minWidth:52}}>{num}</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>{title}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#555",lineHeight:1.6}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"4rem 3rem",background:"#111",display:"flex",flexDirection:"column",gap:"2rem",justifyContent:"center"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C"}}>— Ils témoignent</div>
          {[
            ["En 3 mois avec le plan Forge, j'ai perdu 9 kg tout en gagnant en force.","Sarah M. — Plan Forge"],
            ["Le bilan initial a tout changé — j'avais juste besoin d'un plan fait pour MOI.","Thomas K. — Plan Elite"],
            ["Simple, efficace. J'ai enfin un programme que je peux tenir sur la durée.","Camille D. — Plan Starter"],
          ].map(([quote,author])=>(
            <div key={author} style={{padding:"1.5rem",borderLeft:"3px solid #C9A84C"}}>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:"#888",lineHeight:1.7,marginBottom:"0.75rem"}}>{quote}</p>
              <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C"}}>{author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Offres */}
      <section id="offres" style={{padding:"4rem 3rem",borderBottom:"0.5px solid #242424"}}>
        <div style={{textAlign:"center",marginBottom:"3rem"}}>
          <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.5rem"}}>— Nos formules</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:600,lineHeight:1}}>
            Choisis ton niveau<br/><em style={{fontStyle:"italic",color:"#555"}}>d'engagement</em>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"#242424"}}>
          {PLANS.map(plan=>(
            <div key={plan.id} className="card-hover" style={{
              background:plan.tag?"#181818":"#111",padding:"2.5rem 2rem",
              border:`0.5px solid ${plan.tag?"#C9A84C":"#242424"}`,
              display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
              {plan.tag&&<div style={{position:"absolute",top:0,right:0,background:"#C9A84C",color:"#0A0A0A",
                fontSize:10,fontWeight:700,letterSpacing:"2px",padding:"5px 14px",textTransform:"uppercase"}}>{plan.tag}</div>}
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,
                color:plan.tag?"#E8C87A":"#F0EDE8",marginBottom:4}}>{plan.name}</div>
              <div style={{fontSize:12,color:"#555",marginBottom:"1.5rem"}}>{plan.desc}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:56,fontWeight:600,color:"#C9A84C",lineHeight:1,marginBottom:4}}>{plan.price}€</div>
              <div style={{fontSize:11,letterSpacing:"1px",color:"#555",marginBottom:"1.5rem"}}>paiement unique</div>
              <div style={{flex:1,marginBottom:"2rem"}}>
                {plan.features.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",
                    borderBottom:"0.5px solid #242424",fontSize:13,color:"#888"}}>
                    <span style={{color:"#C9A84C"}}>·</span>{f}
                  </div>
                ))}
              </div>
              <button className="btn-hover" onClick={()=>router.push(`/bilan?plan=${plan.id}&price=${plan.price}`)} style={{
                width:"100%",padding:"13px 0",
                background:plan.tag?"linear-gradient(135deg,#C9A84C,#A67C2E)":"transparent",
                border:`0.5px solid ${plan.tag?"#C9A84C":"#242424"}`,
                color:plan.tag?"#0A0A0A":"#888",
                fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
                letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
                Choisir {plan.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"5rem 3rem",textAlign:"center",background:"#C9A84C"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:64,fontWeight:600,color:"#0A0A0A",lineHeight:1,marginBottom:"1rem"}}>
          Prêt à te<br/>forger ?
        </div>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#6B5F3A",marginBottom:"2.5rem"}}>
          Commence par choisir ton plan. Sans engagement.
        </p>
        <button className="btn-hover" onClick={()=>document.getElementById("offres").scrollIntoView({behavior:"smooth"})} style={{
          background:"#0A0A0A",color:"#C9A84C",padding:"16px 48px",
          fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,
          letterSpacing:"3px",textTransform:"uppercase",border:"none",cursor:"pointer"}}>
          Voir les plans →
        </button>
      </section>

      {/* Footer */}
      <footer style={{padding:"2rem 3rem",display:"flex",justifyContent:"space-between",
        alignItems:"center",borderTop:"0.5px solid #242424"}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:5}}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
        <div style={{fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase"}}>© 2026 APXFITNESS — Coaching personnalisé</div>
      </footer>
    </div>
  );
}
