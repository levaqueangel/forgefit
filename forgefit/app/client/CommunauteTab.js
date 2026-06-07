"use client";
import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase";

function Avatar({ initiale, color }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: `rgba(201,168,76,0.1)`,
      border: `0.5px solid rgba(201,168,76,0.3)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, color: "#C9A84C",
      fontFamily: "'Syne',sans-serif", flexShrink: 0,
    }}>
      {initiale || "?"}
    </div>
  );
}

function PostCard({ post, currentUid, onLike }) {
  const liked = post.likes?.includes(currentUid);
  const age = (() => {
    const diff = Date.now() - new Date(post.createdAt).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return "à l'instant";
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${d}j`;
  })();

  return (
    <div style={{
      background: "#111", border: "0.5px solid #1E1E1E", borderRadius: 14,
      padding: "16px", display: "flex", flexDirection: "column", gap: 10,
      transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Avatar initiale={post.authorInitiale} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F0EDE8", fontFamily: "'Syne',sans-serif" }}>
            {post.authorName}
          </div>
          <div style={{ fontSize: 10, color: "#333", fontFamily: "'Syne',sans-serif" }}>{age}</div>
        </div>
        <div style={{
          fontSize: 8, letterSpacing: "2px", textTransform: "uppercase",
          color: "#C9A84C", border: "0.5px solid rgba(201,168,76,0.3)",
          padding: "3px 8px", borderRadius: 20,
        }}>Elite</div>
      </div>

      <p style={{
        fontFamily: "'Cormorant Garamond',serif", fontSize: 15,
        color: "#C8C4BC", lineHeight: 1.7, margin: 0,
      }}>
        {post.text}
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => onLike(post.id)} style={{
          display: "flex", alignItems: "center", gap: 5,
          background: liked ? "rgba(201,168,76,0.1)" : "transparent",
          border: `0.5px solid ${liked ? "rgba(201,168,76,0.4)" : "#1A1A1A"}`,
          color: liked ? "#C9A84C" : "#444",
          fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700,
          padding: "5px 12px", borderRadius: 20, cursor: "pointer",
          transition: "all 0.15s",
        }}>
          {liked ? "❤️" : "🤍"} {post.likes?.length || 0}
        </button>
      </div>
    </div>
  );
}

export function CommunauteTab({ S, clientData, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isElite = clientData?.plan?.toLowerCase() === "elite";

  const getToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  const loadPosts = useCallback(async () => {
    if (!isElite) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/community?limit=30", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch {}
    setLoading(false);
  }, [isElite, getToken]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true); setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim(), anonymous }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); setPosting(false); return; }
      setText(""); setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      await loadPosts();
    } catch { setError("Erreur de connexion."); }
    setPosting(false);
  };

  const handleLike = async (postId) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p;
          const liked = p.likes?.includes(user?.uid);
          return {
            ...p,
            likes: liked ? (p.likes || []).filter(id => id !== user?.uid) : [...(p.likes || []), user?.uid],
          };
        }));
      }
    } catch {}
  };

  if (!isElite) {
    return (
      <div className="fade-in" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:"3rem 1rem", textAlign:"center" }}>
        <div style={{ fontSize:48 }}>👑</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:"#C9A84C", fontStyle:"italic" }}>
          Espace communauté Elite
        </div>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:"#555", lineHeight:1.8, maxWidth:340 }}>
          La communauté est réservée aux membres Elite. Passe au plan supérieur pour rejoindre les échanges.
        </p>
        <div style={{ background:"rgba(201,168,76,0.06)", border:"0.5px solid rgba(201,168,76,0.2)", borderRadius:10, padding:"12px 20px", fontSize:11, color:"#C9A84C", letterSpacing:"2px", textTransform:"uppercase" }}>
          Plan Elite — 249€/mois
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={S.card}>
        <div style={S.cardTitle}>👥 Communauté Elite
          <span style={{ marginLeft:"auto", fontSize:10, color:"#555", letterSpacing:"2px", textTransform:"uppercase" }}>
            {posts.length} post{posts.length > 1 ? "s" : ""}
          </span>
        </div>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:"#555", lineHeight:1.7, margin:0 }}>
          Un espace privé pour partager ta progression, tes astuces et te motiver mutuellement.
        </p>
      </div>

      {/* Zone de publication */}
      <div style={S.card}>
        <div style={{ fontSize:9, letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:10 }}>
          Nouveau message
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0, 500))}
          placeholder="Partage ta progression, une astuce, ou motive la communauté..."
          rows={3}
          style={{
            width: "100%", background: "#0D0D0D", border: "0.5px solid #242424",
            borderRadius: 10, padding: "12px 14px", color: "#F0EDE8",
            fontFamily: "'Cormorant Garamond',serif", fontSize: 15, lineHeight: 1.6,
            resize: "vertical", outline: "none", boxSizing: "border-box",
          }}
        />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, gap:10 }}>
          <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
              style={{ accentColor:"#C9A84C" }} />
            <span style={{ fontSize:11, color:"#555", fontFamily:"'Syne',sans-serif" }}>Anonyme</span>
          </label>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:10, color:"#333", fontFamily:"'Syne',sans-serif" }}>{text.length}/500</span>
            <button onClick={handlePost} disabled={!text.trim() || posting} style={{
              background: text.trim() ? "linear-gradient(135deg,#C9A84C,#A67C2E)" : "#111",
              border: "none", color: text.trim() ? "#0A0A0A" : "#333",
              fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: "2px", textTransform: "uppercase",
              padding: "8px 18px", borderRadius: 20, cursor: text.trim() ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}>
              {success ? "✓ Publié !" : posting ? "..." : "Publier →"}
            </button>
          </div>
        </div>
        {error && <div style={{ fontSize:11, color:"#E07070", marginTop:8 }}>{error}</div>}
      </div>

      {/* Feed */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[1,2,3].map(i => (
            <div key={i} className="skel" style={{ height:100, borderRadius:14 }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign:"center", padding:"2rem", color:"#333",
          fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontStyle:"italic" }}>
          Sois le premier à publier quelque chose 👋
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUid={user?.uid} onLike={handleLike} />
          ))}
        </div>
      )}
    </div>
  );
}
