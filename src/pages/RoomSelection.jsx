import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";
import { connectSocket, getSocket } from "../state/socket";

const ROOM_CHOICE = {
  id: "wizard_library",
  title: "Wizard's Library & Alchemist's Laboratory",
  note: "Full escape room experience across both chambers.",
};

async function createRoom(socket, roomName) {
  return new Promise((resolve, reject) => {
    socket.emit(
      "create_room",
      { roomName, mode: "solo", startingChamber: roomName },
      (res) => {
        if (!res || !res.ok) {
          console.error("Failed creating room:", res?.error);
          reject(res?.error || "create_room_failed");
          return;
        }
        resolve(res.roomId);
      }
    );
  });
}

export default function RoomSelection() {
  const nav = useNavigate();
  const { setMode, setSessionId } = useGameMode();
  const [busy, setBusy] = useState(false);
  const [busyCoop, setBusyCoop] = useState(false);

  const startSolo = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const sessionId = ("SOLO-" + nanoid(6)).toUpperCase();
      setMode("solo");
      setSessionId(sessionId);
      sessionStorage.setItem("soloChoice", ROOM_CHOICE.id);

      let socket = getSocket();
      if (!socket) {
        socket = connectSocket({
          mode: "solo",
          sessionId,
          role: "player",
        });
      }

      await new Promise((resolve) => {
        if (socket.connected) return resolve();
        socket.on("connect", resolve);
      });

      const roomId = await createRoom(socket, ROOM_CHOICE.id);
      nav(`/solo/${sessionId}/room/${roomId}`, { replace: true });
    } catch (err) {
      console.error("startSolo error:", err);
      alert("Could not start room. Check console.");
    } finally {
      setBusy(false);
    }
  };

  const startCoop = () => {
    if (busyCoop) return;
    setBusyCoop(true);
    try {
      const id = ("COOP-" + nanoid(6)).toUpperCase();
      setMode("coop");
      setSessionId(id);
      nav(`/waiting/${id}?role=A`);
    } finally {
      setBusyCoop(false);
    }
  };

  return (
    <Page>
      <h2 className="text-2xl font-bold mb-4">Choose Your Room</h2>
      <div className="grid gap-6">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{ROOM_CHOICE.title}</h3>
            <p className="opacity-70 text-sm">{ROOM_CHOICE.note}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-outline rounded-2xl"
              onClick={startSolo}
              disabled={busy}
            >
              {busy ? "Loading..." : "Play Solo"}
            </button>
            <button
              className="btn btn-ghost rounded-2xl"
              onClick={startCoop}
              disabled={busyCoop}
            >
              {busyCoop ? "Creating..." : "Create Co-op Lobby"}
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
