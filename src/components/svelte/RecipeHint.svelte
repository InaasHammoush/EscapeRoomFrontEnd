<svelte:options customElement="recipe-hint-widget" />

<script>
  import { onDestroy } from "svelte";
  import chestClosedImg from "../../assets/wizard_library/chest_closed.png";
  import chestWithKeyImg from "../../assets/wizard_library/chest_with_key.png";
  import chestOpenedImg from "../../assets/wizard_library/chest_opened.png";
  import recipeImg from "../../assets/wizard_library/recipe.png";

  export let puzzle = null;
  export let inventory = [];

  let keyInsertAnimating = false;
  let openPulse = false;
  let keyInsertEmitTimer = null;
  let keyInsertEndTimer = null;
  let openPulseTimer = null;
  let prevUnlocked = false;
  const KEY_INSERT_EMIT_MS = 650;
  const KEY_INSERT_VISUAL_MS = 1300;

  $: unlocked = Boolean(puzzle?.unlocked);
  $: recipeTaken = Boolean(puzzle?.recipeTaken);
  $: hasChestKey = Array.isArray(inventory) && inventory.some((entry) => {
    const name = String(entry?.item || "").trim().toUpperCase().replace(/\s+/g, "_");
    return name === "CHEST_KEY" && Number(entry?.count || 0) > 0;
  });

  $: if (unlocked && !prevUnlocked) {
    startOpenPulse();
  }
  $: prevUnlocked = unlocked;

  function normalizeItem(raw) {
    return String(raw || "").trim().toUpperCase().replace(/\s+/g, "_");
  }

  function clearTimers() {
    if (keyInsertEmitTimer) {
      clearTimeout(keyInsertEmitTimer);
      keyInsertEmitTimer = null;
    }
    if (keyInsertEndTimer) {
      clearTimeout(keyInsertEndTimer);
      keyInsertEndTimer = null;
    }
    if (openPulseTimer) {
      clearTimeout(openPulseTimer);
      openPulseTimer = null;
    }
  }

  function startOpenPulse() {
    openPulse = true;
    if (openPulseTimer) clearTimeout(openPulseTimer);
    openPulseTimer = setTimeout(() => {
      openPulse = false;
      openPulseTimer = null;
    }, 500);
  }

  function handleDragOver(event) {
    if (!unlocked) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    if (unlocked || keyInsertAnimating) return;

    const invItem =
      normalizeItem(event.dataTransfer.getData("application/x-inventory-item")) ||
      normalizeItem(event.dataTransfer.getData("text/plain"));

    if (invItem !== "CHEST_KEY" || !hasChestKey) return;

    keyInsertAnimating = true;
    if (keyInsertEmitTimer) clearTimeout(keyInsertEmitTimer);
    if (keyInsertEndTimer) clearTimeout(keyInsertEndTimer);

    keyInsertEmitTimer = setTimeout(() => {
      emitAction("PLACE", { item: "CHEST_KEY" });
      keyInsertEmitTimer = null;
    }, KEY_INSERT_EMIT_MS);

    keyInsertEndTimer = setTimeout(() => {
      keyInsertAnimating = false;
      keyInsertEndTimer = null;
    }, KEY_INSERT_VISUAL_MS);
  }

  function takeRecipe() {
    if (!unlocked || recipeTaken) return;
    emitAction("TAKE", { item: "RECIPE" });
  }

  function emitAction(verb, data = {}) {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: { objectId: "puzzle_recipe_hint", verb, data },
      bubbles: true,
      composed: true
    }));
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: { objectId: "trigger_wiz_hint_recipe", verb: "CLOSE" },
      bubbles: true,
      composed: true
    }));
  }

  onDestroy(() => {
    clearTimers();
  });
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>x</button>

    <div class="chest-zone" on:dragover={handleDragOver} on:drop={handleDrop}>
      <img
        src={chestClosedImg}
        alt="Chest closed"
        class="chest-img chest-closed"
        class:hidden={unlocked}
      />
      <img
        src={chestOpenedImg}
        alt="Chest opened"
        class="chest-img chest-opened"
        class:visible={unlocked}
        class:opening={openPulse}
      />
      <img
        src={chestWithKeyImg}
        alt="Chest with key"
        class="chest-img chest-with-key"
        class:visible={keyInsertAnimating && !unlocked}
      />

      {#if unlocked && !recipeTaken}
        <img
          src={recipeImg}
          alt="Recipe"
          class="recipe-item"
          on:click={takeRecipe}
          draggable="false"
        />
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    z-index: 50;
  }

  .widget-wrapper {
    position: relative;
    width: min(68vw, 720px);
    aspect-ratio: 4/3;
    border-radius: 8px;
    overflow: visible;
    box-shadow: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.8);
    color: #f4e4bc;
    border: 2px solid #8b7355;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    transition: transform 0.2s;
  }

  .close-btn:hover {
    background: black;
    transform: scale(1.1);
  }

  .chest-zone {
    position: relative;
    width: 100%;
    max-width: 720px;
    aspect-ratio: 4/3;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chest-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
    opacity: 0;
    transition: opacity 950ms ease;
  }

  .chest-closed {
    opacity: 1;
    z-index: 1;
  }

  .chest-closed.hidden {
    opacity: 0;
  }

  .chest-opened {
    z-index: 2;
  }

  .chest-opened.visible {
    opacity: 1;
  }

  .chest-with-key {
    z-index: 3;
    transition: opacity 520ms ease;
  }

  .chest-with-key.visible {
    opacity: 1;
  }

  .chest-img.opening {
    animation: chestOpenPulse 500ms ease-out;
  }

  .recipe-item {
    position: absolute;
    z-index: 4;
    width: 10%;
    min-width: 72px;
    left: 51%;
    top: 60%;
    transform: translate(-50%, -50%) rotate(90deg);
    cursor: pointer;
    filter: drop-shadow(0 6px 7px rgba(0, 0, 0, 0.8));
    transition: filter 0.2s ease;
  }

  .recipe-item:hover {
    filter: drop-shadow(0 0 12px rgba(255, 220, 145, 0.9));
  }

  @keyframes chestOpenPulse {
    0% {
      transform: scale(0.985);
      filter: brightness(0.88);
    }
    45% {
      transform: scale(1.015);
      filter: brightness(1.08);
    }
    100% {
      transform: scale(1);
      filter: brightness(1);
    }
  }
</style>
