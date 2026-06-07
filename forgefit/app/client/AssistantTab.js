"use client";
import { useRef, useState, useEffect, useCallback } from "react";

// ── Rendu Markdown simplifié ──────────────────────────────────────────────────
function MarkdownText({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let listItems = [];

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ margin: "6px 0 6px 4px", padding: 0, listStyle: "none" }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
              <span style={{ color: "#C9A84C", flexShrink: 0 }}>·</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    // Liste à puces
    if (/^[-•*]\s+/.test(line)) {
      listItems.push(line.replace(/^[-•*]\s+/, ""));
      return;
    }
    flushList(i);

    // Titre
    if (/^#{1,3}\s+/.test(line)) {
      const txt = line.replace(/^#{1,3}\s+/, "");
      elements.push(
        <div key={i} style={{ fontWeight: 700, color: "#C9A84C", fontSize: 13, marginTop: 8, marginBottom: 2 }}>
          {renderInline(txt)}
        </div>
      );
      return;
    }

    // Ligne vide
    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 6 }} />);
      return;
    }

    // Paragraphe normal
    elements.push(<p key={i} style={{ margin: "2px 0", lineHeight: 1.75 }}>{renderInline(line)}</p>);
  });

  flushList("end");
  return <>{elements}</>;
}

function renderInline(text) {
  // **gras** et *italique* et `code`
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index} style={{ color: "#F0EDE8" }}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} style={{ color: "#C9A84C" }}>{match[3]}</em>);
    else if (match[4]) parts.push(
      <code key={match.index} style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", borderRadius: 4, padding: "1px 5px", fontSize: 12, fontFamily: "monospace", color: "#7AE07A" }}>
        {match[4]}
      </code>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

// ── Follow-up contextuel après chaque réponse ─────────────────────────────────
function getFollowUps(userMsg, hasProgramme) {
  const q = (userMsg || "").toLowerCase();
  const TOPICS = [
    { k: ["squat","jambe","quadri","genoux","cuisse"], q: ["Comment éviter les douleurs aux genoux au squat ?","Squat avant ou arrière — quelle différence ?","Quel volume de squat optimal par semaine ?"] },
    { k: ["développé","couché","pecto","poitrine","bench","press"], q: ["Technique développé couché : comment placer les coudes ?","Quel écartement de prise pour cibler les pectoraux ?","Fréquence optimale pour les pectoraux ?"] },
    { k: ["protéine","protein","macros","gramme"], q: ["Meilleures sources de protéines pour sportifs ?","Protéines avant ou après l'entraînement ?","Comment atteindre mes besoins protéiques au quotidien ?"] },
    { k: ["récupér","courbatur","repos","fatigue","douleur"], q: ["Comment réduire les courbatures rapidement ?","Combien de jours de repos par semaine ?","Puis-je m'entraîner avec des courbatures ?"] },
    { k: ["sèche","séche","séche","gras","définition","perd","maigr"], q: ["Quel déficit calorique pour perdre du gras sans perdre du muscle ?","Cardio ou musculation pour la sèche ?","Comment préserver le muscle en restriction calorique ?"] },
    { k: ["masse","prise","gain","grossir","bulk"], q: ["Quel surplus calorique pour prendre de la masse ?","Fréquence optimale en prise de masse ?","Meilleurs exercices pour maximiser la prise de masse ?"] },
    { k: ["sommeil","nuit","dorm","repos"], q: ["Durée de sommeil optimale pour la récupération musculaire ?","Comment optimiser son sommeil pour progresser ?","Faut-il faire une sieste après l'entraînement ?"] },
    { k: ["charge","progression","1rm","max","stagne"], q: ["Comment débloquer une stagnation en force ?","Principe de surcharge progressive — comment l'appliquer ?","Quand est-ce bon d'augmenter les poids ?"] },
    { k: ["créatine","whey","bcaa","supplément","complément"], q: ["La créatine est-elle réellement efficace ?","Whey ou sources alimentaires — que choisir ?","Les BCAA sont-ils utiles si l'apport protéique est bon ?"] },
    { k: ["nutrition","aliment","manger","repas","calori","kcal"], q: ["Que manger avant une séance de musculation ?","Que manger dans l'heure après l'entraînement ?","Comment calculer mes besoins caloriques journaliers ?"] },
    { k: ["cardio","course","vélo","endurance"], q: ["Comment combiner cardio et musculation ?","Cardio à jeun : mythe ou réalité ?","Quelle durée de cardio pour brûler du gras efficacement ?"] },
    { k: ["traction","dos","rowing","dorsaux"], q: ["Comment progresser en tractions ?","Technique du rowing barre — points clés ?","Quel volume pour développer le dos ?"] },
  ];
  for (const { k, q: suggestions } of TOPICS) {
    if (k.some(kw => q.includes(kw))) return suggestions;
  }
  return hasProgramme
    ? ["Explique-moi un exercice de mon programme","Mes macros sont-elles adaptées à mon objectif ?","Comment optimiser mes séances cette semaine ?"]
    : ["Comment structurer ma semaine d'entraînement ?","Exercices fondamentaux pour débutant ?","Comment calculer mes besoins caloriques ?"];
}

// ── Suggestions rapides contextuelles ────────────────────────────────────────
const SUGGESTIONS_DEFAULT = [
  "Comment bien exécuter un squat ?",
  "Quelle est la bonne quantité de protéines par jour ?",
  "Comment récupérer après une séance intense ?",
  "Combien de temps reposer entre les séances ?",
  "Comment progresser si je stagne ?",
  "Quels aliments manger avant l'entraînement ?",
];

const SUGGESTIONS_PROGRAMME = [
  "Explique-moi le premier exercice de ma séance",
  "Comment améliorer ma technique sur le développé couché ?",
  "Est-ce que je peux substituer un exercice de mon programme ?",
  "Mes calories sont-elles adaptées à mon objectif ?",
  "J'ai raté une séance, comment rattraper ?",
  "Comment progresser en charge sur le squat ?",
];

// ── Bouton copier ─────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button onClick={copy} title="Copier" style={{
      background: "transparent", border: "none", color: copied ? "#7AE07A" : "#2A2A2A",
      cursor: "pointer", padding: "2px 4px", fontSize: 12, lineHeight: 1,
      transition: "color 0.2s", flexShrink: 0,
    }}>
      {copied ? "✓" : "⎘"}
    </button>
  );
}

