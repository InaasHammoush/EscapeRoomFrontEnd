import { createContext, useContext, useEffect, useRef, useState } from "react";
import { clearToken, getToken } from "./token";
import { api, refreshAccessToken } from "./api";
import { disconnectSocket } from "./socket";

const AuthUserContext = createContext(null);

export function AuthUserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [authReady, setAuthReady] = useState(false);
  const bootstrapPromiseRef = useRef(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  async function syncUserFromServer() {
    const hasStoredUser = Boolean(user);
    const hasAccessToken = Boolean(getToken());

    if (!hasStoredUser && !hasAccessToken) {
      return null;
    }

    try {
      if (!hasAccessToken) {
        await refreshAccessToken();
      }

      const data = await api.get("/me");
      const nextUser = data?.user || null;
      setUser(nextUser);
      return nextUser;
    } catch {
      clearToken();
      setUser(null);
      return null;
    }
  }

  function ensureAuthReady() {
    if (!bootstrapPromiseRef.current) {
      bootstrapPromiseRef.current = (async () => {
        try {
          await syncUserFromServer();
        } finally {
          setAuthReady(true);
        }
      })();
    }

    return bootstrapPromiseRef.current;
  }

  useEffect(() => {
    ensureAuthReady();
  }, []);

  const logout = async () => {
    try {
      // backend löscht httpOnly refreshToken-Cookie
      await api.post("/auth/logout", {});
    } catch (e) {
      console.warn("Logout request failed (ignored):", e);
    } finally {
      clearToken();       // Access-Token aus sessionStorage entfernen
      disconnectSocket(); // Realtime-Verbindung schließen
      setUser(null);      // UI-Zustand zurücksetzen
      setAuthReady(true);
    }
  };

  return (
    <AuthUserContext.Provider value={{ user, setUser, logout, authReady, ensureAuthReady }}>
      {children}
    </AuthUserContext.Provider>
  );
}


export function useAuthUser() {
  const ctx = useContext(AuthUserContext);
  if (!ctx) throw new Error("useAuthUser must be used inside AuthUserProvider");
  return ctx;
}
