"use client";
import { useRef, useState } from "react";

/* Dessine un rectangle aux coins arrondis dans un ctx canvas */
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function downloadCanvas(canvas) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "mon-parcours-apxfitness.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function PartagerCard({ clientData, pd, doneSeances, realStreak, currentWeek, totalWeeks }) {
  const canvasRef = useRef(null);
  const [state, setState] = useState("idle"); // idle | loading | done

  const generate = async () => {
    if (state === "loading") return;
    setState("loading");

    /* Charger les polices avant de dessiner */
    try {
      await Promise.allSettled([
        document.fonts.load("800 48px Syne"),
        document.fonts.load("700 48px Syne"),
        document.fonts.load("400 24px Syne"),
        document.fonts.load("italic 400 28px 'Cormorant Garamond'"),
      ]);
    } catch {}

    const W = 1080, H = 1080;
    const canvas = canvasRef.current;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    /* ── Fond ── */
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, W, H);

    /* Halo doré bas-centre */
    const halo = ctx.createRadialGradient(W / 2, H * 0.65, 0, W / 2, H * 0.65, 480);
    halo.addColorStop(0, "rgba(232,176,0,0.09)");
    halo.addColorStop(1, "transparent");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    /* ── Barre top dégradée ── */
    const barGrad = ctx.createLinearGradient(0, 0, W, 0);
    barGrad.addColorStop(0, "#E8B000");
    barGrad.addColorStop(1, "#5DCAA5");
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, W, 5);

    /* ── Logo ── */
    const PAD = 80;
    ctx.textBaseline = "top";

    ctx.font = "800 54px Syne, sans-serif";
    ctx.fillStyle = "#F0EDE8";
    ctx.fillText("APX", PAD, 72);
    const apxW = ctx.measureText("APX").width;
    ctx.fillStyle = "#E8B000";
    ctx.fillText("FITNESS", PAD + apxW + 2, 72);

    ctx.font = "400 19px Syne, sans-serif";
    ctx.fillStyle = "#3A3A3A";
    ctx.fillText("MON PARCOURS FITNESS", PAD, 138);

    /* ── Séparateur ── */
    ctx.strokeStyle = "#1A1A1A";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, 172); ctx.lineTo(W - PAD, 172); ctx.stroke();

    /* ── Grande métrique centrale : semaines ── */
    const weeks = currentWeek || 1;
    ctx.font = "700 190px Syne, sans-serif";
    ctx.fillStyle = "#E8B000";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`${weeks}`, PAD, 400);
    const bigW = ctx.measureText(`${weeks}`).width;

    ctx.font = "400 34px 'Cormorant Garamond', serif";
    ctx.fillStyle = "#888";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("semaines complétées", PAD + bigW + 18, 370);

    /* Objectif en italique */
    if (pd?.objectif_principal) {
      ctx.font = "italic 400 26px 'Cormorant Garamond', serif";
      ctx.fillStyle = "#555";
      ctx.fillText(`Objectif : ${pd.objectif_principal}`, PAD, 435);
    }

    /* ── Metrics 3 cartes ── */
    const mY = 500, mH = 200, mGap = 28;
    const mW = Math.floor((W - PAD * 2 - mGap * 2) / 3);
    const mCards = [
      { val: `${doneSeances}/4`, label: "séances\ncette semaine", color: "#E8B000" },
      { val: `${realStreak || 0}j`,  label: "jours de\nstreak",       color: "#7AE07A" },
      { val: pd?.duree_programme_semaines ? `${pd.duree_programme_semaines}W` : "—", label: "durée\nprogramme", color: "#5DCAA5" },
    ];

    mCards.forEach((m, i) => {
      const mX = PAD + i * (mW + mGap);

      /* Fond carte */
      ctx.fillStyle = "#0D0D0D";
      rr(ctx, mX, mY, mW, mH, 18); ctx.fill();

      /* Accent border subtil */
      ctx.strokeStyle = "#1A1A1A";
      ctx.lineWidth = 1;
      rr(ctx, mX, mY, mW, mH, 18); ctx.stroke();

      /* Barre couleur top */
      ctx.fillStyle = m.color;
      rr(ctx, mX + 24, mY, mW - 48, 3, 2); ctx.fill();

      /* Valeur */
      ctx.font = "700 70px Syne, sans-serif";
      ctx.fillStyle = m.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(m.val, mX + mW / 2, mY + 112);

      /* Label */
      ctx.font = "400 18px Syne, sans-serif";
      ctx.fillStyle = "#555";
      const lines = m.label.split("\n");
      lines.forEach((l, li) => ctx.fillText(l, mX + mW / 2, mY + 140 + li * 25));
    });
    ctx.textAlign = "left";

    /* ── Badge nom ── */
    const nom = clientData?.prenom || clientData?.nom?.split(" ")[0] || "Athlete";
    const badgeY = 740, badgeH = 76;

    ctx.fillStyle = "rgba(232,176,0,0.06)";
    rr(ctx, PAD, badgeY, 440, badgeH, 14); ctx.fill();
    ctx.strokeStyle = "rgba(232,176,0,0.2)";
    ctx.lineWidth = 1;
    rr(ctx, PAD, badgeY, 440, badgeH, 14); ctx.stroke();

    ctx.font = "700 30px Syne, sans-serif";
    ctx.fillStyle = "#F0EDE8";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(nom, PAD + 24, badgeY + 44);

    ctx.font = "400 18px Syne, sans-serif";
    ctx.fillStyle = "#E8B000";
    ctx.fillText("Membre APXFITNESS", PAD + 24, badgeY + 66);

    /* ── Barre de progression programme ── */
    const barY = 860, barW = W - PAD * 2;
    const prog = Math.min(((currentWeek || 1) / (totalWeeks || 12)), 1);

    ctx.font = "400 18px Syne, sans-serif";
    ctx.fillStyle = "#444";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Progression programme", PAD, barY - 12);
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(prog * 100)} %`, W - PAD, barY - 12);
    ctx.textAlign = "left";

    /* Track */
    ctx.fillStyle = "#1A1A1A";
    rr(ctx, PAD, barY, barW, 8, 4); ctx.fill();

    /* Fill */
    const fillGrad = ctx.createLinearGradient(PAD, 0, PAD + barW * prog, 0);
    fillGrad.addColorStop(0, "#E8B000");
    fillGrad.addColorStop(1, "#5DCAA5");
    ctx.fillStyle = fillGrad;
    rr(ctx, PAD, barY, Math.max(barW * prog, 8), 8, 4); ctx.fill();

    /* ── Séparateur bas ── */
    ctx.strokeStyle = "#1A1A1A";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, 928); ctx.lineTo(W - PAD, 928); ctx.stroke();

    /* ── Footer ── */
    ctx.font = "400 20px Syne, sans-serif";
    ctx.fillStyle = "#E8B000";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("apxfitness.fr", PAD, 975);

    ctx.textAlign = "right";
    ctx.fillStyle = "#2A2A2A";
    ctx.fillText("© 2026 APXFITNESS", W - PAD, 975);
    ctx.textAlign = "left";

    /* ── Partage ou téléchargement ── */
    setState("done");
    setTimeout(() => setState("idle"), 3500);

    try {
      canvas.toBlob(async (blob) => {
        const file = new File([blob], "mon-parcours-apxfitness.png", { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Mon parcours APXFITNESS",
            text: `${weeks} semaine${weeks > 1 ? "s" : ""} de progression 💪 #APXFITNESS`,
          });
        } else {
          downloadCanvas(canvas);
        }
      }, "image/png");
    } catch {
      downloadCanvas(canvas);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button
        onClick={generate}
        disabled={state === "loading"}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: state === "done"
            ? "rgba(122,224,122,0.1)"
            : "rgba(232,176,0,0.08)",
          border: `0.5px solid ${state === "done" ? "rgba(122,224,122,0.4)" : "rgba(232,176,0,0.3)"}`,
          borderRadius: 10, padding: "10px 18px",
          color: state === "done" ? "#7AE07A" : "#E8B000",
          fontSize: 12, fontFamily: "'Syne',sans-serif", fontWeight: 700,
          letterSpacing: "1.5px", textTransform: "uppercase",
          cursor: state === "loading" ? "wait" : "pointer",
          width: "100%", justifyContent: "center",
          transition: "all 0.2s",
          opacity: state === "loading" ? 0.6 : 1,
        }}
      >
        {state === "loading" && (
          <span style={{ width: 14, height: 14, border: "2px solid rgba(232,176,0,0.3)", borderTop: "2px solid #E8B000", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
        )}
        {state === "loading" ? "Génération…" : state === "done" ? "✓ Carte générée !" : "📸 Partager mes progrès"}
      </button>
    </>
  );
}
