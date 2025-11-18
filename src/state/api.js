import { getToken, setToken, clearToken } from "./token";

const BASE = "/api"; // proxied to backend

async function doFetch(path, { method = "GET", body, headers, credentials } = {}) {
  const res = await fetch(BASE + path, {
    method,
    credentials, // undefined | "include" | "same-origin"
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });


  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function refreshAccessToken() {
  // Refresh uses the httpOnly refresh cookie
  const res = await fetch(BASE + "/token/refresh", {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.accessToken) throw new Error("REFRESH_FAILED");
  setToken(data.accessToken);
  return data.accessToken;
}

async function request(path, opts) {
  try {
    return await doFetch(path, opts);
  } catch (err) {
    if (err.status === 401) {
      try {
        await refreshAccessToken();
        return await doFetch(path, opts); // retry once
      } catch {
        clearToken();
      }
    }
    throw err;
  }
}

export const api = {
  get:  (p, opts)        => request(p, { ...opts }),
  post: (p, body, opts)  => request(p, { method: "POST", body, ...opts }),
  put:  (p, body, opts)  => request(p, { method: "PUT",  body, ...opts }),
  del:  (p, opts)        => request(p, { method: "DELETE", ...opts }),


};