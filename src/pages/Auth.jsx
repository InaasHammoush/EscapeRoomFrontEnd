import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Page from "../components/Layout/Page";
import FieldErrorList from "../components/auth/FieldErrorList";
import PasswordRuleChecklist from "../components/auth/PasswordRuleChecklist";
import { PASSWORD_RULE_MESSAGES } from "../components/auth/passwordRules";
import { api } from "../state/api";
import { useSession } from "../state/session";

function cloneEmptyFieldErrors() {
  return {
    username: [],
    email: [],
    password: [],
  };
}

function groupFieldErrors(details = []) {
  const next = cloneEmptyFieldErrors();

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
  if (normalized.includes("benutzername") || normalized.includes("username")) return "username";
  if (normalized.includes("e-mail") || normalized.includes("email")) return "email";
  if (normalized.includes("passwort") || normalized.includes("password")) return "password";
  return null;
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useSession();

  const initialMode =
    location.state?.mode === "register" ? "register" : "login";

  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState(() => cloneEmptyFieldErrors());
  const [notice, setNotice] = useState({ kind: "", message: "" });
  const [busy, setBusy] = useState(false);
  const passwordFieldMessages =
    mode === "register"
      ? fieldErrors.password.filter((message) => !PASSWORD_RULE_MESSAGES.has(message))
      : fieldErrors.password;

  const resetFeedback = () => {
    setFieldErrors(cloneEmptyFieldErrors());
    setNotice({ kind: "", message: "" });
  };

  const switchMode = () => {
    resetFeedback();
    setMode((currentMode) => (currentMode === "login" ? "register" : "login"));
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]?.length) return prev;
      return { ...prev, [field]: [] };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    resetFeedback();
    setBusy(true);

    try {
      if (mode === "login") {
        const { accessToken, user } = await api.post("/auth/login", {
          email,
          password,
        });
        login({ accessToken, user });
        navigate("/home");
      } else {
        //  REGISTER
        await api.post("/auth/register", {
          username,
          email,
          password,
        });

        setNotice({
          kind: "success",
          message:
            "Account created. Please check your email and click the verification link to activate your account.",
        });

        setMode("login");
        setPassword("");
      }
    } catch (e) {
      const nextFieldErrors = groupFieldErrors(e?.details);
      const hasFieldErrors = Object.values(nextFieldErrors).some((messages) => messages.length > 0);

      if (hasFieldErrors) {
        setFieldErrors(nextFieldErrors);
      }

      const fallbackMessage = e?.message || "Request failed";
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
          setNotice({ kind: "error", message: fallbackMessage });
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {mode === "login" ? "Login" : "Register"}
            </h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={switchMode}
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
                  className={`input input-bordered rounded-2xl w-full mt-2 text-black ${fieldErrors.username.length ? "input-error" : ""}`}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearFieldError("username");
                  }}
                  autoComplete="username"
                  required
                  disabled={busy}
                />
                <FieldErrorList messages={fieldErrors.username} />
              </label>
            )}

            <label className="form-control">
              <span className="label label-text">Email</span>
              <input
                type="email"
                className={`input input-bordered rounded-2xl w-full mt-2 text-black ${fieldErrors.email.length ? "input-error" : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                autoComplete="email"
                required
                disabled={busy}
              />
              <FieldErrorList messages={fieldErrors.email} />
            </label>

            <label className="form-control">
              <span className="label label-text">Password</span>
              <input
                type="password"
                className={`input input-bordered rounded-2xl w-full mt-2 text-black ${fieldErrors.password.length ? "input-error" : ""}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                disabled={busy}
              />
              {mode === "register" && <PasswordRuleChecklist password={password} />}
              <FieldErrorList messages={passwordFieldMessages} />
            </label>

            {notice.message && (
              <p
                className={`text-sm whitespace-pre-wrap mt-2 ${
                  notice.kind === "success" ? "text-success" : "text-error"
                }`}
              >
                {notice.message}
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
                ? "Please wait..."
                : mode === "login"
                ? "Log in"
                : "Create account"}
            </button>

                {mode === "login" && (
                <div className="mt-2 text-center">
                    <Link to="/forgot-password" className="link text-sm">
                        Forgot your password?
                    </Link>
                    </div>
                )}
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

