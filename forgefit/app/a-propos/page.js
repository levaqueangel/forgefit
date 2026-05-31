"use client";
import { useRouter } from "next/navigation";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

export default function APropos() {
  const router = useRouter();
  const { lang, setLang, t, LANGS } = useLang();

  return (
    <div style={{
      background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",
      fontFamily:"'Syne',sans-serif",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-link{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#555;cursor:pointer;transition:color 0.2s;padding:4px 0}
        .nav-link:hover{color:#C9A84C}
        .footer-link{cursor:pointer;transition:color 0.2s}
        .footer-link:hover{color:#C9A84C}
        .val-card{background:#111;border:0.5px solid #1E1E1E;padding:32px;transition:all 0.25s}
        .val-card:hover{border-color:#C9A84C;background:#131313;transform:translateY(-3px)}
        .cert-item{display:flex;align-items:flex-start;gap:14px;padding:16px 0;border-bottom:0.5px solid #141414}
        .cert-item:last-child{border-bottom:none}
        @keyframes lineGrow{from{width:0}to{width:100%}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .a1{animation:fadeUp 0.5s ease 0.1s both}
        .a2{animation:fadeUp 0.5s ease 0.2s both}
        .a3{animation:fadeUp 0.5s ease 0.35s both}
        .a4{animation:fadeUp 0.5s ease 0.5s both}
        .a5{animation:fadeUp 0.5s ease 0.65s both}
        @media(max-width:768px){
          .hero-grid-about{grid-template-columns:1fr !important}
          .values-grid{grid-template-columns:1fr 1fr !important}
          .footer-wrap-about{flex-direction:column !important;gap:1rem !important;text-align:center}
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"1.2rem 3rem",borderBottom:"0.5px solid #1A1A1A",
        position:"sticky",top:0,background:"rgba(10,10,10,0.97)",
        backdropFilter:"blur(12px)",zIndex:100,
      }}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:5,cursor:"pointer"}}
          onClick={()=>router.push("/")}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div style={{display:"flex",gap:"2rem",alignItems:"center"}}>
          <span className="nav-link" onClick={()=>router.push("/")}>Accueil</span>
          <span className="nav-link" onClick={()=>router.push("/blog")}>Blog</span>
          <span className="nav-link" onClick={()=>router.push("/calculateur")}>Calculateur</span>
          <span className="nav-link" onClick={()=>router.push("/faq")}>FAQ</span>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={()=>router.push("/bilan")} style={{
            background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",
            color:"#0A0A0A",padding:"10px 24px",fontFamily:"'Syne',sans-serif",
            fontSize:12,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",
          }}>
            Commencer →
          </button>
        </div>
      </nav>

      {/* ── Ligne dorée ── */}
      <div style={{height:1,background:"linear-gradient(90deg,transparent,#C9A84C,transparent)"}}/>

      {/* ── Hero ── */}
      <section className="hero-grid-about" style={{
        display:"grid",gridTemplateColumns:"1fr 1fr",
        minHeight:480,borderBottom:"0.5px solid #1A1A1A",
      }}>
        {/* Texte gauche */}
        <div style={{
          padding:"5rem 3.5rem",display:"flex",flexDirection:"column",
          justifyContent:"center",borderRight:"0.5px solid #1A1A1A",
        }}>
          <div className="a1" style={{
            fontSize:10,letterSpacing:"4px",textTransform:"uppercase",
            color:"#C9A84C",marginBottom:"1.2rem",
          }}>— À propos du coach</div>

          <h1 className="a2" style={{
            fontFamily:"'Cormorant Garamond',serif",fontSize:60,fontWeight:600,
            lineHeight:1.05,marginBottom:"1.5rem",
          }}>
            Angel<br/>
            <em style={{fontStyle:"italic",color:"#C9A84C"}}>Levaque</em>
          </h1>

          <div className="a3" style={{
            width:48,height:1,
            background:"linear-gradient(90deg,#C9A84C,transparent)",
            marginBottom:"1.5rem",
          }}/>

          <p className="a4" style={{
            fontFamily:"'Cormorant Garamond',serif",fontSize:18,
            color:"#888",lineHeight:1.9,maxWidth:440,
          }}>
            Coach fitness indépendant, j'accompagne chaque client avec un programme
            conçu spécifiquement pour ses objectifs, son niveau et son quotidien.
            Pas de programme générique. Pas de copier-coller.
          </p>

          <div className="a5" style={{marginTop:"2.5rem",display:"flex",gap:12}}>
            <button onClick={()=>router.push("/bilan")} style={{
              background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",
              color:"#0A0A0A",padding:"14px 32px",fontFamily:"'Syne',sans-serif",
              fontSize:12,fontWeight:700,letterSpacing:"2px",
              textTransform:"uppercase",cursor:"pointer",
            }}>
              Démarrer mon bilan →
            </button>
            <button onClick={()=>router.push("/#offres")} style={{
              background:"transparent",border:"0.5px solid #242424",color:"#555",
              padding:"14px 24px",fontFamily:"'Syne',sans-serif",fontSize:12,
              letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",
              transition:"all 0.2s",
            }}>
              Voir les offres
            </button>
          </div>
        </div>

        {/* Stats droite */}
        <div style={{
          display:"grid",gridTemplateRows:"1fr 1fr",
          background:"#0D0D0D",position:"relative",overflow:"hidden",
        }}>
          <div style={{
            position:"absolute",inset:0,
            background:"radial-gradient(circle at 50% 50%,rgba(201,168,76,0.04) 0%,transparent 70%)",
          }}/>
          {[
            ["5+",  "Années d'expérience"],
            ["+200","Clients transformés"],
          ].map(([num, label], i) => (
            <div key={i} style={{
              padding:"3rem",
              borderBottom:i===0?"0.5px solid #1A1A1A":"none",
              display:"flex",flexDirection:"column",justifyContent:"center",
              position:"relative",
            }}>
              <div style={{
                fontFamily:"'Cormorant Garamond',serif",fontSize:80,
                fontWeight:600,color:"#C9A84C",lineHeight:1,
              }}>{num}</div>
              <div style={{
                fontSize:11,letterSpacing:"3px",textTransform:"uppercase",
                color:"#444",marginTop:8,fontFamily:"'Syne',sans-serif",
              }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ma philosophie ── */}
      <section style={{
        padding:"5rem 3.5rem",borderBottom:"0.5px solid #1A1A1A",
        display:"grid",gridTemplateColumns:"1fr 1.6fr",gap:"5rem",
        alignItems:"center",
      }}>
        <div>
          <div style={{
            fontSize:10,letterSpacing:"4px",textTransform:"uppercase",
            color:"#C9A84C",marginBottom:"1.2rem",
          }}>— Ma philosophie</div>
          <h2 style={{
            fontFamily:"'Cormorant Garamond',serif",fontSize:44,
            fontWeight:600,lineHeight:1.1,color:"#F0EDE8",
          }}>
            Le corps suit<br/>
            <em style={{fontStyle:"italic",color:"#C9A84C"}}>ce que l'esprit décide.</em>
          </h2>
        </div>
        <div>
          <p style={{
            fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#666",
            lineHeight:2,marginBottom:"1.5rem",
          }}>
            Je crois que la transformation physique commence bien avant la salle de sport.
            Elle commence quand tu décides d'arrêter les programmes génériques trouvés
            sur internet et que tu t'engages dans une démarche construite autour de
            <em style={{color:"#C9A84C",fontStyle:"normal"}}> toi</em> — ton corps,
            ton emploi du temps, ta cuisine, ton niveau.
          </p>
          <p style={{
            fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#666",
            lineHeight:2,marginBottom:"1.5rem",
          }}>
            Chaque programme que je livre est le résultat d'une analyse approfondie de
            ton bilan. Je calcule ton TDEE, tes macros, je structure tes séances selon
            ta disponibilité. Rien n'est laissé au hasard.
          </p>
          <p style={{
            fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#666",
            lineHeight:2,
          }}>
            Mon rôle n'est pas juste d'écrire un programme. C'est de t'accompagner
            jusqu'à ce que tu n'en aies plus besoin.
          </p>
        </div>
      </section>

      {/* ── Valeurs ── */}
      <section style={{padding:"5rem 3.5rem",borderBottom:"0.5px solid #1A1A1A"}}>
        <div style={{
          fontSize:10,letterSpacing:"4px",textTransform:"uppercase",
          color:"#C9A84C",marginBottom:"0.8rem",textAlign:"center",
        }}>— Ce qui me guide</div>
        <h2 style={{
          fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:600,
          textAlign:"center",marginBottom:"3rem",color:"#F0EDE8",
        }}>Mes valeurs</h2>
        <div className="values-grid" style={{
          display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,
        }}>
          {[
            {
              icon:"⚡",title:"Personnalisation absolue",
              desc:"Aucun programme ne ressemble à un autre. Chaque détail est ajusté à ta morphologie, ton objectif et ton mode de vie.",
            },
            {
              icon:"📈",title:"Progressivité",
              desc:"Un programme efficace évolue avec toi. Je structure la progression sur 4 semaines pour t'amener vers de nouveaux records.",
            },
            {
              icon:"🎯",title:"Précision nutritionnelle",
              desc:"Les macros sont calculés au gramme près selon la formule Harris-Benedict. Pas d'estimation, pas de raccourci.",
            },
            {
              icon:"💬",title:"Disponibilité totale",
              desc:"Tu as accès à moi via la messagerie intégrée. Je réponds à chaque question, chaque doute, chaque ajustement nécessaire.",
            },
          ].map((v, i) => (
            <div key={i} className="val-card">
              <div style={{fontSize:28,marginBottom:16}}>{v.icon}</div>
              <h3 style={{
                fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,
                letterSpacing:"2px",textTransform:"uppercase",color:"#C9A84C",
                marginBottom:12,
              }}>{v.title}</h3>
              <p style={{
                fontFamily:"'Cormorant Garamond',serif",fontSize:15,
                color:"#555",lineHeight:1.9,
              }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mon parcours ── */}
      <section style={{
        padding:"5rem 3.5rem",borderBottom:"0.5px solid #1A1A1A",
        display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:"5rem",
      }}>
        <div>
          <div style={{
            fontSize:10,letterSpacing:"4px",textTransform:"uppercase",
            color:"#C9A84C",marginBottom:"1.2rem",
          }}>— Parcours</div>
          <h2 style={{
            fontFamily:"'Cormorant Garamond',serif",fontSize:42,
            fontWeight:600,lineHeight:1.1,marginBottom:"2.5rem",
          }}>
            Ce qui m'a<br/>
            <em style={{fontStyle:"italic",color:"#C9A84C"}}>construit</em>
          </h2>
          {[
            {year:"2019", event:"Premiers pas en salle — autodidacte, erreurs, stagnation."},
            {year:"2020", event:"Découverte de la science de l'entraînement. Tout change."},
            {year:"2021", event:"Formation coaching et nutrition sportive. Base théorique solide."},
            {year:"2022", event:"Premiers clients. Premiers résultats. Première fierté."},
            {year:"2023", event:"Lancement APXFITNESS. Le coaching en ligne, sans frontières."},
            {year:"2024", event:"+200 programmes livrés. La méthode est rodée."},
          ].map((item, i) => (
            <div key={i} style={{
              display:"flex",gap:20,marginBottom:20,
              opacity: i < 3 ? 0.55 : 1,
            }}>
              <div style={{
                fontSize:11,fontWeight:700,color:"#C9A84C",letterSpacing:"2px",
                flexShrink:0,paddingTop:3,fontFamily:"'Syne',sans-serif",
                width:40,
              }}>{item.year}</div>
              <div>
                <div style={{
                  width:1,height:"100%",background:"#1E1E1E",
                  position:"absolute",
                }}/>
                <p style={{
                  fontFamily:"'Cormorant Garamond',serif",fontSize:15,
                  color:"#666",lineHeight:1.8,
                }}>{item.event}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div>
          <div style={{
            fontSize:10,letterSpacing:"4px",textTransform:"uppercase",
            color:"#C9A84C",marginBottom:"1.2rem",
          }}>— Compétences</div>
          <h2 style={{
            fontFamily:"'Cormorant Garamond',serif",fontSize:42,
            fontWeight:600,lineHeight:1.1,marginBottom:"2rem",
          }}>
            Expertise<br/>
            <em style={{fontStyle:"italic",color:"#C9A84C"}}>& méthodes</em>
          </h2>
          <div>
            {[
              {label:"Musculation & hypertrophie",     level:95},
              {label:"Nutrition & macros",             level:90},
              {label:"Programmation périodisée",       level:88},
              {label:"Remise en forme & cardio",       level:85},
              {label:"Coaching à distance",            level:95},
              {label:"Analyse & ajustement programme", level:92},
            ].map((skill, i) => (
              <div key={i} style={{marginBottom:16}}>
                <div style={{
                  display:"flex",justifyContent:"space-between",
                  marginBottom:7,
                }}>
                  <span style={{
                    fontSize:11,color:"#888",fontFamily:"'Syne',sans-serif",
                    letterSpacing:"1px",
                  }}>{skill.label}</span>
                  <span style={{
                    fontSize:11,color:"#C9A84C",fontWeight:700,
                    fontFamily:"'Syne',sans-serif",
                  }}>{skill.level}%</span>
                </div>
                <div style={{height:4,background:"#111",borderRadius:4,overflow:"hidden"}}>
                  <div style={{
                    height:"100%",
                    width:`${skill.level}%`,
                    background:"linear-gradient(90deg,#C9A84C,#E8C87A)",
                    borderRadius:4,
                    transition:"width 1.5s cubic-bezier(0.25,1,0.5,1)",
                  }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Approche */}
          <div style={{
            marginTop:"2.5rem",padding:"24px",
            background:"rgba(201,168,76,0.05)",
            border:"0.5px solid rgba(201,168,76,0.2)",
          }}>
            <div style={{
              fontSize:10,letterSpacing:"3px",textTransform:"uppercase",
              color:"#C9A84C",marginBottom:12,fontFamily:"'Syne',sans-serif",
            }}>Mon approche IA</div>
            <p style={{
              fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#666",
              lineHeight:1.9,
            }}>
              J'utilise l'intelligence artificielle pour calculer précisément tes besoins
              caloriques, structurer ta semaine d'entraînement et générer des plans de
              repas adaptés. La technologie au service de l'humain — pas l'inverse.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{
        padding:"6rem 3.5rem",textAlign:"center",
        background:"radial-gradient(ellipse at center,rgba(201,168,76,0.05) 0%,transparent 70%)",
      }}>
        <div style={{
          fontSize:10,letterSpacing:"4px",textTransform:"uppercase",
          color:"#C9A84C",marginBottom:"1.2rem",
        }}>— Prêt à commencer ?</div>
        <h2 style={{
          fontFamily:"'Cormorant Garamond',serif",fontSize:52,fontWeight:600,
          lineHeight:1.1,marginBottom:"1.5rem",
        }}>
          Ton programme.<br/>
          <em style={{fontStyle:"italic",color:"#C9A84C"}}>Ta transformation.</em>
        </h2>
        <p style={{
          fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#555",
          lineHeight:1.9,maxWidth:480,margin:"0 auto 2.5rem",
        }}>
          Réponds à quelques questions sur toi et reçois un programme complet
          généré spécifiquement pour tes objectifs. Sous 48 heures.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>router.push("/bilan")} style={{
            background:"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",
            color:"#0A0A0A",padding:"16px 40px",fontFamily:"'Syne',sans-serif",
            fontSize:13,fontWeight:700,letterSpacing:"2px",
            textTransform:"uppercase",cursor:"pointer",
          }}>
            Démarrer mon bilan →
          </button>
          <button onClick={()=>router.push("/#offres")} style={{
            background:"transparent",border:"0.5px solid #242424",color:"#555",
            padding:"16px 28px",fontFamily:"'Syne',sans-serif",fontSize:12,
            letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",
            transition:"all 0.2s",
          }}>
            Voir les offres
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-wrap-about" style={{
        padding:"2rem 3rem",display:"flex",justifyContent:"space-between",
        alignItems:"center",borderTop:"0.5px solid #242424",
      }}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:5,cursor:"pointer"}}
          onClick={()=>router.push("/")}>
          APXFIT<span style={{color:"#C9A84C"}}>NESS</span>
        </div>
        <div style={{fontSize:11,letterSpacing:"2px",color:"#333",textTransform:"uppercase"}}>
          © 2026 APXFITNESS
        </div>
        <div style={{display:"flex",gap:"1.5rem",alignItems:"center"}}>
          {[
            ["Accueil","/"],["Blog","/blog"],["Bilan","/bilan"],
            ["FAQ","/faq"],["Mentions légales","/mentions-legales"],
          ].map(([label, href]) => (
            <span key={href} className="footer-link" style={{
              fontSize:11,letterSpacing:"2px",color:"#555",textTransform:"uppercase",
            }} onClick={()=>router.push(href)}>{label}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
