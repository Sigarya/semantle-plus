import { useEffect, useState } from "react";

const isAppDisplay = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: fullscreen)").matches ||
  window.matchMedia("(display-mode: minimal-ui)").matches ||
  !!(navigator as Navigator & { standalone?: boolean }).standalone ||
  document.referrer.startsWith("android-app://xyz.sigarya.semantle.twa");

export function useAppDisplay() {
  const [inApp, setInApp] = useState(isAppDisplay);
  useEffect(() => {
    const queries = ["standalone", "fullscreen", "minimal-ui"].map(mode => window.matchMedia(`(display-mode: ${mode})`));
    const update = () => setInApp(isAppDisplay());
    queries.forEach(query => query.addEventListener("change", update));
    return () => queries.forEach(query => query.removeEventListener("change", update));
  }, []);
  return inApp;
}

type RelatedApp = { platform?: string; id?: string; url?: string };
export async function hasInstalledRelatedApp(): Promise<boolean> {
  const relatedNavigator = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<RelatedApp[]> };
  if (!window.isSecureContext || !relatedNavigator.getInstalledRelatedApps) return false;
  try {
    const apps = await relatedNavigator.getInstalledRelatedApps();
    return apps.some(app =>
      (app.platform === "webapp" && (app.id === new URL("/Semantle_Plus", window.location.origin).href || app.url === new URL("/manifest.webmanifest", window.location.origin).href)) ||
      (app.platform === "play" && app.id === "xyz.sigarya.semantle.twa")
    );
  } catch {
    return false;
  }
}
