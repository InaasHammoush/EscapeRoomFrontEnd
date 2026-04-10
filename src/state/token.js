const KEY = "accessToken";
export const TOKEN_CHANGED_EVENT = "session:token-changed";

function emitTokenChanged(accessToken) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOKEN_CHANGED_EVENT, {
      detail: { accessToken: accessToken || "" },
    })
  );
}

export function getToken() {
  return sessionStorage.getItem(KEY) || "";
}
export function setToken(t) {
  if (t) sessionStorage.setItem(KEY, t);
  else sessionStorage.removeItem(KEY);
  emitTokenChanged(t);
}
export function clearToken() {
  sessionStorage.removeItem(KEY);
  emitTokenChanged("");
}
