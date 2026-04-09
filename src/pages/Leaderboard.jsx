import { useEffect, useMemo, useState } from "react";
import Page from "../components/Layout/Page";

const API_BASE = import.meta.env.VITE_BACKEND_URL || window.location.origin;

function formatSeconds(rawSeconds) {
  const seconds = Number(rawSeconds);
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/leaderboard/time`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("LEADERBOARD_FETCH_FAILED");
        return res.json();
      })
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data?.leaderboard) ? data.leaderboard : [];
        setRows(list);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("Leaderboard fetch failed", err);
        setError("Could not load leaderboard data.");
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const tableRows = useMemo(
    () =>
      rows.map((entry, index) => ({
        rank: index + 1,
        user: entry?.username || "Unknown",
        time: formatSeconds(entry?.escape_time_seconds),
        completedAt: formatDate(entry?.completed_at),
      })),
    [rows]
  );

  return (
    <Page>
      <div className="bg-base-100/10 rounded-2xl p-6 shadow text-white">
        <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
        {loading && <p className="text-base-content/70">Loading leaderboard...</p>}
        {error && <p className="text-error">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="table text-white">
              <thead className="!text-white">
                <tr>
                  <th className="!text-white">#</th>
                  <th className="!text-white">User</th>
                  <th className="!text-white">Escape Time</th>
                  <th className="!text-white">Completed At</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-base-content/70">
                      No leaderboard entries yet.
                    </td>
                  </tr>
                )}
                {tableRows.map((r) => (
                  <tr key={`${r.user}-${r.rank}`}>
                    <td>{r.rank}</td>
                    <td>{r.user}</td>
                    <td>{r.time}</td>
                    <td>{r.completedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
