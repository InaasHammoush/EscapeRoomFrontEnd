<svelte:options customElement="bookshelf-widget" />

<script>
  import shelfBg from "../../assets/wizard_library/bookshelf_bg.png";
  import bookRed from "../../assets/wizard_library/book_red.png";
  import bookGreen from "../../assets/wizard_library/book_green.png";
  import bookBlue from "../../assets/wizard_library/book_blue.png";
  import bookYellow from "../../assets/wizard_library/book_yellow.png";

  export let puzzle = null;

  // Reactively pull state from the server object
  $: currentOrder = puzzle?.currentOrder || ["BOOK_RED", "BOOK_GREEN", "BOOK_BLUE", "BOOK_YELLOW"];
  $: solved = puzzle?.solved || false;

  // Helper to map backend IDs to imported images
  function getBookImage(bookId) {
    switch(bookId) {
      case 'BOOK_RED': return bookRed;
      case 'BOOK_GREEN': return bookGreen;
      case 'BOOK_BLUE': return bookBlue;
      case 'BOOK_YELLOW': return bookYellow;
      default: return null;
    }
  }

  // --- Drag and Drop Handlers ---
  function handleDragStart(e, index) {
    if (solved) {
      e.preventDefault(); // Prevent dragging if already solved
      return;
    }
    // Store the starting index
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    if (!solved) e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, toIndex) {
    e.preventDefault();
    if (solved) return;

    // Retrieve the starting index
    const fromIndexStr = e.dataTransfer.getData("text/plain");
    if (!fromIndexStr) return;
    
    const fromIndex = parseInt(fromIndexStr, 10);

    // If the book was dropped in a new slot, tell the server
    if (fromIndex !== toIndex && !isNaN(fromIndex)) {
      emitAction('REORDER', { fromIndex, toIndex });
    }
  }

  // --- Socket Intents ---
  function emitAction(verb, data = {}) {
    const event = new CustomEvent('intent', {
      detail: {
        objectId: 'puzzle_bookshelf',
        verb,
        data
      },
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }

  function closeWidget() {
    // Tells the frontend RoomView to close this widget
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'trigger_bookshelf', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="shelf-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>x</button>

    <img src={shelfBg} alt="Bookshelf" class="shelf-bg" />

    <div class="books-container" class:solved-glow={solved}>
      {#each currentOrder as bookId, index}
        <div 
          class="book-slot"
          on:dragover={handleDragOver}
          on:drop={(e) => handleDrop(e, index)}
        >
          <img 
            src={getBookImage(bookId)} 
            alt={bookId} 
            class="book-image"
            draggable={!solved}
            on:dragstart={(e) => handleDragStart(e, index)}
            class:grabbable={!solved}
          />
        </div>
      {/each}
    </div>

  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    z-index: 50;
  }

  .shelf-wrapper {
    position: relative;
    width: min(95vw, calc(90vh * 1024 / 1230));
    aspect-ratio: 1024 / 1230;
    display: flex;
    justify-content: center;
  }

  .shelf-bg {
    width: 100%;
    height: 100%;
    object-fit: cover; 
    border-radius: 10px;
    user-select: none;
    pointer-events: none;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }

  .close-btn {
    position: absolute;
    top: 3%;
    right: 4%;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: #f4e4bc;
    border: 2px solid #8b7355;
    cursor: pointer;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.2s ease;
  }
  
  .close-btn:hover { background: rgba(0, 0, 0, 0.9); transform: scale(1.1); }

  /* --- THE INVISIBLE TARGET BOX --- */
  .books-container {
    position: absolute;
    top: 35.5%;    
    height: 24.5%; 
    left: 10%;   
    width: 45%;
    display: flex;

    /* Pack the books starting from the left edge of this box */
    justify-content: flex-start; 
    
    /* TIGHTENED SPACING: Remove the gap between books */
    gap: 0px; 
    
    align-items: flex-end; 
    padding-bottom: 2%;
    transition: filter 0.5s ease;
    
  }

  .solved-glow {
    filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.7));
  }

  .book-slot {
    height: 100%;
    display: flex;
    align-items: flex-end;
    padding: 0; 
  }

  .book-image {
    max-height: 100%;
    width: auto; 
    object-fit: contain;
    transition: transform 0.2s ease, filter 0.2s ease;
    filter: drop-shadow(0 8px 6px rgba(0, 0, 0, 0.8)); 
  }

  .grabbable { cursor: grab; }
  .grabbable:hover {
    transform: translateY(-5px) scale(1.02);
    filter: brightness(1.15) drop-shadow(0 12px 8px rgba(0, 0, 0, 0.9));
  }
  .grabbable:active { cursor: grabbing; transform: scale(0.98); }
</style>

