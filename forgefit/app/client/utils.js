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

// Bip sonore à 3 tonalités (signal fin de repos)
export function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
  } catch {}
}
