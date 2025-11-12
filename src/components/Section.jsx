export default function Section({ title, subtitle, children, actions }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="opacity-70">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="bg-base-100/80 backdrop-blur rounded-2xl shadow p-5">
        {children}
      </div>
    </section>
  );
}
