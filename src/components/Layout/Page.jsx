import { Link } from "react-router-dom";
import { useAuthUser } from "../../state/authUser";

// Auth Bar
function AuthStatusBar() {
  const { user, logout } = useAuthUser();

  return (
    <div className="w-full flex justify-end px-6 py-4">
      <div className="bg-base-100/10 backdrop-blur rounded-2xl px-4 py-2 shadow flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm">
              Logged in as <span className="font-semibold">{user.username}</span>
            </span>
            <button className="btn btn-xs btn-outline rounded-2xl" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/auth" className="text-sm underline underline-offset-4">
              Login
            </Link>
            <Link
              to="/auth"
              state={{ mode: "register" }}
              className="text-sm underline underline-offset-4"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// Page Layout
export default function Page({ children, center = false, showAuthBar = true }) {
  return (
    <div className="min-h-screen flex flex-col">
      {showAuthBar && <AuthStatusBar />}

      <main
        className={
          center
            ? // centered layout, needed for home page
              "flex-1 px-6 md:px-10 lg:px-20 max-w-5xl mx-auto py-6"
            : // default layout: small padding, full width
              "flex-1 px-10 py-6"
        }
      >
        {children}
      </main>
    </div>
  );
}

