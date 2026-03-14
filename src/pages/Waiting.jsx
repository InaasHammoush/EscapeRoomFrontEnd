import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { connectSocket, getSocket } from "../state/socket";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";

function useQueryRole() {
  const { search } = useLocation();
  return useMemo(() => {
    const p = new URLSearchParams(search);
    const r = (p.get("role") || "").toUpperCase();
    return r === "A" || r === "B" ? r : null;
  }, [search]);
}

export default function Waiting() {
  const { lobbyId } = useParams();          // sessionId
  const nav = useNavigate();
  const queryRole = useQueryRole();         // A | B | null
  const { mode, sessionId } = useGameMode(); // read current mode

  const [players, setPlayers] = useState([]);   // [{id, role}]
  const [status, setStatus] = useState("waiting"); // 'waiting' | 'ready'
  const [myRole, setMyRole] = useState(null);  // A | B | null

 //  Fallback polling: ping lobby status until ready (and on tab focus)
 useEffect(() => {
   const s = getSocket();
   if (!s) return;

   // Poll every 800ms while not ready
   const id = setInterval(() => {
     if (document.visibilityState === "visible" && status !== "ready") {
       s.emit("lobby:status:get", { sessionId: lobbyId });
     }
   }, 800);

   // Also ping when the tab becomes visible
   const onVis = () => s.emit("lobby:status:get", { sessionId: lobbyId });
   document.addEventListener("visibilitychange", onVis);

   return () => {
     clearInterval(id);
     document.removeEventListener("visibilitychange", onVis);
   };
 }, [lobbyId, status]);


  // Early guard — never stay on Waiting for SOLO sessions
  useEffect(() => {
    const looksSolo = lobbyId?.toUpperCase().startsWith("SOLO-");
    if (mode === "solo" || looksSolo) {
      const sid = sessionId || lobbyId;
      if (sid) nav(`/solo/${sid}/room/Library`, { replace: true });
    }
  }, [mode, sessionId, lobbyId, nav]);

  // Connect (idempotent) and subscribe — ONLY for coop
  useEffect(() => {
    if (!lobbyId) return;

    // If the guard above is about to redirect, don't connect here
    if (mode === "solo" || lobbyId.toUpperCase().startsWith("SOLO-")) return; // NEW

    // Ensure we're on the /coop namespace for this lobby
    connectSocket({ mode: "coop", sessionId: lobbyId });

    const s = getSocket();
    if (!s) return;

    const onStatus = (payload) => {
      // payload: { players:[{id,role}], ready:boolean, myRole?:'A'|'B' }
      const plist = payload.players || [];
      setPlayers(plist);
      setStatus(payload.ready ? "ready" : "waiting");

      // Prefer server-provided myRole, else infer by socket.id
      const mine =
        payload.myRole ||
        plist.find((p) => p.id === s.id)?.role ||
        null;
      if (mine && mine !== myRole) setMyRole(mine);

      // Redirect when ready
      if (payload.ready && payload.roomId) {
        const roleToUse = mine || "A";
        nav(`/coop/${lobbyId}/room/${payload.roomId}/role/${roleToUse}`, { replace: true });
      }
    };

    const onError = (e) => {
      console.error("lobby error:", e);
    };

    // Subscribe and request snapshot
    s.emit("lobby:subscribe", { sessionId: lobbyId });
    s.emit("lobby:status:get", { sessionId: lobbyId }); // ask for current state
    s.on("lobby:status", onStatus);
    s.on("lobby:error", onError);

    // If a role was provided via ?role=… send it once
    if (queryRole) {
      s.emit("lobby:setRole", { sessionId: lobbyId, role: queryRole });
      setMyRole(queryRole);
    }

    return () => {
      s.emit("lobby:unsubscribe", { sessionId: lobbyId });
      s.off("lobby:status", onStatus);
      s.off("lobby:error", onError);
    };
  }, [lobbyId, queryRole, nav, myRole, mode]);


  const chooseRole = (role) => {
    const s = getSocket();
    if (!s) return;
    s.emit("lobby:setRole", { sessionId: lobbyId, role });
    setMyRole(role);
  };

  const copylobbyId = async () => {
    const copy = lobbyId;
    try { await navigator.clipboard.writeText(copy); } catch {}
  };

  return (
    <Page>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Waiting Room</h1>

        <div className="opacity-80">
          Session code: <code>{lobbyId}</code>
          <button className="btn btn-xs ml-2" onClick={copylobbyId}>Copy Lobby-ID</button>
        </div>

        <div className="bg-base-100/10 rounded-2xl p-4">
          <h3 className="font-semibold mb-2">Players</h3>
          <ul className="space-y-1">
            {players.map((p) => (
              <li key={p.id} className="opacity-80">
                {p.id.slice(-4)} · Role: {p.role || "-"}
              </li>
            ))}
            {players.length === 0 && <li className="opacity-60">No one connected yet…</li>}
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm opacity-70">Your role:</span>
          <div className="join">
            <button
              className={`btn btn-sm join-item ${myRole === "A" ? "btn-outline" : ""}`}
              onClick={() => chooseRole("A")}
            >
              A (Library)
            </button>
            <button
              className={`btn btn-sm join-item ${myRole === "B" ? "btn-outline" : ""}`}
              onClick={() => chooseRole("B")}
            >
              B (Laboratory)
            </button>
          </div>
        </div>

        <div className="text-sm opacity-70">
          {status === "ready"
            ? "Starting…"
            : "Waiting for both roles (A & B) to join. This will start automatically."}
        </div>
      </div>
    </Page>
  );
}
