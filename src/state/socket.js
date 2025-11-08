import { io } from "socket.io-client";

// use same origin when served by backend, but explicit URL for local dev if needed
const URL = import.meta.env.VITE_BACKEND_URL || "";

export const socket = io(URL, {
  path: "/socket.io",
  transports: ["websocket"],
});

socket.on("connect", () => console.log("✅ connected:", socket.id));
socket.on("connect_error", (e) => console.error("❌ socket error:", e.message));
