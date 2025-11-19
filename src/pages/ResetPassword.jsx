import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { api } from "../state/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setMsg("");
    setErr("");

    if (newPwd !== confirmPwd) {
      setErr("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await api.post(`/auth/reset-password/${token}`, {
        newPassword: newPwd,
      });

      setMsg("Your password has been reset successfully. You can now log in.");
      setNewPwd("");
      setConfirmPwd("");

      // Optionally redirect after a short delay
      // navigate("/auth", { replace: true });
    } catch (e) {
      setErr(e.message || "Could not reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <div className="h-[70vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow w-[min(90vw,420px)]">
          <h2 className="text-xl font-bold mb-4">Set a new password</h2>

          <form onSubmit={submit} className="space-y-3">
            <label className="form-control">
              <span className="label label-text">New password</span>
              <input
                type="password"
                className="input input-bordered rounded-2xl w-full mt-2 text-black"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                disabled={busy}
                autoComplete="new-password"
              />
            </label>

            <label className="form-control">
              <span className="label label-text">Confirm new password</span>
              <input
                type="password"
                className="input input-bordered rounded-2xl w-full mt-2 text-black"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
                disabled={busy}
                autoComplete="new-password"
              />
            </label>

            {msg && <p className="text-success text-sm whitespace-pre-wrap">{msg}</p>}
            {err && <p className="text-error text-sm whitespace-pre-wrap">{err}</p>}

            <button
              type="submit"
              className="btn btn-outline rounded-2xl w-full mt-4"
              disabled={busy || !newPwd || !confirmPwd}
            >
              {busy ? "Please wait…" : "Reset password"}
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
