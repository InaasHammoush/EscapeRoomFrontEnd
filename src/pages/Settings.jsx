import { useState } from "react";
import Page from "../components/Layout/Page";
import { Link } from "react-router-dom";

export default function Settings() {
  const applyTheme = (name) =>
    document.documentElement.setAttribute("data-theme", name);

  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [colorIntensity, setColorIntensity] = useState(100);

  return (
    <Page>
      <h2 className="text-3xl font-bold mb-10">Settings</h2>

      {/* === USER SETTINGS === */}
      <section className="mb-12 space-y-3">
        <h3 className="text-xl font-semibold mb-3">User Settings</h3>

        <div className="flex flex-col gap-3">
          <Link to="/forgot-password" className="btn btn-outline rounded-2xl w-fit">
            Reset Password
          </Link>

          {/* Future feature are here */}
          <button className="btn btn-outline rounded-2xl w-fit" >
            Change Email
          </button>

          <button className="btn btn-outline btn-error rounded-2xl w-fit" >
            Delete Account
          </button>
        </div>
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

        {/* Optional future item */}
        <div className="mt-4">
          <select className="select select-bordered rounded-2xl w-fit text-black">
            <option>English</option>
            <option>Deutsch</option>
          </select>
        </div>
      </section>

      {/* === GAME SETTINGS === */}
      <section className="mb-12 space-y-3">
        <h3 className="text-xl font-semibold mb-3">Game Settings</h3>

        {/* Hints toggle */}
        <label className="label cursor-pointer w-fit">
          <span className="label-text mr-3">Hints</span>
          <input
            type="checkbox"
            className="toggle"
            checked={hintsEnabled}
            onChange={() => setHintsEnabled(!hintsEnabled)}
          />
        </label>

        {/* Object brightness */}
        <div className="mt-3 mb-6">
          <label className="label-text">Object Lighting</label>
          <input
            type="range"
            min="30"
            max="150"
            value={brightness}
            className="range"
            className="range ml-3"
            onChange={(e) => setBrightness(e.target.value)}
          />
        </div>

        {/* Color intensity */}
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
