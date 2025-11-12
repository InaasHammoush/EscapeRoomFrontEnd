import { Link } from "react-router-dom";
import Page from "../components/Layout/Page";

export default function RoomSelection() {
  return (
    <Page>
      <h2 className="text-2xl font-bold mb-4">Choose a Room</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {["Wizard’s Library & Alchemist’s Laboratory"].map((name,i)=>(
          <div key={i} className="bg-base-100/10 rounded-2xl p-6 shadow flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="opacity-70 text-sm">Co-op: communicate to solve.</p>
            </div>
            <Link to="/waiting/ABC123" className="btn btn-outline rounded-2xl">Select</Link>
          </div>
        ))}
      </div>
    </Page>
  );
}
