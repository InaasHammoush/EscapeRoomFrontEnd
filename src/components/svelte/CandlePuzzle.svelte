<svelte:options customElement="candle-puzzle-widget" />

<script>
  import candlesBg from "../../assets/wizard_library/candles.png"; 
  import flameImg from "../../assets/wizard_library/flame.png"; 

  export let puzzle = null;

  // State: all lit initially
  $: states = puzzle?.states || [true, true, true, true];
  $: solved = puzzle?.solved || false;

  const candlePositions = [
    { left: "28%", top: "35.2%" }, // Moved Right & Down
    { left: "42.4%", top: "35.1%" }, // Moved Right & Down
    { left: "56.9%", top: "34.4%" }, // Centered & Down
    { left: "72%",   top: "37.5%" }  // Moved Left & Down (was too far right)
  ];

  function handleCandleClick(index) {
    if (solved) return;
    
    emitAction('TOGGLE', { candleId: index });
  }

  // --- Socket Intents ---
  function emitAction(verb, data = {}) {
    const event = new CustomEvent('intent', {
      detail: {
        objectId: 'puzzle_candle',
        verb,
        data
      },
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'trigger_candle_puzzle', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>✕</button>

    <img src={candlesBg} alt="Candles Altar" class="bg-image" />

    <div class="interaction-layer">
      {#each candlePositions as pos, index}
        <div 
          class="candle-zone"
          style="left: {pos.left}; top: {pos.top};"
          on:click={() => handleCandleClick(index)}
          class:clickable={!solved}
        >
          {#if states[index]}
            <img src={flameImg} alt="Flame" class="flame-sprite" />
          {/if}
        </div>
      {/each}
    </div>

    {#if solved}
      <div class="success-glow"></div>
    {/if}
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
    /* Aspect ratio based on background image */
    aspect-ratio: 1/1; 
    height: 85vh;
    max-width: 95vw;
    display: flex;
    justify-content: center;
    box-shadow: 0 0 50px rgba(0,0,0,0.8);
    border-radius: 8px;
    overflow: hidden;
  }

  .bg-image {
    width: 100%;
    height: 100%;
    object-fit: contain; /* Keeps the whole image visible */
    background: #1a1510; /* Dark fallback color */
    user-select: none;
    pointer-events: none;
  }

  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: 2px solid #8b7355;
    cursor: pointer;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    transition: transform 0.2s;
  }
  .close-btn:hover { transform: scale(1.1); background: rgba(0, 0, 0, 0.9); }

  /* --- ZONES --- */
  .interaction-layer {
    position: absolute;
    inset: 0;
  }

  .candle-zone {
    position: absolute;
    width: 4%;   /* Slightly wider to make clicking easier */
    height: 9%; /* Taller to ensure the flame fits inside */
    transform: translate(-50%, 0); 
    cursor: pointer;
    /* border: 1px solid rgba(255,0,0,0.5); /* Keep this on for one more test! */
    display: flex;
    justify-content: center;
    align-items: flex-end; /* This aligns the flame image to the bottom of the box */
  }

  .clickable:hover {
    background: radial-gradient(circle, rgba(255, 165, 0, 0.2) 0%, transparent 70%);
  }

  .flame-sprite {
    width: 100%; /* Fill the width of the zone */
    height: auto;
    /* Removed the negative translateY so it sits flush on the bottom line (the wick) */
    transform-origin: bottom center; 
    filter: drop-shadow(0 0 8px rgba(255, 140, 0, 0.6));
    animation: flicker 1.5s infinite alternate ease-in-out;
  }

  /* Improved flicker animation */
  @keyframes flicker {
    0%   { transform: scale(1) rotate(-2deg); opacity: 0.9; }
    25%  { transform: scale(1.05) rotate(2deg); opacity: 1; }
    50%  { transform: scale(0.98) rotate(-1deg); opacity: 0.85; }
    75%  { transform: scale(1.02) rotate(1deg); opacity: 1; }
    100% { transform: scale(1) rotate(-2deg); opacity: 0.9; }
  }

  .success-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at center, transparent 30%, rgba(20, 20, 20, 0.5) 100%);
    box-shadow: inset 0 0 50px rgba(100, 255, 100, 0.2);
    animation: pulse-success 2s ease-in-out infinite;
  }

  @keyframes pulse-success {
    0% { box-shadow: inset 0 0 30px rgba(255, 215, 0, 0.1); }
    50% { box-shadow: inset 0 0 80px rgba(255, 215, 0, 0.3); }
    100% { box-shadow: inset 0 0 30px rgba(255, 215, 0, 0.1); }
  }
</style>