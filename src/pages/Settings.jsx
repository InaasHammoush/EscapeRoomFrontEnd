import Page from "../components/Layout/Page";

export default function Settings() {
  const apply = (name) => document.documentElement.setAttribute("data-theme", name);
  return (
    <Page>
      <h2 className="text-2xl font-bold mb-10">Settings</h2>
      <div className="flex flex-wrap gap-5">
        {["dark","light"].map(t=>(
          <button key={t} className="btn rounded-2xl" onClick={()=>apply(t)}>{t}</button>
        ))}
      </div>
    </Page>
  );
}
