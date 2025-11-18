import { Link } from "react-router-dom";
import Page from "../components/Layout/Page";

export default function VerifyEmail() {
  return (
    <Page>
      <div className="h-[70vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow w-[min(90vw,420px)] text-center space-y-4">
          <h2 className="text-2xl font-bold">Email verified 🎉</h2>
          <p>
            Your email address has been successfully verified.
            You can now log in with your account.
          </p>

          <Link
            to="/auth"
            state={{ mode: "login" }}
            className="btn btn-outline rounded-2xl"
          >
            Go to login
          </Link>
        </div>
      </div>
    </Page>
  );
}
