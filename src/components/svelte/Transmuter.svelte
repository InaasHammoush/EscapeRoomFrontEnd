<svelte:options customElement="transmuter-widget" />

<script>
  // --- ASSETS ---
  import parchmentEmptyImg from "../../assets/alchemist/parchment_empty.png";
  import parchmentRuneImg from "../../assets/alchemist/parchment_rune.png";
  import parchmentBlueImg from "../../assets/alchemist/parchment_rune_blue.png";

  import goldNuggetImg from "../../assets/alchemist/goldnugget.png";
  import goldKeyImg from "../../assets/alchemist/goldkey.png";
  
  export let puzzle = null;

  // --- STATE EXTRACTION ---
  $: symbolDrawn = puzzle?.steps?.symbolDrawn || false;
  $: blueApplied = puzzle?.steps?.blueApplied || false;
  $: goldPlaced = puzzle?.steps?.goldPlaced || false;
  $: ignited = puzzle?.steps?.ignited || false;
  $: solved = puzzle?.solved || false;

  // --- DETERMINE BACKGROUND IMAGE ---
  $: currentBg = 
    blueApplied ? parchmentBlueImg :
    symbolDrawn ? parchmentRuneImg :
    parchmentEmptyImg;

  // --- DRAG & DROP HANDLERS ---
  function handleDragOver(e) {
    if (solved) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e) {
    e.preventDefault();
    if (solved) return;

    // Get the dragged item key from the inventory
    const item = e.dataTransfer.getData("text/plain").toUpperCase();

    // 1. Draw Symbol (Accepts COAL_BLOCK or CHARCOAL_PEN if you named it that)
    if ((item === "COAL_BLOCK" || item === "CHARCOAL_PEN") && !symbolDrawn) {
      emitAction("insert", { item: "COAL_BLOCK" });
    } 
    // 2. Apply Blue Liquid
    else if (item === "BLUE_LIQUID" && symbolDrawn && !blueApplied) {
      emitAction("insert", { item: "BLUE_LIQUID" });
    }
    // 3. Place Gold Nugget
    else if (item === "GOLD_NUGGET" && blueApplied && !goldPlaced) {
      emitAction("insert", { item: "GOLD_NUGGET" });
    }
    // 4. Ignite with Matches
    else if (item === "MATCHES" && goldPlaced && !ignited) {
      emitAction("insert", { item: "MATCHES" });
      
      // Auto-close widget shortly after the key is revealed
      setTimeout(() => closeWidget(), 3000);
    }
  }

  // --- SOCKET INTENTS ---
  function emitAction(verb, data = {}) {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { 
        objectId: 'alch:transmuter', // Matches backend expected ID
        verb, 
        data 
      },
      bubbles: true, 
      composed: true
    }));
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'alch:transmuter', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>✕</button>

    <div 
      class="ritual-area"
      on:dragover={handleDragOver}
      on:drop={handleDrop}
    >
      <img src={currentBg} alt="Ritual Parchment" class="parchment-bg" />
      
      {#if ignited}
        <div class="fire-flash"></div>
      {/if}

      <div class="center-stage">
        {#if goldPlaced && !ignited}
           <img src={goldNuggetImg} alt="Gold Nugget" class="item-overlay nugget" />
        {/if}

        {#if ignited}
           <img src={goldKeyImg} alt="Golden Key" class="item-overlay key glowing" />
        {/if}
      </div>
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

  .ritual-area {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .parchment-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
    transition: opacity 0.5s ease;
  }

  .center-stage {
    position: absolute;
    top: 35%;
    left: 40%;
    width: 20%;
    height: 30%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5;
  }

  .item-overlay {
    position: absolute;
    object-fit: contain;
    pointer-events: none;
  }

  .nugget {
    width: 120%;
    filter: drop-shadow(0 10px 10px rgba(0,0,0,0.8));
    animation: dropIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  .key {
    width: 150%;
    transform: rotate(15deg);
    filter: drop-shadow(0 15px 15px rgba(0,0,0,0.9));
    animation: forgeReveal 1.5s ease-out forwards;
  }

  .glowing {
    animation: goldenPulse 2s infinite alternate;
  }

  /* Full screen fire flash to mask the swap from Nugget to Key */
  .fire-flash {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(255,200,50,1) 0%, rgba(255,100,0,0.8) 50%, rgba(0,0,0,0) 100%);
    z-index: 10;
    pointer-events: none;
    mix-blend-mode: screen;
    animation: flashBang 1.2s ease-out forwards;
  }

  /* --- Animations --- */
  @keyframes dropIn {
    0% { transform: translateY(-50px) scale(1.5); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }

  @keyframes flashBang {
    0% { opacity: 0; transform: scale(0.5); }
    20% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0; transform: scale(1.5); }
  }

  @keyframes forgeReveal {
    0% { opacity: 0; transform: rotate(15deg) scale(0.5) translateY(20px); filter: brightness(5) blur(10px); }
    100% { opacity: 1; transform: rotate(15deg) scale(1) translateY(0); filter: brightness(1) blur(0); }
  }

  @keyframes goldenPulse {
    0% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.4)); }
    100% { filter: drop-shadow(0 0 25px rgba(255, 215, 0, 0.9)); }
  }
</style>