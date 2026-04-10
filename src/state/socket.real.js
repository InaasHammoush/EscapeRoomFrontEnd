import { io } from "socket.io-client";
import { getToken } from "./token";

const BASE = import.meta.env.VITE_BACKEND_URL || window.location.origin;
const PATH = "/socket.io";

let socket = null;
let current = { ns: null, sessionId: null, role: null, token: null };

export function connectSocket({ mode, sessionId, role }) {
  const ns = "/"; // oder später /solo /coop
  const token = getToken() || undefined;

  const paramsUnchanged =
    socket && current.ns === ns && current.sessionId === sessionId && current.role === role;
  const tokenChanged = current.token !== token;

  if (paramsUnchanged && !tokenChanged) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(BASE + ns, {
    path: PATH,
    transports: ["websocket"],
    auth: {
      // JWT aus sessionStorage; Backend liest das in io.use(...)
      token: token,
    },
    withCredentials: true, // optional, schadet aber nicht
  });

  current = { ns, sessionId, role, token };

  socket.on("connect", () => {
    console.log(`connected ${ns} id=${socket.id}`);
  });
  socket.on("disconnect", (reason) => console.log("socket disconnected:", reason));
  socket.on("connect_error", (e) => console.error("socket error:", e.message));

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    current = { ns: "/", sessionId: null, role: null };
  }
}
