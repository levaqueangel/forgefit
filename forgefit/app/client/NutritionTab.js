"use client";

export function NutritionTab({
  S, nutrition, mealPlan, mealLoading, mealError, generateMealPlan,
}) {
  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Métriques macros */}
      <div className="metrics-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          {label:"Calories",  val:nutrition?`${nutrition.calories_jour}`:"—",    sub:nutrition?"Objectif/jour":"Non défini", color:"#C9A84C"},
          {label:"Protéines", val:nutrition?`${nutrition.proteines_g} g`:"—",    sub:nutrition?"Objectif/jour":"Non défini", color:"#7AE07A"},
          {label:"Glucides",  val:nutrition?`${nutrition.glucides_g} g`:"—",     sub:nutrition?"Objectif/jour":"Non défini", color:"#F0EDE8"},
          {label:"Lipides",   val:nutrition?`${nutrition.lipides_g} g`:"—",      sub:nutrition?"Objectif/jour":"Non défini", color:"#F0EDE8"},
        ].map((m,i)=>(
          <div key={i} className="metric-card">
            <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:8}}>{m.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4}}>{m.val}</div>
            <div style={{fontSize:11,color:"#444"}}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Plan alimentaire */}
        <div style={S.card}>
          <div style={S.cardTitle}>🍽 Plan alimentaire</div>
          {nutrition?.repas?.length > 0 ? nutrition.repas.map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",padding:"9px 10px",background:"#0D0D0D",borderRadius:2,gap:8,marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#F0EDE8"}}>{r.nom}</div>
                <div style={{fontSize:11,color:"#555"}}>{r.exemples}</div>
              </div>
            </div>
          )) : <div style={{padding:"1.5rem",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>Plan de repas disponible après ton bilan</div>}
        </div>

        {/* Conseils nutrition */}
        <div style={S.card}>
          <div style={S.cardTitle}>💡 Conseils nutrition</div>
          {nutrition?.conseils?.length > 0 ? nutrition.conseils.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:"0.5px solid #141414"}}>
              <span style={{color:"#C9A84C",flexShrink:0}}>→</span>
              <span style={{fontSize:13,color:"#888",lineHeight:1.6}}>{c}</span>
            </div>
          )) : <div style={{padding:"1rem",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>Conseils disponibles après ton bilan</div>}
        </div>
      </div>

      {/* Générateur de plan de repas */}
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={S.cardTitle}>🍽 Plan de repas du jour</div>
          {nutrition && (
            <button onClick={generateMealPlan} disabled={mealLoading}
              className="btn-primary"
              style={{
                background:mealLoading?"#222":"linear-gradient(135deg,#C9A84C,#A67C2E)",
                border:"none",color:mealLoading?"#555":"#0A0A0A",
                fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"2px",
                textTransform:"uppercase",padding:"7px 14px",
                cursor:mealLoading?"not-allowed":"pointer",borderRadius:2,
                display:"flex",alignItems:"center",gap:6,
              }}>
              {mealLoading
                ? <><div className="spinner" style={{borderTopColor:"#C9A84C"}} />Génération...</>
                : "✨ Générer"}
            </button>
          )}
        </div>
        {mealError && <div style={{fontSize:12,color:"#E07070",padding:"6px 0",marginBottom:8}}>{mealError}</div>}
        {!nutrition ? (
          <div style={{padding:"1rem",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>Disponible après ton bilan</div>
        ) : !mealPlan ? (
          <div style={{padding:"1.5rem",textAlign:"center",color:"#444",fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:"italic",lineHeight:1.7}}>
            Clique sur "Générer" pour obtenir un plan alimentaire adapté à tes macros du jour.
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {mealPlan.repas?.map((r,i) => (
              <div key={i} style={{background:"#0D0D0D",borderRadius:2,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:700,color:"#F0EDE8"}}>{r.nom}</span>
                    <span style={{fontSize:11,color:"#555",marginLeft:8}}>{r.heure}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:"#C9A84C"}}>{r.calories} kcal</span>
                </div>
                <div style={{fontSize:12,color:"#666",lineHeight:1.7,marginBottom:6}}>
                  {r.aliments?.join(" · ")}
                </div>
                <div style={{display:"flex",gap:12,fontSize:11,color:"#444"}}>
                  <span>P: <strong style={{color:"#7AE07A"}}>{r.proteines}g</strong></span>
                  <span>G: <strong style={{color:"#C9A84C"}}>{r.glucides}g</strong></span>
                  <span>L: <strong style={{color:"#5DCAA5"}}>{r.lipides}g</strong></span>
                </div>
              </div>
            ))}
            {mealPlan.conseil_du_jour && (
              <div style={{background:"rgba(201,168,76,0.05)",border:"0.5px solid rgba(201,168,76,0.2)",borderRadius:2,padding:"10px 14px",fontSize:13,color:"#888",lineHeight:1.6}}>
                💡 {mealPlan.conseil_du_jour}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
