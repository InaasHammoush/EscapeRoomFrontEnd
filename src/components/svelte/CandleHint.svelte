<svelte:options customElement="candle-hint-widget" />

<script>
  // --- ASSETS ---
  import shelfBg from "../../assets/wizard_library/bookStack_bg.png"; 
  import openBook1 from "../../assets/wizard_library/bookStack_book1.png";
  import openBook2 from "../../assets/wizard_library/bookStack_book2.png";
  import openBook3 from "../../assets/wizard_library/bookStack_book3.png";
  import openBook4 from "../../assets/wizard_library/bookStack_book4.png";
  import openBook5 from "../../assets/wizard_library/bookStack_book5.png";

  let activeBookImg = null;

  // --- HOTSPOTS ---
  const clickableBooks = [
    { 
      id: "top_book", 
      top: "36%", left: "28%", width: "37%", height: "3.5%", 
      openImage: openBook1
    },
    { 
      id: "first_middle_book", 
      top: "53%", left: "28%", width: "41%", height: "4%", 
      openImage: openBook2 
    },
    { 
      id: "side_book", 
      top: "56%", left: "17%", width: "6%", height: "23%", 
      openImage: openBook3
    },
    { 
      id: "second_middle_book", 
      top: "57%", left: "32%", width: "39%", height: "4%", 
      openImage: openBook4
    },
    { 
      id: "second_book", 
      top: "39.5%", left: "31%", width: "28%", height: "3.5%", 
      openImage: openBook5
    }
  ];

  function openBook(imgSrc) {
    activeBookImg = imgSrc;
  }

  function closeOpenBook() {
    activeBookImg = null;
  }

  function closeWidget() {
    // If a book is open, close the book first. Otherwise, close the whole widget.
    if (activeBookImg) {
      closeOpenBook();
    } else {
      document.dispatchEvent(new CustomEvent('intent', {
        detail: { objectId: 'trigger_wiz_hint_candles', verb: 'CLOSE' }, 
        bubbles: true, composed: true
      }));
    }
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>
      {activeBookImg ? "←" : "x"}
    </button>

    {#if activeBookImg}
      <div class="open-book-container">
        <img src={activeBookImg} alt="Open Book" class="open-book-img" />
      </div>
    {:else}
      <img src={shelfBg} alt="Book Stack" class="shelf-bg" />
      
      {#each clickableBooks as book}
        <div 
          class="hotspot"
          style="top: {book.top}; left: {book.left}; width: {book.width}; height: {book.height};"
          on:click={() => openBook(book.openImage)}
          title="Examine book"
        ></div>
      {/each}
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
    height: 90vh; 
    aspect-ratio: 2/3; 
    max-width: 95vw;
    display: flex; justify-content: center; align-items: center;
    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    background: #0a0a0a;
  }

  .shelf-bg { 
    width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; 
  }

  .close-btn {
    position: absolute; top: 15px; right: 15px; width: 40px; height: 40px;
    border-radius: 50%; background: rgba(0, 0, 0, 0.8); color: #f4e4bc; border: 2px solid #8b7355;
    cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; z-index: 20;
    transition: transform 0.2s;
  }
  .close-btn:hover { background: black; transform: scale(1.1); }

  /* --- HOTSPOT STYLING --- */
  .hotspot {
    position: absolute;
    cursor: pointer;
    border-radius: 4px;
    
    /* Hover effect: slight glowing overlay so the player knows it's clickable */
    transition: background 0.2s ease, box-shadow 0.2s ease;
    
    /* DEBUG MODE: Uncomment the border line below to see clickable zones while aligning them! */
    /* border: 2px solid rgba(255, 0, 0, 0.6); */
  }

  .hotspot:hover {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  }

  /* --- OPEN BOOK STYLING --- */
  .open-book-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .open-book-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.9));
  }
</style>