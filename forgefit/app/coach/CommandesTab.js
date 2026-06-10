"use client";
import { useState } from "react";

const PLAN_COLORS = { starter:"#7AE07A", forge:"#C9A84C", elite:"#E8C87A" };

export function CommandesView({ orders, clients, user, activatingOrder, setActivatingOrder, addToast }) {
  const [filter, setFilter] = useState("all"); // all | pending | activated
  const [activatedIds, setActivatedIds] = useState(new Set());
  const [cleanupState, setCleanupState] = useState(null); // null | "scanning" | {phantoms:[]} | "deleting" | "done"

  const scanPhantoms = async () => {
    setCleanupState("scanning");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/cleanup-phantom-clients", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCleanupState(data);
    } catch (e) { addToast("Erreur scan : " + e.message, "error"); setCleanupState(null); }
  };

  const deletePhantoms = async () => {
    setCleanupState("deleting");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/cleanup-phantom-clients?confirm=true", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCleanupState("done");
      addToast(`✅ ${data.deletedCount} doc(s) fantôme(s) supprimé(s)`, "success");
    } catch (e) { addToast("Erreur suppression : " + e.message, "error"); setCleanupState(null); }
  };

  const filteredOrders = orders.filter(o => {
    const isAct = o.activated === true || activatedIds.has(o.id);
    if (filter === "pending")   return !isAct && o.plan !== "starter";
    if (filter === "activated") return isAct;
    return true;
  });

  const pendingCount = orders.filter(o => o.activated !== true && !activatedIds.has(o.id) && o.plan !== "starter").length;

  const activerClient = async (order) => {
    if (activatingOrder) return;
    if (order.plan === "starter") {
      addToast("Plan Starter — pas d'espace client à activer. Livre le programme par email.", "error");
      return;
    }
    setActivatingOrder(order.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/activate-client", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          email: order.email,
          nom: order.nom || order.email.split("@")[0],
          plan: order.plan,
          orderId: order.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActivatedIds(prev => new Set([...prev, order.id]));
        addToast(`✅ Compte activé pour ${order.nom || order.email}`);
      } else {
        addToast(data.error || "Erreur lors de l'activation", "error");
      }
    } catch (e) {
      addToast("Erreur réseau : " + e.message, "error");
    }
    setActivatingOrder(null);
  };

  const totalRevenue = orders.reduce((s, o) => s + (o.montant || 0), 0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:960,margin:"0 auto",animation:"fadeUp 0.3s ease forwards"}}>
      {/* En-tête */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:6}}>— Stripe</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,color:"#F0EDE8"}}>
            Commandes
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {[
            {label:"Total",      val:orders.length,     color:"#C9A84C"},
            {label:"À activer",  val:pendingCount,      color:pendingCount>0?"#E07070":"#555"},
            {label:"Revenus",    val:`${totalRevenue}€`, color:"#7AE07A"},
          ].map((k,i) => (
            <div key={i} style={{background:"#0D0D0D",border:"0.5px solid #1A1A1A",borderRadius:12,padding:"10px 16px",textAlign:"center",minWidth:90}}>
              <div style={{fontSize:18,fontWeight:700,color:k.color,lineHeight:1}}>{k.val}</div>
              <div style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",color:"#555",marginTop:4}}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nettoyage docs fantômes */}
      <div style={{background:"rgba(224,112,112,0.04)",border:"0.5px solid rgba(224,112,112,0.15)",borderRadius:8,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"#E07070",marginBottom:2}}>🧹 Nettoyage Firestore</div>
          <div style={{fontSize:11,color:"#555",lineHeight:1.5}}>
            {cleanupState === null && "Supprime les docs clients sans compte Firebase Auth (créés par erreur)"}
            {cleanupState === "scanning" && "Scan en cours…"}
            {cleanupState === "deleting" && "Suppression en cours…"}
            {cleanupState === "done" && "✅ Nettoyage terminé — actualise la page"}
            {cleanupState && typeof cleanupState === "object" && (
              cleanupState.phantomCount === 0
                ? "✅ Aucun doc fantôme trouvé — Firestore est propre"
                : `⚠ ${cleanupState.phantomCount} doc(s) fantôme(s) trouvé(s) : ${cleanupState.phantoms.map(p => p.email || p.id).join(", ")}`
            )}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          {(cleanupState === null || cleanupState === "done") && (
            <button onClick={scanPhantoms} style={{background:"transparent",border:"0.5px solid rgba(224,112,112,0.4)",color:"#E07070",fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",padding:"6px 14px",cursor:"pointer",borderRadius:20}}>
              🔍 Scanner
            </button>
          )}
          {cleanupState && typeof cleanupState === "object" && cleanupState.phantomCount > 0 && (
            <button onClick={deletePhantoms} style={{background:"rgba(224,112,112,0.15)",border:"0.5px solid rgba(224,112,112,0.4)",color:"#E07070",fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",padding:"6px 14px",cursor:"pointer",borderRadius:20}}>
              🗑 Supprimer ({cleanupState.phantomCount})
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div style={{display:"flex",gap:6}}>
        {[["all","Toutes"],["pending","À activer"],["activated","Activées"]].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            background:filter===val?"rgba(201,168,76,0.12)":"transparent",
            border:`0.5px solid ${filter===val?"rgba(201,168,76,0.4)":"#1E1E1E"}`,
            color:filter===val?"#E8C87A":"#555",
            fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,
            letterSpacing:"1.5px",textTransform:"uppercase",
            padding:"6px 16px",cursor:"pointer",borderRadius:20,transition:"all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Liste commandes */}
      {filteredOrders.length === 0 ? (
        <div style={{textAlign:"center",padding:"4rem 2rem",color:"#333",fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:"italic"}}>
          {orders.length === 0 ? "Aucune commande pour l'instant." : "Aucune commande dans ce filtre."}
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filteredOrders.map(order => {
            const isActivated = order.activated === true || activatedIds.has(order.id);
            const isActivating = activatingOrder === order.id;
            const planColor = PLAN_COLORS[order.plan?.toLowerCase()] || "#555";
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

            return (
              <div key={order.id} style={{
                background:isActivated?"rgba(122,224,122,0.02)":"#0D0D0D",
                border:`0.5px solid ${isActivated?"rgba(122,224,122,0.15)":"#1A1A1A"}`,
                borderRadius:12,padding:"16px 20px",
                display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",
                transition:"all 0.2s",
              }}>
                <div style={{
                  fontSize:9,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",
                  color:planColor,background:`rgba(${planColor==="#7AE07A"?"122,224,122":planColor==="#C9A84C"?"201,168,76":"232,200,122"},0.1)`,
                  padding:"4px 12px",borderRadius:20,flexShrink:0,fontFamily:"'Syne',sans-serif",
                  border:`0.5px solid ${planColor}33`,
                }}>{order.plan?.toUpperCase() || "—"}</div>

                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#F0EDE8",marginBottom:2}}>{order.nom || "—"}</div>
                  <div style={{fontSize:11,color:"#555"}}>{order.email} · {date}</div>
                </div>

                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:700,color:"#7AE07A"}}>{order.montant}€</div>
                  <div style={{fontSize:9,color:"#555",letterSpacing:"1px",textTransform:"uppercase"}}>payé</div>
                </div>

                <div style={{flexShrink:0}}>
                  {order.plan === "starter" ? (
                    <div style={{fontSize:10,color:"#555",letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'Syne',sans-serif",padding:"6px 14px",background:"rgba(255,255,255,0.02)",border:"0.5px solid #1A1A1A",borderRadius:20}}>
                      📧 Email uniquement
                    </div>
                  ) : isActivated ? (
                    <div style={{fontSize:10,color:"#7AE07A",letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'Syne',sans-serif",padding:"6px 14px",background:"rgba(122,224,122,0.06)",border:"0.5px solid rgba(122,224,122,0.3)",borderRadius:20}}>
                      ✓ Compte activé
                    </div>
                  ) : (
                    <button
                      onClick={() => activerClient(order)}
                      disabled={!!activatingOrder}
                      style={{
                        background:isActivating?"#181818":"linear-gradient(135deg,#C9A84C,#A67C2E)",
                        border:"none",color:"#0A0A0A",
                        fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,
                        letterSpacing:"1.5px",textTransform:"uppercase",
                        padding:"8px 18px",cursor:isActivating?"not-allowed":"pointer",
                        borderRadius:20,display:"flex",alignItems:"center",gap:6,
                        transition:"all 0.2s",opacity:activatingOrder&&!isActivating?0.4:1,
                      }}
                    >
                      {isActivating && <div style={{width:10,height:10,border:"1.5px solid rgba(0,0,0,0.3)",borderTopColor:"#0A0A0A",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>}
                      {isActivating ? "Activation..." : "Activer le compte →"}
                    </button>
                  )}
                </div>

                <div style={{fontSize:9,color:"#2A2A2A",fontFamily:"'Courier New',monospace",width:"100%",marginTop:-8}}>
                  {order.stripeSessionId?.slice(0,28)}...
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
