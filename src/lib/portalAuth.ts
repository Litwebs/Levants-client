export const PORTAL_AUTH_STORAGE_KEY = "portal-authenticated";
export const PORTAL_AUTH_CHANGED_EVENT = "portal-auth-changed";

export const isPortalLoggedIn = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PORTAL_AUTH_STORAGE_KEY) === "true";
};

export const setPortalLoggedIn = (loggedIn: boolean): void => {
  if (typeof window === "undefined") return;

  if (loggedIn) {
    window.localStorage.setItem(PORTAL_AUTH_STORAGE_KEY, "true");
  } else {
    window.localStorage.removeItem(PORTAL_AUTH_STORAGE_KEY);
  }

  window.dispatchEvent(new Event(PORTAL_AUTH_CHANGED_EVENT));
};

export const clearPortalAuth = (): void => {
  setPortalLoggedIn(false);
};
