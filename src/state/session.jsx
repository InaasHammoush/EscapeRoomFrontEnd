import { createContext, useContext, useEffect, useState } from "react";
import { api, refreshSession } from "./api";
import { clearToken, getToken, setToken, TOKEN_CHANGED_EVENT } from "./token";
import { disconnectSocket } from "./socket";

const SessionContext = createContext(null);

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

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      setStatus("loading");

      try {
        if (getToken()) {
          const data = await api.get("/me");
          if (!active) return;

          setUser(data?.user || null);
          setAccessToken(getToken());
          setStatus(data?.user ? "authenticated" : "guest");
          return;
        }

        const data = await refreshSession();
        if (!active) return;

        setUser(data?.user || null);
        setAccessToken(data?.accessToken || "");
        setStatus(data?.user ? "authenticated" : "guest");
      } catch {
        if (!active) return;

        persistAccessToken("");
        setUser(null);
        setAccessToken("");
        setStatus("guest");
      }
    }

    bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const syncToken = (event) => {
      setAccessToken(event?.detail?.accessToken || "");
    };

    window.addEventListener(TOKEN_CHANGED_EVENT, syncToken);
    return () => {
      window.removeEventListener(TOKEN_CHANGED_EVENT, syncToken);
    };
  }, []);

  const login = ({ user: nextUser, accessToken: nextAccessToken }) => {
    persistAccessToken(nextAccessToken || "");
    disconnectSocket();
    setUser(nextUser || null);
    setAccessToken(nextAccessToken || "");
    setStatus(nextUser && nextAccessToken ? "authenticated" : "guest");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch (e) {
      console.warn("Logout request failed (ignored):", e);
    } finally {
      persistAccessToken("");
      disconnectSocket();
      setUser(null);
      setAccessToken("");
      setStatus("guest");
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
