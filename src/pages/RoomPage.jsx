import { useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";
import { connectSocket, getSocket } from "../state/socket";

//placeholders real scenes to be replaced here
function LibraryScene({ role }) { return <div className="opacity-80">Library ({role})</div>; }
function CorridorScene() { return <div className="opacity-80">Corridor — final door here</div>; }
function LaboratoryScene({ role }) { return <div className="opacity-80">Laboratory ({role})</div>; }

const ROOM_ID_TO_KEY = {
  Library: "wizard_library",
  Corridor: "corridor",
  Laboratory: "alchemist_lab",
};

export default function RoomPage({ mode: modeProp }) {
  const { sessionId, roomId, role } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setMode, setSessionId } = useGameMode();


  const mode = useMemo(() => {
    if (modeProp) return modeProp; // "solo" | "coop"
    return location.pathname.startsWith("/solo") ? "solo" : "coop";
  }, [modeProp, location.pathname]);

  // Sync context from URL
  useEffect(() => {
    if (mode) setMode(mode);
    if (sessionId) setSessionId(sessionId);
  }, [mode, sessionId, setMode, setSessionId]);

  // Ensure connection to the right namespace with current params
  useEffect(() => {
    if (!sessionId) return;
    // role is only meaningful for coop; undefined in solo is fine
    connectSocket({ mode, sessionId, role });
  }, [mode, sessionId, role]);

  // Attach listeners to the current socket (handle reconnects)
  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const onWelcome = (msg) => console.log("server welcome (room):", msg);
    s.on("welcome", onWelcome);

    return () => {
      s.off("welcome", onWelcome);
    };
  }, [mode, sessionId, role]); // re-bind if connection context changes

  // Choose scene from roomId
  const scene = useMemo(() => {
    switch (roomId) {
      case "Library":    return <LibraryScene role={role || (mode === "coop" ? "A" : "A")} />;
      case "Corridor":   return <CorridorScene />;
      case "Laboratory": return <LaboratoryScene role={role || (mode === "coop" ? "B" : "B")} />;
      default:           return <div>Unknown room: {roomId}</div>;
    }
  }, [roomId, role, mode]);

  useEffect(() => {
    const roomKey = ROOM_ID_TO_KEY[roomId] || null;
    if (!roomKey) return;
    window.dispatchEvent(
      new CustomEvent("music:room", { detail: { roomKey } })
    );
  }, [roomId]);


  const buildPath = (targetRoomId) => {
    if (mode === "solo") return `/solo/${sessionId}/room/${targetRoomId}`;
    // coop
    const r = role ? `/role/${role}` : "";
    return `/coop/${sessionId}/room/${targetRoomId}${r}`;
  };

  return (
    <Page>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="badge badge-outline">Time left: 30:00</div>
          <button className="btn btn-xs">Hint</button>
          <button className="btn btn-xs btn-error">Give up</button>
        </div>
        <div className="opacity-70 text-sm">
          Mode: {mode} · Session: {sessionId} · Role: {role || "-"}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,300px] gap-6">
        <div className="bg-base-100/10 rounded-2xl p-5 shadow min-h-[50vh]">

          {scene}

          {/* Scene navigation buttons */}
          <div className="mt-4 flex gap-2">
            <button className="btn btn-sm" onClick={() => navigate(buildPath("Library"))}>Library</button>
            <button className="btn btn-sm" onClick={() => navigate(buildPath("Corridor"))}>Corridor</button>
            <button className="btn btn-sm" onClick={() => navigate(buildPath("Laboratory"))}>Laboratory</button>
          </div>
        </div>
      </div>
    </Page>
  );
}
