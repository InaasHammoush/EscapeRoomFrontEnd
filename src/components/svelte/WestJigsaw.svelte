<svelte:options customElement="west-jigsaw-widget" />

<script>
  import { onDestroy, onMount, tick } from "svelte";
  import boxClosedImg from "../../assets/alchemist/box_closed.png";
  import boxOpenImg from "../../assets/alchemist/box_open.png";
  import burningRoseImg from "../../assets/alchemist/burningrose_whole.png";

  export let puzzle = null;
  export let inventory = [];

  let codeInput = "";
  let codeInputEl;
  let localTiles = [];
  let lastTilesSignature = "";
  let wasUnlocked = false;
  let wasAttempts = 0;
  let displayBoxImage = boxClosedImg;
  let darkening = false;
  let revealing = false;
  let darkenTimer = null;
  let revealTimer = null;
  let awaitingCodeResult = false;
  let codeResponseTimer = null;
  let localUnlockedFallback = false;
  let submittedCode = "";
  let draggedIndex = -1;
  let hideJigsaw = false;
  let jigsawFading = false;
  let jigsawFadeTimer = null;
  let roseRewardSent = false;
  let localSolveSyncSent = false;

  const DARKEN_MS = 160;
  const REVEAL_MS = 260;
  const CODE_RESPONSE_WAIT_MS = 300;

  $: size = Number(puzzle?.jigsaw?.size || 3);
  $: unlocked = Boolean(puzzle?.code?.unlocked);
  $: effectiveUnlocked = unlocked || localUnlockedFallback;
  $: solved = Boolean(puzzle?.jigsaw?.solved || puzzle?.solved);
  $: localSolved =
    Array.isArray(localTiles) &&
    localTiles.length === size * size &&
    localTiles.every((v, i) => (i === (size * size - 1) ? v === 0 : v === i + 1));
  $: hasRoseInInventory = Array.isArray(inventory) &&
    inventory.some((entry) => String(entry?.item || "").trim().toUpperCase() === "BURNINGROSE_WHOLE");
  $: roseReady = Boolean(puzzle?.output?.blueRoseImageReady) || solved || localSolved || hasRoseInInventory;
  $: shouldHideJigsaw = roseReady && hasRoseInInventory;
  $: attempts = Number(puzzle?.code?.attempts || 0);
  $: lastCodeOk = puzzle?.code?.lastCodeOk;
  $: serverTiles = Array.isArray(puzzle?.jigsaw?.tiles) ? puzzle.jigsaw.tiles : [];
  $: codeSlots = Array.from({ length: 7 }, (_, i) => codeInput[i] || "_");
  $: targetBoxImage = effectiveUnlocked ? boxOpenImg : boxClosedImg;
  $: showLockedUi = !effectiveUnlocked || darkening;
  $: showJigsawUi = effectiveUnlocked && !darkening && !hideJigsaw;
  $: {
    const sig = serverTiles.join(",");
    if (sig && sig !== lastTilesSignature) {
      localTiles = [...serverTiles];
      lastTilesSignature = sig;
    }
  }
  $: if (!unlocked && wasUnlocked) tick().then(focusCodeInput);
  $: if (attempts !== wasAttempts) {
    if (awaitingCodeResult) {
      awaitingCodeResult = false;
      if (codeResponseTimer) {
        clearTimeout(codeResponseTimer);
        codeResponseTimer = null;
      }
      if (!unlocked && lastCodeOk === false) {
        localUnlockedFallback = false;
        codeInput = "";
        tick().then(focusCodeInput);
      }
    }
    wasAttempts = attempts;
  }
  $: if (targetBoxImage !== displayBoxImage && !darkening && !revealing) {
    startImageTransition(targetBoxImage);
  }
  $: wasUnlocked = unlocked;
  $: if (shouldHideJigsaw && !hideJigsaw && !jigsawFading) {
    jigsawFading = true;
    if (jigsawFadeTimer) clearTimeout(jigsawFadeTimer);
    jigsawFadeTimer = setTimeout(() => {
      hideJigsaw = true;
      jigsawFading = false;
      jigsawFadeTimer = null;
    }, 260);
  }
  $: if (!shouldHideJigsaw) {
    if (jigsawFadeTimer) {
      clearTimeout(jigsawFadeTimer);
      jigsawFadeTimer = null;
    }
    hideJigsaw = false;
    jigsawFading = false;
  }
  $: if (!roseReady) roseRewardSent = false;
  $: if (!localSolved) localSolveSyncSent = false;
  $: if (localSolved && !solved && !localSolveSyncSent) {
    localSolveSyncSent = true;
    emitIntent("alch:west-jigsaw", "set_layout", { tiles: localTiles });
  }
  $: if (roseReady && !hasRoseInInventory && !roseRewardSent) {
    roseRewardSent = true;
    // Same pattern as mortar blue liquid: emit a take intent, let inventoryAdapter apply optimistic add.
    emitIntent("alch:west-jigsaw", "take", { item: "BURNINGROSE_WHOLE" });
  }

  function emitIntent(objectId, verb, data = {}) {
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: { objectId, verb, data },
        bubbles: true,
        composed: true
      })
    );
  }

  function close() {
    emitIntent("alch:west-codebox", "CLOSE");
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) close();
  }

  function handleOverlayKeydown(e) {
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      close();
    }
  }

  function submitCode() {
    if (awaitingCodeResult || effectiveUnlocked) return;
    const code = String(codeInput || "").replace(/\D/g, "").slice(0, 7);
    if (code.length !== 7) return;
    submittedCode = code;
    awaitingCodeResult = true;
    emitIntent("alch:west-codebox", "enter_code", { code });
    if (codeResponseTimer) {
      clearTimeout(codeResponseTimer);
      codeResponseTimer = null;
    }
    codeResponseTimer = setTimeout(() => {
      // Fallback: some routers may bind this puzzle to west-jigsaw only.
      if (awaitingCodeResult && !unlocked) {
        emitIntent("alch:west-jigsaw", "enter_code", { code });
      }
      codeResponseTimer = setTimeout(() => {
        // Do not lock the input forever if no backend response arrives.
        if (awaitingCodeResult) {
          if (!unlocked && submittedCode === "2848693") {
            // Temporary resilience: keep gameplay moving if backend route is missing.
            localUnlockedFallback = true;
          }
          awaitingCodeResult = false;
          tick().then(focusCodeInput);
        }
        codeResponseTimer = null;
      }, CODE_RESPONSE_WAIT_MS);
    }, CODE_RESPONSE_WAIT_MS);
  }

  function focusCodeInput() {
    if (!codeInputEl || effectiveUnlocked) return;
    codeInputEl.focus();
  }

  function onCodeInput(e) {
    codeInput = String(e?.currentTarget?.value || "").replace(/\D/g, "").slice(0, 7);
    if (codeInput.length === 7) submitCode();
  }

  function clearTransitionTimers() {
    if (darkenTimer) {
      clearTimeout(darkenTimer);
      darkenTimer = null;
    }
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
    if (codeResponseTimer) {
      clearTimeout(codeResponseTimer);
      codeResponseTimer = null;
    }
    if (jigsawFadeTimer) {
      clearTimeout(jigsawFadeTimer);
      jigsawFadeTimer = null;
    }
  }

  function startImageTransition(nextImage) {
    clearTransitionTimers();
    darkening = true;
    revealing = false;
    darkenTimer = setTimeout(() => {
      displayBoxImage = nextImage;
      darkening = false;
      revealing = true;
      darkenTimer = null;

      revealTimer = setTimeout(() => {
        revealing = false;
        revealTimer = null;
      }, REVEAL_MS);
    }, DARKEN_MS);
  }

  function canSwap(fromIndex, toIndex) {
    if (!Array.isArray(localTiles) || localTiles.length !== size * size) return false;
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return false;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= localTiles.length || toIndex >= localTiles.length) return false;
    if (fromIndex === toIndex) return false;
    return true;
  }

  function swapTiles(fromIndex, toIndex) {
    if (!effectiveUnlocked || solved || roseReady) return;
    if (!canSwap(fromIndex, toIndex)) return;
    const next = [...localTiles];
    [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
    localTiles = next;
    emitIntent("alch:west-jigsaw", "set_layout", { tiles: next });
  }

  function onTileDragStart(e, index) {
    if (!effectiveUnlocked || solved || roseReady) {
      e.preventDefault();
      return;
    }
    draggedIndex = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function onTileDragEnd() {
    draggedIndex = -1;
  }

  function onCellDragOver(e, targetIndex) {
    if (!effectiveUnlocked || solved || roseReady) return;
    if (!canSwap(draggedIndex, targetIndex)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onCellDrop(e, targetIndex) {
    if (!effectiveUnlocked || solved || roseReady) return;
    e.preventDefault();
    let idx = draggedIndex;
    if (idx < 0) {
      const raw = e.dataTransfer.getData("text/plain");
      idx = Number(raw);
    }
    if (canSwap(idx, targetIndex)) swapTiles(idx, targetIndex);
    draggedIndex = -1;
  }

  function tileBgStyle(tileNumber) {
    const effectiveTile = tileNumber === 0 ? (size * size) : tileNumber;
    if (!effectiveTile || effectiveTile <= 0) return "";
    const i = effectiveTile - 1;
    const row = Math.floor(i / size);
    const col = i % size;
    const posX = size > 1 ? (col * 100) / (size - 1) : 0;
    const posY = size > 1 ? (row * 100) / (size - 1) : 0;
    return `
      background-image: url(${burningRoseImg});
      background-size: ${size * 100}% ${size * 100}%;
      background-position: ${posX}% ${posY}%;
    `;
  }

  function onCodeKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      submitCode();
    }
  }

  function onCodeOverlayKeydown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      focusCodeInput();
    }
  }

  onMount(() => {
    displayBoxImage = targetBoxImage;
    tick().then(focusCodeInput);
  });

  onDestroy(() => {
    clearTransitionTimers();
  });
