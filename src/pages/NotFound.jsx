import { Link } from "react-router-dom";
import Page from "../components/Layout/Page";

export default function NotFound() {
  return (
    <Page>
      <div className="h-[60vh] grid place-items-center text-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Page not found</h1>
          <p className="opacity-70 mb-4">Let’s return to the entrance.</p>
          <Link to="/" className="btn btn-primary rounded-2xl">Go Home</Link>
        </div>
      </div>
    </Page>
  );
}
