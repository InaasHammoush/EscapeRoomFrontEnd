<svelte:options customElement="flask-transfer-widget" />

<script>
  // --- ASSETS ---
  // Background states (Swaps based on solved status)
  import bgMixedImg from "../../assets/alchemist/bench_empty.png";
  import bgSolvedImg from "../../assets/alchemist/bench_open.png";
  
  // Flask & Layers
  import glassEmptyImg from "../../assets/alchemist/bench_glass_empty.png";
  
  // Layers 
  import layerRed from "../../assets/alchemist/bench_layer_red.png";
  import layerYellow from "../../assets/alchemist/bench_layer_yellow.png";
  import layerGreen from "../../assets/alchemist/bench_layer_green.png";
  import layerPurple from "../../assets/alchemist/bench_layer_purple.png";

  export let puzzle = null;

  // --- STATE EXTRACTION ---
  $: bottles = puzzle?.bottles || {};
  $: bottleOrder = puzzle?.bottleOrder || ['RUBY', 'CITRINE', 'EMERALD', 'AMETHYST'];
  $: solved = puzzle?.solved || false;

  // --- REACTIVE BACKGROUND SWAP ---
  $: currentBg = solved ? bgSolvedImg : bgMixedImg;

  // Map backend color strings to imported image assets
  const layerImages = {
    'RED': layerRed,
    'YELLOW': layerYellow,
    'GREEN': layerGreen,
    'PURPLE': layerPurple
  };

  // --- LOCAL INTERACTION STATE ---
  let selectedBottleId = null;

  // --- INTERACTION LOGIC ---
  function handleBottleClick(id) {
    if (solved) return; // Prevent moves after solution

    if (!selectedBottleId) {
      // 1. Select the source bottle
      selectedBottleId = id;
    } else if (selectedBottleId === id) {
      // 2. Deselect if clicked again
      selectedBottleId = null;
    } else {
      // 3. Pour from selected into the clicked bottle
      emitAction("pour", { from: selectedBottleId, to: id });
      selectedBottleId = null; // Clear selection
    }
  }

  // --- SOCKET INTENTS ---
  function emitAction(verb, data = {}) {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { 
        objectId: 'alch:flask-transfer', // Matches backend WIDGET_ID
        verb, 
        data 
      },
      bubbles: true, 
      composed: true
    }));
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'alch:flask-transfer', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>✕</button>

    <div class="scene-area">
      <img src={currentBg} alt="Alchemist Bench" class="bg-image" />

      <div class="bottles-container" class:faded={solved}>
        {#each bottleOrder as id}
          {@const bottleData = bottles[id]}
          {@const isSelected = selectedBottleId === id}
          
          <div 
            class="bottle-slot" 
            class:selected={isSelected}
            class:solved-bottle={solved}
            on:click={() => handleBottleClick(id)}
          >
            <img src={glassEmptyImg} alt="Glass Flask" class="glass-img" />

            <div class="layers-container">
              {#if bottleData && bottleData.layers}
                {#each bottleData.layers as color, index}
                  <img 
                    src={layerImages[color]} 
                    alt="{color} Layer" 
                    class="liquid-layer"
                    style="bottom: {index * 16}%; z-index: {index + 1};"
                  />
                {/each}
              {/if}
            </div>
          </div>
        {/each}
      </div>

    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(5px); z-index: 50;
  }

  .widget-wrapper {
    position: relative; 
    width: 90vw;
    max-width: 900px;
    display: flex; flex-direction: column; align-items: center;
    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.9);
    background: #0f0c09; border: 2px solid #4a3b2c;
  }

  .close-btn {
    position: absolute; top: 15px; right: 15px; width: 40px; height: 40px;
    border-radius: 50%; background: rgba(0, 0, 0, 0.8); color: #f4e4bc; border: 2px solid #8b7355;
    cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; z-index: 30;
    transition: transform 0.2s;
  }
  .close-btn:hover { background: black; transform: scale(1.1); }

  .scene-area {
    position: relative;
    width: 100%;
    aspect-ratio: 16/10;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .bg-image {
    position: absolute; width: 100%; height: 100%; object-fit: cover; pointer-events: none;
  }

  /* --- BOTTLES CONTAINER --- */
  .bottles-container {
    position: absolute;
    /* Aligns bottles naturally over the bench structure (image_3.png) */
    bottom: 30%; 
    width: 80%;
    height: 45%;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    z-index: 10;
    transition: opacity 1s ease-in-out;
  }

  /* Slightly fade the bottles/liquids when solved to emphasize the final static background art */
  .bottles-container.faded {
    opacity: 0.8;
  }

  /* A single bottle slot */
  .bottle-slot {
    position: relative;
    width: 18%; 
    height: 100%;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  /* Interaction highlights while unsolved */
  .bottle-slot:not(.solved-bottle):hover {
    filter: brightness(1.2) drop-shadow(0 0 10px rgba(255,255,255,0.2));
  }

  /* Lift the selected source bottle */
  .bottle-slot.selected {
    transform: translateY(-30px) scale(1.05);
    filter: drop-shadow(0 20px 15px rgba(0,0,0,0.8));
  }
  
  /* Lock cursor after solved */
  .bottle-slot.solved-bottle {
    cursor: default;
  }

  /* The PNG Glass Overlay (Reflections/Depth) */
  .glass-img {
    position: absolute;
    bottom: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: contain;
    pointer-events: none;
    z-index: 20; 
  }

  /* --- LIQUID LAYERS --- */
  .layers-container {
    position: absolute;
    /* Adjust these bounds specifically so the liquids sit perfectly inside your unique glass image shape */
    bottom: 12%; 
    left: 18%; 
    width: 64%; 
    height: 60%; 
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    pointer-events: none;
  }

  .liquid-layer {
    position: absolute;
    width: 100%;
    height: 20%; /* 5 capacity, each is ~20% */
    object-fit: cover;
    pointer-events: none;
    
    /* MAGIC CSS: Removes the black background of the JPGs perfectly! */
    mix-blend-mode: screen; 
    
    transition: bottom 0.3s ease-in-out;
  }

</style>