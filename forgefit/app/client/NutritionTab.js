"use client";

export function NutritionTab({
  S, nutrition, mealPlan, mealLoading, mealError, generateMealPlan,
}) {
  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Métriques macros — style cards colorées */}
      <div className="metrics-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          {label:"Calories",  val:nutrition?`${nutrition.calories_jour}`:"—",  sub:"kcal/jour", color:"#C9A84C"},
          {label:"Protéines", val:nutrition?`${nutrition.proteines_g}g`:"—",   sub:"objectif",  color:"#7AE07A"},
          {label:"Glucides",  val:nutrition?`${nutrition.glucides_g}g`:"—",    sub:"objectif",  color:"#5DCAA5"},
          {label:"Lipides",   val:nutrition?`${nutrition.lipides_g}g`:"—",     sub:"objectif",  color:"#E8C87A"},
        ].map((m,i)=>(
          <div key={i} className="metric-card" style={{position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:16,right:16,height:2,background:m.color,borderRadius:"0 0 2px 2px",opacity:0.6}}/>
            <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#555",marginBottom:10,marginTop:8}}>{m.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:m.color,lineHeight:1,marginBottom:3,fontFamily:"'Syne',sans-serif"}}>{m.val}</div>
            <div style={{fontSize:10,color:"#444",fontFamily:"'Syne',sans-serif"}}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {/* Plan alimentaire */}
        <div style={S.card}>
          <div style={S.cardTitle}>🍽 Plan alimentaire</div>
          {nutrition?.repas?.length > 0 ? nutrition.repas.map((r,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"10px 12px",background:"#0D0D0D",borderRadius:10,marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#F0EDE8",fontFamily:"'Syne',sans-serif"}}>{r.nom}</div>
                <div style={{fontSize:11,color:"#444",fontFamily:"'Syne',sans-serif",marginTop:2,lineHeight:1.5}}>{r.exemples}</div>
              </div>
            </div>
          )) : <div style={{padding:"1.5rem",textAlign:"center",color:"#333",fontSize:14,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Plan de repas disponible après ton bilan</div>}
        </div>

        {/* Conseils */}
        <div style={S.card}>
          <div style={S.cardTitle}>💡 Conseils</div>
          {nutrition?.conseils?.length > 0 ? nutrition.conseils.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i<nutrition.conseils.length-1?"0.5px solid #161616":"none"}}>
              <span style={{color:"#C9A84C",flexShrink:0,fontSize:14,lineHeight:1.5}}>→</span>
              <span style={{fontSize:12,color:"#666",lineHeight:1.6,fontFamily:"'Syne',sans-serif"}}>{c}</span>
            </div>
          )) : <div style={{padding:"1rem",textAlign:"center",color:"#333",fontSize:13,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Conseils disponibles après ton bilan</div>}
        </div>
      </div>

      {/* Générateur de plan */}
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={S.cardTitle}>🍽 Plan du jour</div>
          {nutrition && (
            <button onClick={generateMealPlan} disabled={mealLoading}
              className="btn-primary"
              style={{
                background:mealLoading?"rgba(255,255,255,0.04)":"rgba(201,168,76,0.12)",
                border:`0.5px solid ${mealLoading?"#1E1E1E":"rgba(201,168,76,0.35)"}`,
                color:mealLoading?"#333":"#C9A84C",
                fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"1.5px",
                textTransform:"uppercase",padding:"8px 18px",
                cursor:mealLoading?"not-allowed":"pointer",borderRadius:20,
                display:"flex",alignItems:"center",gap:6,transition:"all 0.2s",
              }}>
              {mealLoading?<><div className="spinner" style={{width:12,height:12}}/>Génération...</>:"✨ Générer"}
            </button>
          )}
        </div>
        {mealError&&<div style={{fontSize:12,color:"#E07070",padding:"6px 0",marginBottom:8}}>{mealError}</div>}
        {!nutrition ? (
          <div style={{padding:"1.5rem",textAlign:"center",color:"#333",fontSize:13,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Disponible après ton bilan</div>
        ) : !mealPlan ? (
          <div style={{padding:"1.5rem",textAlign:"center",color:"#333",fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:"italic",lineHeight:1.7}}>
            Clique sur Générer pour obtenir un plan alimentaire adapté à tes macros.
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {mealPlan.repas?.map((r,i) => (
              <div key={i} style={{background:"#0D0D0D",borderRadius:12,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#F0EDE8",fontFamily:"'Syne',sans-serif"}}>{r.nom}</span>
                    <span style={{fontSize:10,color:"#444",background:"rgba(255,255,255,0.04)",padding:"2px 8px",borderRadius:10,fontFamily:"'Syne',sans-serif"}}>{r.heure}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:"#C9A84C",fontFamily:"'Syne',sans-serif"}}>{r.calories} kcal</span>
                </div>
                <div style={{fontSize:12,color:"#555",lineHeight:1.7,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>
                  {r.aliments?.join(" · ")}
                </div>
                <div style={{display:"flex",gap:10,fontSize:11,color:"#444"}}>
                  <span style={{background:"rgba(122,224,122,0.08)",padding:"2px 8px",borderRadius:10,color:"#7AE07A",fontFamily:"'Syne',sans-serif"}}>P {r.proteines}g</span>
                  <span style={{background:"rgba(201,168,76,0.08)",padding:"2px 8px",borderRadius:10,color:"#C9A84C",fontFamily:"'Syne',sans-serif"}}>G {r.glucides}g</span>
                  <span style={{background:"rgba(93,202,165,0.08)",padding:"2px 8px",borderRadius:10,color:"#5DCAA5",fontFamily:"'Syne',sans-serif"}}>L {r.lipides}g</span>
                </div>
              </div>
            ))}
            {mealPlan.conseil_du_jour&&(
              <div style={{background:"rgba(201,168,76,0.05)",border:"0.5px solid rgba(201,168,76,0.15)",borderRadius:12,padding:"10px 14px",fontSize:13,color:"#666",lineHeight:1.6,fontFamily:"'Syne',sans-serif"}}>
                💡 {mealPlan.conseil_du_jour}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
