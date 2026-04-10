import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";

export default function Join() {
  const [code, setCode] = useState("");
  const [role, setRole] = useState("B"); // default B
  const navigate = useNavigate();
  const { setMode, setSessionId, setRole: setGameRole } = useGameMode();

  const join = (e) => {
    e.preventDefault();
    const trimmed = (code || "").trim().toUpperCase();
    if (!trimmed) return;
    setMode("coop");
    setSessionId(trimmed);
    setGameRole(role);
    navigate(`/waiting/${trimmed}?role=${role}`);
  };

  return (
    <Page>
      <div className="max-w-md">
        <h2 className="text-2xl font-bold mb-4">Join Lobby</h2>

        <form onSubmit={join} className="space-y-6">
          <label className="form-control">
            <span className="label label-text">Lobby ID</span>
            <input
              className="input input-bordered rounded-2xl text-black"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="COOP-ABC123"
            />
          </label>

          <div>
            <div className="text-sm mb-2">Choose your role</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`btn btn-sm ${role === "A" ? "btn-outline" : "btn-ghost"} rounded-2xl`}
                onClick={() => setRole("A")}
              >
                A (Library)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${role === "B" ? "btn-outline" : "btn-ghost"} rounded-2xl`}
                onClick={() => setRole("B")}
              >
                B (Laboratory)
              </button>
            </div>
          </div>

          <button className="btn btn-outline rounded-2xl" type="submit">
            Join
          </button>
        </form>

        <div className="mt-3">
          <Link to="/start" className="link">Back</Link>
        </div>
      </div>
    </Page>
  );
}
