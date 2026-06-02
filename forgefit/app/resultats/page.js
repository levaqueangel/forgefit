"use client";
import { useRouter } from "next/navigation";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

// Résultats placeholder (à remplacer par vraies photos)
const RESULTATS = [
  {
    nom: "Maxime R.",
    plan: "Forge",
    duree: "8 semaines",
    objectif: "Prise de masse",
    avant: { poids: 72, taille_tour: 84 },
    apres:  { poids: 76, taille_tour: 80 },
    gain_muscle: "+4 kg",
    perte_gras: "-4 cm taille",
    temoignage: "Le programme etait adapte a mes contraintes horaires exactes. 3 seances de 55 minutes, pas une de plus.",
    initiale: "M",
    color: "#C9A84C",
  },
  {
    nom: "Lea S.",
    plan: "Elite",
    duree: "12 semaines",
    objectif: "Perte de poids",
    avant: { poids: 68, taille_tour: 90 },
    apres:  { poids: 60, taille_tour: 76 },
    gain_muscle: "+2 kg muscle",
    perte_gras: "-8 kg",
    temoignage: "Le premier programme qui prenait vraiment en compte ma cuisine, mon emploi du temps. La difference se voit des la 4eme semaine.",
    initiale: "L",
    color: "#E8C87A",
  },
  {
    nom: "Thomas M.",
    plan: "Starter",
    duree: "6 semaines",
    objectif: "Force",
    avant: { poids: 80, squat: 60 },
    apres:  { poids: 82, squat: 100 },
    gain_muscle: "+2 kg",
    perte_gras: "Squat +67%",
    temoignage: "Le suivi des charges dans l app m a permis de voir que je progressais meme quand je ne le sentais pas.",
    initiale: "T",
    color: "#7AE07A",
  },
];

const STATS = [
  { val: "+200", label: "Clients accompagnes",    color: "#C9A84C" },
  { val: "92%",  label: "Objectif atteint 12 sem.",color: "#7AE07A" },
  { val: "4.9",  label: "Note moyenne / 5",        color: "#5DCAA5" },
  { val: "48h",  label: "Delai de livraison",      color: "#E8C87A" },
];

