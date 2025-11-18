import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Page from "../components/Layout/Page";
import { api } from "../state/api";
import { setToken } from "../state/token";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  // if we came from <Link to="/auth" state={{ mode: "register" }}>
  const initialMode =
    location.state?.mode === "register" ? "register" : "login";

  const [mode, setMode] = useState(initialMode); // "login" | "register"
  const [username, setUsername] = useState("");  // only for register
  const [email, setEmail] = useState("");        // for both
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setErr("");
    setBusy(true);

    try {
      if (mode === "login") {
        // 🔐 LOGIN FLOW
        const { accessToken } = await api.post("/auth/login", {
          email,
          password,
        });
        setToken(accessToken);
        navigate("/home"); // or "/start" if you prefer
      } else {
        // 📨 REGISTER FLOW – backend sends verification email
        await api.post("/auth/register", {
          username,
          email,
          password,
        });

        // Inform the user – email has the verify link
        setErr(
          "Account created. Please check your email and click the verification link to activate your account."
        );

        // Optional: switch to login view after successful register
        setMode("login");
        setPassword("");
      }
    } catch (e) {
      setErr(e.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <div className="h-[70vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow w-[min(90vw,420px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {mode === "login" ? "Login" : "Register"}
            </h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                setMode(mode === "login" ? "register" : "login")
              }
              disabled={busy}
            >
              {mode === "login" ? "Register" : "Login"}
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <label className="form-control">
                <span className="label label-text">Username</span>
                <input
                  className="input input-bordered rounded-2xl w-full mt-2 text-black"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  disabled={busy}
                />
              </label>
            )}

            <label className="form-control">
              <span className="label label-text">Email</span>
              <input
                type="email"
                className="input input-bordered rounded-2xl w-full mt-2 text-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={busy}
              />
            </label>

            <label className="form-control">
              <span className="label label-text">Password</span>
              <input
                type="password"
                className="input input-bordered rounded-2xl w-full mt-2 text-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                disabled={busy}
              />
            </label>

            {err && (
              <p className="text-error text-sm whitespace-pre-wrap mt-2">
                {err}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-outline rounded-2xl w-full mt-4"
              disabled={
                busy ||
                !email ||
                !password ||
                (mode === "register" && !username)
              }
            >
              {busy
                ? "Please wait…"
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/start" className="link">
              Continue as guest
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}
