<svelte:options customElement="drawer-widget" />

<script>
  // --- ASSETS ---
  import drawerClosedImg from "../../assets/alchemist/drawer.png";
  import drawerOpenImg from "../../assets/alchemist/drawer_open.png";
  import scrollImg from "../../assets/alchemist/hirachy.png";

  export let puzzle = null;

  // --- STATE EXTRACTION ---
  $: opened = puzzle?.opened || false;
  $: scrollTaken = puzzle?.scrollTaken || false;
  $: solved = puzzle?.solved || false;

  // --- INTERACTION LOGIC ---
  function openDrawer() {
    if (!opened) {
      emitAction('open');
    }
  }

  function takeScroll() {
    if (opened && !scrollTaken) {
      emitAction('take', { item: 'SCROLL' });
      // Optionally auto-close widget shortly after taking the item
      setTimeout(closeWidget, 1000);
    }
  }

  // --- SOCKET INTENTS ---
  function emitAction(verb, data = {}) {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { 
        objectId: 'alch:drawer', // Matches backend OBJECT_ID
        verb, 
        data 
      },
      bubbles: true, 
      composed: true
    }));
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'alch:drawer', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>x</button>

    <div class="drawer-container">
      {#if !opened}
        <img 
          src={drawerClosedImg} 
          alt="Closed Drawer" 
          class="main-bg closed-view" 
          on:click={openDrawer}
          title="Open Drawer"
        />
      {:else}
        <img src={drawerOpenImg} alt="Open Drawer" class="main-bg" />

        {#if !scrollTaken}
          <img 
            src={scrollImg} 
            alt="Old Scroll" 
            class="collectable scroll" 
            on:click={takeScroll}
            title="Take Scroll"
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
    width: 90vw;
    max-width: 600px;
    aspect-ratio: 1536 / 1024; /* Match the actual background image aspect ratio */
    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.9);
    background: #1a1510; border: 2px solid #4a3b2c;
  }

  .close-btn {
    position: absolute; top: 15px; right: 15px; width: 40px; height: 40px;
    border-radius: 50%; background: rgba(0, 0, 0, 0.8); color: #f4e4bc; border: 2px solid #8b7355;
    cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; z-index: 30;
    transition: transform 0.2s;
  }
  .close-btn:hover { background: black; transform: scale(1.1); }

  .drawer-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex; justify-content: center; align-items: center;
  }

  .main-bg {
    width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none;
  }

  .closed-view {
    cursor: pointer;
    pointer-events: auto; /* Allow clicking the background image when closed */
    transition: filter 0.3s ease;
  }
  .closed-view:hover {
    filter: brightness(1.1) contrast(1.1);
  }

  /* --- COLLECTABLE ITEM --- */
  .collectable {
    position: absolute;
    height: auto;
    object-fit: contain;
    cursor: pointer;
    z-index: 10;
    transition: transform 0.2s ease, filter 0.2s ease;
    filter: drop-shadow(0 5px 8px rgba(0,0,0,0.8));
  }

  .collectable:hover {
    filter: brightness(1.3) drop-shadow(0 0 10px rgba(255, 215, 0, 0.6));
    transform: scale(1.03);
  }

  /* ðŸ› ï¸ POSITIONING TUNING ðŸ› ï¸
     Adjust these percentage values until the scroll sits perfectly 
     inside the dark slot of the open drawer image.
  */
  
  .scroll {
    top: 20%; /* Position vertically inside the open drawer gap */
    left: 40%; /* Position horizontally */
    width: 20%; /* Scale the scroll image appropriately */
    transform: rotate(-5deg); /* Slight angle for realism */
    animation: fadeIn 0.5s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: rotate(-5deg) translateY(-10px); }
    to { opacity: 1; transform: rotate(-5deg) translateY(0); }
  }
</style>
