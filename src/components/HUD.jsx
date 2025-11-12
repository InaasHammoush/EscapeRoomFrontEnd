export default function HUD({ title = "Arcane Descent", subtitle = "Room A", children }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 p-4">
      <div className="navbar bg-base-200/80 backdrop-blur rounded-2xl shadow-xl">
        <div className="flex-1">
          <span className="text-xl font-bold px-2">{title}</span>
          <span className="opacity-70">/ {subtitle}</span>
        </div>
        <div className="flex gap-2">{children}</div>
      </div>
    </div>
  );
}