// ── Bulle de message ──────────────────────────────────────────────────────────
function ChatBubble({ msg, isStreaming }) {
  const isUser = msg.role === "user";
  const ts = msg.ts ? new Date(msg.ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="chat-bubble" style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
      <div style={{
        maxWidth: "85%", padding: "10px 14px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        fontSize: 13, lineHeight: 1.7,
        background: isUser ? "rgba(201,168,76,0.1)" : "#181818",
        border: `0.5px solid ${isUser ? "rgba(201,168,76,0.35)" : "#242424"}`,
        color: isUser ? "#E8C87A" : "#C8C4BC",
        position: "relative",
      }}>
        {isUser ? (
          <p style={{ margin: 0, lineHeight: 1.75 }}>{msg.content}</p>
        ) : (
          <>
            <MarkdownText text={msg.content} />
            {isStreaming && (
              <span style={{
                display: "inline-block", width: 8, height: 14,
                background: "#C9A84C", borderRadius: 2, marginLeft: 2,
                animation: "pulse 0.8s ease-in-out infinite", verticalAlign: "middle",
              }}/>
            )}
          </>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
        <span style={{ fontSize: 10, color: "#555" }}>
          {isUser ? "Toi" : "Assistant IA"}{ts ? ` · ${ts}` : ""}
        </span>
        {!isUser && !isStreaming && msg.content && <CopyBtn text={msg.content} />}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
const STORAGE_KEY = "apx_chat_history";
const MAX_HISTORY = 30;

export function AssistantTab({ S, clientData, user }) {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [{ role: "assistant", content: "Bonjour ! Je suis ton assistant fitness APXFITNESS 💪\n\nPose-moi tes questions sur **l'entraînement**, la **nutrition** ou la **récupération** — je connais ton programme et tes données.", ts: Date.now() }];
  });

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingIdx, setStreamingIdx] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [followUps, setFollowUps] = useState([]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const hasProgramme = !!clientData?.programmeData;
  const suggestions = hasProgramme ? SUGGESTIONS_PROGRAMME : SUGGESTIONS_DEFAULT;

  // Scroll en bas à chaque nouveau message / chunk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Persistance localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY))); } catch {}
  }, [history]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;

    setInput("");
    setShowSuggestions(false);
    setFollowUps([]);
    setStreaming(true);

    // Ajouter le message utilisateur
    const userMsg = { role: "user", content: msg, ts: Date.now() };
    setHistory(h => [...h, userMsg]);

    // Préparer le slot de réponse IA (streaming)
    const aiMsg = { role: "assistant", content: "", ts: Date.now() };
    setHistory(h => { const next = [...h, aiMsg]; setStreamingIdx(next.length - 1); return next; });

    // Préparer le contexte à envoyer
    const historyToSend = history.slice(-10).map(m => ({ role: m.role, content: m.content }));

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const token = user ? await user.getIdToken?.() : null;

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: msg,
          history: historyToSend,
          uid: user?.uid || null,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        setHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, content: err.error || "Erreur de connexion.", error: true } : m));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const { text, error } = JSON.parse(raw);
            if (error) {
              setHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, content: "Désolé, une erreur s'est produite.", error: true } : m));
              return;
            }
            if (text) {
              fullText += text;
              setHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, content: fullText } : m));
            }
          } catch {}
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, content: "Erreur de connexion. Réessaie dans un instant.", error: true } : m));
      }
    } finally {
      setStreaming(false);
      setStreamingIdx(null);
      abortRef.current = null;
      /* Générer les questions de suivi selon le topic */
      setFollowUps(getFollowUps(msg, hasProgramme));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, streaming, history, user, hasProgramme]);

  const stopStream = () => { abortRef.current?.abort(); };

  const clearHistory = () => {
    setHistory([{ role: "assistant", content: "Conversation réinitialisée. Que puis-je faire pour toi ?", ts: Date.now() }]);
    setShowSuggestions(true);
    setFollowUps([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 0, height: "calc(100vh - 200px)", minHeight: 400 }}>
      <div style={{ ...S.card, flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ padding: "14px 18px", borderBottom: "0.5px solid #1A1A1A", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ ...S.cardTitle, marginBottom: 2 }}>
              🤖 Assistant IA
              {hasProgramme && (
                <span style={{ marginLeft: 8, fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", color: "#7AE07A", background: "rgba(122,224,122,0.08)", border: "0.5px solid rgba(122,224,122,0.2)", padding: "2px 7px", borderRadius: 10 }}>
                  Ton programme chargé
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: "#333", letterSpacing: "0.5px" }}>
              Musculation · Nutrition · Récupération
            </div>
          </div>
          <button onClick={clearHistory} title="Effacer la conversation" style={{
            background: "transparent", border: "0.5px solid #1A1A1A", color: "#333",
            fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: "1.5px",
            textTransform: "uppercase", padding: "5px 10px", borderRadius: 20,
            cursor: "pointer", transition: "all 0.15s",
          }}>
            ↺ Effacer
          </button>
        </div>

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>

          {history.map((msg, i) => (
            <ChatBubble
              key={i}
              msg={msg}
              isStreaming={streaming && i === streamingIdx}
            />
          ))}

          {/* Indicateur typing (avant que le premier token arrive) */}
          {streaming && streamingIdx !== null && history[streamingIdx]?.content === "" && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
              <div style={{ padding: "12px 16px", background: "#181818", border: "0.5px solid #242424", borderRadius: "14px 14px 14px 4px", display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: "#555", animation: "typingDot 1.2s ease-in-out infinite", animationDelay: `${j * 0.18}s` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Follow-ups contextuels ── */}
        {followUps.length > 0 && !streaming && (
          <div style={{ padding: "0 18px 10px", flexShrink: 0 }}>
            <div style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#3A3A3A", marginBottom: 7 }}>
              Continuer avec →
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {followUps.map((s, i) => (
                <button key={i} onClick={() => { setFollowUps([]); send(s); }} style={{
                  background: "rgba(93,202,165,0.04)", border: "0.5px solid rgba(93,202,165,0.2)",
                  color: "#888", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
                  fontSize: 12, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                  transition: "all 0.15s", lineHeight: 1.4,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(93,202,165,0.5)"; e.currentTarget.style.color = "#5DCAA5"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(93,202,165,0.2)"; e.currentTarget.style.color = "#888"; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Suggestions rapides ── */}
        {showSuggestions && !streaming && (
          <div style={{ padding: "0 18px 10px", flexShrink: 0 }}>
            <div style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#333", marginBottom: 7 }}>
              Questions fréquentes
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {suggestions.slice(0, 4).map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  background: "rgba(201,168,76,0.04)", border: "0.5px solid rgba(201,168,76,0.2)",
                  color: "#888", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
                  fontSize: 12, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                  transition: "all 0.15s", lineHeight: 1.4,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; e.currentTarget.style.color = "#C9A84C"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.color = "#888"; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input ── */}
        <div style={{ padding: "10px 14px", borderTop: "0.5px solid #1A1A1A", display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0, background: "#0A0A0A" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            onFocus={() => setShowSuggestions(false)}
            placeholder="Pose ta question... (Entrée pour envoyer)"
            rows={1}
            disabled={streaming}
            style={{
              flex: 1, background: "#111", border: "0.5px solid #1A1A1A",
              color: "#F0EDE8", fontFamily: "'Syne',sans-serif", fontSize: 13,
              padding: "10px 14px", resize: "none", minHeight: 42, maxHeight: 120,
              outline: "none", borderRadius: 14, lineHeight: 1.5,
              transition: "border-color 0.2s", opacity: streaming ? 0.5 : 1,
            }}
          />
          {streaming ? (
            <button onClick={stopStream} title="Arrêter" style={{
              background: "rgba(224,112,112,0.15)", border: "0.5px solid rgba(224,112,112,0.4)",
              color: "#E07070", width: 42, height: 42, borderRadius: "50%",
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}>
              ◼
            </button>
          ) : (
            <button onClick={() => send()} disabled={!input.trim()} style={{
              background: input.trim() ? "linear-gradient(135deg,#C9A84C,#A67C2E)" : "#181818",
              border: "none", color: "#0A0A0A",
              width: 42, height: 42, borderRadius: "50%",
              cursor: input.trim() ? "pointer" : "not-allowed",
              fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s",
            }}>
              ↑
            </button>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "6px 18px 10px", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "#222", letterSpacing: "0.3px" }}>
            L'IA répond aux questions générales · Pour un suivi personnalisé, écris au coach dans Messages
          </p>
        </div>
      </div>
    </div>
  );
}
