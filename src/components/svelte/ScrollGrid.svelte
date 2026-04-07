<svelte:options customElement="tictactoe-scroll-widget" />

<script>
  import scrollSrc from "../../assets/wizard_library/scroll-grid.png";
  import xSrc from "../../assets/wizard_library/x.png";
  import oSrc from "../../assets/wizard_library/o.png";

  export let grid = null;

  let isGlowing = false;

  $: boardArr = grid?.board || Array(9).fill(null);
  $: message = grid?.message || "";
  $: score = grid?.score || { player: 0, ghost: 0 };
  $: round = grid?.round || 1;

  $: if (boardArr) {
    triggerGlow();
  }

  function triggerGlow() {
    isGlowing = true;
    setTimeout(() => { isGlowing = false; }, 800);
  }

  function handleCellClick(idx) {
    if (boardArr[idx]) return;

    const event = new CustomEvent('intent', {
      detail: {
        objectId: 'puzzle_tictactoe_scroll',
        verb: 'PLACE_MARK',
        data: { index: idx, mark: 'X' }
      },
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }

  function close() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'trigger_tictactoe_scroll', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="scroll-container">
  <div class="scroll-wrapper">
    <img src={scrollSrc} alt="Scroll" class="bg-scroll" />
    
    <div class="content-overlay">
      <div class="text-area">
        <p class="ghost-message">{message}</p>
        <p class="stats">Round {round} | You: {score.player} - Ghost: {score.ghost}</p>
      </div>

      <div class="grid-layout">
        {#each boardArr as cell, idx}
          <button class="cell" on:click={() => handleCellClick(idx)}>
            {#if cell === 'X'}<img src={xSrc} alt="X" class="mark"/>{/if}
            {#if cell === 'O'}<img src={oSrc} alt="O" class="mark" class:ghost-mark={isGlowing}/>{/if}
          </button>
        {/each}
      </div>
    </div>

    <button class="close-btn" on:click={close}>✕</button>
  </div>
</div>

<style>
  .scroll-container {
    position: fixed; inset: 0; display: flex; 
    align-items: center; justify-content: center;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(2px);
  }
  .scroll-wrapper { position: relative; width: 720px; aspect-ratio: 4/3; }
  .bg-scroll { width: 100%; height: 100%; object-fit: contain; }
  
  .content-overlay {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center;
  }

  .text-area { 
      margin-top: 15%; 
      text-align: center; 
    }
  
  .ghost-message { font-style: italic; font-size: 1.4rem; color: #2c1810; margin: 0; }
  .stats { font-size: 1rem; color: #4a3728; margin: 5px 0 0 0; }

  .grid-layout {
    position: absolute;
    top: 44%;
    left: 30%;   
    width: 38%;
    height: 38%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }

  .cell { 
    background: transparent; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .cell:hover { background: rgba(0,0,0,0.03); }
  .mark { width: 75%; height: 75%; object-fit: contain; }

  .close-btn {
    position: absolute; top: 15%; right: 3%;
    width: 32px; height: 32px; border-radius: 50%;
    background: #2c1810; color: #f4e4bc; border: none; cursor: pointer;
  }

  /* The Glow Effect */
  .ghost-active .bg-scroll {
    filter: drop-shadow(0 0 15px rgba(211, 198, 13, 0.6)) sepia(0.3);
    transition: filter 0.3s ease-out;
  }

  /* The Ghost's Marks glow more intensely */
  .ghost-mark {
    filter: brightness(1.5) drop-shadow(0 0 5px rgb(207, 184, 6));
  }

  /* Text Glitch Animation */
  .glitch {
    animation: glitch-anim 0.2s infinite;
    color: #b99d12 !important;
    text-shadow: 2px 0 #ff00ff, -2px 0 #d0d608;
  }

  @keyframes glitch-anim {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
  }

  .scroll-wrapper {
    transition: transform 0.1s ease-in-out;
  }

  /* Subtle shake of the whole scroll when the ghost plays */
  /* It is not working right now, we can look into it more */
  .ghost-active {
    transform: scale(1.02);
  }
</style>