export default function ResultatsPage() {
  const router = useRouter();
  const { lang, setLang, LANGS } = useLang();

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh", fontFamily:"'Syne',sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .result-card{background:#0D0D0D;border:0.5px solid #1A1A1A;transition:all 0.25s}
        .result-card:hover{border-color:#C9A84C;transform:translateY(-3px)}
        .nav-link{color:#555;cursor:pointer;font-size:11px;letter-spacing:2px;text-transform:uppercase;transition:color 0.2s}
        .nav-link:hover{color:#C9A84C}
        .footer-link{cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#C9A84C !important}
        @media(max-width:768px){
          .results-grid{grid-template-columns:1fr !important}
          .stats-grid{grid-template-columns:1fr 1fr !important}
        }
      `}</style>

      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 28px", borderBottom:"0.5px solid #1A1A1A", position:"sticky", top:0, background:"rgba(10,10,10,0.97)", backdropFilter:"blur(12px)", zIndex:100 }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color:"#C9A84C" }}>NESS</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
          {[["Accueil","/"],["Blog","/blog"],["Calculateur","/calculateur"],["Bilan","/bilan"]].map(([l,h])=>(
            <span key={h} className="nav-link" onClick={()=>router.push(h)}>{l}</span>
          ))}
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS}/>
          <button onClick={() => router.push("/bilan")} style={{ background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none", color:"#0A0A0A", padding:"10px 24px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}>
            Mon programme →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding:"5rem 3rem", textAlign:"center", borderBottom:"0.5px solid #1A1A1A", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.06) 0%, transparent 60%)", pointerEvents:"none" }}/>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#C9A84C", marginBottom:"1rem" }}>— Transformations reelles</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,6vw,64px)", fontWeight:600, lineHeight:1.05, marginBottom:"1.5rem" }}>
          Des resultats<br/><em style={{ fontStyle:"italic", color:"#555" }}>qui parlent d eux-memes.</em>
        </h1>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#555", maxWidth:520, margin:"0 auto" }}>
          Pas de stock photos. Pas de transformations generees. Que des clients reels avec des programmes reels.
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

      {/* Resultats */}
      <section style={{ padding:"5rem 3rem", borderBottom:"0.5px solid #1A1A1A" }}>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#C9A84C", marginBottom:"0.8rem", textAlign:"center" }}>— Resultats clients</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:44, fontWeight:600, textAlign:"center", marginBottom:"3rem" }}>
          Avant / <em style={{ fontStyle:"italic", color:"#555" }}>Apres</em>
        </h2>

        <div className="results-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"#1A1A1A" }}>
          {RESULTATS.map((r,i) => (
            <div key={i} className="result-card" style={{ position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:r.color }}/>

              {/* Photo placeholder — a remplacer par vraies photos */}
              <div style={{ height:220, background:"#111", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, borderBottom:"0.5px solid #1A1A1A" }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:`rgba(${r.color==="#C9A84C"?"201,168,76":r.color==="#E8C87A"?"232,200,122":"122,224,122"},0.1)`, border:`1.5px solid ${r.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:r.color }}>
                  {r.initiale}
                </div>
                <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#333" }}>Photo a venir</div>
              </div>

              {/* Infos */}
              <div style={{ padding:"20px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#F0EDE8" }}>{r.nom}</div>
                    <div style={{ fontSize:10, color:"#555", letterSpacing:"1px", marginTop:2 }}>Plan {r.plan} · {r.duree}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.gain_muscle}</div>
                    <div style={{ fontSize:10, color:"#7AE07A" }}>{r.perte_gras}</div>
                  </div>
                </div>

                {/* Stats avant/apres */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
                  {Object.entries(r.avant).map(([key, val]) => (
                    <div key={key} style={{ background:"#111", borderRadius:8, padding:"8px 10px" }}>
                      <div style={{ fontSize:8, letterSpacing:"1.5px", textTransform:"uppercase", color:"#444", marginBottom:4 }}>Avant · {key.replace("_"," ")}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"#E07070" }}>{val}{key==="poids"?" kg":key==="taille_tour"?" cm":key==="squat"?" kg":""}</span>
                        <span style={{ fontSize:11, color:"#7AE07A", fontWeight:700 }}>
                          {r.apres[key]}{key==="poids"?" kg":key==="taille_tour"?" cm":key==="squat"?" kg":""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:"#666", lineHeight:1.8, fontStyle:"italic" }}>
                  "{r.temoignage}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Avertissement honnete */}
      <section style={{ padding:"3rem", borderBottom:"0.5px solid #1A1A1A", background:"#0D0D0D" }}>
        <div style={{ maxWidth:720, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:"1rem" }}>— Transparence</div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#555", lineHeight:2 }}>
            Ces resultats ont ete obtenus avec un programme personnalise, une alimentation rigoureuse et un entrainement regulier. Ils ne sont pas representatifs de resultats moyens — la progression depend de l engagement, de la genetique et du point de depart de chaque individu. Les changements visibles arrivent generalement entre 8 et 16 semaines.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"5rem 3rem", textAlign:"center", background:"radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)" }}>
        <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#C9A84C", marginBottom:"1rem" }}>— Ton tour</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:48, fontWeight:600, lineHeight:1.1, marginBottom:"1.5rem" }}>
          Ces resultats<br/><em style={{ fontStyle:"italic", color:"#555" }}>peuvent etre les tiens.</em>
        </h2>
        <button onClick={() => router.push("/bilan")} style={{ background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none", color:"#0A0A0A", padding:"18px 48px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", cursor:"pointer" }}>
          Demarrer mon bilan gratuit →
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding:"1.5rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"0.5px solid #1A1A1A" }}>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:5, cursor:"pointer" }} onClick={() => router.push("/")}>APXFIT<span style={{ color:"#C9A84C" }}>NESS</span></div>
        <div style={{ fontSize:11, letterSpacing:"2px", color:"#333", textTransform:"uppercase" }}>© 2026 APXFITNESS</div>
        <div style={{ display:"flex", gap:"1rem" }}>
          {[["Accueil","/"],["Blog","/blog"],["FAQ","/faq"],["Mentions","/mentions-legales"]].map(([l,h])=>(
            <span key={h} className="footer-link" style={{ fontSize:11, letterSpacing:"2px", color:"#555", textTransform:"uppercase" }} onClick={()=>router.push(h)}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
