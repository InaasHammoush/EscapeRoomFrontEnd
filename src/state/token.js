const KEY = "accessToken";
export const TOKEN_CHANGED_EVENT = "session:token-changed";

let storageWarningShown = false;

function warnStorageAccess(err) {
  if (storageWarningShown) return;
  storageWarningShown = true;
  console.warn("Session storage is unavailable; auth session will be less persistent.", err);
}

function getSessionStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch (err) {
    warnStorageAccess(err);
    return null;
  }
}

function emitTokenChanged(accessToken) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOKEN_CHANGED_EVENT, {
      detail: { accessToken: accessToken || "" },
    })
  );
}

export function getToken() {
  const storage = getSessionStorage();
  if (!storage) return "";
  return storage.getItem(KEY) || "";
}

export function setToken(t) {
  const storage = getSessionStorage();
  if (storage) {
    if (t) storage.setItem(KEY, t);
    else storage.removeItem(KEY);
  }
  emitTokenChanged(t);
}

export function clearToken() {
  const storage = getSessionStorage();
  storage?.removeItem(KEY);
  emitTokenChanged("");
}
