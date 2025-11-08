import { useEffect } from "react";
import { Link } from "react-router-dom";
import Page from "../components/Layout/Page";

export default function StartPage() {

  return (
    <Page>
      <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow">
          <h3 className="font-semibold mb-2">Create Lobby</h3>
          <Link to="/rooms" className="btn btn-outline rounded-2xl">Create</Link>
        </div>
        <div className="bg-base-100/10 rounded-2xl p-6 shadow">
          <h3 className="font-semibold mb-2">Join Lobby</h3>
          <Link to="/join" className="btn btn-outline rounded-2xl">Join</Link>
        </div>
      </div>
      <div className="mt-6">
      </div>
    </Page>
  );
}
