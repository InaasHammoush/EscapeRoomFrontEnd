<svelte:options customElement="transmuter-widget" />

<script>
  import parchmentEmptyBg from "../../assets/alchemist/parchment_empty.png";

  export let puzzle = null;

  function close() {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: { objectId: "puzzle_transmuter", verb: "CLOSE" },
      bubbles: true,
      composed: true
    }));
  }
</script>

<div class="overlay" on:click={close}>
  <div class="transmuter-container" on:click={(e) => e.stopPropagation()}>
    <button class="close-btn" on:click={close}>x</button>
    <img src={parchmentEmptyBg} alt="Transmuter" class="transmuter-bg" />
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
    width: 550px;
    aspect-ratio: 1;
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

  .transmuter-bg {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
</style>
