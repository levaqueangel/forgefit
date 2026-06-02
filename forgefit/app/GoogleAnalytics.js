"use client";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function loadGAScript() {
  if (!GA_ID || typeof window === "undefined") return;
  if (document.getElementById("ga-script")) return;

  const script = document.createElement("script");
  script.id = "ga-script";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID, {
    page_path: window.location.pathname,
    anonymize_ip: true,
    allow_ad_personalization_signals: false,
  });
}

// Composant interne — isolé pour que useSearchParams soit dans Suspense
function GATracker() {
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => { loadGAScript(); }, []);

  useEffect(() => {
    if (!GA_ID || !window.gtag) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("event", "page_view", { page_path: url, page_title: document.title });
  }, [pathname, searchParams]);

  return null;
}

// Export public — Suspense requis par Next.js 14 autour de useSearchParams
export function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GATracker />
    </Suspense>
  );
}

// Helper événements custom — Usage: trackEvent("bilan_start", { plan: "forge" })
export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined" || !window.gtag || !GA_ID) return;
  window.gtag("event", eventName, { ...params, send_to: GA_ID });
}
