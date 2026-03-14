<svelte:options customElement="portrait-widget" />

<script>
  // --- ASSETS ---
  import portraitClosedImg from "../../assets/alchemist/portrait.png";
  import portraitOpenImg from "../../assets/alchemist/portrait_open.png";
  import featherImg from "../../assets/alchemist/feather.png";
  import goldImg from "../../assets/alchemist/goldnugget.png";

  export let puzzle = null;

  // --- STATE EXTRACTION ---
  $: opened = puzzle?.opened || false;
  $: featherTaken = puzzle?.featherTaken || false;
  $: goldTaken = puzzle?.goldTaken || false;
  $: solved = puzzle?.solved || false;
  $: currentAspectRatio = opened ? "1264 / 843" : "1665 / 1228";

  // --- INTERACTION LOGIC ---
  function openPortrait() {
    if (!opened) {
      emitAction('open');
    }
  }

  function takeItem(itemKey) {
    emitAction('take', { item: itemKey });
  }

  // --- SOCKET INTENTS ---
  function emitAction(verb, data = {}) {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { 
        objectId: 'alch:portrait', // Matches backend OBJECT_ID
        verb, 
        data 
      },
      bubbles: true, 
      composed: true
    }));
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'alch:portrait', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" style={`aspect-ratio: ${currentAspectRatio};`} on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>✕</button>

    <div class="portrait-container">
      {#if !opened}
        <img 
          src={portraitClosedImg} 
          alt="Portrait" 
          class="main-bg closed-view" 
          on:click={openPortrait}
          title="Examine Portrait"
        />
      {:else}
        <img src={portraitOpenImg} alt="Opened Portrait" class="main-bg" />

        {#if !featherTaken}
          <img 
            src={featherImg} 
            alt="Feather" 
            class="collectable feather" 
            on:click={() => takeItem('FEATHER')}
            title="Take Feather"
          />
        {/if}

        {#if !goldTaken}
          <img 
            src={goldImg} 
            alt="Gold Nugget" 
            class="collectable gold" 
            on:click={() => takeItem('GOLD_NUGGET')}
            title="Take Gold Nugget"
          />
        {/if}
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
    width: min(68vw, 720px);
    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.9);
    background: #0a0a0a; border: 4px solid #8b7355; /* Fancy frame border */
  }

  .close-btn {
    position: absolute; top: 12px; right: 12px; width: 34px; height: 34px;
    border-radius: 50%; background: rgba(0, 0, 0, 0.8); color: #f4e4bc; border: 2px solid #8b7355;
    cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; z-index: 30;
    transition: transform 0.2s;
  }
  .close-btn:hover { background: black; transform: scale(1.1); }

  .portrait-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex; justify-content: center; align-items: center;
  }

  .main-bg {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }

  .closed-view {
    cursor: pointer;
    pointer-events: auto;
    transition: filter 0.3s ease;
  }
  .closed-view:hover {
    filter: brightness(1.2);
  }

  /* --- COLLECTABLE ITEMS --- */
  .collectable {
    position: absolute;
    height: auto;
    object-fit: contain;
    cursor: pointer;
    z-index: 10;
    transition: transform 0.2s ease, filter 0.2s ease;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.7));
  }

  .collectable:hover {
    filter: brightness(1.3) drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
    transform: scale(1.05);
  }

  /* 🛠️ POSITIONING TUNING 🛠️
     Adjust these percentage values until the items sit perfectly on the 
     shelves within your portrait_open.jpg.
  */
  
  .feather {
    top: 17%; /* Mid-height shelf */
    left: 58%;
    width: 5%; /* Adjust size */
    transform: rotate(20deg); /* Slanted slightly */
  }

  .gold {
    top: 65%; /* Lower shelf */
    right: 38%;
    width: 5%; /* Small nugget */
  }
</style>
