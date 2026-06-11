"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { LangSelector } from "../LangSelector";

export function LoginScreen({ lang, setLang, LANGS }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setError("Email ou mot de passe incorrect."); }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true); setResetError("");
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch {
      setResetError("Aucun compte trouvé pour cet email.");
    }
    setResetLoading(false);
  };

  const inp = { width:"100%", background:"#111", border:"0.5px solid #242424", color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:13, padding:"12px 16px", outline:"none", borderRadius:0 };

  return (
    <div style={{background:"#0A0A0A",color:"#F0EDE8",minHeight:"100vh",fontFamily:"'Syne',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input:focus{border-color:#C9A84C !important;outline:none}`}</style>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 28px",borderBottom:"0.5px solid #242424"}}>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:5}}>APXFIT<span style={{color:"#C9A84C"}}>NESS</span></div>
        <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
      </nav>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{width:"100%",maxWidth:400}}>

          {!resetMode ? (
            <>
              <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.75rem"}}>— Espace client</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:600,lineHeight:1.1,marginBottom:"2rem"}}>
                Bon retour<br/><em style={{fontStyle:"italic",color:"#555"}}>parmi nous</em>
              </div>
              <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:1}}>
                <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
                  <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:7}}>Email</div>
                  <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" required />
                </div>
                <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
                  <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:7}}>Mot de passe</div>
                  <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                {error && <div style={{background:"#1A0808",border:"0.5px solid #5A1A1A",color:"#E07070",fontSize:12,padding:"10px 14px"}}>{error}</div>}
                <button type="submit" disabled={loading} style={{background:loading?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"14px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",marginTop:2}}>
                  {loading?"Connexion...":"Se connecter →"}
                </button>
              </form>
              <div style={{textAlign:"center",marginTop:"1.25rem"}}>
                <button
                  onClick={() => { setResetMode(true); setResetEmail(email); }}
                  style={{background:"none",border:"none",color:"#444",fontSize:11,fontFamily:"'Syne',sans-serif",letterSpacing:"1px",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3,transition:"color 0.15s"}}
                  onMouseEnter={e=>e.target.style.color="#C9A84C"}
                  onMouseLeave={e=>e.target.style.color="#444"}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <p style={{fontSize:12,color:"#555",textAlign:"center",marginTop:"1rem",lineHeight:1.6}}>Tes identifiants t'ont été envoyés par email après ton bilan.</p>
            </>
          ) : (
            <>
              <button
                onClick={() => { setResetMode(false); setResetSent(false); setResetError(""); }}
                style={{background:"none",border:"none",color:"#555",fontSize:11,fontFamily:"'Syne',sans-serif",letterSpacing:"1px",cursor:"pointer",marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:6,padding:0}}
              >
                ← Retour
              </button>

              <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.75rem"}}>— Réinitialisation</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,lineHeight:1.1,marginBottom:"1.5rem"}}>
                Nouveau<br/><em style={{fontStyle:"italic",color:"#555"}}>mot de passe</em>
              </div>

              {resetSent ? (
                <div style={{background:"#081A08",border:"0.5px solid #1A5A1A",borderRadius:4,padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:24,marginBottom:10}}>✉️</div>
                  <div style={{fontSize:13,color:"#7AE07A",fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:6}}>
                    Email envoyé !
                  </div>
                  <div style={{fontSize:12,color:"#555",lineHeight:1.6}}>
                    Vérifie ta boîte mail — tu recevras un lien pour choisir un nouveau mot de passe.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReset} style={{display:"flex",flexDirection:"column",gap:1}}>
                  <div style={{background:"#111",padding:"14px 16px",border:"0.5px solid #242424"}}>
                    <div style={{fontSize:10,letterSpacing:"3px",textTransform:"uppercase",color:"#555",marginBottom:7}}>Ton email</div>
                    <input
                      style={inp} type="email" value={resetEmail}
                      onChange={e=>setResetEmail(e.target.value)}
                      placeholder="ton@email.com" required
                    />
                  </div>
                  {resetError && <div style={{background:"#1A0808",border:"0.5px solid #5A1A1A",color:"#E07070",fontSize:12,padding:"10px 14px"}}>{resetError}</div>}
                  <button type="submit" disabled={resetLoading} style={{background:resetLoading?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",border:"none",color:"#0A0A0A",padding:"14px",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",cursor:resetLoading?"not-allowed":"pointer",marginTop:2}}>
                    {resetLoading?"Envoi...":"Envoyer le lien →"}
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

