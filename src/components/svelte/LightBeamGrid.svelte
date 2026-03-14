<svelte:options customElement="lightbeam-grid-widget" />

<script>
  import mirrorGridSrc from "../../assets/alchemist/mirror_grid.png";
  import mirrorSourceSrc from "../../assets/alchemist/mirror_source.png";
  import mirrorGoalSrc from "../../assets/alchemist/mirror_goal.png";
  import mirrorLeftSrc from "../../assets/alchemist/mirror_left.png";
  import mirrorRightSrc from "../../assets/alchemist/mirror_right.png";
  import rune1Src from "../../assets/alchemist/rune_1.png";
  import rune2Src from "../../assets/alchemist/rune_2.png";
  import rune3Src from "../../assets/alchemist/rune_3.png";

  export let puzzle = null;

  $: gridWidth = Number(puzzle?.grid?.width || 7);
  $: gridHeight = Number(puzzle?.grid?.height || 7);

  
  const overlayLeftPct = 12.7;
  const overlayTopPct = 12.7;
  const overlayWidthPct = 77.0;
  const overlayHeightPct = 76.0;
  const markerOffsetXPct = 0.8;
  const markerOffsetYPct = 0.6;

  $: sourceX = Number.isInteger(puzzle?.source?.x) ? puzzle.source.x : 0;
  $: sourceY = Number.isInteger(puzzle?.source?.y) ? puzzle.source.y : 3;
  $: sourceLeft = overlayLeftPct + ((sourceX + 0.5) / gridWidth) * overlayWidthPct + markerOffsetXPct;
  $: sourceTop = overlayTopPct + ((sourceY + 0.5) / gridHeight) * overlayHeightPct + markerOffsetYPct;
  $: goalX = Number.isInteger(puzzle?.goal?.x) ? puzzle.goal.x : 6;
  $: goalY = Number.isInteger(puzzle?.goal?.y) ? puzzle.goal.y : 3;
  $: goalLeft = overlayLeftPct + ((goalX + 0.5) / gridWidth) * overlayWidthPct + markerOffsetXPct;
  $: goalTop = overlayTopPct + ((goalY + 0.5) / gridHeight) * overlayHeightPct + markerOffsetYPct;
  $: runes = Array.isArray(puzzle?.runes) ? puzzle.runes : [
    { id: "R1", x: 2, y: 1 },
    { id: "R2", x: 4, y: 0 },
    { id: "R3", x: 5, y: 2 },
  ];
  $: mirrors = normalizeMirrors(puzzle);
  $: beamSegments = Array.isArray(puzzle?.beam?.segments) ? puzzle.beam.segments : [];
  $: beamHitGoal = Boolean(puzzle?.beam?.hitGoal);
  $: mirrorMap = new Map(mirrors.map((m) => [`${m.x},${m.y}`, m.type]));
  $: xCells = Array.from({ length: gridWidth }, (_, i) => i);
  $: yCells = Array.from({ length: gridHeight }, (_, i) => i);
  $: phase = String(puzzle?.phase || "SETUP");
  $: phaseUpper = phase.toUpperCase();
  $: renderedBeamSegments = buildRenderedBeam(beamSegments, beamHitGoal, goalX, goalY);
  $: showBeam = phaseUpper === "SIMULATED" || phaseUpper === "SOLVED";
  $: activeRunes = Number.isFinite(Number(puzzle?.progress?.activeRunes))
    ? Number(puzzle.progress.activeRunes)
    : runes.filter((r) => r.active).length;
  $: totalRunes = Number.isFinite(Number(puzzle?.progress?.totalRunes))
    ? Number(puzzle.progress.totalRunes)
    : runes.length;

  function runeImage(id) {
    if (id === "R1") return rune1Src;
    if (id === "R2") return rune2Src;
    if (id === "R3") return rune3Src;
    return rune1Src;
  }

  function runeLeft(x) {
    return overlayLeftPct + ((x + 0.5) / gridWidth) * overlayWidthPct + markerOffsetXPct;
  }

  function runeTop(y) {
    return overlayTopPct + ((y + 0.5) / gridHeight) * overlayHeightPct + markerOffsetYPct;
  }

  function mirrorImage(type) {
    if (type === "/") return mirrorLeftSrc;
    if (type === "\\") return mirrorRightSrc;
    return mirrorLeftSrc;
  }

  function normalizeMirrorType(raw) {
    const v = String(raw ?? "").trim().toLowerCase();
    if (!v) return "/";
    if (v === "/" || v === "left" || v === "slash" || v === "fwd" || v === "forward") return "/";
    if (v === "\\" || v === "right" || v === "backslash" || v === "back" || v === "rev" || v === "reverse") return "\\";
    if (v.includes("\\")) return "\\";
    if (v.includes("/")) return "/";
    return "/";
  }

  function parseCellString(value) {
    const m = String(value ?? "").match(/^\s*(-?\d+)\s*[,;:]\s*(-?\d+)\s*$/);
    if (!m) return null;
    return { x: Number(m[1]), y: Number(m[2]) };
  }

  function normalizeMirrorEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    const parsedCell =
      parseCellString(entry.cell) ||
      parseCellString(entry.key) ||
      parseCellString(entry.pos) ||
      parseCellString(entry.position);

    const xRaw = entry.x ?? entry.col ?? entry.column ?? entry.cx ?? entry.pos?.x ?? entry.position?.x ?? parsedCell?.x;
    const yRaw = entry.y ?? entry.row ?? entry.cy ?? entry.pos?.y ?? entry.position?.y ?? parsedCell?.y;
    const x = Number(xRaw);
    const y = Number(yRaw);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    const rawType =
      entry.type ??
      entry.mirror ??
      entry.orientation ??
      entry.direction ??
      entry.dir ??
      entry.slash;

    return { x, y, type: normalizeMirrorType(rawType) };
  }

  function mirrorsFromAny(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== "object") return [];
    // Support map-like payloads: { "x,y": "/" }
    return Object.entries(raw).map(([key, type]) => ({ key, type }));
  }

  function normalizeMirrors(p) {
    const candidates = [
      p?.mirrors,
      p?.grid?.mirrors,
      p?.state?.mirrors,
      p?.output?.mirrors,
    ];

    const rawList = candidates.find((c) => Array.isArray(c) || (c && typeof c === "object"));
    const list = mirrorsFromAny(rawList);
    return list
      .map(normalizeMirrorEntry)
      .filter((m) => m && Number.isInteger(m.x) && Number.isInteger(m.y));
  }

  function mirrorLeft(x) {
    return overlayLeftPct + ((x + 0.5) / gridWidth) * overlayWidthPct + markerOffsetXPct;
  }

  function mirrorTop(y) {
    return overlayTopPct + ((y + 0.5) / gridHeight) * overlayHeightPct + markerOffsetYPct;
  }

  function beamX(x) {
    return overlayLeftPct + ((x + 0.5) / gridWidth) * overlayWidthPct + markerOffsetXPct;
  }

  function beamY(y) {
    return overlayTopPct + ((y + 0.5) / gridHeight) * overlayHeightPct + markerOffsetYPct;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function cutSegment(seg, tStart = 0, tEnd = 1) {
    return {
      x1: lerp(seg.x1, seg.x2, tStart),
      y1: lerp(seg.y1, seg.y2, tStart),
      x2: lerp(seg.x1, seg.x2, tEnd),
      y2: lerp(seg.y1, seg.y2, tEnd),
    };
  }

  function buildRenderedBeam(segments, hitGoal, gx, gy) {
    if (!Array.isArray(segments) || segments.length === 0) return [];
    const out = segments.map((s) => ({ ...s }));

    if (!hitGoal) return out;

    const idx = out.findIndex((s) => s.x2 === gx && s.y2 === gy);
    if (idx < 0) return out;

    // End halfway into the goal tile and drop the rest.
    out[idx] = cutSegment(out[idx], 0, 1);
    return out.slice(0, idx + 1);
  }

  function close() {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: {
        objectId: "puzzle_light_beam_grid",
        verb: "CLOSE",
      },
      bubbles: true,
      composed: true,
    }));
  }

  function emitAction(verb, data = {}) {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: {
        objectId: "puzzle_light_beam_grid",
        verb,
        data,
        canonicalObjectId: "alch:mirror-grid",
      },
      bubbles: true,
      composed: true,
    }));
  }

  function onCellClick(x, y, event) {
    const existing = mirrorMap.get(`${x},${y}`);
    if (existing) {
      emitAction("rotate_mirror", { x, y });
      return;
    }
    const type = event?.shiftKey ? "\\" : "/";
    emitAction("place_mirror", { x, y, type });
  }

  function onCellContextMenu(x, y, event) {
    event.preventDefault();
    const existing = mirrorMap.get(`${x},${y}`);
    if (!existing) return;
    emitAction("remove_mirror", { x, y });
  }

  function simulate() {
    emitAction("simulate");
  }

  function reset() {
    emitAction("reset");
  }

  function onOverlayKeydown(event) {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      close();
    }
  }

  function onContainerKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }
