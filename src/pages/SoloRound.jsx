import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";
import { useGameMode } from "../state/gameMode";
import { connectSocket, disconnectSocket } from "../state/socket";

export default function SoloRound() {
  const nav = useNavigate();
  const { setMode, setSessionId } = useGameMode();

  useEffect(() => {
    setMode("solo");
    const id = "SOLO-" + nanoid(6);
    setSessionId(id);

    // Connect to /solo namespace with sessionId
    connectSocket({ mode: "solo", sessionId: id });

    // Navigate to the first room
    nav(`/solo/${id}/room/Library`, { replace: true });


  }, []);

  return null;
}