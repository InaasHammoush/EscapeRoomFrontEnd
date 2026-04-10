import { getToken, setToken, clearToken } from "./token";

const BASE = "/api"; // proxied to backend

async function doFetch(path, { method = "GET", body, headers, credentials } = {}) {
  const upperMethod = (method || "GET").toUpperCase();
  const isDeleteAccount = upperMethod === "DELETE" && path === "/auth/delete-account";

  const res = await fetch(BASE + path, {
    method: upperMethod,
    credentials,
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

async function refreshAccessToken() {
  const res = await fetch(BASE + "/token/refresh", {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.accessToken) throw new Error("REFRESH_FAILED");

  setToken(data.accessToken);
  return data.accessToken;
}

async function request(path, opts = {}) {
  try {
    return await doFetch(path, opts);
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
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
  get: (p, opts) => request(p, { ...opts }),
  post: (p, body, opts) => request(p, { method: "POST", body, ...opts }),
  put: (p, body, opts) => request(p, { method: "PUT", body, ...opts }),
  del: (p, opts) => request(p, { method: "DELETE", ...opts }),
  patch: (p, body, opts) => request(p, { method: "PATCH", body, ...opts }),
};

export { refreshAccessToken };
