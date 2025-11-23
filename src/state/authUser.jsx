import { createContext, useContext, useEffect, useState } from "react";
import { clearToken } from "./token";

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

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthUserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUser() {
  const ctx = useContext(AuthUserContext);
  if (!ctx) throw new Error("useAuthUser must be used inside AuthUserProvider");
  return ctx;
}
