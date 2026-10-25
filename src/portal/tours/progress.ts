const sessionProgress = new Set<string>();
export const tourProgressKey = (customerId: string, page: string) =>
  "levants:portal-tour:v1:" + customerId + ":" + page;

export function hasSeenTour(key: string): boolean {
  if (sessionProgress.has(key)) return true;
  try { return localStorage.getItem(key) === "seen"; } catch { return false; }
}

export function rememberTour(key: string) {
  sessionProgress.add(key);
  try { localStorage.setItem(key, "seen"); } catch { /* Replay remains available without storage. */ }
}
