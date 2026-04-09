<svelte:options customElement="mortar-widget" />

<script>
  // --- ASSETS ---
  import mortarEmptyImg from "../../assets/alchemist/mortar_empty.png";
  import mortarMoonwortImg from "../../assets/alchemist/mortar_moonwort.png";
  import mortarGreenImg from "../../assets/alchemist/mortar_moonwort_green.png";
  import mortarBlueImg from "../../assets/alchemist/mortar_blue.png";
  
  import pestleImg from "../../assets/alchemist/pestel.png";
  import moonwortImg from "../../assets/alchemist/moonwort.png";

  export let puzzle = null;

  // --- STATE EXTRACTION ---
  $: moonwortInserted = puzzle?.inserted?.moonwort || false;
  $: greenLiquidInserted = puzzle?.inserted?.greenLiquid || false;
  $: essenceReady = puzzle?.processed?.essenceReady || false;
  $: blueLiquidReady = puzzle?.output?.blueLiquidReady || false;
  $: blueLiquidTaken = puzzle?.output?.blueLiquidTaken || false;
  $: solved = puzzle?.solved || false;

  // --- DETERMINE BACKGROUND IMAGE ---
  $: currentBg = 
    blueLiquidTaken ? mortarEmptyImg :
    blueLiquidReady ? mortarBlueImg :
    greenLiquidInserted ? mortarGreenImg :
    essenceReady ? mortarMoonwortImg :
    mortarEmptyImg;
  $: currentAspectRatio =
    blueLiquidTaken ? "1024 / 590" :
    blueLiquidReady ? "1361 / 784" :
    greenLiquidInserted ? "1361 / 784" :
    essenceReady ? "1372 / 784" :
    "1024 / 590";

  // --- LOCAL ANIMATION AUTOMATION ---
  let isGrinding = false;
  let isCombining = false;
  let grindTriggered = false;
  let combineTriggered = false;

  // 1. AUTOMATIC GRINDING: Triggered when moonwort is successfully inserted
  $: if (moonwortInserted && !essenceReady && !grindTriggered) {
    grindTriggered = true;
    isGrinding = true;
    
    // Animate for 2 seconds, then automatically tell the server to grind
    setTimeout(() => {
      isGrinding = false;
      emitAction("grind");
    }, 2000); 
  }

  // 2. AUTOMATIC COMBINING: Triggered when green liquid is successfully inserted
  $: if (greenLiquidInserted && !blueLiquidReady && !combineTriggered) {
    combineTriggered = true;
    isCombining = true;
    
    // Animate for 2.5 seconds, then automatically tell the server to combine
    setTimeout(() => {
      isCombining = false;
      emitAction("combine");
    }, 2500); 
  }

  // Reset triggers if the puzzle ever gets fully reset
  $: if (!moonwortInserted) grindTriggered = false;
  $: if (!greenLiquidInserted) combineTriggered = false;

  // --- DRAG & DROP HANDLERS ---
  function handleDragOver(e) {
    if ((solved && blueLiquidTaken) || isGrinding || isCombining) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e) {
    e.preventDefault();
    if (solved && blueLiquidTaken) return; 
    if (isGrinding || isCombining) return; // Prevent drops during animations

    const item = e.dataTransfer.getData("text/plain").toUpperCase();

    // Insert Moonwort
    if (item === "MOONWORT" && !moonwortInserted && !essenceReady) {
      emitAction("insert", { item: "MOONWORT" });
    } 
    // Insert Green Liquid
    else if (item === "GREEN_LIQUID" && essenceReady && !greenLiquidInserted) {
      emitAction("insert", { item: "GREEN_LIQUID" });
    }
    // Collect Blue Liquid with Empty Bottle
    else if ((item === "EMPTY_BOTTLE" || item === "BOTTLE") && blueLiquidReady && !blueLiquidTaken) {
      emitAction("take", { item: "BLUE_LIQUID" });
      
      // Auto-close widget shortly after taking the liquid
      setTimeout(() => closeWidget(), 1000);
    }
  }

  // --- SOCKET INTENTS ---
  function emitAction(verb, data = {}) {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'alch:mortar', verb, data },
      bubbles: true, composed: true
    }));
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'alch:mortar', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>x</button>

    <div class="mortar-area" style={`aspect-ratio: ${currentAspectRatio};`}>
      <img src={currentBg} alt="Mortar State" class="mortar-bg" />
      
      <div class="bowl-interior" on:dragover={handleDragOver} on:drop={handleDrop}>
        {#if moonwortInserted && !essenceReady && !blueLiquidTaken}
           <img src={moonwortImg} alt="Raw Moonwort" class="raw-moonwort" class:crushing={isGrinding} />
        {/if}
      </div>

      {#if isGrinding || isCombining}
        <div class="pestle-wrapper" style="animation-duration: {isCombining ? '2.5s' : '2s'};">
          <div
            class="impact-glow"
            class:grinding={isGrinding}
            class:combining={isCombining}
          ></div>
          <img 
            src={pestleImg} 
            alt="Pestle" 
            class="pestle" 
            class:grinding={isGrinding}
            class:combining={isCombining}
          />
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(4px); z-index: 50;
  }

  .widget-wrapper {
    position: relative; 
    width: 90vw;
    max-width: 800px;
    display: flex; flex-direction: column; align-items: center;
    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.9);
    background: #1a1510; border: 2px solid #4a3b2c;
  }

  .close-btn {
    position: absolute; top: 15px; right: 15px; width: 40px; height: 40px;
    border-radius: 50%; background: rgba(0, 0, 0, 0.8); color: #f4e4bc; border: 2px solid #8b7355;
    cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; z-index: 20;
    transition: transform 0.2s;
  }
  .close-btn:hover { background: black; transform: scale(1.1); }

  .mortar-area {
    position: relative;
    width: 100%;
    aspect-ratio: 1361 / 784;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .mortar-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
  }

  .bowl-interior {
    position: absolute;
    top: 25%;
    left: 30%;
    width: 40%;
    height: 50%;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5;
  }

  .raw-moonwort {
    width: 60%;
    height: auto;
    object-fit: contain;
    filter: drop-shadow(0 5px 5px rgba(0,0,0,0.6));
    animation: dropIn 0.3s ease-out;
  }

  /* Shrink the raw leaves as they are being ground */
  .raw-moonwort.crushing {
    animation: crushDown 2s forwards ease-in-out;
  }

  /* Pestle Styling */
  /* 1. The Wrapper: Centers the pestle over the bowl and fades it in */
  .pestle-wrapper {
    position: absolute;
    top: 10%; 
    left: 42%; /* Centers it horizontally over the bowl */
    width: 40%;
    height: 45%;
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    animation: toolFadeInOut ease-in-out forwards; 
  }

  .impact-glow {
    position: absolute;
    left: -68%;
    bottom: -18%;
    width: 200%;
    height: 86%;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
    background:
      radial-gradient(circle, rgba(255, 242, 122, 0.84) 0%, rgba(255, 219, 84, 0.56) 34%, rgba(255, 191, 40, 0.3) 58%, rgba(255, 170, 0, 0.12) 72%, rgba(0, 0, 0, 0) 84%);
    filter: blur(18px);
    mix-blend-mode: screen;
    transform: scale(0.8);
  }

  .impact-glow.grinding {
    animation: grindGlowPulse 0.6s infinite ease-in-out;
  }

  .impact-glow.combining {
    animation: stirGlowPulse 0.8s infinite ease-in-out;
  }

  /* 2. The Image: Anchors the rotation at the tip inside the bowl */
  .pestle {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(-15px 15px 10px rgba(0,0,0,0.6));
    transform-origin: bottom center; /* Keeps the tip in the bowl */
  }

  .pestle.grinding {
    animation: grindMotion 0.6s infinite ease-in-out;
  }

  .pestle.combining {
    animation: stirMotion 0.8s infinite linear;
  }

  /* --- Keyframes --- */
  @keyframes dropIn {
    0% { transform: translateY(-50px) scale(1.2); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }

  /* --- Keyframes --- */
  @keyframes toolFadeInOut {
    0% { opacity: 0; transform: translateY(-30px); }
    15% { opacity: 1; transform: translateY(0); }
    85% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-30px); }
  }
  
  /* Pounding motion: Rotates back and forth with a slight downward crush */
  @keyframes grindMotion {
    0% { transform: rotate(0deg) translateY(0); }
    25% { transform: rotate(-15deg) translateY(10px); }
    50% { transform: rotate(10deg) translateY(20px); }
    75% { transform: rotate(-10deg) translateY(10px); }
    100% { transform: rotate(0deg) translateY(0); }
  }

  /* Stirring motion: Smooth circular sweep anchored at the tip */
  @keyframes stirMotion {
    0% { transform: rotate(0deg) translateX(0); }
    25% { transform: rotate(-20deg) translateX(-10px); }
    50% { transform: rotate(-40deg) translateX(0); }
    75% { transform: rotate(-20deg) translateX(15px); }
    100% { transform: rotate(0deg) translateX(0); }
  }

  @keyframes grindGlowPulse {
    0% { opacity: 0.12; transform: scale(0.8); }
    25% { opacity: 0.25; transform: scale(0.88); }
    50% { opacity: 0.88; transform: scale(1.08); }
    75% { opacity: 0.35; transform: scale(0.93); }
    100% { opacity: 0.12; transform: scale(0.8); }
  }

  @keyframes stirGlowPulse {
    0% { opacity: 0.18; transform: scale(0.86); }
    50% { opacity: 0.55; transform: scale(1.02); }
    100% { opacity: 0.18; transform: scale(0.86); }
  }
</style>




