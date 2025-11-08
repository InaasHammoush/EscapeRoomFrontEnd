import Page from "../components/Layout/Page";

export default function Room() {
  return (
    <Page>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="badge badge-outline">Time left: 30:00</div>
          <button className="btn btn-xs">Hint</button>
          <button className="btn btn-xs btn-error">Give up</button>
        </div>
        <div className="opacity-70 text-sm">Players: user1, user2</div>
      </div>

      <div className="grid lg:grid-cols-[1fr,300px] gap-6">
        <div className="bg-base-100/80 rounded-2xl p-5 shadow min-h-[50vh]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({length:6}).map((_,i)=>(
              <button key={i} className="btn rounded-2xl">Puzzle {i+1}</button>
            ))}
          </div>
        </div>
        <aside className="bg-base-100/80 rounded-2xl p-5 shadow">
          <h3 className="font-semibold mb-3">Inventory</h3>
          <ul className="space-y-2 opacity-70">
            <li>—</li><li>—</li><li>—</li>
          </ul>
        </aside>
      </div>
    </Page>
  );
}
