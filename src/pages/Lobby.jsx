import { useState } from "react";
import { Link } from "react-router-dom";
import Page from "../components/Page";
import Section from "../components/Section";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";

export default function Lobby() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  return (
    <Page>
      <Section title="Lobby" subtitle="Create a session or join by code">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create */}
          <div className="rounded-2xl p-5 bg-base-200/60">
            <h3 className="font-semibold mb-3">Create Lobby</h3>
            <label className="form-control w-full mb-3">
              <div className="label"><span className="label-text">Display name</span></div>
              <input className="input input-bordered rounded-2xl" value={name} onChange={e=>setName(e.target.value)} />
            </label>
            <Link to="/hub"><PrimaryButton>Create</PrimaryButton></Link>
          </div>

          {/* Join */}
          <div className="rounded-2xl p-5 bg-base-200/60">
            <h3 className="font-semibold mb-3">Join Lobby</h3>
            <label className="form-control w-full mb-3">
              <div className="label"><span className="label-text">Lobby code</span></div>
              <input className="input input-bordered rounded-2xl" value={code} onChange={e=>setCode(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <Link to="/hub"><PrimaryButton>Join</PrimaryButton></Link>
              <SecondaryButton onClick={()=>{ setCode(""); }}>Clear</SecondaryButton>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Players" subtitle="Appears when connected (placeholder)">
        <div className="rounded-2xl border border-dashed border-base-300 p-6 text-center opacity-70">
          Waiting for players…
        </div>
      </Section>
    </Page>
  );
}
