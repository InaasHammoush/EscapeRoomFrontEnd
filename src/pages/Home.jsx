import { Link } from "react-router-dom";
import Page from "../components/Layout/Page";

export default function Home() {
  // simple persistence (no provider required)
  const setMode = (m) => localStorage.setItem("gameMode", m);

  return (
    <Page full>
      <section className="relative min-h-[calc(100vh-7rem)] flex items-center justify-center">
        {/* top-left auth links */}
        <div className="absolute left-6 top-6 md:left-10 md:top-10 flex gap-4">
          <Link to="/auth" className="underline underline-offset-4 hover:opacity-90">Login</Link>
          <Link to="/auth" className="underline underline-offset-4 hover:opacity-90" state={{ mode: "register" }}>
            Register
          </Link>
        </div>

        {/* centered hero */}
        <div className="text-center space-y-6">
          <button
            className="btn btn-circle btn-outline w-32 h-32 text-4xl shadow-lg"
            aria-label="Play Solo"
            onClick={() => { setMode("solo"); }}
          >
            ▶︎
          </button>

          <div className="flex items-center justify-center gap-4">
            <Link
              to="/start"
              className="btn btn-outline rounded-2xl"
              onClick={() => setMode("coop")}
            >
              Play Co-op
            </Link>
            <Link
              to="/rooms"
              className="btn btn-outline rounded-2xl"
              onClick={() => setMode("solo")}
            >
              Play Solo
            </Link>
          </div>

          <div>
          </div>
        </div>
      </section>
    </Page>
  );
}
