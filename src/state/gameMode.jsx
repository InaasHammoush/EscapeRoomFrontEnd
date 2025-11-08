import { createContext, useContext, useMemo, useState } from "react";

const GameModeContext = createContext();

export function GameModeProvider({ children }) {
  const [mode, setMode] = useState("coop"); // "solo" | "coop"
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return <GameModeContext.Provider value={value}>{children}</GameModeContext.Provider>;
}

export function useGameMode() {
  const ctx = useContext(GameModeContext);
  if (!ctx) throw new Error("useGameMode must be used inside GameModeProvider");
  return ctx;
}
