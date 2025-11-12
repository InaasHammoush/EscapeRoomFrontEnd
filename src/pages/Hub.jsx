import { Link } from "react-router-dom";
import Page from "../components/Page";
import Section from "../components/Section";
import PrimaryButton from "../components/PrimaryButton";

export default function Hub() {
  return (
    <Page>
      <Section title="Connecting Chamber" subtitle="Choose your starting room">
        <div className="grid sm:grid-cols-2 gap-4">
          <RoomChoice label="Enter Room A" to="/room/A" />
          <RoomChoice label="Enter Room B" to="/room/B" />
        </div>
      </Section>

      <Section title="Shared Clue Board" subtitle="A neutral area for cross-room hints (placeholder)">
        <div className="rounded-2xl border border-dashed border-base-300 p-6 text-center opacity-70">
          Your shared notes will appear here.
        </div>
      </Section>
    </Page>
  );
}

function RoomChoice({ label, to }) {
  return (
    <div className="rounded-2xl p-6 bg-base-200/60 flex items-center justify-between">
      <div>
        <h3 className="font-semibold">{label}</h3>
        <p className="opacity-70 text-sm">Both players start separately and must meet here later.</p>
      </div>
      <Link to={to}><PrimaryButton>Enter</PrimaryButton></Link>
    </div>
  );
}
