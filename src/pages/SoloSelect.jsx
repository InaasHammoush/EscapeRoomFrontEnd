import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";

import { connectSocket, getSocket } from "../state/socket";

// Room options
const SOLO_CHOICES = [
  { id: "wizard_library", title: "Wizard’s Library", note: "Spellbooks and runes" },
  { id: "alchemist_lab",  title: "Alchemist’s Laboratory", note: "Potions and crystals" },
];

/**
 * Create a room on the backend using an already-connected socket.
 * Returns the roomId.
 */
async function createRoom(socket, roomName) {
  return new Promise((resolve, reject) => {
    socket.emit("create_room", { roomName, mode: "solo", startingChamber: roomName }, (res) => {
      if (!res || !res.ok) {
        console.error("Failed creating room:", res?.error);
        reject(res?.error || "create_room_failed");
        return;
      }
      resolve(res.roomId);
    });
  });
}

export default function SoloSelect() {
  const nav = useNavigate();
  const { setMode, setSessionId } = useGameMode();

  const [loadingRoom, setLoadingRoom] = useState(null); // which room is currently loading?

  /**
   * Main entry point when the user clicks “Play”.
   */
  const startSolo = async (choice) => {
    try {
      setLoadingRoom(choice.id);

      // 1) Generate session ID for solo play
      const sessionId = ("SOLO-" + nanoid(6)).toUpperCase();
      setMode("solo");
      setSessionId(sessionId);
      sessionStorage.setItem("soloChoice", choice.id);

      // 2) Create/Connect the socket for this solo session
      let socket = getSocket();
      if (!socket) {
        socket = connectSocket({
          mode: "solo",
          sessionId,
          role: "player"
        });
      }

      // 3) Ensure socket is connected before emitting anything
      await new Promise((resolve) => {
        if (socket.connected) return resolve();
        socket.on("connect", resolve);
      });

      // 4) Ask backend to create room
      const roomId = await createRoom(socket, choice.id);

      // 5) Navigate to the RoomView
      nav(`/solo/${sessionId}/room/${roomId}`, { replace: true });

    } catch (err) {
      console.error("startSolo error:", err);
      alert("Could not start room. Check console.");
    } finally {
      setLoadingRoom(null);
    }
  };

  return (
    <Page>
      <h2 className="text-2xl font-bold mb-4">Choose Your Solo Room</h2>

      <div className="grid sm:grid-cols-2 gap-6">
        {SOLO_CHOICES.map((c) => (
          <div
            key={c.id}
            className="bg-base-100/10 rounded-2xl p-6 shadow flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold">{c.title}</h3>
              <p className="opacity-70 text-sm">{c.note}</p>
            </div>

            <button
              className="btn btn-outline rounded-2xl"
              disabled={loadingRoom === c.id}
              onClick={() => startSolo(c)}
            >
              {loadingRoom === c.id ? "Loading..." : "Play"}
            </button>
          </div>
        ))}
      </div>
    </Page>
  );
}
