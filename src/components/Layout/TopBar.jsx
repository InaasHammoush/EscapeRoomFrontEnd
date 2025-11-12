import { Link, NavLink } from "react-router-dom";
import { useGameMode } from "../../state/gameMode.jsx";

export default function TopBar() {
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
            <NavLink to="/start" className={linkClass}>Start</NavLink>
            <NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink>
            <NavLink to="/settings" className={linkClass}>Settings</NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}
