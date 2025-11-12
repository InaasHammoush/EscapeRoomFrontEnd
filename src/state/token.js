const KEY = "accessToken";

export function getToken() {
  return sessionStorage.getItem(KEY) || "";
}
export function setToken(t) {
  if (t) sessionStorage.setItem(KEY, t);
}
export function clearToken() {
  sessionStorage.removeItem(KEY);
}