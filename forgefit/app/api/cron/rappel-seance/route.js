import { getAdminDb } from "../../firebase-admin";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://apxfitness-brown.vercel.app";

// Cron quotidien — envoie un rappel push aux clients qui ont une séance aujourd'hui
// Horaire vercel.json : 07:00 UTC = 9h France été / 8h France hiver
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const JOURS_FR = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const jourAujourdhui = JOURS_FR[new Date().getDay()];

  try {
    const db = getAdminDb();
    const snapshot = await db.collection("clients").get();
    const clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Clients avec programme actif + séance aujourd'hui + pushSubscription
    const toNotify = clients.filter(c => {
      if (!c.pushSubscription) return false;
      if (!c.programmeData?.seances?.length) return false;
      return c.programmeData.seances.some(s =>
        s.jour?.toLowerCase() === jourAujourdhui.toLowerCase()
      );
    });

    let sent = 0;
    let errors = 0;

    for (const client of toNotify) {
      const seanceDuJour = client.programmeData.seances.find(s =>
        s.jour?.toLowerCase() === jourAujourdhui.toLowerCase()
      );
      try {
        const res = await fetch(`${SITE}/api/push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": process.env.CRON_SECRET || "",
          },
          body: JSON.stringify({
            clientId: client.id,
            title: "⚡ APXFITNESS — Séance du jour",
            body: seanceDuJour
              ? `${seanceDuJour.nom} · ${seanceDuJour.duree_min || 60}min — Lance-toi !`
              : "Ta séance t'attend aujourd'hui. Lance-toi !",
            url: "/client",
          }),
        });
        if (res.ok) sent++;
        else errors++;
      } catch { errors++; }
    }

    console.log(`rappel-seance: ${sent} push envoyés, ${errors} erreurs (${jourAujourdhui})`);
    return Response.json({ success: true, jour: jourAujourdhui, sent, errors, total: toNotify.length });
  } catch (e) {
    console.error("rappel-seance cron error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
