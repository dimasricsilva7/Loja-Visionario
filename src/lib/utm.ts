export interface UTMData {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  gclid?: string | null;
}

const STORAGE_KEY = "lv_utm_data";

const PARAM_MAP: Record<keyof UTMData, string> = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  content: "utm_content",
  term: "utm_term",
  fbclid: "fbclid",
  ttclid: "ttclid",
  gclid: "gclid",
};

export function captureUTMFromLocation(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const incoming: UTMData = {};
  let hasAny = false;

  (Object.keys(PARAM_MAP) as (keyof UTMData)[]).forEach((key) => {
    const value = params.get(PARAM_MAP[key]);
    if (value) {
      incoming[key] = value;
      hasAny = true;
    }
  });

  if (!hasAny) return;

  const existing = getStoredUTM();
  const merged: UTMData = { ...existing, ...incoming };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage indisponível (modo privado, etc.) - segue sem persistir
  }
}

export function getStoredUTM(): UTMData {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UTMData;
  } catch {
    return {};
  }
}
