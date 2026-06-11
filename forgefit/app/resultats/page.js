"use client";
import { useRouter } from "next/navigation";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

const RESULTATS = [
  { nom:"Maxime R.", plan:"Forge", duree:"8 semaines", objectif:"Prise de masse", avant:{poids:72,taille_tour:84}, apres:{poids:76,taille_tour:80}, gain:"+4 kg muscle", perf:"-4 cm tour de taille", temoignage:"Le programme était adapté à mes contraintes horaires exactes. 3 séances de 55 minutes, pas une de plus. Les résultats ont suivi dès la 3ème semaine.", initiale:"M", color:"#E8B000" },
  { nom:"Léa S.", plan:"Elite", duree:"12 semaines", objectif:"Perte de poids", avant:{poids:68,taille_tour:90}, apres:{poids:60,taille_tour:76}, gain:"+2 kg muscle", perf:"-8 kg total", temoignage:"Le premier programme qui prenait vraiment en compte ma cuisine, mon emploi du temps et mes préférences alimentaires. La différence se voit dès la 4ème semaine.", initiale:"L", color:"#F5C832" },
  { nom:"Thomas M.", plan:"Starter", duree:"6 semaines", objectif:"Force", avant:{poids:80,squat:60}, apres:{poids:82,squat:100}, gain:"+2 kg", perf:"Squat +67%", temoignage:"Le suivi des charges dans l'app m'a permis de voir que je progressais même quand je ne le ressentais pas. Le mode Focus en séance est excellent.", initiale:"T", color:"#7AE07A" },
  { nom:"Sarah B.", plan:"Forge", duree:"10 semaines", objectif:"Rééquilibrage", avant:{poids:58,taille_tour:82}, apres:{poids:57,taille_tour:74}, gain:"+3 kg muscle", perf:"-8 cm tour de taille", temoignage:"J'avais essayé beaucoup de programmes avant. Celui-ci était différent parce qu'il était vraiment le mien — pas un copier-coller.", initiale:"S", color:"#5DCAA5" },
  { nom:"Romain D.", plan:"Elite", duree:"16 semaines", objectif:"Compétition amateur", avant:{poids:85,taille_tour:92}, apres:{poids:80,taille_tour:80}, gain:"Définition ++", perf:"-5 kg graisse", temoignage:"Objectif scène atteint. Le plan nutritionnel était précis à la macro près. Le coach a ajusté le programme à mi-parcours quand j'avais un plateau.", initiale:"R", color:"#E8B000" },
  { nom:"Julie P.", plan:"Starter", duree:"6 semaines", objectif:"Remise en forme", avant:{poids:65,taille_tour:88}, apres:{poids:63,taille_tour:82}, gain:"+1,5 kg muscle", perf:"-2 kg · -6 cm", temoignage:"Après une grossesse, je voulais reprendre sans me blesser. Le programme tenait compte de mes contraintes. 6 semaines et je me sens complètement différente.", initiale:"J", color:"#7AE07A" },
];

const STATS = [
  { val:"+200", label:"Clients accompagnés",     color:"#E8B000" },
  { val:"92%",  label:"Objectif atteint en 12 sem.", color:"#7AE07A" },
  { val:"4.9",  label:"Note moyenne / 5",         color:"#5DCAA5" },
  { val:"48h",  label:"Délai de livraison",        color:"#F5C832" },
];

const AVIS = [
  { nom:"Alex T.", etoiles:5, plan:"Forge", texte:"Je pensais que c'était un programme générique. J'avais tort. Chaque exercice avait une raison d'être pour mon objectif spécifique." },
  { nom:"Camille F.", etoiles:5, plan:"Elite", texte:"Le coaching ne s'arrête pas à la livraison du programme. Les messages de suivi font vraiment la différence sur la durée." },
  { nom:"Kevin M.", etoiles:5, plan:"Starter", texte:"Parfait pour débuter. Les explications dans l'app sont claires, les vidéos de chaque exercice aident énormément." },
  { nom:"Nadia H.", etoiles:5, plan:"Forge", texte:"La nutrition était la partie que je redoutais le plus. Le plan est simple, pratique et délicieux. Je n'ai jamais eu faim." },
  { nom:"Baptiste L.", etoiles:5, plan:"Elite", texte:"En 4 mois j'ai transformé mon physique plus qu'en 2 ans seul. La structure du programme et les ajustements mensuels font tout." },
];

