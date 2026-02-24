<svelte:options customElement="candle-hint-widget" />

<script>
  import hintImg from "../../assets/wizard_library/candles.png"; //TODO: just for testing, replace with actual hint image

  function closeWidget() {
    // Sends the CLOSE intent. The RoomView catches this and unmounts the widget.
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'trigger_wiz_hint_candles', verb: 'CLOSE', data: {} },
      bubbles: true, 
      composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  
  <div class="hint-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>✕</button>
    
    <img src={hintImg} alt="Candle Puzzle Hint" class="hint-image" />
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

  .hint-wrapper {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    justify-content: center;
    align-items: center;
    /* Optional: Adds a nice dark frame behind the paper/hint */
    background: rgba(20, 15, 10, 0.9);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
    border: 1px solid #3a2e22;
  }

  .hint-image {
    max-width: 100%;
    max-height: calc(90vh - 40px);
    object-fit: contain;
    user-select: none;
  }

  .close-btn {
    position: absolute;
    top: -15px;
    right: -15px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.9);
    color: #f4e4bc;
    border: 2px solid #8b7355;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: transform 0.2s ease;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  }
  
  .close-btn:hover { 
    transform: scale(1.1);
    background: #1a1510;
  }
</style>