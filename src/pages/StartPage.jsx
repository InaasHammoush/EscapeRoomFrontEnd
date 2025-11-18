import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { nanoid } from "nanoid";
import { useGameMode } from "../state/gameMode";

export default function StartPage() {
  const nav = useNavigate();
  const { setMode, setSessionId } = useGameMode();
  const [busy, setBusy] = useState(false);

  const createLobby = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setMode("coop");
      const id = ("COOP-" + nanoid(6)).toUpperCase();
      setSessionId(id);
      // Host goes straight to Waiting as Player A
      nav(`/waiting/${id}?role=A`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow">
          <h3 className="font-semibold mb-2">Create Lobby</h3>
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
          <Link to="/join" className="btn btn-outline rounded-2xl">
            Join
          </Link>
        </div>
      </div>
    </Page>
  );
}
