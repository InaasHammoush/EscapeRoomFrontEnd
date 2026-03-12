<svelte:options customElement="alch-east-door-widget" />

<script>
  import doorCloseupImg from "../../assets/alchemist/final_door_closeup.png";
  import doorSolvedImg from "../../assets/alchemist/final_door_solved.png";

  export let puzzle = null;
  export let inventory = [];
  let keyholeActive = false;

  $: hasGoldenKey = Array.isArray(inventory) && inventory.some(
    (entry) => String(entry?.item || "").toUpperCase() === "GOLDEN_KEY" && Number(entry?.count || 0) > 0
  );
  $: lockVisible = !!puzzle?.lockVisible;
  $: keyInserted = !!puzzle?.keyInserted;
  $: runesActivated = !!puzzle?.runesActivated;
  $: mechanismTriggered = !!puzzle?.mechanismTriggered;
  $: doorOpen = !!(puzzle?.open || puzzle?.opened);
  $: doorImage = keyInserted ? doorSolvedImg : doorCloseupImg;

  function emitIntent(objectId, verb, data = {}) {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: { objectId, verb, data },
      bubbles: true,
      composed: true,
    }));
  }

  function insertKey() {
    if (keyInserted || !hasGoldenKey) return;
    emitIntent("alch:east-door-lock", "insert", { item: "GOLDEN_KEY" });
  }

  function close() {
    emitIntent("trigger_east_door", "CLOSE");
  }

  function onDragOver(event) {
    if (keyInserted || !lockVisible) return;
    const item = String(event?.dataTransfer?.getData("application/x-inventory-item") || "").toUpperCase();
    if (item !== "GOLDEN_KEY") return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    keyholeActive = true;
  }

  function onDragLeave() {
    keyholeActive = false;
  }

  function onDrop(event) {
    keyholeActive = false;
    if (keyInserted || !lockVisible) return;
    const item = String(event?.dataTransfer?.getData("application/x-inventory-item") || "").toUpperCase();
    if (item !== "GOLDEN_KEY") return;
    event.preventDefault();
    insertKey();
  }
</script>

<div class="overlay">
  <div class="panel" on:click|stopPropagation>
    <button class="close-btn" on:click={close}>x</button>

    <div
      class="door-dropzone"
      class:active={keyholeActive && !keyInserted}
      on:dragover={onDragOver}
      on:dragleave={onDragLeave}
      on:drop={onDrop}
    >
      <img src={doorImage} alt="Alchemist east door" class="door-image" />
    </div>

    {#if !keyInserted}
      <button class="action-btn" on:click={insertKey} disabled={!lockVisible || !hasGoldenKey}>
        {#if !lockVisible}
          Lock hidden
        {:else if hasGoldenKey}
          Insert Golden Key
        {:else}
          Golden Key Required
        {/if}
      </button>
    {/if}

    {#if doorOpen}
      <p class="status-text">The door mechanism yields. The eastern passage is open.</p>
    {:else if keyInserted && !runesActivated}
      <p class="status-text">The key settles into place, but the runes remain dormant.</p>
    {:else if keyInserted}
      <p class="status-text">The key locks in place. Close this view and touch the door.</p>
    {:else}
      <p class="status-text">A heavy lock plate blocks the way.</p>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.7);
  }

  .panel {
    position: relative;
    width: min(540px, 92vw);
    background: #17120d;
    border: 2px solid #7c6949;
    border-radius: 14px;
    padding: 24px;
    display: grid;
    gap: 16px;
    justify-items: center;
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
  }

  .door-image {
    width: min(420px, 84vw);
    height: auto;
    object-fit: contain;
    border-radius: 10px;
  }

  .door-dropzone {
    width: min(420px, 84vw);
    border-radius: 12px;
    transition: box-shadow 120ms ease, transform 120ms ease;
  }

  .door-dropzone.active {
    box-shadow: 0 0 0 3px rgba(243, 229, 191, 0.7);
    transform: scale(1.01);
  }

  .action-btn {
    border: 1px solid #8f734a;
    background: #2f281f;
    color: #e8d6b3;
    padding: 11px 18px;
    border-radius: 8px;
    cursor: pointer;
    min-width: 220px;
  }
  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .status-text {
    margin: 0;
    color: #e8d6b3;
    text-align: center;
  }

  .close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: none;
    background: #30271f;
    color: #e8d6b3;
    cursor: pointer;
  }
</style>
