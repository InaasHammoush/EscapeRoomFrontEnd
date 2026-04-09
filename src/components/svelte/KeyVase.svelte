<svelte:options customElement="vase-widget" />

<script>
  // --- ASSETS ---
  import vaseBg from "../../assets/wizard_library/empty_vase.png";
  import keyImg from "../../assets/wizard_library/chest_key.png";

  export let puzzle = null;

  $: keyTaken = puzzle?.keyTaken || false;

  function takeKey() {
    if (!keyTaken) {
      document.dispatchEvent(new CustomEvent('intent', {
        detail: { 
          objectId: 'puzzle_vase', 
          verb: 'TAKE', 
          data: {} 
        },
        bubbles: true, composed: true
      }));
    }
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'trigger_key_vase', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>âœ•</button>

    <img src={vaseBg} alt="Vase" class="bg-image" />

    {#if !keyTaken}
      <img 
        src={keyImg} 
        alt="Chest Key" 
        class="hidden-key" 
        on:click={takeKey}
        draggable="false"
      />
    {/if}
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(4px); z-index: 50;
  }

  .widget-wrapper {
    position: relative; 
    width: min(95vw, calc(85vh * 1024 / 565));
    aspect-ratio: 1024 / 565; /* Match the actual background image aspect ratio */
    display: flex; justify-content: center; align-items: center;
    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    background: #0a0a0a;
  }

  .bg-image { 
    width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; 
  }

  .close-btn {
    position: absolute; top: 15px; right: 15px; width: 40px; height: 40px;
    border-radius: 50%; background: rgba(0, 0, 0, 0.8); color: #f4e4bc; border: 2px solid #8b7355;
    cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; z-index: 20;
    transition: transform 0.2s;
  }
  .close-btn:hover { background: black; transform: scale(1.1); }

  .hidden-key {
    position: absolute;
    top: 55%;
    left: 49%;
    width: 5%;
    height: auto;
    object-fit: contain;
    cursor: pointer;
    transform: rotate(106deg);
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.7)) brightness(0.8);
    transition: filter 0.2s ease, transform 0.2s ease;
  }

  .hidden-key:hover {
    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)) brightness(1.2);
    /* transform: rotate(70deg) scale(1.1); */
  }
</style>

