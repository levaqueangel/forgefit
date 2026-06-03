"use client";
import { useState, useEffect, useRef, memo } from "react";
import { beep } from "./utils";

function RestTimer({ duration, exerciseName, onDone, onSkip }) {
  const [remaining, setRemaining] = useState(duration);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);
  const doneRef = useRef(false);

  // Entrée animée
  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  useEffect(() => {
    if (paused) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (!doneRef.current) {
            doneRef.current = true;
            beep();
            setTimeout(onDone, 300);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused, onDone]);

  const pct = (duration - remaining) / duration;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining <= 5 && remaining > 0;
  const isWarning = remaining <= 10 && remaining > 5;
  const strokeColor = isUrgent ? "#E07070" : isWarning ? "#E8C87A" : "#C9A84C";

  return (
    <>
      <style>{`
        @keyframes timerSlideIn{from{opacity:0;transform:translateY(20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes timerPulse{0%,100%{box-shadow:0 0 0 0 rgba(224,112,112,0.4)}50%{box-shadow:0 0 0 8px rgba(224,112,112,0)}}
        @keyframes urgentGlow{0%,100%{border-color:rgba(224,112,112,0.5)}50%{border-color:rgba(224,112,112,1)}}
        .timer-wrap{position:fixed;bottom:24px;right:24px;z-index:500;background:#0D0D0D;border-radius:12px;padding:18px 20px;
          box-shadow:0 16px 48px rgba(0,0,0,0.7),0 0 0 0.5px rgba(255,255,255,0.06);min-width:230px}
        .timer-skip:hover{color:#C9A84C !important;border-color:#C9A84C !important}
        .timer-pause:hover{background:rgba(255,255,255,0.05) !important}
      `}</style>
      <div className="timer-wrap" style={{
        animation: visible ? "timerSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
        opacity: visible ? 1 : 0,
        border: isUrgent ? "0.5px solid rgba(224,112,112,0.5)" : "0.5px solid #1E1E1E",
        ...(isUrgent && { animation: "timerSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards, timerPulse 0.8s ease infinite 0.3s" }),
      }}>
        {/* Label */}
        <div style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>
          ⏱ Repos
        </div>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>
          {exerciseName}
        </div>

        {/* Ring + Timer */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0 }}>
            <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: "rotate(-90deg)" }}>
              {/* Track */}
              <circle cx="64" cy="64" r={r} fill="none" stroke="#1A1A1A" strokeWidth="7" />
              {/* Progress */}
              <circle cx="64" cy="64" r={r} fill="none" stroke={strokeColor} strokeWidth="7"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                fontSize: 32, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                color: isUrgent ? "#E07070" : isWarning ? "#E8C87A" : "#F0EDE8",
                lineHeight: 1,
                transition: "color 0.3s ease",
              }}>
                {mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : secs}
              </div>
              {mins === 0 && <div style={{ fontSize: 11, color: "#444", letterSpacing: "1px", marginTop: 2 }}>sec</div>}
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <button className="timer-pause" onClick={() => setPaused(p => !p)} style={{
              background: "transparent", border: "0.5px solid #2A2A2A", color: "#888",
              fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "2px",
              textTransform: "uppercase", padding: "10px 14px", cursor: "pointer", borderRadius: 6,
              transition: "all 0.15s"
            }}>
              {paused ? "▶ Reprendre" : "⏸ Pause"}
            </button>
            <button className="timer-skip" onClick={onSkip} style={{
              background: "transparent", border: "0.5px solid #1A1A1A", color: "#444",
              fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "2px",
              textTransform: "uppercase", padding: "10px 14px", cursor: "pointer", borderRadius: 6,
              transition: "all 0.15s"
            }}>
              Passer →
            </button>
          </div>
        </div>

        {/* Compte à rebours final */}
        {isUrgent && (
          <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "#E07070", fontWeight: 700, letterSpacing: "2px", animation: "urgentGlow 0.5s ease infinite" }}>
            PRÊT… {remaining}
          </div>
        )}
      </div>
    </>
  );
}

export { memo(RestTimer) as RestTimer };
