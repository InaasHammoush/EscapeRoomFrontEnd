import Page from "../components/Layout/Page";

export default function Leaderboard() {
  const rows = [
    { rank: 1, user: "bobby-is-the-best", time: "20:15" },
    { rank: 2, user: "alice-for-the-win", time: "23:00" },
  ];
  return (
    <Page>
      <div className="bg-base-100/10 rounded-2xl p-6 shadow">
        <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>#</th><th>User</th><th>Best Time</th></tr></thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.rank}><td>{r.rank}</td><td>{r.user}</td><td>{r.time}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}
