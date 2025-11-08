import { useParams, Link } from "react-router-dom";
import Page from "../components/Layout/Page";

export default function Waiting() {
  const { lobbyId } = useParams();
  return (
    <Page>
      <div className="h-[60vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-8 shadow text-center">
          <h2 className="text-2xl font-bold mb-2">Room created</h2>
          <p className="opacity-80 mb-4">Lobby ID: <span className="font-mono">{lobbyId}</span></p>
          <p className="opacity-70 mb-6">Starts automatically when a second player joins.</p>
          <Link to="/rooms" className="btn rounded-2xl">Back</Link>
        </div>
      </div>
    </Page>
  );
}
