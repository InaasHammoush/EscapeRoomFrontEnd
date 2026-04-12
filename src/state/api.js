import { getToken, setToken, clearToken } from "./token";

const BASE = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api';
const DEFAULT_CREDENTIALS = "include";
let refreshPromise = null;

async function doFetch(path, { method = "GET", body, headers, credentials } = {}) {
  const upperMethod = (method || "GET").toUpperCase();
  const isDeleteAccount = upperMethod === "DELETE" && path === "/auth/delete-account";

  const res = await fetch(BASE + path, {
    method: upperMethod,
    credentials: credentials ?? DEFAULT_CREDENTIALS,
    redirect: isDeleteAccount ? "manual" : "follow",
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });


  if (isDeleteAccount && (res.type === "opaqueredirect" || res.status === 0)) {
    return { message: "Account deleted successfully." };
  }

  if (isDeleteAccount && [301, 302, 303, 307, 308].includes(res.status)) {
    return { message: "Account deleted successfully." };
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(BASE + "/token/refresh", {
        method: "POST",
        credentials: DEFAULT_CREDENTIALS,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.accessToken) {
        clearToken();
        const err = new Error(data?.error || data?.message || "REFRESH_FAILED");
        err.status = res.status;
        throw err;
      }

      setToken(data.accessToken);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function refreshAccessToken() {
  const data = await refreshSession();
  return data.accessToken;
}

async function request(path, opts = {}) {
  try {
    return await doFetch(path, opts);
  } catch (err) {
    if ((err.status === 401 || err.status === 403) && path !== "/token/refresh") {
      try {
        await refreshAccessToken();
        return await doFetch(path, opts); // retry once
      } catch {
        // refreshSession already cleared the token when recovery failed
      }
    }
    throw err;
  }
}

export const api = {
  get: (p, opts) => request(p, { ...opts }),
  post: (p, body, opts) => request(p, { method: "POST", body, ...opts }),
  put: (p, body, opts) => request(p, { method: "PUT", body, ...opts }),
  del: (p, opts) => request(p, { method: "DELETE", ...opts }),
  patch: (p, body, opts) => request(p, { method: "PATCH", body, ...opts }),
};
