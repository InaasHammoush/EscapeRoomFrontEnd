import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { api } from "../state/api";
import { clearToken } from "../state/token";

export default function DeleteAccount() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const doDelete = async () => {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      // Delete account (redirect-safe)
      await api.del("/auth/delete-account");
    } catch (e) {
      // Even if backend already deleted the account,
      // we still force logout on the client.
      console.warn("Delete error (ignored for logout):", e);
    } finally {
      // 🔒 FORCE LOGOUT (no matter what)
      clearToken();

      // Optional: clear any other auth-related storage
      localStorage.removeItem("user");
      sessionStorage.clear();

      // Hard reload = kills all React state, effects, and pending requests
      window.location.replace("/");
    }
  };

  return (
    <Page>
      <div className="h-[70vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow w-[min(90vw,520px)] text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-300">
            Delete your account?
          </h2>

          <p className="opacity-80">
            This action is permanent and cannot be undone.
          </p>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3 justify-center">
            <button
              className="btn btn-outline btn-error rounded-2xl"
              onClick={doDelete}
              disabled={busy}
            >
              {busy ? "Deleting…" : "Yes, delete my account"}
            </button>

            <button
              className="btn btn-outline rounded-2xl"
              onClick={() => navigate("/settings", { replace: true })}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
