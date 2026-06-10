"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "../firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const oobCode = params.get("oobCode");

  const [step, setStep] = useState("loading"); // loading | form | done | error
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!oobCode) { setStep("error"); return; }
    verifyPasswordResetCode(auth, oobCode)
      .then(e => { setEmail(e); setStep("form"); })
      .catch(() => setStep("error"));
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setErr("Minimum 6 caractères."); return; }
    if (password !== confirm) { setErr("Les mots de passe ne correspondent pas."); return; }
    setLoading(true); setErr("");
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStep("done");
    } catch { setErr("Lien expiré ou invalide. Redemande un email."); }
    setLoading(false);
  };

  return (
    <div style={{ background:"#0A0A0A", color:"#F0EDE8", minHeight:"100vh", fontFamily:"'Syne',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ fontSize:22, fontWeight:800, letterSpacing:6, marginBottom:"3rem" }}>
        APXFIT<span style={{ color:"#C9A84C" }}>NESS</span>
      </div>
      <div style={{ width:"100%", maxWidth:360 }}>

        {step === "loading" && (
          <div style={{ textAlign:"center", color:"#555", fontSize:13, letterSpacing:3, textTransform:"uppercase" }}>Vérification...</div>
        )}

        {step === "error" && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
            <div style={{ color:"#E07070", fontSize:14, marginBottom:20, lineHeight:1.6 }}>
              Lien invalide ou expiré.<br/>Redemande un email depuis la page coach.
            </div>
            <button onClick={() => router.push("/coach")}
              style={{ background:"transparent", border:"0.5px solid #C9A84C", color:"#C9A84C", padding:"10px 24px", fontSize:11, letterSpacing:3, textTransform:"uppercase", cursor:"pointer" }}>
              ← Page coach
            </button>
          </div>
        )}

        {step === "form" && (
          <>
            <div style={{ fontSize:10, letterSpacing:"4px", textTransform:"uppercase", color:"#C9A84C", marginBottom:"0.75rem" }}>— Nouveau mot de passe</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:600, lineHeight:1.2, marginBottom:"0.5rem" }}>
              Réinitialisation
            </div>
            <div style={{ fontSize:12, color:"#555", marginBottom:"2rem" }}>{email}</div>
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:1 }}>
              <div style={{ background:"#111", padding:"14px 16px", border:"0.5px solid #242424" }}>
                <div style={{ fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:7 }}>Nouveau mot de passe</div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères" required autoFocus
                  style={{ width:"100%", background:"transparent", border:"none", color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:13, outline:"none" }}/>
              </div>
              <div style={{ background:"#111", padding:"14px 16px", border:"0.5px solid #242424" }}>
                <div style={{ fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:7 }}>Confirmer</div>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••" required
                  style={{ width:"100%", background:"transparent", border:"none", color:"#F0EDE8", fontFamily:"'Syne',sans-serif", fontSize:13, outline:"none" }}/>
              </div>
              {err && <div style={{ background:"#1A0808", border:"0.5px solid #5A1A1A", color:"#E07070", fontSize:12, padding:"10px 14px" }}>{err}</div>}
              <button type="submit" disabled={loading}
                style={{ background:loading?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none", color:"#0A0A0A", padding:"14px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", cursor:loading?"not-allowed":"pointer", marginTop:2 }}>
                {loading ? "Enregistrement..." : "Enregistrer →"}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>✓</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, marginBottom:8 }}>Mot de passe mis à jour</div>
            <div style={{ fontSize:13, color:"#555", marginBottom:24 }}>Tu peux maintenant te connecter.</div>
            <button onClick={() => router.push("/coach")}
              style={{ background:"linear-gradient(135deg,#C9A84C,#A67C2E)", border:"none", color:"#0A0A0A", padding:"12px 28px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", cursor:"pointer" }}>
              Aller sur le coach →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
