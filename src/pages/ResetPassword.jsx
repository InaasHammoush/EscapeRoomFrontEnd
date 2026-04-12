import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Page from "../components/Layout/Page";
import FieldErrorList from "../components/auth/FieldErrorList";
import PasswordRuleChecklist from "../components/auth/PasswordRuleChecklist";
import { filterPasswordRuleMessages } from "../components/auth/passwordRules";
import { api } from "../state/api";

function createEmptyFieldErrors() {
  return {
    newPassword: [],
    confirmPassword: [],
  };
}

function groupFieldErrors(details = []) {
  const next = createEmptyFieldErrors();

  for (const issue of Array.isArray(details) ? details : []) {
    const field = Array.isArray(issue?.path) ? String(issue.path[0] || "") : "";
    const message = typeof issue?.message === "string" ? issue.message.trim() : "";

    if (!message) continue;
    if (!Object.prototype.hasOwnProperty.call(next, field)) continue;
    if (!next[field].includes(message)) {
      next[field].push(message);
    }
  }

  return next;
}

function inferFieldFromMessage(message = "") {
  const normalized = String(message).trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("passwort") || normalized.includes("password")) {
    return "newPassword";
  }
  return null;
}

export default function ResetPassword() {
  const { token } = useParams();

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState(() => createEmptyFieldErrors());
  const newPasswordFieldMessages = filterPasswordRuleMessages(
    fieldErrors.newPassword
  );

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]?.length) return prev;
      return { ...prev, [field]: [] };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setMsg("");
    setErr("");
    setFieldErrors(createEmptyFieldErrors());

    if (newPwd !== confirmPwd) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: ["Passwords do not match."],
      }));
      return;
    }

    setBusy(true);
    try {
      await api.post(`/auth/password/reset/${token}`, {
        newPassword: newPwd,
      });

      setMsg("Your password has been reset successfully. You can now log in.");
      setNewPwd("");
      setConfirmPwd("");
      setFieldErrors(createEmptyFieldErrors());
    } catch (e) {
      const nextFieldErrors = groupFieldErrors(e?.details);
      const hasFieldErrors = Object.values(nextFieldErrors).some(
        (messages) => messages.length > 0
      );

      if (hasFieldErrors) {
        setFieldErrors(nextFieldErrors);
      }

      const fallbackMessage = e?.message || "Could not reset password.";
      if (!hasFieldErrors || !Array.isArray(e?.details) || e.details.length === 0) {
        const inferredField = inferFieldFromMessage(fallbackMessage);
        if (inferredField) {
          setFieldErrors((prev) => ({
            ...prev,
            [inferredField]: prev[inferredField].includes(fallbackMessage)
              ? prev[inferredField]
              : [...prev[inferredField], fallbackMessage],
          }));
        } else {
          setErr(fallbackMessage);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page showAuthBar={false}>
      <div className="h-[70vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow w-[min(90vw,420px)]">
          <h2 className="text-xl font-bold mb-4">Set a new password</h2>

          <form onSubmit={submit} className="space-y-3">
            <label className="form-control">
              <span className="label label-text">New password</span>
              <input
                type="password"
                className={`input input-bordered rounded-2xl w-full mt-2 text-black ${
                  fieldErrors.newPassword.length ? "input-error" : ""
                }`}
                value={newPwd}
                onChange={(e) => {
                  setNewPwd(e.target.value);
                  clearFieldError("newPassword");
                }}
                required
                disabled={busy}
                autoComplete="new-password"
              />
              <PasswordRuleChecklist password={newPwd} />
              <FieldErrorList messages={newPasswordFieldMessages} />
            </label>

            <label className="form-control">
              <span className="label label-text">Confirm new password</span>
              <input
                type="password"
                className={`input input-bordered rounded-2xl w-full mt-2 text-black ${
                  fieldErrors.confirmPassword.length ? "input-error" : ""
                }`}
                value={confirmPwd}
                onChange={(e) => {
                  setConfirmPwd(e.target.value);
                  clearFieldError("confirmPassword");
                }}
                required
                disabled={busy}
                autoComplete="new-password"
              />
              <FieldErrorList messages={fieldErrors.confirmPassword} />
            </label>

            {msg && <p className="text-success text-sm whitespace-pre-wrap">{msg}</p>}
            {err && <p className="text-error text-sm whitespace-pre-wrap">{err}</p>}

            <button
              type="submit"
              className="btn btn-outline rounded-2xl w-full mt-4"
              disabled={busy || !newPwd || !confirmPwd}
            >
              {busy ? "Please wait..." : "Reset password"}
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
