import type { AnalysisResponse } from "./types";

const KEY = "lexguard:result";

export function saveResult(r: AnalysisResponse): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(r));
}

export function loadResult(): AnalysisResponse | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalysisResponse;
  } catch {
    return null;
  }
}

export function clearResult(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
