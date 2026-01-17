import { useState } from "react";
import { Link } from "react-router-dom";
import Page from "../components/Layout/Page";
import { api } from "../state/api";

export default function RecoverAccount() {
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
      const res = await api.patch("/auth/recover-account", { email });
      setMsg(res?.message || "Account recovery successful. You can now log in.");
      setEmail("");
    } catch (e2) {
      setErr(e2.message || "Account recovery failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <div className="h-[70vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow w-[min(90vw,420px)] text-center space-y-4">
          <h2 className="text-2xl font-bold">Recover account</h2>
          <p className="opacity-80">
            Enter the email address of the deleted account you want to recover.
          </p>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              className="input input-bordered rounded-2xl w-full text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={busy}
            />

            {msg && <p className="text-success text-sm">{msg}</p>}
            {err && <p className="text-error text-sm">{err}</p>}

            <button
              type="submit"
              className="btn btn-outline rounded-2xl w-full"
              disabled={busy || !email}
            >
              {busy ? "Recovering…" : "Recover account"}
            </button>
          </form>

          <Link to="/auth" state={{ mode: "login" }} className="btn btn-ghost rounded-2xl">
            Back to login
          </Link>
        </div>
      </div>
    </Page>
  );
}
