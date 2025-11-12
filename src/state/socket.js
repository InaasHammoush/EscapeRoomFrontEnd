// src/state/socket.js
let api;
if (import.meta.env.VITE_SOCKET_MOCK === "true") {
  api = await import("./socket.mock");
} else {
  api = await import("./socket.real");
}

export const { connectSocket, getSocket, disconnectSocket } = api;
console.log("[socket loader] MOCK =", import.meta.env.VITE_SOCKET_MOCK);
