import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";
import { connectSocket } from "../state/socket";

const SOLO_CHOICES = [
  { id: "WizardLibrary", title: "Wizard’s Library", firstRoom: "Library", note: "Spellbooks and runes" },
  { id: "AlchemistLab",  title: "Alchemist’s Laboratory", firstRoom: "Laboratory", note: "Potions and crystals" },
];

export default function SoloSelect() {
  const nav = useNavigate();
  const { setMode, setSessionId } = useGameMode();

  const startSolo = (choice) => {
    setMode("solo");
    const id = ("SOLO-" + nanoid(6)).toUpperCase();
    setSessionId(id);
    sessionStorage.setItem("soloChoice", choice.id);
    connectSocket({ mode: "solo", sessionId: id }); // optional
    nav(`/solo/${id}/room/${choice.firstRoom}`, { replace: true });
  };

  return (
    <Page>
      <h2 className="text-2xl font-bold mb-4">Choose Your Solo Room</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {SOLO_CHOICES.map((c) => (
          <div key={c.id} className="bg-base-100/10 rounded-2xl p-6 shadow flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{c.title}</h3>
              <p className="opacity-70 text-sm">{c.note}</p>
            </div>
            <button className="btn btn-outline rounded-2xl" onClick={() => startSolo(c)}>
              Play
            </button>
          </div>
        ))}
      </div>
    </Page>
  );
}
