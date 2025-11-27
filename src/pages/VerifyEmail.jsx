import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Page from "../components/Layout/Page";
import { api } from "../state/api";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        if (res.data?.success === false) {
          setStatus("error");
          setMessage(res.data.message || "Verification failed.");
        } else {
          setStatus("success");
          setMessage(res.data?.message || "Your email address has been successfully verified.");
        }
      } catch (err) {
        setStatus("error");
        const msg =
          err.response?.data?.message ||
          "Verification link is invalid or has expired.";
        setMessage(msg);
      }
    }

    if (token) verify();
  }, [token]);

  return (
    <Page>
      <div className="h-[70vh] grid place-items-center">
        <div className="bg-base-100/10 rounded-2xl p-6 shadow w-[min(90vw,420px)] text-center space-y-4">
          {status === "loading" && (
            <>
              <h2 className="text-2xl font-bold">Verifying email…</h2>
              <p>Please wait a moment while we confirm your email.</p>
            </>
          )}

          {status === "success" && (
            <>
              <h2 className="text-2xl font-bold">Email verified 🎉</h2>
              <p>{message}</p>
              <Link
                to="/auth"
                state={{ mode: "login" }}
                className="btn btn-outline rounded-2xl"
              >
                Go to login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <h2 className="text-2xl font-bold text-red-400">Verification failed</h2>
              <p>{message}</p>
              <Link
                to="/auth"
                state={{ mode: "login" }}
                className="btn btn-outline rounded-2xl"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
