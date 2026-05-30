"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ID GA4 — à définir dans les variables d'env Vercel : NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Charge le script GA une seule fois
function loadGAScript() {
  if (!GA_ID || typeof window === "undefined") return;
  if (document.getElementById("ga-script")) return;

  const script1 = document.createElement("script");
  script1.id = "ga-script";
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script1.async = true;
  document.head.appendChild(script1);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID, {
    page_path: window.location.pathname,
    anonymize_ip: true,        // RGPD
    allow_ad_personalization_signals: false,
  });
}

// Trackage de page vue à chaque navigation
export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Charger GA au premier rendu
  useEffect(() => {
    loadGAScript();
  }, []);

  // Page view à chaque changement de route
  useEffect(() => {
    if (!GA_ID || !window.gtag) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("event", "page_view", {
      page_path: url,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null; // Pas de rendu visuel
}

// Helper pour tracker des événements custom depuis n'importe quel composant
// Usage: trackEvent("bilan_start", { plan: "forge" })
export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined" || !window.gtag || !GA_ID) return;
  window.gtag("event", eventName, {
    ...params,
    send_to: GA_ID,
  });
}
