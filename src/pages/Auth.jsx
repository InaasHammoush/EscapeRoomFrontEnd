import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    // TODO: wire to backend later
    navigate("/home");
  };

  return (
    <Page>
      <div className="h-[70vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow w-[min(90vw,420px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{mode === "login" ? "Login" : "Register"}</h2>
            <button className="btn btn-ghost" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Register" : "Login"}
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <label className="form-control">
              <span className="label label-text">Username</span>
              <input className="input input-bordered rounded-2xl w-full mt-2 text-black" value={username} onChange={e=>setUsername(e.target.value)} />
            </label>
            <label className="form-control">
              <span className="label label-text">Password</span>
              <input type="password" className="input input-bordered rounded-2xl w-full mt-2 text-black" value={password} onChange={e=>setPassword(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-outline rounded-2xl w-full mt-4">
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/start" className="link">Continue as guest</Link>
          </div>
        </div>
      </div>
    </Page>
  );
}