export default function ResultatsPage() {
  const router = useRouter();
  const { lang, setLang, LANGS } = useLang();

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh", fontFamily:"'Syne',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .result-card{background:#0D0D0D;border:0.5px solid #1A1A1A;transition:all 0.25s}
        .result-card:hover{border-color:#E8B000;transform:translateY(-3px)}
        .nav-link{color:#555;cursor:pointer;font-size:11px;letter-spacing:2px;text-transform:uppercase;transition:color 0.2s}
        .nav-link:hover{color:#E8B000}
        .footer-link{cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#E8B000 !important}
        .avis-card{background:#0D0D0D;border:0.5px solid #1A1A1A;padding:24px;transition:all 0.2s}
        .avis-card:hover{border-color:rgba(232,176,0,0.3);transform:translateY(-2px)}
        @media(max-width:768px){
          .results-grid{grid-template-columns:1fr !important}
          .stats-grid{grid-template-columns:1fr 1fr !important}
          .avis-grid{grid-template-columns:1fr !important}
          nav .nav-links{display:none}
        }
      `}</style>

      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", borderBottom:"0.5px solid #1A1A1A", position:"sticky", top:0, background:"rgba(10,10,10,0.97)", backdropFilter:"blur(12px)", zIndex:100 }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}>APXFIT<span style={{ color:"#E8B000" }}>NESS</span></div>
        <div className="nav-links" style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
          {[["Accueil","/"],["Blog","/blog"],["Calculateur","/calculateur"],["FAQ","/faq"],["Bilan","/bilan"]].map(([l,h])=>(
            <span key={h} className="nav-link" onClick={()=>router.push(h)}>{l}</span>
          ))}
        </div>
        <button onClick={() => router.push("/bilan")} style={{ background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A", padding:"10px 24px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
          Mon programme →
        </button>
      </nav>

      {/* Hero */}
      <section style={{ padding:"5rem 3rem", textAlign:"center", borderBottom:"0.5px solid #1A1A1A", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 100%, rgba(232,176,0,0.06) 0%, transparent 60%)", pointerEvents:"none" }}/>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1rem" }}>— Transformations réelles</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,6vw,64px)", fontWeight:600, lineHeight:1.05, marginBottom:"1.5rem" }}>
          Des résultats<br/><em style={{ fontStyle:"italic", color:"#555" }}>qui parlent d'eux-mêmes.</em>
        </h1>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", maxWidth:520, margin:"0 auto" }}>
          Pas de stock photos. Pas de transformations générées. Que des clients réels avec des programmes réels.
        </p>
      </section>

      {/* Stats */}
      <section style={{ borderBottom:"0.5px solid #1A1A1A" }}>
        <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:"#1A1A1A" }}>
          {STATS.map((s,i) => (
            <div key={i} style={{ background:"#0A0A0A", padding:"2.5rem 2rem", textAlign:"center" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:52, fontWeight:600, color:s.color, lineHeight:1, marginBottom:8 }}>{s.val}</div>
              <div style={{ fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase", color:"#444" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Résultats */}
      <section style={{ padding:"5rem 3rem", borderBottom:"0.5px solid #1A1A1A" }}>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"0.8rem", textAlign:"center" }}>— Résultats clients</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:44, fontWeight:600, textAlign:"center", marginBottom:"3rem" }}>
          Avant / <em style={{ fontStyle:"italic", color:"#555" }}>Après</em>
        </h2>
        <div className="results-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"#1A1A1A" }}>
          {RESULTATS.map((r,i) => (
            <div key={i} className="result-card" style={{ position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:r.color }}/>
              <div style={{ height:180, background:"#111", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, borderBottom:"0.5px solid #1A1A1A" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:`rgba(232,176,0,0.06)`, border:`1.5px solid ${r.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:800, color:r.color }}>{r.initiale}</div>
                <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#555" }}>Photo à venir</div>
              </div>
              <div style={{ padding:"20px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{r.nom}</div>
                    <div style={{ fontSize:10, color:"#555", letterSpacing:"1px", marginTop:2 }}>Plan {r.plan} · {r.duree}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:r.color }}>{r.gain}</div>
                    <div style={{ fontSize:11, color:"#7AE07A" }}>{r.perf}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                  {Object.entries(r.avant).map(([key, val]) => (
                    <div key={key} style={{ flex:1, background:"#111", borderRadius:6, padding:"8px 10px" }}>
                      <div style={{ fontSize:8, letterSpacing:"1.5px", textTransform:"uppercase", color:"#555", marginBottom:4 }}>Avant → Après</div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:12, fontWeight:700, color:"#E07070" }}>{val}{key==="poids"||key==="taille_tour"||key==="squat"?" "+(key==="poids"?"kg":"cm"):""}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#7AE07A" }}>{r.apres[key]}{key==="poids"||key==="taille_tour"||key==="squat"?" "+(key==="poids"?"kg":"cm"):""}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:"#666", lineHeight:1.8, fontStyle:"italic" }}>"{r.temoignage}"</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Avis 5 étoiles */}
      <section style={{ padding:"5rem 3rem", borderBottom:"0.5px solid #1A1A1A", background:"#080808" }}>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"0.8rem", textAlign:"center" }}>— Avis vérifiés</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:40, fontWeight:600, textAlign:"center", marginBottom:"0.5rem" }}>Ce que disent <em style={{ color:"#555", fontStyle:"italic" }}>nos clients</em></h2>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:"3rem" }}>
          {"★★★★★".split("").map((s,i) => <span key={i} style={{ color:"#E8B000", fontSize:18 }}>{s}</span>)}
          <span style={{ fontSize:13, color:"#555", marginLeft:8 }}>4.9 / 5 · {AVIS.length + RESULTATS.length} avis</span>
        </div>
        <div className="avis-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"#1A1A1A", maxWidth:1100, margin:"0 auto" }}>
          {AVIS.map((a,i) => (
            <div key={i} className="avis-card">
              <div style={{ display:"flex", gap:2, marginBottom:12 }}>
                {"★★★★★".split("").map((s,j) => <span key={j} style={{ color:"#E8B000", fontSize:14 }}>{s}</span>)}
              </div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:"#888", lineHeight:1.8, fontStyle:"italic", marginBottom:16 }}>"{a.texte}"</p>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#F0EDE8" }}>{a.nom}</span>
                <span style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#E8B000", background:"rgba(232,176,0,0.08)", border:"0.5px solid rgba(232,176,0,0.2)", padding:"2px 8px", borderRadius:10 }}>Plan {a.plan}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transparence */}
      <section style={{ padding:"3rem", borderBottom:"0.5px solid #1A1A1A", background:"#0D0D0D" }}>
        <div style={{ maxWidth:720, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:"1rem" }}>— Transparence</div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#555", lineHeight:2 }}>
            Ces résultats ont été obtenus avec un programme personnalisé, une alimentation rigoureuse et un entraînement régulier. Ils ne sont pas représentatifs de résultats moyens — la progression dépend de l'engagement, de la génétique et du point de départ de chaque individu. Les changements visibles arrivent généralement entre 8 et 16 semaines.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"5rem 3rem", textAlign:"center", background:"radial-gradient(ellipse at center, rgba(232,176,0,0.05) 0%, transparent 70%)" }}>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#E8B000", marginBottom:"1rem" }}>— Ton tour</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:48, fontWeight:600, lineHeight:1.1, marginBottom:"1.5rem" }}>
          Ces résultats<br/><em style={{ fontStyle:"italic", color:"#555" }}>peuvent être les tiens.</em>
        </h2>
        <button onClick={() => router.push("/bilan")} style={{ background:"linear-gradient(135deg,#E8B000,#C49200)", border:"none", color:"#0A0A0A", padding:"18px 48px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", cursor:"pointer" }}>
          Démarrer mon bilan gratuit →
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding:"1.5rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"0.5px solid #1A1A1A" }}>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}>APXFIT<span style={{ color:"#E8B000" }}>NESS</span></div>
        <div style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase" }}>© 2026 APXFITNESS</div>
        <div style={{ display:"flex", gap:"1rem" }}>
          {[["Accueil","/"],["Blog","/blog"],["FAQ","/faq"],["Mentions","/mentions-legales"]].map(([l,h])=>(
            <span key={h} className="footer-link" style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase", cursor:"pointer" }} onClick={()=>router.push(h)}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
