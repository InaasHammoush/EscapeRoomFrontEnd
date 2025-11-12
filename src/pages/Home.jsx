import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode"; // optional if you want to sync context

export default function Home() {
  const nav = useNavigate();
  const { setMode } = useGameMode ? useGameMode() : { setMode: () => {} };

  // fallback for localStorage if context not active
  const setModeLocal = (m) => {
    try {
      localStorage.setItem("gameMode", m);
    } catch {}
  };

  const handleSolo = () => {
    setMode?.("solo");
    setModeLocal("solo");
    // go directly to solo route
    nav("/solo/select");
  };

  const handleCoop = () => {
    setMode?.("coop");
    setModeLocal("coop");
    // go directly to coop lobby
    nav("/start");
  };

  return (
    <Page full>
      <section className="relative min-h-[calc(100vh-7rem)] flex items-center justify-center">
        {/* top-left auth right */}
        <div className="absolute right-6 top-6 md:right-10 md:top-5 flex gap-4">
          <Link to="/auth" className="underline underline-offset-4 hover:opacity-90">Login</Link>
          <Link to="/auth" className="underline underline-offset-4 hover:opacity-90" state={{ mode: "register" }}>
            Register
          </Link>
        </div>

        {/* centered hero */}
        <div className="text-center space-y-6">
          {/* main play button: solo */}
          <button
            className="btn btn-circle btn-outline w-32 h-32 text-4xl shadow-lg"
            aria-label="Play Solo"
            onClick={handleSolo}
          >
            ▶︎
          </button>

          <div className="flex items-center justify-center gap-4">
            {/* multiplayer link */}
            <button
              className="btn btn-outline rounded-2xl"
              onClick={handleCoop}
            >
              Play Co-op
            </button>

            {/* single player link */}
            <button
              className="btn btn-outline rounded-2xl"
              onClick={handleSolo}
            >
              Play Solo
            </button>
          </div>
        </div>
      </section>
    </Page>
  );
}
