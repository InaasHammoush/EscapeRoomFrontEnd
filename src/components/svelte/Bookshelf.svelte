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
        objectId: 'bookshelf_puzzle', // Matches your backend apply() router
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
      detail: { objectId: 'bookshelf_01', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="shelf-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>✕</button>

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
    width: 800px; /* Adjust based on your background image ratio */
    max-width: 90vw;
    aspect-ratio: 16/9; /* Update this to match your shelf image */
    display: flex;
    justify-content: center;
  }

  .shelf-bg {
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
  }

  .close-btn {
    position: absolute;
    top: 5%;
    right: 5%;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: #f4e4bc;
    border: 2px solid #8b7355;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  .close-btn:hover { background: rgba(0, 0, 0, 0.9); }

  /* This container positions the row of books over the drawn shelf in the image.
    Adjust top, left, width, and height so it aligns perfectly with the art.
  */
  .books-container {
    position: absolute;
    top: 45%;    
    left: 20%;   
    width: 60%;  
    height: 35%; 
    display: flex;
    justify-content: center;
    align-items: flex-end; /* Aligns books to the bottom "shelf" line */
    gap: 10px;
    transition: filter 0.5s ease;
  }

  .solved-glow {
    filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.6)); /* Golden glow when won */
  }

  .book-slot {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .book-image {
    max-height: 100%;
    width: auto;
    object-fit: contain;
    transition: transform 0.1s ease;
  }

  .grabbable {
    cursor: grab;
  }
  .grabbable:active {
    cursor: grabbing;
    transform: scale(0.95);
  }
</style>