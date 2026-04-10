import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";

export default function Home() {
  const nav = useNavigate();
  const { setMode } = useGameMode ? useGameMode() : { setMode: () => {} };

  const setModeLocal = (m) => {
    try {
      localStorage.setItem("gameMode", m);
    } catch {}
  };

  const handleSolo = () => {
    setMode?.("solo");
    setModeLocal("solo");
    nav("/solo/select");
  };

  const handleCoop = () => {
    setMode?.("coop");
    setModeLocal("coop");
    nav("/start");
  };

  return (
    <Page center>
      <section className="relative min-h-[calc(100vh-7rem)] flex items-center justify-center">


        <div className="text-center space-y-6">
          <button
            className="btn btn-circle btn-outline w-32 h-32 text-4xl shadow-lg backdrop-blur"
            aria-label="Play Co-op"
            onClick={handleCoop}
          >
            ▶︎
          </button>

          <div className="flex items-center justify-center gap-4">
            <button
              className="btn btn-outline rounded-2xl backdrop-blur"
              onClick={handleCoop}
            >
              Play Co-op
            </button>

            <button
              className="btn btn-outline rounded-2xl backdrop-blur"
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
