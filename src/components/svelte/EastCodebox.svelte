<svelte:options customElement="east-codebox-widget" />

<script>
  import slidePuzzleImg from "../../assets/alchemist/slide_puzzle.png";
  import finalDoorImg from "../../assets/alchemist/image_final_door.png";

  export let puzzle = null;

  const DEFAULT_SIZE = 3;
  let localBoard = [];
  let lastBoardSignature = "";
  let solvedSignalSent = false;

  $: size = Number(puzzle?.size || DEFAULT_SIZE);
  $: serverBoard = Array.isArray(puzzle?.board) ? puzzle.board : [];
  $: {
    if (serverBoard.length === size * size) {
      const sig = serverBoard.join(",");
      if (sig !== lastBoardSignature) {
        localBoard = [...serverBoard];
        lastBoardSignature = sig;
      }
    } else {
      localBoard = [];
      lastBoardSignature = "";
    }
  }
  $: solvedByState = Boolean(puzzle?.solved);
  $: localSolved =
    Array.isArray(localBoard) &&
    localBoard.length === size * size &&
    localBoard.every((v, i) => (i === size * size - 1 ? v === 0 : v === i + 1));
  $: solved = solvedByState || localSolved;
  $: if (!solved) solvedSignalSent = false;
  $: if (solved && !solvedSignalSent) {
    solvedSignalSent = true;
    document.dispatchEvent(new CustomEvent("east-sliding-solved", {
      detail: { solved: true },
      bubbles: true,
      composed: true,
    }));
    close();
  }

  function emitIntent(objectId, verb, data = {}, canonicalObjectId = "") {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: { objectId, verb, data, canonicalObjectId },
      bubbles: true,
      composed: true,
    }));
  }

  function close() {
    emitIntent("puzzle_east_sliding_lock", "CLOSE");
  }

  function isAdjacent(a, b) {
    const ar = Math.floor(a / size);
    const ac = a % size;
    const br = Math.floor(b / size);
    const bc = b % size;
    return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
  }

  function moveTile(index) {
    if (solved) return;
    const emptyIndex = localBoard.indexOf(0);
    if (emptyIndex < 0) return;
    if (!isAdjacent(index, emptyIndex)) return;

    const next = [...localBoard];
    [next[index], next[emptyIndex]] = [next[emptyIndex], next[index]];
    localBoard = next;

    emitIntent("puzzle_east_sliding_lock", "move", {
      index,
      tile: next[emptyIndex],
    }, "alch:east-sliding-lock");
  }

  function tileBgStyle(tileNumber) {
    if (tileNumber === 0) return "";
    const i = tileNumber - 1;
    const row = Math.floor(i / size);
    const col = i % size;
    const posX = size > 1 ? (col * 100) / (size - 1) : 0;
    const posY = size > 1 ? (row * 100) / (size - 1) : 0;
    return `
      background-image: url(${finalDoorImg});
      background-size: ${size * 100}% ${size * 100}%;
      background-position: ${posX}% ${posY}%;
    `;
  }
</script>

<div class="overlay" on:click={close}>
  <div class="east-codebox-container" on:click={(e) => e.stopPropagation()}>
    <button class="close-btn" on:click={close} aria-label="Close east codebox">x</button>
    <div class="east-codebox-display">
      <img src={slidePuzzleImg} alt="Slide puzzle frame" class="slide-puzzle-image" />

      <div class="puzzle-overlay" class:solved>
        <div class="puzzle-grid" style={`--size:${size}`}>
          {#each localBoard as tile, i}
            <button
              class="puzzle-tile"
              class:empty={tile === 0}
              style={tileBgStyle(tile)}
              on:click={() => moveTile(i)}
              disabled={solved}
              aria-label={`Tile ${tile === 0 ? "empty" : tile}`}
            ></button>
          {/each}
        </div>
      </div>
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

  .east-codebox-container {
    position: relative;
  }

  .close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
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

  .east-codebox-display {
    position: relative;
    width: 420px;
    aspect-ratio: 1;
  }

  .slide-puzzle-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    user-select: none;
  }

  .puzzle-overlay {
    position: absolute;
    left: 50%;
    top: 49%;
    transform: translate(-50%, -50%);
    width: 56%;
    height: 56%;
  }

  .puzzle-grid {
    --size: 3;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(var(--size), 1fr);
    gap: 0;
  }

  .puzzle-tile {
    width: 100%;
    height: 100%;
    border: 0;
    margin: 0;
    padding: 0;
    cursor: pointer;
    background-repeat: no-repeat;
    background-color: transparent;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }

  .puzzle-tile.empty {
    opacity: 0;
    box-shadow: none;
    pointer-events: none;
  }

  .puzzle-overlay.solved .puzzle-tile {
    cursor: default;
  }
</style>
