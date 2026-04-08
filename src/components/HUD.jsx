// src/components/HUD.jsx
export default function HUD({
  onHome,
  onTurnLeft,
  onTurnRight,
  onToggleMusic,
  musicEnabled = true,
  onSwitchRoom,
  switchRoomLabel = "Switch Room",
  onGoCorridor,
  corridorLabel = "Go to Corridor",
  timerLabel,
}) {
  return (
    <div className="pointer-events-none">
      <button
        onClick={onHome}
        className="absolute top-4 left-4 z-30 btn btn-circle btn-sm bg-black/60 text-white border-white/30 pointer-events-auto"
        title="Back to Home"
      >
        {"\u2302"}
      </button>
      <button
        onClick={onToggleMusic}
        className="absolute top-4 left-16 z-30 btn btn-circle btn-sm bg-black/60 text-white border-white/30 pointer-events-auto"
        title={musicEnabled ? "Mute music" : "Unmute music"}
        aria-label={musicEnabled ? "Mute music" : "Unmute music"}
      >
        {musicEnabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M14 3.23v17.54a1 1 0 0 1-1.64.77L6.7 17H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3.7l5.66-4.54A1 1 0 0 1 14 3.23Zm3.54 2.39a1 1 0 0 1 1.41 0 9 9 0 0 1 0 12.72 1 1 0 1 1-1.41-1.42 7 7 0 0 0 0-9.88 1 1 0 0 1 0-1.42Zm-2.83 2.83a1 1 0 0 1 1.41 0 5 5 0 0 1 0 7.1 1 1 0 0 1-1.41-1.42 3 3 0 0 0 0-4.26 1 1 0 0 1 0-1.42Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M14 3.23v5.63l-2-2V5.31L7.05 9H4v6h3.05L12 18.69v-3.55l2 2v3.63a1 1 0 0 1-1.64.77L6.7 17H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3.7l5.66-4.54A1 1 0 0 1 14 3.23Z" />
            <path d="M20.71 19.29a1 1 0 0 1-1.42 1.42l-16-16a1 1 0 0 1 1.42-1.42l16 16Z" />
          </svg>
        )}
      </button>

      {onSwitchRoom && (
        <button
          onClick={onSwitchRoom}
          className="absolute top-4 right-28 z-30 btn btn-sm bg-black/60 text-white border-white/30 pointer-events-auto"
          title={switchRoomLabel}
        >
          {switchRoomLabel}
        </button>
      )}

      {onGoCorridor && (
        <button
          onClick={onGoCorridor}
          className="absolute top-4 right-4 z-30 btn btn-sm bg-black/70 text-white border-white/40 pointer-events-auto"
          title={corridorLabel}
        >
          {corridorLabel}
        </button>
      )}

      {timerLabel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/70 text-white border border-white/30 text-xs font-semibold tracking-wide">
          {timerLabel}
        </div>
      )}

      {(typeof onTurnLeft === "function" || typeof onTurnRight === "function") && (
        <div className="absolute inset-x-0 bottom-10 flex justify-between px-10 z-20 pointer-events-none">
          {typeof onTurnLeft === "function" && (
            <button
              className="btn btn-circle btn-lg btn-outline bg-black/40 text-white pointer-events-auto"
              onClick={onTurnLeft}
              title="Turn Left"
            >
              {"\u27F2"}
            </button>
          )}

          {typeof onTurnRight === "function" && (
            <button
              className="btn btn-circle btn-lg btn-outline bg-black/40 text-white pointer-events-auto"
              onClick={onTurnRight}
              title="Turn Right"
            >
              {"\u27F3"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
