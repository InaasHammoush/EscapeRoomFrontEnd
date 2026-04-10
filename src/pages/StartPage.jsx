import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { nanoid } from "nanoid";
import { useGameMode } from "../state/gameMode";

export default function StartPage() {
  const nav = useNavigate();
  const { setMode, setSessionId, setRole } = useGameMode();
  const [busy, setBusy] = useState(false);
  const [hostRole, setHostRole] = useState("A");

  const createLobby = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setMode("coop");
      setRole(hostRole);
      const id = ("COOP-" + nanoid(6)).toUpperCase();
      setSessionId(id);
      // Host goes straight to Waiting with preferred role
      nav(`/waiting/${id}?role=${hostRole}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <h1 className="text-2xl font-bold mb-4">Co-op Lobby</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow">
          <h3 className="font-semibold mb-2">Create Lobby</h3>
          <p className="opacity-70 text-sm mb-4">
            Pick a role to start with. You can switch later in the waiting room.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              className={`btn btn-sm ${hostRole === "A" ? "btn-outline" : "btn-ghost"} rounded-2xl`}
              onClick={() => setHostRole("A")}
            >
              A (Library)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${hostRole === "B" ? "btn-outline" : "btn-ghost"} rounded-2xl`}
              onClick={() => setHostRole("B")}
            >
              B (Laboratory)
            </button>
          </div>
          <button
            className="btn btn-outline rounded-2xl"
            onClick={createLobby}
            disabled={busy}
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>

        <div className="bg-base-100/10 rounded-2xl p-6 shadow">
          <h3 className="font-semibold mb-2">Join Lobby</h3>
          <p className="opacity-70 text-sm mb-4">
            Enter a lobby code from your partner and choose your role.
          </p>
          <Link to="/join" className="btn btn-outline rounded-2xl">
            Join
          </Link>
        </div>
      </div>
    </Page>
  );
}
