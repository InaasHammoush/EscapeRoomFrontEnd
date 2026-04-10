import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, refreshSession } from "./api";
import { clearToken, getToken, setToken, TOKEN_CHANGED_EVENT } from "./token";
import { disconnectSocket } from "./socket";
import { getTokenExpirationMs, isTokenExpiringSoon } from "./sessionToken";

const SessionContext = createContext(null);
const TOKEN_REFRESH_LEAD_MS = 60 * 1000;
const TOKEN_FOCUS_REFRESH_WINDOW_MS = 90 * 1000;

function persistAccessToken(accessToken) {
  if (accessToken) {
    setToken(accessToken);
  } else {
    clearToken();
  }
}

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [accessToken, setAccessToken] = useState(() => getToken());

  const applyGuestState = useCallback(({ disconnect = true } = {}) => {
    persistAccessToken("");
    if (disconnect) {
      disconnectSocket();
    }
    setUser(null);
    setAccessToken("");
    setStatus("guest");
  }, []);

  const applyAuthenticatedState = useCallback(({ user: nextUser, accessToken: nextAccessToken }) => {
    setUser(nextUser || null);
    setAccessToken(nextAccessToken || getToken() || "");
    setStatus(nextUser ? "authenticated" : "guest");
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      setStatus("loading");

      try {
        if (getToken()) {
          const data = await api.get("/me");
          if (!active) return;

          applyAuthenticatedState({
            user: data?.user || null,
            accessToken: getToken(),
          });
          return;
        }

        const data = await refreshSession();
        if (!active) return;

        applyAuthenticatedState({
          user: data?.user || null,
          accessToken: data?.accessToken || "",
        });
      } catch {
        if (!active) return;

        applyGuestState();
      }
    }

    bootstrapSession();

    return () => {
      active = false;
    };
  }, [applyAuthenticatedState, applyGuestState]);

  useEffect(() => {
    const syncToken = (event) => {
      const nextAccessToken = event?.detail?.accessToken || "";
      setAccessToken(nextAccessToken);
      if (!nextAccessToken) {
        disconnectSocket();
        setUser(null);
        setStatus("guest");
      }
    };

    window.addEventListener(TOKEN_CHANGED_EVENT, syncToken);
    return () => {
      window.removeEventListener(TOKEN_CHANGED_EVENT, syncToken);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    const expiresAtMs = getTokenExpirationMs(accessToken);
    if (!expiresAtMs) return;

    let cancelled = false;
    const refreshDelayMs = Math.max(0, expiresAtMs - Date.now() - TOKEN_REFRESH_LEAD_MS);
    const timeoutId = window.setTimeout(async () => {
      try {
        await refreshSession();
      } catch {
        if (!cancelled) {
          applyGuestState();
        }
      }
    }, refreshDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [status, accessToken, applyGuestState]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let active = true;
    const maybeRefreshSession = async () => {
      const currentToken = getToken() || accessToken;
      if (!currentToken) return;
      if (!isTokenExpiringSoon(currentToken, TOKEN_FOCUS_REFRESH_WINDOW_MS)) return;

      try {
        await refreshSession();
      } catch {
        if (active) {
          applyGuestState();
        }
      }
    };

    const onFocus = () => {
      void maybeRefreshSession();
    };
    const onVisibilityChange = () => {
      if (!document.hidden) {
        void maybeRefreshSession();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [status, accessToken, applyGuestState]);

  const login = ({ user: nextUser, accessToken: nextAccessToken }) => {
    persistAccessToken(nextAccessToken || "");
    disconnectSocket();
    applyAuthenticatedState({
      user: nextUser || null,
      accessToken: nextAccessToken || "",
    });
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch (e) {
      console.warn("Logout request failed (ignored):", e);
    } finally {
      applyGuestState();
    }
  };

  return (
    <SessionContext.Provider
      value={{
        accessToken,
        isAuthenticated: status === "authenticated",
        login,
        logout,
        status,
        user,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return ctx;
}
