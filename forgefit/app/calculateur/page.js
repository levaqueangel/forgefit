"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "../useLang";
import { LangSelector } from "../LangSelector";

function calcBMR(poids, taille, age, genre) {
  if (genre === "femme") return 447.593 + (9.247 * poids) + (3.098 * taille) - (4.330 * age);
  return 88.362 + (13.397 * poids) + (4.799 * taille) - (5.677 * age);
}

const ACTIVITY = [
  { label: "Sédentaire (bureau, peu de sport)", mult: 1.2 },
  { label: "Légèrement actif (1-2 séances/sem)", mult: 1.375 },
  { label: "Modérément actif (3-4 séances/sem)", mult: 1.55 },
  { label: "Très actif (5-6 séances/sem)", mult: 1.65 },
  { label: "Extrêmement actif (sport quotidien)", mult: 1.725 },
];

const GOALS = [
  { id: "perte", label: "Perte de gras",      delta: -400, pLabel: "Déficit modéré (-400 kcal)" },
  { id: "recomp", label: "Remise en forme",   delta: 0,    pLabel: "Maintenance (0 kcal)" },
  { id: "masse", label: "Prise de masse",      delta: 250,  pLabel: "Surplus léger (+250 kcal)" },
];

function IMCBar({ imc }) {
  const zones = [
    { max: 18.5, label: "Maigreur",      color: "#5DCAA5" },
    { max: 25,   label: "Normal",        color: "#7AE07A" },
    { max: 30,   label: "Surpoids",      color: "#E8C87A" },
    { max: 40,   label: "Obésité",       color: "#E07070" },
  ];
  const pct = Math.min(Math.max(((imc - 10) / 30) * 100, 0), 100);
  const zone = zones.find(z => imc < z.max) || zones[zones.length - 1];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#888" }}>IMC</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: zone.color }}>{imc.toFixed(1)}</span>
      </div>
      <div style={{ height: 8, background: "#1A1A1A", borderRadius: 4, overflow: "visible", position: "relative" }}>
        <div style={{ display: "flex", height: "100%", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#5DCAA5" }} />
          <div style={{ flex: 1.3, background: "#7AE07A" }} />
          <div style={{ flex: 1, background: "#E8C87A" }} />
          <div style={{ flex: 2, background: "#E07070" }} />
        </div>
        <div style={{ position: "absolute", top: -4, left: `${pct}%`, transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", background: zone.color, border: "2px solid #0A0A0A", transition: "left 0.5s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "#444" }}>
        <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
      </div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <span style={{ fontSize: 12, background: `${zone.color}22`, color: zone.color, padding: "3px 12px", borderRadius: 12, border: `0.5px solid ${zone.color}55` }}>
          {zone.label}
        </span>
      </div>
    </div>
  );
}

export default function CalculateurPage() {
  const router = useRouter();
  const { lang, setLang, LANGS } = useLang();
  const [form, setForm] = useState({ poids: "", taille: "", age: "", genre: "homme", activite: 2, objectif: "recomp" });
  const [result, setResult] = useState(null);

  const inp = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const calculate = () => {
    const p = parseFloat(form.poids), t = parseFloat(form.taille), a = parseInt(form.age);
    if (!p || !t || !a || p < 30 || t < 100 || a < 10) return;
    const bmr = calcBMR(p, t, a, form.genre);
    const tdee = Math.round(bmr * ACTIVITY[form.activite].mult);
    const goal = GOALS.find(g => g.id === form.objectif);
    const calories = Math.round((tdee + goal.delta) / 50) * 50;
    const imc = p / ((t / 100) ** 2);

    // Macros selon objectif
    let proteines, lipides;
    if (form.objectif === "perte") { proteines = Math.round(p * 2.2); lipides = Math.round(p * 0.8); }
    else if (form.objectif === "masse") { proteines = Math.round(p * 2.0); lipides = Math.round(p * 1.0); }
    else { proteines = Math.round(p * 1.8); lipides = Math.round(p * 0.9); }
    const glucides = Math.round(Math.max(0, calories - proteines * 4 - lipides * 9) / 4);

    setResult({ bmr: Math.round(bmr), tdee, calories, imc, proteines, glucides, lipides, goalLabel: goal.label, pctLabel: goal.pLabel });
  };

  const S = {
    card: { background: "#111", border: "0.5px solid #1E1E1E", borderRadius: 4, padding: 16 },
    label: { fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 7, display: "block" },
    input: { width: "100%", background: "#0D0D0D", border: "0.5px solid #242424", color: "#F0EDE8", fontFamily: "'Syne',sans-serif", fontSize: 14, padding: "10px 14px", outline: "none", borderRadius: 2 },
  };

  return (
    <div style={{ background: "#0A0A0A", color: "#F0EDE8", minHeight: "100vh", fontFamily: "'Syne',sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .gold{background:linear-gradient(90deg,#C9A84C,#E8C87A,#F5D98A,#C9A84C);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite}
        .fade-in{animation:fadeUp 0.3s ease forwards}
        .option-btn{background:transparent;border:0.5px solid #242424;color:#555;font-family:'Syne',sans-serif;font-size:11px;letter-spacing:1px;padding:8px 14px;cursor:pointer;transition:all 0.15s;border-radius:2px;text-align:left}
        .option-btn.active{border-color:#C9A84C;color:#C9A84C;background:rgba(201,168,76,0.05)}
        input:focus{border-color:#C9A84C !important;outline:none}
        select:focus{border-color:#C9A84C !important;outline:none}
        .macro-bar{height:6px;background:#1A1A1A;border-radius:3px;overflow:hidden;margin-top:5px}
        .macro-fill{height:100%;border-radius:3px;transition:width 0.8s ease}
        @media(max-width:640px){.calc-grid{grid-template-columns:1fr !important}}
      `}</style>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "0.5px solid #1A1A1A", position: "sticky", top: 0, background: "#0A0A0A", zIndex: 100 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, cursor: "pointer" }} onClick={() => router.push("/")}>
          APXFIT<span style={{ color: "#C9A84C" }}>NESS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LangSelector lang={lang} setLang={setLang} LANGS={LANGS} />
          <button onClick={() => router.push("/")} style={{ background: "transparent", border: "0.5px solid #242424", color: "#555", fontFamily: "'Syne',sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", padding: "8px 18px", cursor: "pointer", borderRadius: 2 }}>
            ← Retour
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: "3rem 2rem 2rem", textAlign: "center", borderBottom: "0.5px solid #1A1A1A", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%,rgba(201,168,76,0.04),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 11, letterSpacing: "4px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "0.75rem" }}>— Outil gratuit</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 600, lineHeight: 1.1, marginBottom: "0.75rem" }}>
          Calculateur <em className="gold" style={{ fontStyle: "italic" }}>IMC & Calories</em>
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: "#555", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
          Découvre ton indice de masse corporelle et tes besoins caloriques journaliers selon ton objectif.
        </p>
      </div>

      {/* Formulaire + Résultat */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div className="calc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Formulaire */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: 4 }}>— Tes données</div>

            {/* Données physiques */}
            <div style={S.card}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { k: "poids", label: "Poids", ph: "75", unit: "kg" },
                  { k: "taille", label: "Taille", ph: "175", unit: "cm" },
                  { k: "age", label: "Âge", ph: "25", unit: "ans" },
                ].map(f => (
                  <div key={f.k} style={f.k === "age" ? { gridColumn: "span 2" } : {}}>
                    <label style={S.label}>{f.label}</label>
                    <div style={{ position: "relative" }}>
                      <input type="number" value={form[f.k]} onChange={inp(f.k)} placeholder={f.ph}
                        style={{ ...S.input, paddingRight: 36 }} />
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#444" }}>{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Genre */}
            <div style={S.card}>
              <label style={S.label}>Genre</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["homme", "♂ Homme"], ["femme", "♀ Femme"]].map(([val, lab]) => (
                  <button key={val} className={`option-btn${form.genre === val ? " active" : ""}`}
                    style={{ flex: 1 }} onClick={() => setForm(f => ({ ...f, genre: val }))}>
                    {lab}
                  </button>
                ))}
              </div>
            </div>

            {/* Activité */}
            <div style={S.card}>
              <label style={S.label}>Niveau d'activité</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ACTIVITY.map((a, i) => (
                  <button key={i} className={`option-btn${form.activite === i ? " active" : ""}`}
                    onClick={() => setForm(f => ({ ...f, activite: i }))} style={{ fontSize: 12, padding: "8px 12px" }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Objectif */}
            <div style={S.card}>
              <label style={S.label}>Objectif</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {GOALS.map(g => (
                  <button key={g.id} className={`option-btn${form.objectif === g.id ? " active" : ""}`}
                    onClick={() => setForm(f => ({ ...f, objectif: g.id }))} style={{ fontSize: 12, padding: "8px 12px" }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={calculate} style={{
              background: "linear-gradient(135deg,#C9A84C,#A67C2E)", border: "none", color: "#0A0A0A",
              padding: "14px", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
              letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", borderRadius: 2,
            }}>
              Calculer →
            </button>
          </div>

          {/* Résultats */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "1rem" }}>— Tes résultats</div>

            {!result ? (
              <div style={{ ...S.card, textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: "#444", lineHeight: 1.7 }}>
                  Remplis tes données et clique sur Calculer pour voir tes résultats.
                </p>
              </div>
            ) : (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* IMC */}
                <div style={S.card}>
                  <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>Indice de masse corporelle</div>
                  <IMCBar imc={result.imc} />
                </div>

                {/* Calories */}
                <div style={S.card}>
                  <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>Besoins caloriques</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    {[
                      { label: "Métabolisme de base", val: result.bmr, sub: "kcal/jour au repos" },
                      { label: "TDEE (activité incluse)", val: result.tdee, sub: "kcal/jour total" },
                    ].map((m, i) => (
                      <div key={i} style={{ background: "#0D0D0D", padding: "12px", borderRadius: 2, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#555", marginBottom: 6, letterSpacing: "1px" }}>{m.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#F0EDE8", lineHeight: 1 }}>{m.val.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.3)", borderRadius: 2, padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#C9A84C", marginBottom: 4 }}>
                      Objectif : {result.goalLabel}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#C9A84C", lineHeight: 1 }}>
                      {result.calories.toLocaleString()} kcal/jour
                    </div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{result.pctLabel}</div>
                  </div>
                </div>

                {/* Macros */}
                <div style={S.card}>
                  <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>Répartition macros</div>
                  {[
                    { label: "Protéines", val: result.proteines, unit: "g", kcal: result.proteines * 4, color: "#7AE07A" },
                    { label: "Glucides",  val: result.glucides,  unit: "g", kcal: result.glucides * 4,  color: "#C9A84C" },
                    { label: "Lipides",   val: result.lipides,   unit: "g", kcal: result.lipides * 9,   color: "#5DCAA5" },
                  ].map((m, i) => {
                    const pct = Math.round((m.kcal / result.calories) * 100);
                    return (
                      <div key={i} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "#888" }}>{m.label}</span>
                          <span style={{ color: m.color, fontWeight: 700 }}>{m.val}g <span style={{ color: "#444", fontWeight: 400 }}>· {pct}%</span></span>
                        </div>
                        <div className="macro-bar">
                          <div className="macro-fill" style={{ width: `${pct}%`, background: m.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <div style={{ background: "#0D0D0D", border: "0.5px solid rgba(201,168,76,0.3)", borderRadius: 4, padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: 8 }}>— Prochaine étape</div>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: "#888", lineHeight: 1.7, marginBottom: "1rem" }}>
                    Ces chiffres sont un point de départ. Un programme sur mesure tient compte de bien plus — tes habitudes, ton équipement, tes contraintes.
                  </p>
                  <button onClick={() => router.push("/#offres")} style={{
                    background: "linear-gradient(135deg,#C9A84C,#A67C2E)", border: "none", color: "#0A0A0A",
                    padding: "12px 24px", fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700,
                    letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", borderRadius: 2,
                  }}>
                    Obtenir mon programme →
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid #1A1A1A", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 5 }}>APXFIT<span style={{ color: "#C9A84C" }}>NESS</span></div>
        <div style={{ fontSize: 11, letterSpacing: "2px", color: "#333", textTransform: "uppercase" }}>© 2026 APXFITNESS</div>
        <span onClick={() => router.push("/mentions-legales")} style={{ fontSize: 11, letterSpacing: "2px", color: "#555", textTransform: "uppercase", textDecoration: "underline", cursor: "pointer" }}>
          Mentions légales
        </span>
      </footer>
    </div>
  );
}
