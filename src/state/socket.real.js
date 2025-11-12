// src/state/socket.real.js
import { io } from "socket.io-client";

const BASE = import.meta.env.VITE_BACKEND_URL || window.location.origin;
const PATH = "/socket.io";

let socket = null;
let current = { ns: null, sessionId: null, role: null };

export function connectSocket({ mode, sessionId, role }) {
  const ns = mode === "solo" ? "/solo" : "/coop";
  const unchanged =
    socket && current.ns === ns && current.sessionId === sessionId && current.role === role;

  if (unchanged) return socket;

  if (socket) { socket.disconnect(); socket = null; }

  socket = io(BASE + ns, {
    path: PATH,
    transports: ["websocket"],
    query: { sessionId, role },
  });

  current = { ns, sessionId, role };

  socket.on("connect", () =>
    console.log(`✅ connected ${ns} session=${sessionId} role=${role || "-"} id=${socket.id}`)
  );
  socket.on("disconnect", (reason) => console.log("ℹ️ disconnected:", reason));
  socket.on("connect_error", (e) => console.error("❌ socket error:", e.message));

  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    current = { ns: null, sessionId: null, role: null };
  }
}
