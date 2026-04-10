import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { connectSocket, getSocket } from "../state/socket";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";
import { useAuthUser } from "../state/authUser";

function useQueryRole() {
  const { search } = useLocation();
  return useMemo(() => {
    const p = new URLSearchParams(search);
    const r = (p.get("role") || "").toUpperCase();
    return r === "A" || r === "B" ? r : null;
  }, [search]);
}

export default function Waiting() {
  const { lobbyId } = useParams();
  const nav = useNavigate();
  const queryRole = useQueryRole();
  const { mode, sessionId } = useGameMode();
  const { authReady, ensureAuthReady } = useAuthUser();

  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("waiting");
  const [myRole, setMyRole] = useState(null);
  const roleInitializedRef = useRef(false);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const id = setInterval(() => {
      if (document.visibilityState === "visible" && status !== "ready") {
        s.emit("lobby:status:get", { sessionId: lobbyId });
      }
    }, 800);

    const onVis = () => s.emit("lobby:status:get", { sessionId: lobbyId });
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [lobbyId, status]);

  useEffect(() => {
    const looksSolo = lobbyId?.toUpperCase().startsWith("SOLO-");
    if (mode === "solo" || looksSolo) {
      const sid = sessionId || lobbyId;
      if (sid) nav(`/solo/${sid}/room/Library`, { replace: true });
    }
  }, [mode, sessionId, lobbyId, nav]);

  useEffect(() => {
    roleInitializedRef.current = false;
  }, [lobbyId, queryRole]);

  useEffect(() => {
    if (!lobbyId || !authReady) return;
    if (mode === "solo" || lobbyId.toUpperCase().startsWith("SOLO-")) return;

    let cancelled = false;
    let activeSocket = null;

    const onError = (e) => {
      console.error("lobby error:", e);
    };

    let onStatus = null;

    const subscribeLobby = async () => {
      await ensureAuthReady();
      if (cancelled) return;

      activeSocket = connectSocket({ mode: "coop", sessionId: lobbyId }) || getSocket();
      if (!activeSocket) return;

      onStatus = (payload) => {
        const plist = payload.players || [];
        setPlayers(plist);
        setStatus(payload.ready ? "ready" : "waiting");

        const mine =
          payload.myRole ||
          plist.find((p) => p.id === activeSocket.id)?.role ||
          null;

        if (mine) {
          setMyRole((prev) => (prev === mine ? prev : mine));
        }

        if (payload.ready && payload.roomId) {
          const roleToUse = mine || "A";
          nav(`/coop/${lobbyId}/room/${payload.roomId}/role/${roleToUse}`, { replace: true });
        }
      };

      activeSocket.on("lobby:status", onStatus);
      activeSocket.on("lobby:error", onError);
      activeSocket.emit("lobby:subscribe", { sessionId: lobbyId });
      activeSocket.emit("lobby:status:get", { sessionId: lobbyId });

      if (queryRole && !roleInitializedRef.current) {
        activeSocket.emit("lobby:setRole", { sessionId: lobbyId, role: queryRole });
        setMyRole(queryRole);
        roleInitializedRef.current = true;
      }
    };

    subscribeLobby();

    return () => {
      cancelled = true;
      if (!activeSocket) return;
      activeSocket.emit("lobby:unsubscribe", { sessionId: lobbyId });
      if (onStatus) activeSocket.off("lobby:status", onStatus);
      activeSocket.off("lobby:error", onError);
    };
  }, [lobbyId, queryRole, nav, mode, authReady, ensureAuthReady]);

  const chooseRole = (role) => {
    const s = getSocket();
    if (!s) return;
    s.emit("lobby:setRole", { sessionId: lobbyId, role });
    setMyRole(role);
  };

  const copyLobbyId = async () => {
    const copy = lobbyId;
    try {
      await navigator.clipboard.writeText(copy);
    } catch {}
  };

  return (
    <Page>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Waiting Room</h1>

        <div className="opacity-80">
          Session code: <code>{lobbyId}</code>
          <button className="btn btn-xs ml-2" onClick={copyLobbyId}>Copy Lobby-ID</button>
        </div>

        <div className="bg-base-100/10 rounded-2xl p-4">
          <h3 className="font-semibold mb-2">Players</h3>
          <ul className="space-y-1">
            {players.map((p, index) => (
              <li key={p.id} className="opacity-80">
                {`player${index + 1} - Role: ${p.role || "-"}`}
              </li>
            ))}
            {players.length === 0 && <li className="opacity-60">No one connected yet...</li>}
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
            ? "Starting..."
            : "Waiting for both roles (A & B) to join. This will start automatically."}
        </div>
      </div>
    </Page>
  );
}
