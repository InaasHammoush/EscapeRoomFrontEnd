import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";
import { useGameMode } from "../state/gameMode";
import { connectSocket } from "../state/socket";

const SOLO_CHOICES = [
  { id: "wizard_library", title: "Wizard’s Library", firstRoom: "Library", note: "Spellbooks and runes" },
  { id: "alchemist_lab",  title: "Alchemist’s Laboratory", firstRoom: "Laboratory", note: "Potions and crystals" },
];

export default function SoloSelect() {
  const nav = useNavigate();
  const { setMode, setSessionId } = useGameMode();

  const createRoom = (roomName) => {
    return new Promise((resolve, reject) => {
      connectSocket.emit("create_room", { roomName }, (res) => {
        if (!res.ok) {
          console.error("Failed creating room:", res.error);
          reject(res.error);
          return;
        }

        resolve(res.roomId);
      });
    });
  };

  const startSolo = async (choice) => {
    setMode("solo");
    const id = ("SOLO-" + nanoid(6)).toUpperCase();
    setSessionId(id);
    sessionStorage.setItem("soloChoice", choice.id);
    const roomId = await createRoom(choice.id);
    nav(`/solo/${id}/room/${roomId}`, { replace: true });
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
