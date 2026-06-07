import { getAdminDb, verifyAuthToken } from "../firebase-admin";
import { checkRateLimit } from "../rateLimit";
export const dynamic = "force-dynamic";

// ── Communauté Elite — lecture des posts ───────────────────────────────────
export async function GET(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 30, 60_000)) return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const db = getAdminDb();
    // Vérifier que le client est Elite
    const snap = await db.collection("clients").doc(decoded.uid).get();
    if (!snap.exists || snap.data().plan?.toLowerCase() !== "elite") {
      return Response.json({ error: "Réservé aux membres Elite" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const postsSnap = await db.collection("community")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const posts = postsSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
    }));

    return Response.json({ posts });
  } catch (e) {
    console.error("community GET:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

// ── Communauté Elite — créer un post ──────────────────────────────────────
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 5, 60_000)) return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const db = getAdminDb();
    const clientSnap = await db.collection("clients").doc(decoded.uid).get();
    if (!clientSnap.exists || clientSnap.data().plan?.toLowerCase() !== "elite") {
      return Response.json({ error: "Réservé aux membres Elite" }, { status: 403 });
    }

    const { text, anonymous } = await req.json();
    if (!text || text.trim().length < 5) return Response.json({ error: "Message trop court" }, { status: 400 });
    if (text.length > 500) return Response.json({ error: "Message trop long (500 caractères max)" }, { status: 400 });

    const clientData = clientSnap.data();
    const prenom = anonymous ? "Membre Elite" : (clientData.nom?.split(" ")[0] || "Membre Elite");
    const initiale = anonymous ? "?" : prenom[0]?.toUpperCase() || "?";

    const post = {
      text: text.trim(),
      authorId: decoded.uid,
      authorName: prenom,
      authorInitiale: initiale,
      anonymous: !!anonymous,
      likes: [],
      createdAt: new Date(),
    };

    const ref = await db.collection("community").add(post);
    return Response.json({ success: true, id: ref.id });
  } catch (e) {
    console.error("community POST:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}

// ── Communauté Elite — liker un post ──────────────────────────────────────
export async function PATCH(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip, 20, 60_000)) return Response.json({ error: "Trop de requêtes." }, { status: 429 });

  const decoded = await verifyAuthToken(req);
  if (!decoded) return Response.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const db = getAdminDb();
    const clientSnap = await db.collection("clients").doc(decoded.uid).get();
    if (!clientSnap.exists || clientSnap.data().plan?.toLowerCase() !== "elite") {
      return Response.json({ error: "Réservé aux membres Elite" }, { status: 403 });
    }

    const { postId } = await req.json();
    if (!postId) return Response.json({ error: "postId manquant" }, { status: 400 });

    const postRef = db.collection("community").doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) return Response.json({ error: "Post introuvable" }, { status: 404 });

    const likes = postSnap.data().likes || [];
    const alreadyLiked = likes.includes(decoded.uid);
    const newLikes = alreadyLiked ? likes.filter(id => id !== decoded.uid) : [...likes, decoded.uid];

    await postRef.update({ likes: newLikes });
    return Response.json({ success: true, liked: !alreadyLiked, count: newLikes.length });
  } catch (e) {
    console.error("community PATCH:", e.message);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}
