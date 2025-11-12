import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";

export default function Join() {
  const [code, setCode] = useState("");
  const [role, setRole] = useState("B"); // default B
  const navigate = useNavigate();
  const { setMode, setSessionId } = useGameMode();

  const join = (e) => {
    e.preventDefault();
    const trimmed = (code || "").trim().toUpperCase();
    if (!trimmed) return;
    setMode("coop");
    setSessionId(trimmed);
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
              className="input input-bordered rounded-2xl w-xs m-4 text-black"
              value={code}
              onChange={e=>setCode(e.target.value)}
              placeholder="COOP-ABC123"
            />
          </label>

          <label className="form-control">
            <span className="label label-text">Role</span>
            <select
              className="select select-bordered rounded-2xl w-xs m-4 text-black"
              value={role}
              onChange={e=>setRole(e.target.value)}
            >
              <option value="A">A (Library)</option>
              <option value="B">B (Laboratory)</option>
            </select>
          </label>

          <button className="btn btn-outline rounded-2xl w-xs" type="submit">
            Join
          </button>
        </form>

        <div className="mt-3">
          <Link to="/home" className="link">Back</Link>
        </div>
      </div>
    </Page>
  );
}
