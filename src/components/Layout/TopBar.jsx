import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { readMusicSettings, writeMusicSettings } from "../../state/musicSettings";

export default function TopBar() {
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    const settings = readMusicSettings();
    setMusicEnabled(settings.enabled);

    const onSettings = (event) => {
      if (!event?.detail) return;
      setMusicEnabled(event.detail.enabled !== false);
    };
    const onStorage = (event) => {
      if (event.key !== "musicSettings") return;
      setMusicEnabled(readMusicSettings().enabled);
    };

    window.addEventListener("music:settings", onSettings);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("music:settings", onSettings);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const onToggleMusic = () => {
    const current = readMusicSettings();
    const nextEnabled = !musicEnabled;
    setMusicEnabled(nextEnabled);
    writeMusicSettings({ enabled: nextEnabled, volume: current.volume });
  };

  const linkClass = ({ isActive }) =>
    `btn btn-ghost rounded-2xl normal-case text-base ${
      isActive ? "font-semibold" : "opacity-80 hover:opacity-100 hover:bg-white hover:text-black"
    }`;

  return (
    <div className="sticky top-0 z-50 bg-base-100/10 backdrop-blur border-b border-base-100/10">
      <div className="px-6">
        <div className="navbar min-h-14">
          <div className="flex-1">
            <Link to="/" className="text-xl font-extrabold tracking-wide">
              Arcane Descent
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink to="/" className={linkClass} end>Home</NavLink>
            <NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink>
            <NavLink to="/settings" className={linkClass}>Settings</NavLink>
            <button
              type="button"
              className="btn btn-ghost rounded-2xl normal-case text-sm"
              onClick={onToggleMusic}
              aria-label={musicEnabled ? "Mute music" : "Unmute music"}
              title={musicEnabled ? "Mute music" : "Unmute music"}
            >
              <span className="sr-only">{musicEnabled ? "Music On" : "Music Off"}</span>
              {musicEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                  <path d="M14 3.23v17.54a1 1 0 0 1-1.64.77L6.7 17H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3.7l5.66-4.54A1 1 0 0 1 14 3.23Zm3.54 2.39a1 1 0 0 1 1.41 0 9 9 0 0 1 0 12.72 1 1 0 1 1-1.41-1.42 7 7 0 0 0 0-9.88 1 1 0 0 1 0-1.42Zm-2.83 2.83a1 1 0 0 1 1.41 0 5 5 0 0 1 0 7.1 1 1 0 0 1-1.41-1.42 3 3 0 0 0 0-4.26 1 1 0 0 1 0-1.42Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                  <path d="M14 3.23v5.63l-2-2V5.31L7.05 9H4v6h3.05L12 18.69v-3.55l2 2v3.63a1 1 0 0 1-1.64.77L6.7 17H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3.7l5.66-4.54A1 1 0 0 1 14 3.23Z" />
                  <path d="M20.71 19.29a1 1 0 0 1-1.42 1.42l-16-16a1 1 0 0 1 1.42-1.42l16 16Z" />
                </svg>
              )}
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
