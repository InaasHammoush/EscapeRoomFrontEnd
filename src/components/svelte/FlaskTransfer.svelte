<svelte:options customElement="flask-transfer-widget" />

<script>
  import benchEmptyImg from "../../assets/alchemist/bench_empty.png";
  import benchOpenImg from "../../assets/alchemist/bench_open.png";
  import benchGlassEmptyImg from "../../assets/alchemist/bench_glass_empty.png";
  import benchLayerRedImg from "../../assets/alchemist/bench_layer_red.png";
  import benchLayerYellowImg from "../../assets/alchemist/bench_layer_yellow.png";
  import benchLayerGreenImg from "../../assets/alchemist/bench_layer_green.png";
  import benchLayerPurpleImg from "../../assets/alchemist/bench_layer_purple.png";
  import moonwortImg from "../../assets/alchemist/moonwort.png";
  import greenLiquidImg from "../../assets/alchemist/green_liquid.png";
  import matchboxImg from "../../assets/alchemist/matchbox.png";
  import charcoalPenImg from "../../assets/alchemist/charcoal_pen.png";

  export let puzzle = null;
  export let inventory = [];

  const DEFAULT_ORDER = ["RUBY", "CITRINE", "EMERALD", "AMETHYST"];
  const DEFAULT_BOTTLES = {
    RUBY: ["RED", "YELLOW", "GREEN"],
    CITRINE: ["GREEN", "RED", "PURPLE"],
    EMERALD: ["RED", "PURPLE", "YELLOW"],
    AMETHYST: ["PURPLE", "YELLOW", "GREEN"],
  };

  const COLOR_IMAGE = {
    RED: benchLayerRedImg,
    YELLOW: benchLayerYellowImg,
    GREEN: benchLayerGreenImg,
    PURPLE: benchLayerPurpleImg,
  };

  // `liquidX` stays independent from glass placement so manual tuning remains easy.
  const HOTSPOT_SIZE = { width: 8.0, height: 32.0 };

  const BOTTLE_SLOTS = {
    RUBY: { glassX: 30.0, liquidX: 20.0, y: 40.5, hitX: 20.0, hitY: 40.5 },
    CITRINE: { glassX: 49.0, liquidX: 39.0, y: 40.5, hitX: 39.0, hitY: 40.5 },
    EMERALD: { glassX: 68.0, liquidX: 58.0, y: 40.5, hitX: 58.0, hitY: 40.5 },
    AMETHYST: { glassX: 86.0, liquidX: 76.0, y: 40.5, hitX: 76.0, hitY: 40.5 },
  };

  // Visual stack tuning: explicit y-slots so the 4th layer is clearly above the 3rd.
  const LAYER_Y_SLOTS = {
    1: [44.0],
    2: [44.0, 37.0],
    3: [44.0, 37.0, 30.0],
    4: [44.0, 37.0, 30.0, 23.0],
  };
  const FRONTEND_MAX_CAPACITY = 4;

  // Reward positions/sizes over the opened bench.
  // Adjust `x`, `y`, `size` manually to fit your art precisely.
  const REWARD_SLOTS = {
    MOONWORT: { x: 28.5, y: 38.8, size: 10.5, image: moonwortImg, readyKey: "moonwortReady" },
    GREEN_LIQUID: { x: 45.5, y: 39.0, size: 9.8, image: greenLiquidImg, readyKey: "greenLiquidReady" },
    MATCHES: { x: 62.5, y: 38.9, size: 9.3, image: matchboxImg, readyKey: "matchesReady" },
    CHARCOAL_PEN: { x: 79.2, y: 39.1, size: 9.4, image: charcoalPenImg, readyKey: "coalBlockReady" },
  };

  let bottles = cloneBottles(DEFAULT_BOTTLES);
  let bottleOrder = [...DEFAULT_ORDER];
  let capacity = FRONTEND_MAX_CAPACITY;
  let solved = false;
  let selectedBottle = null;
  let targetFlashBottle = null;
  let targetFlashTimer = null;
  let invalidFlashBottle = null;
  let invalidFlashTimer = null;
  let statusMessage = "";
  let puzzleOutput = {};
  let claimedRewards = {};

  $: if (puzzle && typeof puzzle === "object") {
    const nextOrder = Array.isArray(puzzle.bottleOrder) && puzzle.bottleOrder.length
      ? [...puzzle.bottleOrder]
      : [...DEFAULT_ORDER];

    const nextBottles = {};
    for (const id of nextOrder) {
      const layers = Array.isArray(puzzle?.bottles?.[id]?.layers)
        ? puzzle.bottles[id].layers
        : DEFAULT_BOTTLES[id] || [];
      nextBottles[id] = [...layers];
    }

    bottleOrder = nextOrder;
    bottles = nextBottles;
    if (Number.isFinite(Number(puzzle.capacity))) {
      capacity = Math.min(Number(puzzle.capacity), FRONTEND_MAX_CAPACITY);
    }
    solved = !!puzzle.solved;
    statusMessage = String(puzzle.message || "");
    puzzleOutput = puzzle?.output && typeof puzzle.output === "object" ? { ...puzzle.output } : {};
    if (!solved) claimedRewards = {};

  }

  function cloneBottles(source) {
    const out = {};
    for (const key of Object.keys(source || {})) out[key] = [...(source[key] || [])];
    return out;
  }

  function close() {
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: { objectId: "alch:flask-transfer", verb: "CLOSE", data: {} },
        bubbles: true,
        composed: true,
      })
    );
  }

  function emitPour(from, to) {
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "puzzle_flask_transfer",
          canonicalObjectId: "alch:flask-transfer",
          verb: "pour",
          data: { from, to },
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  function handleBottleClick(targetBottle) {
    if (solved) return;

    if (!selectedBottle) {
      if ((bottles[targetBottle] || []).length === 0) return;
      selectedBottle = targetBottle;
      return;
    }

    if (selectedBottle === targetBottle) {
      selectedBottle = null;
      return;
    }

    const from = selectedBottle;
    const to = targetBottle;

    const src = bottles[from] || [];
    const dst = bottles[to] || [];

    // Match backend pour guards.
    if (!from || !to) return;
    if (from === to) return;
    if (src.length === 0) {
      flashInvalid(to);
      return;
    }
    if (dst.length >= capacity) {
      flashInvalid(to);
      return;
    }

    selectedBottle = null;
    flashTarget(to);

    // Backend-authoritative update:
    // do not mutate local bottle layers optimistically, because RoomView can
    // immediately push stale puzzle props before server ack, causing flicker/revert.
    emitPour(from, to);
  }

  function flashTarget(bottleId) {
    if (targetFlashTimer) {
      clearTimeout(targetFlashTimer);
      targetFlashTimer = null;
    }
    targetFlashBottle = bottleId;
    targetFlashTimer = setTimeout(() => {
      targetFlashBottle = null;
      targetFlashTimer = null;
    }, 220);
  }

  function flashInvalid(bottleId) {
    if (invalidFlashTimer) {
      clearTimeout(invalidFlashTimer);
      invalidFlashTimer = null;
    }
    invalidFlashBottle = bottleId;
    invalidFlashTimer = setTimeout(() => {
      invalidFlashBottle = null;
      invalidFlashTimer = null;
    }, 220);
  }

  function getLayerY(indexFromBottom, layerCount) {
    const count = Math.max(1, Math.min(FRONTEND_MAX_CAPACITY, Number(layerCount || 1)));
    const slots = LAYER_Y_SLOTS[count] || LAYER_Y_SLOTS[FRONTEND_MAX_CAPACITY];
    const idx = Math.max(0, Math.min(slots.length - 1, Number(indexFromBottom || 0)));
    return slots[idx];
  }

  function getLayerScaleY(layerCount) {
    return 2.25;
  }

  function hasInventoryItem(itemName) {
    const key = String(itemName || "").trim().toUpperCase();
    return Array.isArray(inventory)
      ? inventory.some((entry) => {
          const count = Number(entry?.count ?? 1);
          if (!Number.isFinite(count) || count <= 0) return false;
          const inv = String(entry?.item || "").trim().toUpperCase();
          if (key === "CHARCOAL_PEN") return inv === "CHARCOAL_PEN" || inv === "COAL_BLOCK";
          return inv === key;
        })
      : false;
  }

  function isRewardVisible(itemName) {
    const slot = REWARD_SLOTS[itemName];
    if (!slot) return false;
    const readyByOutput = !!puzzleOutput?.[slot.readyKey];
    if (!solved && !readyByOutput) return false;
    if (claimedRewards[itemName]) return false;
    return true;
  }

  function takeReward(itemName) {
    if (!isRewardVisible(itemName)) return;
    const backendItem = itemName === "CHARCOAL_PEN" ? "COAL_BLOCK" : itemName;
    claimedRewards = { ...claimedRewards, [itemName]: true };
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "puzzle_flask_transfer",
          canonicalObjectId: "alch:flask-transfer",
          verb: "take",
          data: { item: backendItem },
        },
        bubbles: true,
        composed: true,
      })
    );
  }