</script>

<div
  class="overlay"
  role="button"
  tabindex="0"
  aria-label="Close west jigsaw widget"
  on:click={handleOverlayClick}
  on:keydown={handleOverlayKeydown}
>
  <div class="widget">
    <button class="close-btn" on:click={close}>x</button>
    <div class="display">
      <img src={displayBoxImage} alt="West code box" class="bg" class:open={displayBoxImage === boxOpenImg} />
      {#if darkening || revealing}
        <div
          class="box-transition-mask"
          class:darkening
          class:revealing
          aria-hidden="true"
        ></div>
      {/if}

      {#if showLockedUi}
        <div
          class="code-overlay"
          role="button"
          tabindex="0"
          aria-label="Focus code input"
          on:click={focusCodeInput}
          on:keydown={onCodeOverlayKeydown}
        >
          <input
            class="code-capture"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="7"
            bind:this={codeInputEl}
            bind:value={codeInput}
            on:input={onCodeInput}
            on:keydown={onCodeKeydown}
            aria-label="Enter the 7-digit code"
          />
          <div class="code-slots" aria-hidden="true">
            {#each codeSlots as slot}
              <span class="slot" class:placeholder={slot === "_"}>{slot}</span>
            {/each}
          </div>
        </div>
        <div class="panel panel-status">
          {#if lastCodeOk === false}
            <div class="status bad">Wrong code</div>
          {/if}
          {#if attempts > 0}
            <div class="attempts">Attempts: {attempts}</div>
          {/if}
        </div>
      {:else if showJigsawUi}
        <div class="jigsaw-overlay" class:fading={jigsawFading} aria-label="Burning rose jigsaw">
          <div class="jigsaw-grid" style={`--size:${size}`}>
            {#each localTiles as tile, i}
                <button
                  class="jigsaw-tile"
                  class:zero-tile={tile === 0}
                  class:drop-ready={draggedIndex >= 0 && canSwap(draggedIndex, i) && !solved && !roseReady}
                  disabled={solved || roseReady}
                  draggable={!solved && !roseReady}
                  style={tileBgStyle(tile)}
                on:dragover={(e) => onCellDragOver(e, i)}
                on:drop={(e) => onCellDrop(e, i)}
                on:dragstart={(e) => onTileDragStart(e, i)}
                on:dragend={onTileDragEnd}
                aria-label={`Tile ${tile === 0 ? "empty-marker" : tile}`}
              ></button>
            {/each}
          </div>
        </div>
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

  .widget {
    position: relative;
    width: min(88vw, 560px);
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
    z-index: 3;
  }

  .display {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    overflow: visible;
  }

  .bg {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .bg.open {
    transform: scale(1.12);
    transform-origin: center;
  }

  .panel {
    position: absolute;
    left: 50%;
    top: 54%;
    transform: translate(-50%, -50%);
    width: min(72%, 370px);
    background: rgba(18, 12, 9, 0.72);
    border: 1px solid rgba(198, 163, 113, 0.65);
    border-radius: 10px;
    padding: 12px;
    color: #fcfcfc;
    text-align: center;
  }

  .panel.panel-status {
    background: transparent;
    border: 0;
    top: 68%;
    padding-top: 0;
  }

  .code-overlay {
    position: absolute;
    left: 48%;
    top: calc(49% - 10px);
    transform: translate(-50%, -50%);
    width: min(28%, 130px);
    height: 68px;
    cursor: text;
    z-index: 2;
  }

  .code-capture {
    position: absolute;
    inset: 0;
    opacity: 0;
    border: 0;
    background: transparent;
  }

  .code-slots {
    height: 100%;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0;
    align-items: center;
  }

  .slot {
    text-align: center;
    font-size: clamp(18px, 2.3vw, 24px);
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
    user-select: none;
  }

  .slot.placeholder {
    color: transparent;
    text-shadow: none;
  }

  .box-transition-mask {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }

  .box-transition-mask.darkening {
    animation: westBoxDarken 160ms ease-out forwards;
  }

  .box-transition-mask.revealing {
    animation: westBoxReveal 260ms ease-out forwards;
  }

  .jigsaw-overlay {
    position: absolute;
    left: 50%;
    top: 55%;
    transform: translate(-50%, -50%);
    width: min(52%, 280px);
    height: min(44%, 235px);
    z-index: 2;
    opacity: 1;
    transition: opacity 260ms ease;
  }

  .jigsaw-overlay.fading {
    opacity: 0;
  }

  .jigsaw-grid {
    --size: 3;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(var(--size), 1fr);
    gap: 0;
    padding: 0;
    border-radius: 0;
    background: transparent;
  }

  .jigsaw-tile {
    border: 0;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-color: transparent;
    cursor: pointer;
    position: relative;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    border-radius: 0;
  }

  .jigsaw-tile.zero-tile {
    opacity: 0.9;
  }

  .jigsaw-tile.drop-ready {
    filter: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }

  .jigsaw-tile:disabled {
    cursor: default;
  }

  .jigsaw-tile::after {
    content: none;
  }

  .status {
    margin-top: 8px;
    font-size: 14px;
  }

  .status.bad {
    color: #ff9a80;
  }

  .attempts {
    margin-top: 6px;
    font-size: 13px;
    opacity: 0.9;
  }

  @keyframes westBoxDarken {
    0% { background: rgba(0, 0, 0, 0); }
    100% { background: rgba(0, 0, 0, 0.62); }
  }

  @keyframes westBoxReveal {
    0% { background: rgba(0, 0, 0, 0.62); }
    100% { background: rgba(0, 0, 0, 0); }
  }

  @media (max-width: 640px) {
    .panel {
      width: min(84%, 330px);
      top: 56%;
    }

    .panel.panel-status {
      top: 70%;
    }

    .code-overlay {
      width: min(62%, 240px);
      top: 50%;
      height: 36px;
    }

    .jigsaw-overlay {
      top: 56%;
      width: min(56%, 210px);
      height: min(44%, 165px);
    }
  }
</style>
