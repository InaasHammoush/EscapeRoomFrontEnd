import { useState } from "react";
import Page from "../components/Layout/Page";
import { api } from "../state/api";
import { useAuthUser } from "../state/authUser";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const applyTheme = (name) =>
    document.documentElement.setAttribute("data-theme", name);

  const { user } = useAuthUser();
  const navigate = useNavigate();

  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [colorIntensity, setColorIntensity] = useState(100);

  // change-password form state
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  // change-email form state
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [emailErr, setEmailErr] = useState("");

  const submitChangePassword = async (e) => {
    e.preventDefault();
    if (pwdBusy) return;

    setPwdErr("");
    setPwdMsg("");

    if (newPwd !== confirmPwd) {
      setPwdErr("New passwords do not match.");
      return;
    }

    setPwdBusy(true);
    try {
      await api.patch("/auth/change-password", {
        oldPassword: oldPwd,
        newPassword: newPwd,
      });

      setPwdMsg("Password changed successfully.");
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setShowChangePwd(false);
    } catch (e) {
      setPwdErr(e.message || "Password change failed.");
    } finally {
      setPwdBusy(false);
    }
  };

  const submitChangeEmail = async (e) => {
    e.preventDefault();
    if (emailBusy) return;

    setEmailErr("");
    setEmailMsg("");

    setEmailBusy(true);
    try {
      const res = await api.patch("/auth/change-email", { newEmail });
      setEmailMsg(
        res?.message ||
          "Email change initiated. Please verify your new email address."
      );
      setNewEmail("");
      setShowChangeEmail(false);
    } catch (e) {
      setEmailErr(e.message || "Email change failed.");
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <Page>
      <h2 className="text-3xl font-bold mb-10">Settings</h2>

      {/* === USER SETTINGS === */}
      <section className="mb-12 space-y-3">
        <h3 className="text-xl font-semibold mb-3">User Settings</h3>

        {user ? (
          <div className="flex flex-col gap-3">
            {/* CHANGE PASSWORD */}
            <button
              className="btn btn-outline rounded-2xl w-fit"
              type="button"
              onClick={() => {
                setShowChangePwd((v) => !v);
                setPwdErr("");
                setPwdMsg("");
              }}
            >
              Change Password
            </button>

            {showChangePwd && (
              <form
                onSubmit={submitChangePassword}
                className="mt-2 space-y-3 max-w-md"
              >
                <label className="form-control">
                  <span className="label label-text">Current password</span>
                  <input
                    type="password"
                    className="input input-bordered rounded-2xl w-full mt-2 text-black"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    required
                    disabled={pwdBusy}
                  />
                </label>

                <label className="form-control">
                  <span className="label label-text">New password</span>
                  <input
                    type="password"
                    className="input input-bordered rounded-2xl w-full mt-2 text-black"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    required
                    disabled={pwdBusy}
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
                    disabled={pwdBusy}
                  />
                </label>

                {pwdMsg && <p className="text-success text-sm">{pwdMsg}</p>}
                {pwdErr && <p className="text-error text-sm">{pwdErr}</p>}

                <button
                  type="submit"
                  className="btn btn-outline rounded-2xl mt-2"
                  disabled={pwdBusy || !oldPwd || !newPwd || !confirmPwd}
                >
                  {pwdBusy ? "Please wait…" : "Save new password"}
                </button>
              </form>
            )}

            {/* CHANGE EMAIL */}
            <button
              className="btn btn-outline rounded-2xl w-fit"
              type="button"
              onClick={() => {
                setShowChangeEmail((v) => !v);
                setEmailErr("");
                setEmailMsg("");
              }}
            >
              Change Email
            </button>

            {showChangeEmail && (
              <form
                onSubmit={submitChangeEmail}
                className="mt-2 space-y-3 max-w-md"
              >
                <label className="form-control">
                  <span className="label label-text">New email address</span>
                  <input
                    type="email"
                    className="input input-bordered rounded-2xl w-full mt-2 text-black"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    disabled={emailBusy}
                  />
                </label>

                {emailMsg && <p className="text-success text-sm">{emailMsg}</p>}
                {emailErr && <p className="text-error text-sm">{emailErr}</p>}

                <button
                  type="submit"
                  className="btn btn-outline rounded-2xl mt-2"
                  disabled={emailBusy || !newEmail}
                >
                  {emailBusy ? "Please wait…" : "Send verification email"}
                </button>
              </form>
            )}

            {/* DELETE ACCOUNT -> go to dedicated page */}
            <button
              className="btn btn-outline btn-error rounded-2xl w-fit"
              type="button"
              onClick={() => navigate("/delete-account")}
            >
              Delete Account
            </button>
          </div>
        ) : (
          <p className="text-sm opacity-70">
            Log in to change your password and manage user settings.
          </p>
        )}
      </section>

      {/* === GENERAL SETTINGS === */}
      <section className="mb-12 space-y-3">
        <h3 className="text-xl font-semibold mb-3">General Settings</h3>

        <div className="flex gap-4">
          <button className="btn rounded-2xl" onClick={() => applyTheme("dark")}>
            Dark
          </button>
          <button className="btn rounded-2xl" onClick={() => applyTheme("light")}>
            Light
          </button>
        </div>
      </section>

      {/* === GAME SETTINGS === */}
      <section className="mb-12 space-y-3">
        <h3 className="text-xl font-semibold mb-3">Game Settings</h3>

        <label className="label cursor-pointer w-fit">
          <span className="label-text mr-3">Hints</span>
          <input
            type="checkbox"
            className="toggle"
            checked={hintsEnabled}
            onChange={() => setHintsEnabled(!hintsEnabled)}
          />
        </label>

        <div className="mt-3 mb-6">
          <label className="label-text">Object Lighting</label>
          <input
            type="range"
            min="30"
            max="150"
            value={brightness}
            className="range ml-3"
            onChange={(e) => setBrightness(e.target.value)}
          />
        </div>

        <div className="mt-3">
          <label className="label-text">Object Color Intensity</label>
          <input
            type="range"
            min="50"
            max="150"
            value={colorIntensity}
            className="range ml-3"
            onChange={(e) => setColorIntensity(e.target.value)}
          />
        </div>
      </section>
    </Page>
  );
}