</script>

<div class="overlay" on:click={close}>
  <div class="container" on:click={(e) => e.stopPropagation()}>
    <button class="close-btn" on:click={close} aria-label="Close flask transfer">x</button>
    {#if statusMessage}
      <div class="status-message" aria-live="polite">{statusMessage}</div>
    {/if}

    <div class="bench-stage">
      <img src={solved ? benchOpenImg : benchEmptyImg} alt="Alchemy bench" class="bench-image" />

      {#each bottleOrder as bottleId}
        {@const layers = bottles[bottleId] || []}
        {@const slot = BOTTLE_SLOTS[bottleId]}
        {#if slot}
          {#each layers as color, idx}
            {@const layerImage = COLOR_IMAGE[color]}
            {#if layerImage}
              <img
                src={layerImage}
                alt={`${bottleId} ${color} layer`}
                class="liquid-layer"
                style={`left:${slot.liquidX}%; top:${getLayerY(idx, layers.length)}%; z-index:${10 + idx}; --layer-scale-y:${getLayerScaleY(layers.length)};`}
                data-bottle={bottleId}
                data-color={color}
              />
            {/if}
          {/each}
        {/if}
      {/each}

      {#each bottleOrder as bottleId}
        {@const slot = BOTTLE_SLOTS[bottleId]}
        {#if slot}
          <img
            src={benchGlassEmptyImg}
            alt={`${bottleId} bottle`}
            class="glass-slot"
            class:selected={selectedBottle === bottleId}
            class:target={targetFlashBottle === bottleId}
            class:invalid={invalidFlashBottle === bottleId}
            style={`left:${slot.glassX}%; top:${slot.y}%;`}
            data-bottle={bottleId}
          />

          <button
            type="button"
            class="bottle-hit"
            class:selected={selectedBottle === bottleId}
            aria-label={`Select ${bottleId}`}
            style={`left:${slot.hitX ?? slot.glassX}%; top:${slot.hitY ?? slot.y}%; --hit-w:${HOTSPOT_SIZE.width}%; --hit-h:${HOTSPOT_SIZE.height}%;`}
            on:click={() => handleBottleClick(bottleId)}
          ></button>
        {/if}
      {/each}

      {#each Object.entries(REWARD_SLOTS) as [itemName, slot]}
        {#if isRewardVisible(itemName)}
          <button
            type="button"
            class="reward-item"
            style={`left:${slot.x}%; top:${slot.y}%; width:${slot.size}%;`}
            aria-label={`Take ${itemName}`}
            on:click={() => takeReward(itemName)}
          >
            <img src={slot.image} alt={itemName} class="reward-image" />
          </button>
        {/if}
      {/each}
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

  .container {
    position: relative;
    width: min(62vw, 640px);
  }

  .bench-stage {
    position: relative;
    width: 100%;
  }

  .bench-image {
    position: relative;
    z-index: 1;
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain;
  }

  .liquid-layer {
    position: absolute;
    width: 18.5%;
    height: auto;
    transform: translate(-50%, -50%) scaleY(var(--layer-scale-y, 2.25));
    transform-origin: center center;
    object-fit: contain;
    pointer-events: none;
    z-index: 12;
    transition: top 180ms ease;
  }

  .bottle-hit {
    position: absolute;
    width: var(--hit-w, 11%);
    height: var(--hit-h, 32%);
    border: 0;
    background: transparent;
    padding: 0;
    transform: translate(-50%, -50%);
    cursor: pointer;
    z-index: 20;
    transition: transform 140ms ease, filter 140ms ease;
  }

  .bottle-hit.selected {
    transform: translate(-50%, -50%) scale(1.02);
    filter: drop-shadow(0 0 12px rgba(248, 235, 150, 0.85));
  }

  .glass-slot {
    position: absolute;
    width: 50%;
    transform: translate(-70%, -70%);
    height: auto;
    display: block;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
    transition: filter 140ms ease, transform 140ms ease;
  }

  .glass-slot.selected {
    filter: drop-shadow(0 0 12px rgba(248, 235, 150, 0.9));
    transform: translate(-70%, -70%) scale(1.02);
  }

  .glass-slot.target {
    filter: drop-shadow(0 0 12px rgba(130, 220, 255, 0.95));
    transform: translate(-70%, -70%) scale(1.02);
  }

  .glass-slot.invalid {
    filter: drop-shadow(0 0 12px rgba(255, 110, 110, 0.95));
    transform: translate(-70%, -70%) scale(1.02);
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
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .status-message {
    position: absolute;
    left: 50%;
    top: -34px;
    transform: translateX(-50%);
    background: rgba(14, 10, 4, 0.85);
    color: #f0e5bf;
    border: 1px solid #8b7355;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 13px;
    line-height: 1.2;
    white-space: nowrap;
    z-index: 6;
  }

  .reward-item {
    position: absolute;
    transform: translate(-50%, -50%);
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    display: block;
    z-index: 9999;
    transition: transform 120ms ease, filter 120ms ease;
  }

  .reward-item:hover {
    transform: translate(-50%, -50%) scale(1.06);
    filter: drop-shadow(0 0 8px rgba(244, 228, 188, 0.75));
  }

  .reward-image {
    position: relative;
    z-index: 10000;
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 0 10px rgba(255, 240, 160, 0.85));
  }
</style>
