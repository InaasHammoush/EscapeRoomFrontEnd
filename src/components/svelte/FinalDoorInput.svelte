<svelte:options customElement="final-door-widget" />

<script>
  export let puzzle = null;

  let keyword = "";

  $: keywordSolved = !!puzzle?.keywordSolved;
  $: finalDoorOpen = !!puzzle?.finalDoorOpen;
  $: wizardRunesLit = !!puzzle?.wizardRunesLit;
  $: alchemistRunesLit = !!puzzle?.alchemistRunesLit;
  $: attempts = Number(puzzle?.keywordAttempts || 0);
  $: lastError = puzzle?.lastError || null;
  $: hintRevealed = !!puzzle?.hintRevealed;
  $: runeHint = puzzle?.runeHint || null;

  function emitIntent(objectId, verb, data = {}) {
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: { objectId, verb, data },
        bubbles: true,
        composed: true,
      })
    );
  }

  function submitKeyword() {
    const word = String(keyword || "").trim();
    if (!word) return;
    emitIntent("final:door-keypad", "submit", { word });
    keyword = "";
  }

  function revealHint() {
    emitIntent("final:hint-note", "read");
  }

  function close() {
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: { objectId: "trigger_final_keypad", verb: "CLOSE", data: {} },
        bubbles: true,
        composed: true,
      })
    );
  }

  function onInputKeyDown(e) {
    if (e.key === "Enter") submitKeyword();
  }
</script>

<div class="overlay" on:click={close}>
  <div class="panel" on:click={(e) => e.stopPropagation()}>
    <button class="close-btn" on:click={close}>x</button>
    <h3>Final Door Console</h3>

    <div class="status-grid">
      <div>Wizard runes</div>
      <div class:warn={!wizardRunesLit}>{wizardRunesLit ? "ready" : "missing"}</div>
      <div>Alchemist runes</div>
      <div class:warn={!alchemistRunesLit}>{alchemistRunesLit ? "ready" : "missing"}</div>
      <div>Keyword solved</div>
      <div>{keywordSolved ? "yes" : "no"}</div>
      <div>Door open</div>
      <div>{finalDoorOpen ? "yes" : "no"}</div>
      <div>Attempts</div>
      <div>{attempts}</div>
    </div>

    <div class="input-row">
      <input
        type="text"
        value={keyword}
        on:input={(e) => (keyword = e.currentTarget.value)}
        on:keydown={onInputKeyDown}
        placeholder="Enter final word..."
        disabled={finalDoorOpen}
      />
      <button on:click={submitKeyword} disabled={finalDoorOpen}>Submit</button>
    </div>

    <div class="hint-row">
      <button on:click={revealHint}>Read Rune Hint</button>
      {#if hintRevealed && runeHint}
        <div class="hint-text">
          {#each Object.entries(runeHint) as [rune, letter]}
            <span>{rune}: {letter}</span>
          {/each}
        </div>
      {/if}
    </div>

    {#if lastError}
      <p class="error">Error: {lastError}</p>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 60;
  }

  .panel {
    width: min(760px, 92vw);
    background: #171717;
    color: #f5f5f5;
    border: 1px solid #434343;
    border-radius: 12px;
    padding: 20px;
    position: relative;
  }

  .close-btn {
    position: absolute;
    top: 8px;
    right: 10px;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
  }

  h3 {
    margin: 0 0 14px;
  }

  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
    margin-bottom: 14px;
    font-size: 14px;
  }

  .warn {
    color: #fca5a5;
  }

  .input-row {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  input {
    flex: 1;
    min-width: 0;
    border: 1px solid #666;
    border-radius: 8px;
    background: #0f0f0f;
    color: #fff;
    padding: 10px 12px;
  }

  button {
    border: 1px solid #666;
    border-radius: 8px;
    background: #222;
    color: #fff;
    cursor: pointer;
    padding: 8px 12px;
  }

  .hint-row {
    display: grid;
    gap: 10px;
  }

  .hint-text {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    color: #d4d4d4;
  }

  .error {
    margin-top: 10px;
    color: #fca5a5;
    font-size: 12px;
  }
</style>
