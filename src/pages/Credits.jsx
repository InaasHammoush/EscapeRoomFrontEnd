import { Link, useLocation } from "react-router-dom";
import Page from "../components/Layout/Page";

function formatElapsed(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export default function Credits() {
  const { state } = useLocation();
  const durationSeconds = Number(state?.durationSeconds);
  const timeLabel = formatElapsed(durationSeconds);

  return (
    <Page center showAuthBar={false}>
      <section className="relative min-h-[calc(100vh-7rem)] flex items-center justify-center">
        <div className="w-full max-w-3xl text-center space-y-6">
          <div className="text-xs uppercase tracking-[0.4em] text-white/70">
            Escape Complete
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold">
            You won and escaped the room.
          </h1>
          <p className="text-white/80 max-w-xl mx-auto">
            The final seal broke, the corridor opened, and you made it out alive.
          </p>
          {timeLabel && (
            <div className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.25em] bg-black/60 px-4 py-2 rounded-full border border-white/15">
              Time {timeLabel}
            </div>
          )}

          <div className="text-xs uppercase tracking-[0.4em] text-white/70">
            Credits
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold">Thank you for playing</h2>
          <div className="text-left space-y-4 bg-black/60 border border-white/10 rounded-2xl p-6">
            <div>
              <h2 className="text-sm uppercase tracking-[0.3em] text-white/70">
                Project
              </h2>
              <p className="mt-2 text-white/80">
                Escape Room experience built as a student project at the <a href="https://www.mannheim.dhbw.de/" target="_blank" rel="noopener noreferrer" className="underline">DHBW Mannheim</a>.
                <br/>
                We hope you enjoyed playing it as much as we enjoyed creating it! if you want to see more of our work, check out our GitHub profiles:
                <ul className="list-disc list-inside">
                  <li>Finn Jakob <a href="https://github.com/MindDaemon" target="_blank" rel="noopener noreferrer" className="underline">Github</a></li>
                  <li>Inaas Hammoush <a href="https://github.com/inaashammoush" target="_blank" rel="noopener noreferrer" className="underline">Github</a></li>
                  <li>Zubaria Qureshi <a href="https://github.com/ZubariaQureshi" target="_blank" rel="noopener noreferrer" className="underline">Github</a></li>
                </ul>
              </p>
            </div>
            <div>
              <h2 className="text-sm uppercase tracking-[0.3em] text-white/70">
                Visuals
              </h2>
              <p className="mt-2 text-white/80">
              <ul className="list-disc list-inside">
                <li>All images are created by AI.</li>
                <li>Intro video created using Veo and edited by Yahia Mohy (<a href="https://www.linkedin.com/in/yahiamohy/" target="_blank" rel="noopener noreferrer" className="underline">LinkedIn</a>)</li>
              </ul>
              </p>
            </div>
            <div>
              <h2 className="text-sm uppercase tracking-[0.3em] text-white/70">
                Audio
              </h2>
              <p className="mt-2 text-white/80">
                <ul className="list-disc list-inside">
                  <li>
                    Main Site Music: "Timeliner" by Juanjo_sound (<a href="https://juanjosound.itch.io/fantasy-music-and-ambience-dark-and-emotional" target="_blank" rel="noopener noreferrer" className="underline">itch.io</a>)
                  </li>
                  <li>
                    Alchemist Lab: "Distorted Core" by Juanjo_sound (<a href="https://juanjosound.itch.io/fantasy-music-and-ambience-dark-and-emotional" target="_blank" rel="noopener noreferrer" className="underline">itch.io</a>)
                  </li>
                  <li>
                    Wizard Library: "Wander" by Innlydian (<a href="https://innlydian.itch.io/basic-classical-music-pack" target="_blank" rel="noopener noreferrer" className="underline">itch.io</a>)
                  </li>
                  <li>
                    Final Corridor: "Grindhouse" by TurtleBox (<a href="https://theturtlebox.itch.io/grindhouse" target="_blank" rel="noopener noreferrer" className="underline">itch.io</a>)
                  </li>
                  <li>
                    Credits theme: "End" by Juanjo_sound (<a href="https://juanjosound.itch.io/fantasy-music-and-ambience-dark-and-emotional" target="_blank" rel="noopener noreferrer" className="underline">itch.io</a>)
                  </li>
                  <li>
                    Mixing and Sound Design for Intro Video: Yahia Mohy (<a href="https://www.linkedin.com/in/yahiamohy/" target="_blank" rel="noopener noreferrer" className="underline">LinkedIn</a>)
                  </li>
                </ul>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link to="/home" className="btn btn-outline rounded-2xl">
              Back Home
            </Link>
            <Link to="/rooms" className="btn btn-ghost rounded-2xl">
              Play Again
            </Link>
          </div>
        </div>
      </section>
    </Page>
  );
}