</script>

<div
  class="overlay"
  on:click={close}
  on:keydown={onOverlayKeydown}
  role="button"
  tabindex="0"
  aria-label="Close light beam grid"
>
  <div
    class="mirror-grid-container"
    on:click={(e) => e.stopPropagation()}
    on:keydown={onContainerKeydown}
    role="dialog"
    tabindex="0"
    aria-label="Light beam grid puzzle"
  >
    <button class="close-btn" on:click={close} aria-label="Close mirror grid">x</button>
    <div class="board-wrap">
      <p class="puzzle-hint">The lightbeam needs to hit all the runes.</p>
      <div class="board-image-wrap">
        <img
          src={mirrorGridSrc}
          alt="Mirror grid"
          class="mirror-grid-image"
        />
        <div class="grid-layer">
          <div
            class="debug-grid"
            style={`
              left:${overlayLeftPct}%;
              top:${overlayTopPct}%;
              width:${overlayWidthPct}%;
              height:${overlayHeightPct}%;
              --cols:${gridWidth};
              --rows:${gridHeight};
            `}
          ></div>
          <div
            class="interaction-grid"
            style={`
              left:${overlayLeftPct}%;
              top:${overlayTopPct}%;
              width:${overlayWidthPct}%;
              height:${overlayHeightPct}%;
              --cols:${gridWidth};
              --rows:${gridHeight};
            `}
          >
            {#each yCells as y}
              {#each xCells as x}
                <button
                  class="cell-hitbox"
                  on:click={(e) => onCellClick(x, y, e)}
                  on:contextmenu={(e) => onCellContextMenu(x, y, e)}
                  aria-label={`Grid cell ${x},${y}`}
                ></button>
              {/each}
            {/each}
          </div>
          <img
            src={mirrorSourceSrc}
            alt=""
            class="source-marker"
            style={`left:${sourceLeft}%; top:${sourceTop}%;`}
          />
          <img
            src={mirrorGoalSrc}
            alt=""
            class="goal-marker"
            style={`left:${goalLeft}%; top:${goalTop}%;`}
          />
          {#each runes as rune}
            <img
              src={runeImage(rune.id)}
              alt=""
              class="rune-marker"
              style={`left:${runeLeft(rune.x)}%; top:${runeTop(rune.y)}%;`}
            />
          {/each}
          {#each mirrors as mirror}
            <img
              src={mirrorImage(mirror.type)}
              alt=""
              class="mirror-marker"
              style={`left:${mirrorLeft(mirror.x)}%; top:${mirrorTop(mirror.y)}%;`}
            />
          {/each}
          {#if showBeam}
            <svg class="beam-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
              {#each renderedBeamSegments as seg}
                <line
                  x1={beamX(seg.x1)}
                  y1={beamY(seg.y1)}
                  x2={beamX(seg.x2)}
                  y2={beamY(seg.y2)}
                  class="beam-line"
                />
              {/each}
            </svg>
          {/if}
        </div>
      </div>
      <div class="controls-row">
        <button class="control-btn" on:click={simulate}>simulate</button>
        <button class="control-btn" on:click={reset}>reset</button>
      </div>
      <p class="progress-text">{activeRunes} / {totalRunes} runes hit</p>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(2px);
    z-index: 50;
  }

  .mirror-grid-image {
    display: block;
    width: 100%;
    max-height: 92vh;
    object-fit: contain;
    user-select: none;
  }

  .mirror-grid-container {
    position: relative;
    display: inline-block;
  }

  .board-wrap {
    position: relative;
    width: min(62vw, 420px);
  }

  .puzzle-hint {
    margin: 0 0 10px;
    padding: 8px 12px;
    text-align: center;
    color: #f4e4bc;
    font-size: 14px;
    line-height: 1.35;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(139, 115, 85, 0.45);
    border-radius: 6px;
    background: rgba(22, 18, 14, 0.45);
  }

  .board-image-wrap {
    position: relative;
  }

  .grid-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .debug-grid {
    position: absolute;
    border: 2px solid transparent;
    box-shadow: none;
    background-image:
      repeating-linear-gradient(
        to right,
        transparent 0,
        transparent 1px,
        transparent 1px,
        transparent calc(100% / var(--cols))
      ),
      repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 1px,
        transparent 1px,
        transparent calc(100% / var(--rows))
      );
  }

  .interaction-grid {
    position: absolute;
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    pointer-events: auto;
  }

  .cell-hitbox {
    border: 0;
    background: transparent;
    cursor: pointer;
    margin: 0;
    padding: 0;
  }

  .controls-row {
    margin-top: 10px;
    display: flex;
    justify-content: center;
    gap: 10px;
    pointer-events: auto;
  }

  .progress-text {
    margin: 10px 0 0;
    padding: 7px 12px;
    text-align: center;
    color: #d8c79f;
    font-size: 13px;
    line-height: 1.3;
    pointer-events: none;
    border: 1px solid rgba(139, 115, 85, 0.38);
    border-radius: 6px;
    background: rgba(22, 18, 14, 0.38);
  }

  .control-btn {
    border: 1px solid #8b7355;
    background: rgba(22, 18, 14, 0.9);
    color: #f4e4bc;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    text-transform: lowercase;
  }

  .control-btn:hover {
    background: rgba(35, 28, 21, 0.95);
  }

  .source-marker,
  .goal-marker {
    position: absolute;
    width: clamp(90px, 12.5%, 40px);
    aspect-ratio: 1 / 1;
    transform: translate(-50%, -50%);
    object-fit: contain;
  }

  .rune-marker {
    position: absolute;
    width: clamp(45px, 3.2%, 40px);
    aspect-ratio: 1 / 1;
    transform: translate(-50%, -50%);
    object-fit: contain;
  }

  .mirror-marker {
    position: absolute;
    width: clamp(34px, 6.8%, 54px);
    aspect-ratio: 1 / 1;
    transform: translate(-50%, -50%);
    object-fit: contain;
  }

  .beam-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }

  .beam-line {
    stroke: #ffd84d;
    stroke-width: 0.75;
    stroke-linecap: round;
    filter: drop-shadow(0 0 2px rgba(255, 216, 77, 0.9));
    opacity: 0.95;
  }

  .close-btn {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: #f4e4bc;
    border: 2px solid #8b7355;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.8);
  }
</style>
