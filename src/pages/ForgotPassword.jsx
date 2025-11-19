import { useState } from "react";
import Page from "../components/Layout/Page";
import { api } from "../state/api";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setErr("");
    setMsg("");
    setBusy(true);

    try {
      await api.post("/auth/request-password-reset", { email });

      // backend already returns a generic message;
      // on the frontend we just show a friendly "always success"
      setMsg(
        "If this email is registered, we have sent you a password reset link."
      );
      setEmail("");
    } catch (e) {
      // you can still show a generic error if the request itself failed
      setErr(e.message || "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <div className="h-[70vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow w-[min(90vw,420px)]">
          <h2 className="text-xl font-bold mb-4">Forgot your password?</h2>
          <p className="text-sm mb-4 opacity-80">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={submit} className="space-y-3">
            <label className="form-control">
              <span className="label label-text">Email</span>
              <input
                type="email"
                className="input input-bordered rounded-2xl w-full mt-2 text-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
              />
            </label>

            {msg && <p className="text-success text-sm whitespace-pre-wrap">{msg}</p>}
            {err && <p className="text-error text-sm whitespace-pre-wrap">{err}</p>}

            <button
              type="submit"
              className="btn btn-outline rounded-2xl w-full mt-4"
              disabled={busy || !email}
            >
              {busy ? "Please wait…" : "Send reset link"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link to="/auth" className="link">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}
