import { createContext, useContext, useMemo, useState } from "react";

const GameModeContext = createContext(null);

export function GameModeProvider({ children }) {
  const [mode, setMode] = useState("coop"); // "solo" | "coop"
  const [sessionId, setSessionId] = useState(undefined);
  const [role, setRole] = useState(null);

  const value = useMemo(
      () => ({ mode, setMode, sessionId, setSessionId, role, setRole }),
      [mode, sessionId, role]
    );

  return <GameModeContext.Provider value={value}>{children}</GameModeContext.Provider>;
}

export function useGameMode() {
  const ctx = useContext(GameModeContext);
  if (!ctx) throw new Error("useGameMode must be used inside GameModeProvider");
  return ctx;
}
