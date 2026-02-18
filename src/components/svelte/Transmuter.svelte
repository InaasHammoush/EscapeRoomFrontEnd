<svelte:options customElement="transmuter-widget" />

<script>
  import { onDestroy } from "svelte";
  import parchmentEmptyBg from "../../assets/alchemist/parchment_empty.png";
  import parchmentRuneBg from "../../assets/alchemist/parchment_rune.png";
  import parchmentRuneBlueBg from "../../assets/alchemist/parchment_rune_blue.png";
  import noParchmentBg from "../../assets/alchemist/noparchment.png";
  import charcoalPenImg from "../../assets/alchemist/charcoal_pen.png";
  import blueLiquidImg from "../../assets/alchemist/blue_liquid.png";
  import goldNuggetImg from "../../assets/alchemist/goldnugget.png";
  import matchboxImg from "../../assets/alchemist/matchbox.png";
  import goldKeyImg from "../../assets/alchemist/goldkey.png";

  export let puzzle = null;

  let symbolAnimating = false;
  let blueAnimating = false;
  let fireAnimating = false;
  let darkening = false;
  let revealing = false;
  let localSymbolReady = false;
  let localBlueApplied = false;
  let localGoldPlaced = false;
  let localIgnited = false;
  let localGoldenKeyReady = false;
  let localKeyCollected = false;
  let phaseUpper = "";
  let symbolReadyFromPuzzle = false;
  let blueAppliedFromPuzzle = false;
  let goldPlacedFromPuzzle = false;
  let ignitedFromPuzzle = false;
  let goldenKeyReadyFromPuzzle = false;
  let symbolReady = false;
  let blueApplied = false;
  let goldPlaced = false;
  let ignited = false;
  let goldenKeyReady = false;
  let keyCollected = false;
  let currentParchmentBg = parchmentEmptyBg;
  let showTransmuterGlow = false;
  let interactionLocked = false;
  let activeGlow = "none";

  let symbolTimer = null;
  let blueTimer = null;
  let fireTimer = null;
  let fireSwapTimer = null;
  let darkenTimer = null;
  let revealTimer = null;

  const SYMBOL_DRAW_MS = 1900;
  const BLUE_SWIRL_MS = 1900;
  const FIRE_MS = 1700;
  const DARKEN_MS = 360;
  const REVEAL_MS = 800;

  $: phaseUpper = String(puzzle?.phase || "").toUpperCase();
  $: symbolReadyFromPuzzle =
    Boolean(puzzle?.steps?.symbolDrawn) ||
    phaseUpper.includes("SYMBOL") ||
    phaseUpper.includes("BLUE") ||
    phaseUpper.includes("GOLD") ||
    phaseUpper.includes("COMPLETE");
  $: blueAppliedFromPuzzle =
    Boolean(puzzle?.steps?.blueApplied) ||
    phaseUpper.includes("BLUE") ||
    phaseUpper.includes("GOLD") ||
    phaseUpper.includes("COMPLETE");
  $: goldPlacedFromPuzzle =
    Boolean(puzzle?.steps?.goldPlaced) ||
    phaseUpper.includes("GOLD") ||
    phaseUpper.includes("COMPLETE");
  $: ignitedFromPuzzle =
    Boolean(puzzle?.steps?.ignited) ||
    phaseUpper.includes("COMPLETE");
  $: goldenKeyReadyFromPuzzle =
    Boolean(puzzle?.output?.goldenKeyReady) ||
    phaseUpper.includes("COMPLETE");
  $: symbolReady = localSymbolReady || symbolReadyFromPuzzle;
  $: blueApplied = localBlueApplied || blueAppliedFromPuzzle;
  $: goldPlaced = localGoldPlaced || goldPlacedFromPuzzle;
  $: ignited = localIgnited || ignitedFromPuzzle;
  $: goldenKeyReady = localGoldenKeyReady || goldenKeyReadyFromPuzzle;
  $: keyCollected = localKeyCollected;
  $: currentParchmentBg = ignited
    ? noParchmentBg
    : (blueApplied
      ? parchmentRuneBlueBg
      : (symbolReady ? parchmentRuneBg : parchmentEmptyBg));
  $: showTransmuterGlow =
    activeGlow !== "none" && (symbolAnimating || blueAnimating || fireAnimating || darkening || revealing);
  $: interactionLocked = symbolAnimating || blueAnimating || fireAnimating || darkening || revealing;

  function normalizeItem(itemName) {
    return String(itemName || "").trim().toUpperCase();
  }

  function isCoalItem(itemName) {
    const key = normalizeItem(itemName);
    return key === "COAL_BLOCK" || key === "COALBLOCK" || key === "CHARCOAL_PEN";
  }

  function isBlueLiquidItem(itemName) {
    const key = normalizeItem(itemName);
    return key === "BLUE_LIQUID" || key === "BLUELIQUID";
  }

  function isGoldNuggetItem(itemName) {
    const key = normalizeItem(itemName);
    return key === "GOLD_NUGGET" || key === "GOLDNUGGET";
  }

  function isMatchesItem(itemName) {
    const key = normalizeItem(itemName);
    return key === "MATCHES";
  }

  function clearTimers() {
    if (symbolTimer) {
      clearTimeout(symbolTimer);
      symbolTimer = null;
    }
    if (blueTimer) {
      clearTimeout(blueTimer);
      blueTimer = null;
    }
    if (fireTimer) {
      clearTimeout(fireTimer);
      fireTimer = null;
    }
    if (fireSwapTimer) {
      clearTimeout(fireSwapTimer);
      fireSwapTimer = null;
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

  function startDarkRevealTransition(onSwap = null, onDone = null) {
    darkening = true;
    revealing = false;

    if (darkenTimer) clearTimeout(darkenTimer);
    if (revealTimer) clearTimeout(revealTimer);

    darkenTimer = setTimeout(() => {
      darkening = false;
      revealing = true;
      if (onSwap) onSwap();
      darkenTimer = null;

      revealTimer = setTimeout(() => {
        revealing = false;
        if (onDone) onDone();
        revealTimer = null;
      }, REVEAL_MS);
    }, DARKEN_MS);
  }

  function startCoalDrawSequence() {
    if (interactionLocked) return;
    activeGlow = "charcoal";
    symbolAnimating = true;

    if (symbolTimer) clearTimeout(symbolTimer);
    symbolTimer = setTimeout(() => {
      symbolAnimating = false;
      startDarkRevealTransition(() => {
        localSymbolReady = true;
      }, () => {
        activeGlow = "none";
      });
      symbolTimer = null;
    }, SYMBOL_DRAW_MS);
  }

  function startBlueSwirlSequence() {
    if (interactionLocked || !symbolReady || blueApplied) return;
    activeGlow = "blue";
    blueAnimating = true;

    if (blueTimer) clearTimeout(blueTimer);
    blueTimer = setTimeout(() => {
      blueAnimating = false;
      startDarkRevealTransition(() => {
        localBlueApplied = true;
      }, () => {
        activeGlow = "none";
      });
      blueTimer = null;
    }, BLUE_SWIRL_MS);
  }

  function startIgnitionSequence() {
    if (interactionLocked || !goldPlaced || ignited) return;
    activeGlow = "fire";
    fireAnimating = true;

    if (fireTimer) clearTimeout(fireTimer);
    if (fireSwapTimer) clearTimeout(fireSwapTimer);

    // Switch to ash/key state while fire is still visible.
    fireSwapTimer = setTimeout(() => {
      startDarkRevealTransition(() => {
        localIgnited = true;
        localGoldenKeyReady = true;
      });
      fireSwapTimer = null;
    }, 620);

    // Let flames continue to overtake the scene, then fade them.
    fireTimer = setTimeout(() => {
      fireAnimating = false;
      activeGlow = "none";
      fireTimer = null;
    }, FIRE_MS);
  }

  function emitAction(verb, item = null) {
    const event = new CustomEvent("intent", {
      detail: {
        objectId: "alch:transmuter",
        verb,
        data: item ? { item } : {}
      },
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }

  function handleDragOver(e) {
    if (interactionLocked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e) {
    if (interactionLocked) return;
    e.preventDefault();

    const dataItem =
      e.dataTransfer.getData("application/x-inventory-item") ||
      e.dataTransfer.getData("text/plain");
    if (!dataItem) return;

    if (isCoalItem(dataItem) && !symbolReady) {
      emitAction("insert", "COAL_BLOCK");
      startCoalDrawSequence();
      return;
    }

    if (isBlueLiquidItem(dataItem) && symbolReady && !blueApplied) {
      emitAction("insert", "BLUE_LIQUID");
      startBlueSwirlSequence();
      return;
    }

    if (isGoldNuggetItem(dataItem)) {
      if (!blueApplied || goldPlaced) return;
      emitAction("insert", "GOLD_NUGGET");
      localGoldPlaced = true;
      return;
    }

    if (isMatchesItem(dataItem)) {
      if (!goldPlaced || ignited) return;
      emitAction("insert", "MATCHES");
      startIgnitionSequence();
      return;
    }

    emitAction("insert", dataItem);
  }

  $: if (symbolReadyFromPuzzle && !symbolAnimating && !blueAnimating && !darkening && !revealing) {
    localSymbolReady = true;
  }

  $: if (blueAppliedFromPuzzle && !symbolAnimating && !blueAnimating && !darkening && !revealing) {
    localBlueApplied = true;
    activeGlow = "none";
  }

  $: if (goldPlacedFromPuzzle && !symbolAnimating && !blueAnimating && !darkening && !revealing) {
    localGoldPlaced = true;
  }

  $: if (ignitedFromPuzzle && !symbolAnimating && !blueAnimating && !fireAnimating && !darkening && !revealing) {
    localIgnited = true;
  }

  $: if (goldenKeyReadyFromPuzzle && !symbolAnimating && !blueAnimating && !fireAnimating && !darkening && !revealing) {
    localGoldenKeyReady = true;
    activeGlow = "none";
  }

  function takeGoldenKey(e) {
    e.stopPropagation();
    if (!goldenKeyReady || keyCollected || !ignited) return;
    emitAction("take", "GOLDEN_KEY");
    localKeyCollected = true;
  }

  function close() {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: { objectId: "alch:transmuter", verb: "CLOSE" },
      bubbles: true,
      composed: true
    }));
  }

  onDestroy(() => {
    clearTimers();
  });
</script>

<div class="overlay" on:click={close}>
  <div class="transmuter-container" on:click={(e) => e.stopPropagation()}>
    <button class="close-btn" on:click={close}>x</button>
    <div class="transmuter-display">
      <img src={currentParchmentBg} alt="Transmuter" class="transmuter-bg" />
      <div
        class="transmuter-drop-zone"
        on:dragover={handleDragOver}
        on:drop={handleDrop}
        role="region"
        aria-label="Transmuter parchment drop zone"
        class:locked={interactionLocked}
      ></div>

      {#if symbolAnimating}
        <div class="coal-motion" aria-hidden="true">
          <div class="coal-follow-glow"></div>
          <img src={charcoalPenImg} alt="" class="coal-image" />
        </div>
      {/if}

      {#if blueAnimating}
        <div class="blue-motion" aria-hidden="true">
          <div class="blue-orbit">
            <div class="blue-follow-glow"></div>
            <img src={blueLiquidImg} alt="" class="blue-liquid-image" />
          </div>
        </div>
      {/if}

      {#if goldPlaced && !ignited}
        <img src={goldNuggetImg} alt="Gold Nugget" class="gold-nugget-on-rune" />
      {/if}

      {#if fireAnimating}
        <div class="fire-blaze" aria-hidden="true">
          <img src={matchboxImg} alt="" class="matchbox-ignite" />
          <div class="fire-core"></div>
          <div class="fire-wave wave-one"></div>
          <div class="fire-wave wave-two"></div>
          <div class="fire-sparks"></div>
        </div>
      {/if}

      {#if ignited && goldenKeyReady && !keyCollected}
        <button
          type="button"
          class="gold-key-on-ash"
          on:click={takeGoldenKey}
          aria-label="Take golden key"
        >
          <img src={goldKeyImg} alt="Golden Key" />
        </button>
      {/if}

      {#if showTransmuterGlow}
        <div
          class="transmuter-glow"
          class:charcoal={activeGlow === "charcoal"}
          class:blue={activeGlow === "blue"}
          class:fire={activeGlow === "fire"}
          class:darkening
          class:revealing
          aria-hidden="true"
        ></div>
      {/if}

      {#if darkening || revealing}
        <div
          class="transmuter-transition-mask"
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

  .transmuter-container {
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

  .transmuter-display {
    position: relative;
    width: 550px;
    aspect-ratio: 1;
  }

  .transmuter-bg {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .transmuter-drop-zone {
    position: absolute;
    inset: 9% 13% 10% 13%;
    cursor: grab;
  }

  .transmuter-drop-zone:hover {
    background: rgba(212, 175, 55, 0.05);
  }

  .transmuter-drop-zone.locked {
    cursor: default;
  }

  .transmuter-drop-zone.locked:hover {
    background: transparent;
  }

  .coal-motion {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 220px;
    height: 200px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: runeDrawPath 1900ms linear forwards;
    z-index: 3;
  }

  .coal-image {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 88px;
    height: 88px;
    object-fit: contain;
    transform: translate(-50%, -50%) rotate(-22deg);
    filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.55));
  }

  .coal-follow-glow {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 130px;
    height: 130px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(55, 55, 55, 0.92) 0%,
      rgba(30, 30, 30, 0.78) 35%,
      rgba(8, 8, 8, 0.2) 66%,
      rgba(0, 0, 0, 0) 100%
    );
    filter: blur(7px);
    animation: charcoalPulse 560ms ease-in-out infinite alternate;
  }

  .blue-motion {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 220px;
    height: 220px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 3;
  }

  .blue-orbit {
    position: absolute;
    inset: 0;
    animation: blueCircleOrbit 1900ms linear forwards;
  }

  .blue-liquid-image {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 82px;
    height: 82px;
    object-fit: contain;
    transform: translate(-50%, -50%) translateX(56px) rotate(180deg);
    animation: blueCounterOrbit 1900ms linear forwards;
    filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
  }

  .blue-follow-glow {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 130px;
    height: 130px;
    transform: translate(-50%, -50%) translateX(56px);
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(160, 220, 255, 0.95) 0%,
      rgba(95, 178, 255, 0.82) 32%,
      rgba(42, 127, 255, 0.35) 62%,
      rgba(20, 80, 180, 0) 100%
    );
    filter: blur(7px);
    animation: bluePulse 560ms ease-in-out infinite alternate;
  }

  .gold-nugget-on-rune {
    position: absolute;
    left: 50%;
    top: 53%;
    width: 92px;
    height: 92px;
    object-fit: contain;
    transform: translate(-50%, -50%);
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
    pointer-events: none;
    z-index: 3;
  }

  .fire-blaze {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 6;
    animation: fireBreath 1700ms ease-in-out forwards;
  }

  .matchbox-ignite {
    position: absolute;
    left: 50%;
    top: 56%;
    width: 88px;
    height: 88px;
    object-fit: contain;
    transform: translate(-50%, -50%) rotate(12deg);
    filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.45));
    opacity: 0.85;
  }

  .fire-core {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 70%, rgba(255, 245, 176, 1) 0%, rgba(255, 205, 92, 0.98) 30%, rgba(255, 146, 54, 0.92) 52%, rgba(245, 78, 18, 0.64) 70%, rgba(0, 0, 0, 0) 90%),
      radial-gradient(ellipse at 35% 68%, rgba(255, 232, 140, 0.9) 0%, rgba(255, 154, 56, 0.62) 45%, rgba(0, 0, 0, 0) 84%),
      radial-gradient(ellipse at 66% 63%, rgba(255, 210, 118, 0.86) 0%, rgba(255, 121, 34, 0.58) 44%, rgba(0, 0, 0, 0) 86%);
    filter: blur(7px);
  }

  .fire-wave {
    position: absolute;
    inset: 0;
    border-radius: 48%;
    mix-blend-mode: screen;
    filter: blur(10px);
  }

  .fire-wave.wave-one {
    background: radial-gradient(circle, rgba(255, 190, 86, 0.4) 0%, rgba(255, 112, 36, 0.34) 36%, rgba(255, 78, 25, 0.2) 58%, rgba(0, 0, 0, 0) 78%);
    animation: fireWaveOne 1200ms ease-in-out infinite alternate;
  }

  .fire-wave.wave-two {
    background: radial-gradient(circle, rgba(255, 221, 122, 0.34) 0%, rgba(255, 136, 44, 0.3) 32%, rgba(255, 74, 22, 0.14) 56%, rgba(0, 0, 0, 0) 80%);
    animation: fireWaveTwo 980ms ease-in-out infinite alternate;
  }

  .fire-sparks {
    position: absolute;
    inset: 12%;
    background:
      radial-gradient(circle at 30% 22%, rgba(255, 242, 176, 0.8) 0 2px, rgba(0, 0, 0, 0) 4px),
      radial-gradient(circle at 43% 16%, rgba(255, 236, 164, 0.72) 0 2px, rgba(0, 0, 0, 0) 4px),
      radial-gradient(circle at 58% 20%, rgba(255, 226, 142, 0.72) 0 2px, rgba(0, 0, 0, 0) 4px),
      radial-gradient(circle at 72% 28%, rgba(255, 214, 118, 0.68) 0 2px, rgba(0, 0, 0, 0) 4px);
    filter: blur(0.6px);
    animation: sparkRise 700ms ease-out infinite;
  }

  .gold-key-on-ash {
    position: absolute;
    left: 50%;
    top: 56%;
    width: 140px;
    height: 140px;
    transform: translate(-50%, -50%);
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
    z-index: 7;
    animation: keyPulse 1000ms ease-in-out infinite alternate;
  }

  .gold-key-on-ash img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0 16px rgba(255, 219, 123, 0.85)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  }

  .transmuter-glow {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 310px;
    height: 250px;
    transform: translate(-50%, -50%);
    border-radius: 60%;
    filter: blur(9px);
    animation: transmuterAuraPulse 600ms ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 2;
  }

  .transmuter-glow.charcoal {
    background: radial-gradient(
      circle,
      rgba(35, 35, 35, 0.96) 0%,
      rgba(20, 20, 20, 0.9) 26%,
      rgba(12, 12, 12, 0.45) 52%,
      rgba(0, 0, 0, 0) 82%
    );
    box-shadow: 0 0 38px rgba(20, 20, 20, 0.9);
  }

  .transmuter-glow.blue {
    background: radial-gradient(
      circle,
      rgba(178, 227, 255, 0.95) 0%,
      rgba(126, 198, 255, 0.88) 28%,
      rgba(70, 145, 255, 0.48) 56%,
      rgba(24, 84, 198, 0) 82%
    );
    box-shadow: 0 0 38px rgba(105, 183, 255, 0.88);
  }

  .transmuter-glow.fire {
    background: radial-gradient(
      ellipse at center,
      rgba(255, 236, 150, 0.96) 0%,
      rgba(255, 187, 95, 0.92) 26%,
      rgba(255, 126, 48, 0.64) 50%,
      rgba(218, 68, 18, 0.34) 68%,
      rgba(0, 0, 0, 0) 86%
    );
    box-shadow: 0 0 64px rgba(255, 169, 76, 0.95);
  }

  .transmuter-glow.darkening {
    animation: transmuterGlowFadeWithDarken 360ms ease-out forwards;
  }

  .transmuter-glow.revealing {
    animation: transmuterGlowFadeOut 800ms ease-out forwards;
  }

  .transmuter-transition-mask {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 4;
  }

  .transmuter-transition-mask.darkening {
    animation: transmuterDarken 360ms ease-out forwards;
  }

  .transmuter-transition-mask.revealing {
    animation: transmuterReveal 800ms ease-out forwards;
  }

  @keyframes runeDrawPath {
    /* Start low, draw straight up */
    0% { transform: translate(-50%, -50%) translate(-10px, 72px) rotate(-20deg); }
    18% { transform: translate(-50%, -50%) translate(-10px, -72px) rotate(-10deg); }

    /* Go back down on the same line */
    30% { transform: translate(-50%, -50%) translate(-10px, 72px) rotate(-20deg); }

    /* Go back up to about 2/3 */
    46% { transform: translate(-50%, -50%) translate(-10px, -22px) rotate(-12deg); }

    /* First diagonal to upper-right and return */
    56% { transform: translate(-50%, -50%) translate(50px, -58px) rotate(16deg); }
    64% { transform: translate(-50%, -50%) translate(-10px, -22px) rotate(-12deg); }

    /* Go 1/4 up */
    74% { transform: translate(-50%, -50%) translate(-10px, -48px) rotate(-8deg); }

    /* Second identical diagonal and return */
    84% { transform: translate(-50%, -50%) translate(50px, -84px) rotate(16deg); }
    92% { transform: translate(-50%, -50%) translate(-10px, -48px) rotate(-8deg); }

    /* Finish the remaining 1/4 up */
    100% { transform: translate(-50%, -50%) translate(-10px, -72px) rotate(-6deg); }
  }

  @keyframes charcoalPulse {
    0% { opacity: 0.72; transform: translate(-50%, -50%) scale(0.95); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
  }

  @keyframes charcoalAuraPulse {
    0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.98); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
  }

  @keyframes blueCircleOrbit {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes blueCounterOrbit {
    0% { transform: translate(-50%, -50%) translateX(56px) rotate(180deg); }
    100% { transform: translate(-50%, -50%) translateX(56px) rotate(-180deg); }
  }

  @keyframes bluePulse {
    0% { opacity: 0.75; transform: translate(-50%, -50%) translateX(56px) scale(0.95); }
    100% { opacity: 1; transform: translate(-50%, -50%) translateX(56px) scale(1.12); }
  }

  @keyframes transmuterAuraPulse {
    0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.98); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
  }

  @keyframes fireBreath {
    0% { opacity: 0; transform: scale(0.88); }
    12% { opacity: 0.88; transform: scale(0.98); }
    58% { opacity: 1; transform: scale(1.06); }
    100% { opacity: 0.92; transform: scale(1.02); }
  }

  @keyframes fireWaveOne {
    0% { transform: scale(0.94) translateY(10px); opacity: 0.6; }
    100% { transform: scale(1.08) translateY(-8px); opacity: 0.98; }
  }

  @keyframes fireWaveTwo {
    0% { transform: scale(0.98) translateX(-10px) translateY(8px); opacity: 0.52; }
    100% { transform: scale(1.06) translateX(8px) translateY(-10px); opacity: 0.86; }
  }

  @keyframes sparkRise {
    0% { transform: translateY(8px); opacity: 0.24; }
    35% { opacity: 0.92; }
    100% { transform: translateY(-16px); opacity: 0; }
  }

  @keyframes keyPulse {
    0% { transform: translate(-50%, -50%) scale(0.96); }
    100% { transform: translate(-50%, -50%) scale(1.04); }
  }

  @keyframes transmuterDarken {
    0% { background: rgba(0, 0, 0, 0); }
    100% { background: rgba(0, 0, 0, 0.62); }
  }

  @keyframes transmuterReveal {
    0% { background: rgba(0, 0, 0, 0.62); }
    100% { background: rgba(0, 0, 0, 0); }
  }

  @keyframes transmuterGlowFadeWithDarken {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
    100% { opacity: 0.58; transform: translate(-50%, -50%) scale(1.02); }
  }

  @keyframes transmuterGlowFadeOut {
    0% { opacity: 0.58; transform: translate(-50%, -50%) scale(1.02); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.98); }
  }
</style>
