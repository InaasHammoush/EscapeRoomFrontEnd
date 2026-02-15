<svelte:options customElement="mortar-widget" />

<script>
  import mortarBg from "../../assets/alchemist/mortar_empty.png";
  import mortarMoonwortBg from "../../assets/alchemist/mortar_moonwort.png";
  import mortarMoonwortGreenBg from "../../assets/alchemist/mortar_moonwort_green.png";
  import mortarBlueBg from "../../assets/alchemist/mortar_blue.png";
  import blueLiquidImg from "../../assets/alchemist/blue_liquid.png";
  import moonwortImg from "../../assets/alchemist/moonwort.png";
  import pestleImg from "../../assets/alchemist/pestel.png";

  export let puzzle = null;

  let draggedItem = null;
  let localContents = [];
  let grinding = false;
  let darkening = false;
  let revealing = false;
  let localGrindDone = false;
  let localGreenMixed = false;
  let localBlueMixed = false;
  let localBlueTaken = false;
  let transitionMode = "none";
  let grindTimer = null;
  let mixPrepTimer = null;
  let darkenTimer = null;
  let revealTimer = null;
  const GRIND_MS = 2200;
  const GREEN_SHOW_MS = 1000;
  const DARKEN_MS = 360;
  const REVEAL_MS = 800;

  $: contents = puzzle?.contents || [];
  $: solved = puzzle?.solved || false;
  $: displayContents = Array.from(new Set([...(contents || []), ...(localContents || [])]));
  $: essenceReady = Boolean(puzzle?.processed?.essenceReady);
  $: greenMixedFromPuzzle =
    (contents || []).some((item) => normalizeItem(item).replace(/\s+/g, "_") === "GREEN_LIQUID") ||
    Boolean(puzzle?.inserted?.greenLiquid) ||
    String(puzzle?.phase || "").toUpperCase().includes("GREEN");
  $: showGreenState = localGreenMixed || greenMixedFromPuzzle;
  $: blueMixedFromPuzzle =
    Boolean(puzzle?.output?.blueLiquidReady);
  $: showBlueState = localBlueMixed || blueMixedFromPuzzle;
  $: blueTakenFromPuzzle =
    Boolean(puzzle?.output?.blueLiquidTaken);
  $: showResetEmptyState = localBlueTaken || blueTakenFromPuzzle;
  $: widgetLocked = showResetEmptyState || solved;
  $: showGroundState = essenceReady || localGrindDone;
  $: currentMortarBg = showResetEmptyState
    ? mortarBg
    : (showBlueState
      ? mortarBlueBg
      : (showGreenState ? mortarMoonwortGreenBg : (showGroundState ? mortarMoonwortBg : mortarBg)));
  $: showGrindGlow =
    grinding ||
    ((darkening || revealing) && (transitionMode === "grind" || transitionMode === "mix"));
  $: if (contents && contents.length) {
    localContents = localContents.filter((item) => !contents.includes(item));
  }

  function normalizeItem(itemName) {
    return String(itemName || "").trim().toUpperCase();
  }

  function getItemImage(itemName) {
    const images = {
      'BLUE_LIQUID': blueLiquidImg,
      'MOONWORT': moonwortImg
    };
    return images[normalizeItem(itemName)] || null;
  }

  function shouldShowItem(itemName) {
    if (widgetLocked) return false;
    const key = normalizeItem(itemName);
    if (showGroundState && key === "MOONWORT") return false;
    if ((showGreenState || showBlueState) && key === "GREEN_LIQUID") return false;
    return true;
  }

  function clearTransitionTimers() {
    if (mixPrepTimer) {
      clearTimeout(mixPrepTimer);
      mixPrepTimer = null;
    }
    if (darkenTimer) {
      clearTimeout(darkenTimer);
      darkenTimer = null;
    }
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
  }

  function startDarkRevealTransition(mode, onSwap = null, onDone = null) {
    transitionMode = mode;
    darkening = true;
    revealing = false;

    clearTransitionTimers();

    darkenTimer = setTimeout(() => {
      darkening = false;
      revealing = true;
      if (onSwap) onSwap();
      darkenTimer = null;

      revealTimer = setTimeout(() => {
        revealing = false;
        transitionMode = "none";
        if (onDone) onDone();
        revealTimer = null;
      }, REVEAL_MS);
    }, DARKEN_MS);
  }

  function startGrindingIfNeeded() {
    if (widgetLocked || grinding || localGrindDone || essenceReady) return;
    grinding = true;
    transitionMode = "grind";

    if (grindTimer) clearTimeout(grindTimer);
    clearTransitionTimers();
    grindTimer = setTimeout(() => {
      grinding = false;
      startDarkRevealTransition("grind", () => {
        localGrindDone = true;
        localContents = localContents.filter((item) => normalizeItem(item) !== "MOONWORT");
        emitAction("grind");
      });

      grindTimer = null;
    }, GRIND_MS);
  }

  function startGreenMixIfNeeded() {
    if (widgetLocked || !showGroundState || showBlueState || grinding || darkening || revealing) return;
    if (mixPrepTimer) clearTimeout(mixPrepTimer);
    if (grindTimer) clearTimeout(grindTimer);
    clearTransitionTimers();

    startDarkRevealTransition(
      "mix_pour",
      () => {
        localGreenMixed = true;
        localContents = localContents.filter((item) => normalizeItem(item) !== "GREEN_LIQUID");
      },
      () => {
        transitionMode = "mix_wait";
        mixPrepTimer = setTimeout(() => {
          grinding = true;
          transitionMode = "mix";
          mixPrepTimer = null;

          grindTimer = setTimeout(() => {
            grinding = false;
            startDarkRevealTransition("mix", () => {
              emitAction("combine");
              localGreenMixed = false;
              localBlueMixed = true;
            });
            grindTimer = null;
          }, GRIND_MS);
        }, GREEN_SHOW_MS);
      }
    );
  }

  function startBlueTakeIfNeeded() {
    if (widgetLocked || !showBlueState || showResetEmptyState || grinding || darkening || revealing) return;
    emitAction("take", "BLUE_LIQUID");
    startDarkRevealTransition("collect", () => {
      localBlueTaken = true;
      localBlueMixed = false;
      localGreenMixed = false;
      localGrindDone = false;
      localContents = localContents.filter((item) => {
        const key = normalizeItem(item);
        return key !== "MOONWORT" && key !== "GREEN_LIQUID";
      });
    });
  }

  function handleDragStart(e, item) {
    draggedItem = item;
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    if (widgetLocked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e) {
    if (widgetLocked) return;
    e.preventDefault();
    const dataItem = e.dataTransfer.getData("application/x-inventory-item") || e.dataTransfer.getData("text/plain");
    if (dataItem) {
      const normalizedDataItem = normalizeItem(dataItem);
      if (normalizedDataItem === "MOONWORT") {
        localContents = Array.from(new Set([...localContents, "MOONWORT"]));
        emitAction('insert', dataItem, {
          phase: "MOONWORT_INSERTED",
          inserted: { moonwort: true },
          processed: { essenceReady: false },
          output: { blueLiquidReady: false, blueLiquidTaken: false },
          solved: false,
          contents: ["Moonwort"],
          nextActions: ["grind"],
          message: "Moonwort inserted."
        });
        startGrindingIfNeeded();
        draggedItem = null;
        return;
      }
      if (normalizedDataItem === "GREEN_LIQUID") {
        emitAction('insert', dataItem);
        startGreenMixIfNeeded();
        draggedItem = null;
        return;
      }
      if (normalizedDataItem === "EMPTY_BOTTLE") {
        startBlueTakeIfNeeded();
        draggedItem = null;
        return;
      }
      emitAction('insert', dataItem);
      draggedItem = null;
      return;
    }
    if (draggedItem && draggedItem.count > 0) {
      const normalizedDraggedItem = normalizeItem(draggedItem.item);
      if (normalizedDraggedItem === "MOONWORT") {
        localContents = Array.from(new Set([...localContents, "MOONWORT"]));
        emitAction('insert', draggedItem.item, {
          phase: "MOONWORT_INSERTED",
          inserted: { moonwort: true },
          processed: { essenceReady: false },
          output: { blueLiquidReady: false, blueLiquidTaken: false },
          solved: false,
          contents: ["Moonwort"],
          nextActions: ["grind"],
          message: "Moonwort inserted."
        });
        startGrindingIfNeeded();
      } else if (normalizedDraggedItem === "GREEN_LIQUID") {
        emitAction('insert', draggedItem.item);
        startGreenMixIfNeeded();
      } else if (normalizedDraggedItem === "EMPTY_BOTTLE") {
        startBlueTakeIfNeeded();
      } else {
        emitAction('insert', draggedItem.item);
      }
      draggedItem = null;
    }
  }

  $: if (essenceReady) {
    localGrindDone = true;
    grinding = false;
    darkening = false;
    revealing = false;
    transitionMode = "none";
    localContents = localContents.filter((item) => normalizeItem(item) !== "MOONWORT");
    if (grindTimer) {
      clearTimeout(grindTimer);
      grindTimer = null;
    }
    clearTransitionTimers();
  }

  function emitAction(verb, item = null, extraData = {}) {
    const event = new CustomEvent('intent', {
      detail: {
        objectId: 'puzzle_mortar',
        verb,
        data: item ? { item, ...extraData } : { ...extraData }
      },
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }

  function close() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'puzzle_mortar', verb: 'CLOSE', data: {} },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="overlay" on:click={close}>
  <div class="mortar-container" on:click={(e) => e.stopPropagation()}>
    <button class="close-btn" on:click={close}>✕</button>

    <div class="mortar-display">
      <img src={currentMortarBg} alt="Mortar" class="mortar-bg" />
      <div 
        class="mortar-drop-zone"
        on:dragover={handleDragOver}
        on:drop={handleDrop}
        role="region"
        aria-label="Mortar drop zone"
        class:solved
        class:locked={widgetLocked}
      >
        {#each displayContents as item}
          {@const itemImage = getItemImage(item)}
          {#if shouldShowItem(item) && itemImage}
            <img 
              src={itemImage} 
              alt={item}
              class="item-image"
            />
          {/if}
        {/each}
      </div>
      {#if showGrindGlow}
        <div
          class="grind-glow"
          class:darkening
          class:revealing
          aria-hidden="true"
        ></div>
      {/if}
      {#if grinding}
        <div class="pestle-motion" aria-hidden="true">
          <img src={pestleImg} alt="" class="pestle-image" />
        </div>
      {/if}
      {#if darkening || revealing}
        <div
          class="mortar-transition-mask"
          class:darkening
          class:revealing
          aria-hidden="true"
        ></div>
      {/if}
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

  .mortar-container {
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
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .mortar-display {
    position: relative;
    width: 550px;
    aspect-ratio: 1;
  }

  .mortar-bg {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .mortar-drop-zone {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 15px;
    padding: 30px 40px 40px;;
    cursor: grab;
  }

  .mortar-drop-zone:hover {
    background: rgba(212, 175, 55, 0.05);
  }

  .mortar-drop-zone.locked {
    cursor: default;
  }

  .mortar-drop-zone.locked:hover {
    background: transparent;
  }

  .item-image {
    width: 150px;
    height: 150px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
  }

  .grind-glow {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 250px;
    height: 250px;
    transform: translate(-50%, -50%);
    border-radius: 60%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 245, 1) 0%,
      rgba(255, 255, 240, 1) 22%,
      rgba(255, 248, 190, 0.9) 40%,
      rgba(255, 237, 148, 0.5) 58%,
      rgba(255, 237, 148, 0) 82%
    );
    filter: blur(8px);
    box-shadow: 0 0 40px rgba(255, 252, 220, 0.95);
    animation: glowPulse 600ms ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 1;
  }

  .grind-glow.darkening {
    animation: glowFadeWithDarken 360ms ease-out forwards;
  }

  .grind-glow.revealing {
    animation: glowFadeOut 800ms ease-out forwards;
  }

  .mortar-transition-mask {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .mortar-transition-mask.darkening {
    animation: mortarDarken 360ms ease-out forwards;
  }

  .mortar-transition-mask.revealing {
    animation: mortarReveal 800ms ease-out forwards;
  }

  .pestle-motion {
    position: absolute;
    left: calc(50% + 40px);
    top: 40%;
    width: 140px;
    height: 140px;
    transform: translate(-50%, -50%);
    animation: ovalMotion 1800ms ease-in-out infinite;
    pointer-events: none;
  }

  .pestle-image {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 300px;
    height: 300px;
    object-fit: contain;
    transform: translate(-50%, -50%) rotate(28deg);
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.42));
    opacity: 0.95;
  }

  @keyframes ovalMotion {
    0% { transform: translate(-50%, -50%) translate(53px, 0); }
    3.125% { transform: translate(-50%, -50%) translate(52px, 5px); }
    6.25% { transform: translate(-50%, -50%) translate(49px, 10px); }
    9.375% { transform: translate(-50%, -50%) translate(44px, 14px); }
    12.5% { transform: translate(-50%, -50%) translate(38px, 17px); }
    15.625% { transform: translate(-50%, -50%) translate(30px, 20px); }
    18.75% { transform: translate(-50%, -50%) translate(21px, 23px); }
    21.875% { transform: translate(-50%, -50%) translate(13px, 25px); }
    25% { transform: translate(-50%, -50%) translate(5px, 27px); }
    28.125% { transform: translate(-50%, -50%) translate(-3px, 25px); }
    31.25% { transform: translate(-50%, -50%) translate(-11px, 23px); }
    34.375% { transform: translate(-50%, -50%) translate(-20px, 20px); }
    37.5% { transform: translate(-50%, -50%) translate(-28px, 17px); }
    40.625% { transform: translate(-50%, -50%) translate(-34px, 14px); }
    43.75% { transform: translate(-50%, -50%) translate(-39px, 10px); }
    46.875% { transform: translate(-50%, -50%) translate(-42px, 5px); }
    50% { transform: translate(-50%, -50%) translate(-43px, 0); }
    53.125% { transform: translate(-50%, -50%) translate(-42px, -5px); }
    56.25% { transform: translate(-50%, -50%) translate(-39px, -10px); }
    59.375% { transform: translate(-50%, -50%) translate(-34px, -14px); }
    62.5% { transform: translate(-50%, -50%) translate(-28px, -17px); }
    65.625% { transform: translate(-50%, -50%) translate(-20px, -20px); }
    68.75% { transform: translate(-50%, -50%) translate(-11px, -23px); }
    71.875% { transform: translate(-50%, -50%) translate(-3px, -25px); }
    75% { transform: translate(-50%, -50%) translate(5px, -27px); }
    78.125% { transform: translate(-50%, -50%) translate(13px, -25px); }
    81.25% { transform: translate(-50%, -50%) translate(21px, -23px); }
    84.375% { transform: translate(-50%, -50%) translate(30px, -20px); }
    87.5% { transform: translate(-50%, -50%) translate(38px, -17px); }
    90.625% { transform: translate(-50%, -50%) translate(44px, -14px); }
    93.75% { transform: translate(-50%, -50%) translate(49px, -10px); }
    96.875% { transform: translate(-50%, -50%) translate(52px, -5px); }
    100% { transform: translate(-50%, -50%) translate(53px, 0); }
  }

  @keyframes glowPulse {
    0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.97); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1.14); }
  }

  @keyframes mortarDarken {
    0% { background: rgba(0, 0, 0, 0); }
    100% { background: rgba(0, 0, 0, 0.62); }
  }

  @keyframes mortarReveal {
    0% { background: rgba(0, 0, 0, 0.62); }
    100% { background: rgba(0, 0, 0, 0); }
  }

  @keyframes glowFadeWithDarken {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
    100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.02); }
  }

  @keyframes glowFadeOut {
    0% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.02); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.98); }
  }
</style>
