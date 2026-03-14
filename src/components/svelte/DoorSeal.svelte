<svelte:options customElement="door-seal-widget" />

<script>
  import keyHoleImg from "../../assets/wizard_library/key_hole.png";
  import keyHoleWithKeyImg from "../../assets/wizard_library/key_hole_with_key.png";

  export let puzzle = null;
  export let inventory = [];

  $: hasKeyInserted = !!puzzle?.hasKey;
  $: isOpenable = !!puzzle?.openable;
  $: hasAshKey = Array.isArray(inventory) && inventory.some(
    (entry) => String(entry?.item || "").toUpperCase() === "ASH_KEY" && Number(entry?.count || 0) > 0
  );

  function insertKey() {
    if (hasKeyInserted || !hasAshKey) return;

    document.dispatchEvent(new CustomEvent("intent", {
      detail: {
        objectId: "puzzle_door_seal",
        verb: "INSERT",
        data: { item: "ASH_KEY" },
      },
      bubbles: true,
      composed: true,
    }));
  }

  function close() {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: { objectId: "trigger_door_seal", verb: "CLOSE" },
      bubbles: true,
      composed: true,
    }));
  }
</script>

<div class="overlay">
  <div class="panel" on:click|stopPropagation>
    <button class="close-btn" on:click={close}>x</button>
    <img
      src={hasKeyInserted ? keyHoleWithKeyImg : keyHoleImg}
      alt="Door Seal"
      class="seal-image"
    />

    {#if !hasKeyInserted}
      <button class="action-btn" on:click={insertKey} disabled={!hasAshKey}>
        {hasAshKey ? "Insert Ash Key" : "Ash Key Required"}
      </button>
    {:else if isOpenable}
      <p class="status">The seal breaks. Close this view and click the door.</p>
    {:else}
      <p class="status">The key fits, but something still blocks the door.</p>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.65);
  }

  .panel {
    position: relative;
    width: min(540px, 92vw);
    background: #1c1a17;
    border: 2px solid #5f4d33;
    border-radius: 12px;
    padding: 24px;
    display: grid;
    gap: 16px;
    justify-items: center;
  }

  .seal-image {
    width: min(420px, 84vw);
    height: auto;
    object-fit: contain;
  }

  .action-btn {
    border: 1px solid #8f734a;
    background: #2f281f;
    color: #e8d6b3;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .status {
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

