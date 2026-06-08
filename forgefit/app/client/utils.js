"use client";

// Parse une durée de repos (ex: "2 min", "90 sec") en secondes
export function parseReposSeconds(repos) {
  if (!repos) return 90;
  const s = repos.toLowerCase();
  const minMatch = s.match(/(\d+)\s*min/);
  const secMatch = s.match(/(\d+)\s*s(ec)?/);
  let total = 0;
  if (minMatch) total += parseInt(minMatch[1]) * 60;
  if (secMatch) total += parseInt(secMatch[1]);
  return total > 0 ? total : 90;
}

// AudioContext partagé — iOS exige qu'il soit créé dans un geste utilisateur puis resume()
let _ctx = null;
function getAudioCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _ctx;
}

// Appeler depuis un handler de clic/tap pour déverrouiller iOS
export function unlockAudio() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();
  } catch {}
}

// Bip sonore à 3 tonalités (signal fin de repos)
// Fallback <audio> data-URI si AudioContext bloqué (iOS en arrière-plan)
export function beep() {
  try {
    const ctx = getAudioCtx();
    const play = () => {
      [0, 0.15, 0.3].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = delay === 0.3 ? 880 : 660;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.25);
      });
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(play).catch(_beepFallback);
    } else {
      play();
    }
  } catch {
    _beepFallback();
  }
}

// Fallback <audio> silencieux encodé en base64 (triangle wave 880 Hz, 0.4s)
// Généré inline — pas de fichier à héberger
function _beepFallback() {
  try {
    // WAV PCM 8-bit 8000Hz mono, 880 Hz, 0.3s — petit fichier inline
    const sr = 8000, freq = 880, dur = 0.3, vol = 80;
    const n = Math.floor(sr * dur);
    const buf = new Uint8Array(44 + n);
    const dv = new DataView(buf.buffer);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); dv.setUint32(4, 36 + n, true); str(8, "WAVEfmt ");
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr, true); dv.setUint16(32, 1, true);
    dv.setUint16(34, 8, true); str(36, "data"); dv.setUint32(40, n, true);
    for (let i = 0; i < n; i++) {
      buf[44 + i] = 128 + Math.round(vol * Math.sin(2 * Math.PI * freq * i / sr));
    }
    const blob = new Blob([buf], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play().catch(() => {});
  } catch {}
}
