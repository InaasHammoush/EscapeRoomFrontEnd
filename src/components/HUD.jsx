// src/components/HUD.jsx
export default function HUD({ onHome, onTurnLeft, onTurnRight }) {
  return (
    <div className="pointer-events-none">
      <button
        onClick={onHome}
        className="absolute top-4 left-4 z-30 btn btn-circle btn-sm bg-black/60 text-white border-white/30 pointer-events-auto"
        title="Back to Home"
      >
        {"\u2302"}
      </button>

      <div className="absolute inset-x-0 bottom-10 flex justify-between px-10 z-20 pointer-events-none">
        <button
          className="btn btn-circle btn-lg btn-outline bg-black/40 text-white pointer-events-auto"
          onClick={onTurnLeft}
          title="Turn Left"
        >
          {"\u27F2"}
        </button>

        <button
          className="btn btn-circle btn-lg btn-outline bg-black/40 text-white pointer-events-auto"
          onClick={onTurnRight}
          title="Turn Right"
        >
          {"\u27F3"}
        </button>
      </div>
    </div>
  );
}