<svelte:options customElement="transformation-table-widget" />

<script>
  import { onDestroy } from "svelte";
  // --- ASSETS ---
  import tableBg from "../../assets/wizard_library/table_top.png";
  import whiteRoseImg from "../../assets/wizard_library/white_rose.png";
  import blueRoseImg from "../../assets/wizard_library/blue_rose.png";
  import ashesImg from "../../assets/wizard_library/ashes.png";
  import ashesWithKeyImg from "../../assets/wizard_library/ashes_with_key.png";
  
  // Scraps
  import scrapFlamma from "../../assets/wizard_library/scrap_flamma.png";
  import scrapPurificat from "../../assets/wizard_library/scrap_purificat.png";
  import scrapAbsolvo from "../../assets/wizard_library/scrap_absolvo.png";
  import scrapComburo from "../../assets/wizard_library/scrap_comburo.png";
  import scrapFervor from "../../assets/wizard_library/scrap_fervor.png";
  import scrapIgnes from "../../assets/wizard_library/scrap_ignes.png";
  import scrapMundo from "../../assets/wizard_library/scrap_mundo.png";
  import scrapSanctus from "../../assets/wizard_library/scrap_sanctus.png";

  export let puzzle = null;
  let placedScraps = []; // Holds max 2 scraps currently resting on the plate
  let sprinkleAnimating = false;
  let fireAnimating = false;
  let sprinkleEmitTimer = null;
  let sprinkleEndTimer = null;
  let combineEmitTimer = null;
  let combineEndTimer = null;
  let combineResetTimer = null;
  const REQUIRED_SCRAPS = ["Flamma", "Purificat"];

  // --- REACTIVE BACKEND STATE ---
  $: itemOnPlate = puzzle?.itemOnPlate || null;
  $: powderApplied = puzzle?.powderApplied || false;
  $: hasKey = puzzle?.hasKey || false;
  $: keyTaken = puzzle?.keyTaken || false;
  $: solved = puzzle?.solved || false;
  $: if ((solved || itemOnPlate === "ASHES") && placedScraps.length) {
    placedScraps = [];
  }

  // Define all 8 scraps with their starting positions on the table
  const allScraps = [
    { id: "Flamma", src: scrapFlamma, top: "12%", left: "15%", rot: -15 },
    { id: "Purificat", src: scrapPurificat, top: "30%", left: "76%", rot: 25 },
    { id: "Absolvo", src: scrapAbsolvo, top: "70%", left: "12%", rot: -5 },
    { id: "Comburo", src: scrapComburo, top: "72%", left: "75%", rot: 10 },
    { id: "Fervor", src: scrapFervor, top: "33%", left: "11%", rot: 45 },
    { id: "Ignes", src: scrapIgnes, top: "52%", left: "75%", rot: -20 },
    { id: "Mundo", src: scrapMundo, top: "50%", left: "9%", rot: 5 },
    { id: "Sanctus", src: scrapSanctus, top: "11%", left: "72%", rot: 18 }
  ];

  // --- DRAG & DROP HANDLERS ---
  function handleDragStartScrap(e, scrapId) {
    if (solved || fireAnimating) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-scrap-item", scrapId);
  }

  function handleDragOver(e) {
    if (solved) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e) {
    e.preventDefault();
    if (solved || fireAnimating || sprinkleAnimating) return;

    // 1. Check if it's an INVENTORY item (from your generic InventoryBar)
    const invItem = e.dataTransfer.getData("text/plain");
    
    if (invItem === "WHITE_ROSE") {
      emitAction("PLACE", { item: "WHITE_ROSE" });
      return;
    } 
    
    if (invItem === "BLUE_POWDER") {
      if (itemOnPlate !== "WHITE_ROSE" || powderApplied) return;
      startSprinkleAnimation();
      return;
    }

    // 2. Check if it's a LOCAL SCRAP from the table
    const scrapId = e.dataTransfer.getData("application/x-scrap-item");
    if (scrapId && itemOnPlate === "BLUE_ROSE") {
      // Only allow 2 scraps on the plate at a time
      if (placedScraps.length < 2 && !placedScraps.includes(scrapId)) {
        placedScraps = [...placedScraps, scrapId];

        // If we just placed the second scrap, tell the server to combine!
        if (placedScraps.length === 2) {
          const scrapA = placedScraps[0];
          const scrapB = placedScraps[1];

          if (isCorrectScrapCombo(scrapA, scrapB)) {
            startBurnAnimationAndCombine(scrapA, scrapB);
          } else {
            emitAction("COMBINE", { scrapA, scrapB });
            setTimeout(() => {
              if (!puzzle?.solved) placedScraps = [];
            }, 800);
          }
        }
      }
    }
  }

  function clearAnimTimers() {
    if (sprinkleEmitTimer) clearTimeout(sprinkleEmitTimer);
    if (sprinkleEndTimer) clearTimeout(sprinkleEndTimer);
    if (combineEmitTimer) clearTimeout(combineEmitTimer);
    if (combineEndTimer) clearTimeout(combineEndTimer);
    if (combineResetTimer) clearTimeout(combineResetTimer);
    sprinkleEmitTimer = null;
    sprinkleEndTimer = null;
    combineEmitTimer = null;
    combineEndTimer = null;
    combineResetTimer = null;
  }

  function startSprinkleAnimation() {
    sprinkleAnimating = true;

    // Let the powder visual play before the server transforms the rose.
    sprinkleEmitTimer = setTimeout(() => {
      emitAction("SPRINKLE", { item: "BLUE_POWDER" });
      sprinkleEmitTimer = null;
    }, 550);

    sprinkleEndTimer = setTimeout(() => {
      sprinkleAnimating = false;
      sprinkleEndTimer = null;
    }, 1000);
  }

  function startBurnAnimationAndCombine(scrapA, scrapB) {
    fireAnimating = true;

    // Send COMBINE after a short burn-up phase.
    combineEmitTimer = setTimeout(() => {
      emitAction("COMBINE", { scrapA, scrapB });
      combineEmitTimer = null;
    }, 850);

    combineEndTimer = setTimeout(() => {
      fireAnimating = false;
      combineEndTimer = null;
    }, 1300);

    // If the combination is wrong, return scraps to the table.
    combineResetTimer = setTimeout(() => {
      if (!puzzle?.solved) placedScraps = [];
      combineResetTimer = null;
    }, 1700);
  }

  function isCorrectScrapCombo(scrapA, scrapB) {
    return (
      (scrapA === REQUIRED_SCRAPS[0] && scrapB === REQUIRED_SCRAPS[1]) ||
      (scrapA === REQUIRED_SCRAPS[1] && scrapB === REQUIRED_SCRAPS[0])
    );
  }

  function takeKey() {
    if (hasKey && !keyTaken) {
      emitAction("TAKE", {});
    }
  }

  // --- SOCKET INTENTS ---
  function emitAction(verb, data = {}) {
    const event = new CustomEvent('intent', {
      detail: { objectId: 'puzzle_transformation_table', verb, data },
      bubbles: true, composed: true
    });
    document.dispatchEvent(event);
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'puzzle_transformation_table', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }

  onDestroy(() => {
    clearAnimTimers();
  });
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="table-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>✕</button>

    <img src={tableBg} alt="Transformation Table" class="table-bg" />

    <div 
      class="plate-zone"
      class:glow={itemOnPlate === 'BLUE_ROSE' && placedScraps.length < 2}
      on:dragover={handleDragOver}
      on:drop={handleDrop}
      on:click={takeKey}
    >
      {#if itemOnPlate === "WHITE_ROSE"}
        <img src={whiteRoseImg} alt="White Rose" class="center-item" class:powdering={sprinkleAnimating} />
      {:else if itemOnPlate === "BLUE_ROSE"}
        <img src={blueRoseImg} alt="Blue Rose" class="center-item pulse" />
      {:else if itemOnPlate === "ASHES" && !keyTaken}
        <img src={ashesWithKeyImg} alt="Ashes and Key" class="center-item key-item" />
      {:else if itemOnPlate === "ASHES" && keyTaken}
        <img src={ashesImg} alt="Ashes" class="center-item" />
      {/if}

      {#each placedScraps as scrapId, i}
        {@const scrapDef = allScraps.find(s => s.id === scrapId)}
        <img 
          src={scrapDef.src} 
          alt={scrapDef.id} 
          class="placed-scrap"
          class:burning={fireAnimating}
          style="transform: rotate({i === 0 ? -10 : 15}deg); margin-left: {i === 0 ? -30 : 30}px;"
        />
      {/each}

      {#if sprinkleAnimating}
        <div class="powder-fx" aria-hidden="true"></div>
      {/if}
      {#if fireAnimating}
        <div class="fire-fx" aria-hidden="true"></div>
      {/if}
    </div>

    {#each allScraps as scrap}
      {#if !placedScraps.includes(scrap.id) && !solved}
        <img 
          src={scrap.src} 
          alt={scrap.id} 
          class="scattered-scrap"
          style="top: {scrap.top}; left: {scrap.left}; transform: rotate({scrap.rot}deg);"
          draggable="true"
          on:dragstart={(e) => handleDragStartScrap(e, scrap.id)}
        />
      {/if}
    {/each}

  </div>
</div>

<style>
  .modal-overlay {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(4px); z-index: 50;
  }
  .table-wrapper {
    position: relative; height: 90vh; aspect-ratio: 16/10; max-width: 95vw;
    display: flex; justify-content: center; align-items: center;
    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  }
  .table-bg { width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; }
  .close-btn {
    position: absolute; top: 15px; right: 15px; width: 40px; height: 40px;
    border-radius: 50%; background: rgba(0, 0, 0, 0.8); color: #f4e4bc; border: 2px solid #8b7355;
    cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; z-index: 20;
  }
  .close-btn:hover { background: black; transform: scale(1.1); }

  /* THE CENTER PLATE */
  .plate-zone {
    position: absolute;
    top: 47%; left: 50%;
    transform: translate(-50%, -50%);
    width: 39%; height: 50%;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    /* Uncomment below to see the drop zone bounds while debugging! */
    /* border: 2px solid rgba(255,0,0,0.3); */
  }
  .plate-zone.glow { box-shadow: inset 0 0 50px rgba(100, 200, 255, 0.3); }

  .center-item {
    position: absolute; width: auto; height: 55%; max-width: 70%; max-height: 70%;
    object-fit: contain; pointer-events: none;
    filter: drop-shadow(0 10px 10px rgba(0,0,0,0.6));
  }
  .center-item.powdering {
    animation: powderTint 0.9s ease-in-out;
  }
  .pulse { animation: pulseGlow 2s infinite alternate; }
  .key-item { cursor: pointer; pointer-events: auto; width: 45%; }
  .key-item:hover { filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)); transform: scale(1.05); transition: 0.2s;}

  /* PLACED SCRAPS (On the plate) */
  .placed-scrap {
    position: absolute; width: auto; height: 24%; max-width: 28%; max-height: 28%;
    object-fit: contain; pointer-events: none;
    filter: drop-shadow(0 5px 5px rgba(0,0,0,0.8)); transition: all 0.3s ease; z-index: 2;
  }
  .placed-scrap.burning {
    animation: scrapIgnite 1.2s ease-out forwards;
  }

  .powder-fx {
    position: absolute;
    width: 72%;
    height: 72%;
    border-radius: 50%;
    pointer-events: none;
    z-index: 5;
    background:
      radial-gradient(circle at 30% 35%, rgba(120, 190, 255, 0.95) 0 4%, transparent 6%),
      radial-gradient(circle at 60% 28%, rgba(100, 170, 255, 0.95) 0 5%, transparent 7%),
      radial-gradient(circle at 42% 58%, rgba(120, 200, 255, 0.9) 0 6%, transparent 8%),
      radial-gradient(circle at 70% 62%, rgba(150, 220, 255, 0.9) 0 4%, transparent 6%),
      radial-gradient(circle at 48% 42%, rgba(90, 150, 255, 0.25) 0 26%, transparent 42%);
    animation: powderSprinkle 1s ease-out forwards;
    filter: drop-shadow(0 0 10px rgba(90, 170, 255, 0.55));
  }

  .fire-fx {
    position: absolute;
    inset: 20%;
    border-radius: 50%;
    pointer-events: none;
    z-index: 6;
    background:
      radial-gradient(ellipse at 50% 88%, rgba(255, 235, 140, 0.95) 0 22%, transparent 46%),
      radial-gradient(ellipse at 38% 88%, rgba(255, 160, 60, 0.9) 0 24%, transparent 50%),
      radial-gradient(ellipse at 62% 85%, rgba(255, 120, 40, 0.85) 0 22%, transparent 48%),
      radial-gradient(ellipse at 50% 75%, rgba(255, 70, 20, 0.65) 0 26%, transparent 56%);
    filter: blur(1px) drop-shadow(0 0 18px rgba(255, 120, 30, 0.8));
    animation: fireBurst 1.25s ease-out forwards;
  }

  /* SCATTERED SCRAPS (On the table) */
  .scattered-scrap {
    position: absolute; width: 12%; height: auto; object-fit: contain;
    cursor: grab; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transition: transform 0.2s ease;
  }
  .scattered-scrap:hover { filter: brightness(1.2) drop-shadow(0 8px 10px rgba(0,0,0,0.7)); z-index: 10; transform: scale(1.1) !important; }
  .scattered-scrap:active { cursor: grabbing; }

  @keyframes pulseGlow {
    0% { filter: drop-shadow(0 0 10px rgba(100, 150, 255, 0.5)); }
    100% { filter: drop-shadow(0 0 30px rgba(100, 200, 255, 0.9)); }
  }

  @keyframes powderTint {
    0%   { filter: drop-shadow(0 10px 10px rgba(0,0,0,0.6)) saturate(1); }
    45%  { filter: drop-shadow(0 0 18px rgba(90, 170, 255, 0.85)) saturate(1.25); }
    100% { filter: drop-shadow(0 10px 10px rgba(0,0,0,0.6)) saturate(1); }
  }

  @keyframes powderSprinkle {
    0%   { opacity: 0; transform: translateY(-18%) scale(0.86); }
    20%  { opacity: 1; }
    70%  { opacity: 0.95; transform: translateY(4%) scale(1.02); }
    100% { opacity: 0; transform: translateY(12%) scale(1.08); }
  }

  @keyframes scrapIgnite {
    0%   { filter: drop-shadow(0 5px 5px rgba(0,0,0,0.8)) brightness(1); opacity: 1; }
    25%  { filter: drop-shadow(0 0 12px rgba(255, 180, 70, 0.9)) brightness(1.25); opacity: 1; }
    60%  { filter: drop-shadow(0 0 20px rgba(255, 110, 40, 0.9)) brightness(0.85); opacity: 0.65; }
    100% { filter: drop-shadow(0 0 4px rgba(90, 90, 90, 0.6)) brightness(0.45); opacity: 0.18; }
  }

  @keyframes fireBurst {
    0%   { opacity: 0; transform: translateY(8%) scale(0.8); }
    20%  { opacity: 1; transform: translateY(0) scale(1); }
    65%  { opacity: 0.95; transform: translateY(-6%) scale(1.08); }
    100% { opacity: 0; transform: translateY(-11%) scale(1.15); }
  }
</style>
