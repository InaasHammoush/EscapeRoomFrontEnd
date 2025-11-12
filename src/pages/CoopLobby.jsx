import { nanoid } from "nanoid";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useGameMode } from "../state/gameMode";

export default function CoopLobby() {
  const nav = useNavigate();
  const { setMode, setSessionId } = useGameMode();
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setMode("coop");
      const id = ("COOP-" + nanoid(6)).toUpperCase();
      setSessionId(id);
      // Host goes to waiting as Player A
      nav(`/waiting/${id}?role=A`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <h2 className="text-xl font-semibold">Multiplayer Lobby</h2>

      <div className="space-y-2">
        <button className="btn btn-primary" onClick={create} disabled={busy}>
          Create Session (as Player A)
        </button>
        <p className="text-sm opacity-70">
          After creating, share the code from the Waiting Room with your partner.
        </p>
      </div>

      <div className="divider">or</div>

      {/* Use the dedicated Join page instead of duplicating the form here */}
      <div className="space-y-2">
        <p className="opacity-80 text-sm">Already have a code?</p>
        <Link to="/join" className="btn">
          Go to Join page
        </Link>
      </div>
    </div>
  );
}