<svelte:options customElement="final-door-widget" />

<script>
  export let puzzle = null;

  let keyword = "";

  $: keywordSolved = !!puzzle?.keywordSolved;
  $: finalDoorOpen = !!puzzle?.finalDoorOpen;
  $: wizardRunesLit = !!puzzle?.wizardRunesLit;
  $: alchemistRunesLit = !!puzzle?.alchemistRunesLit;
  $: leftPlatePressed = !!puzzle?.plates?.left?.pressed;
  $: rightPlatePressed = !!puzzle?.plates?.right?.pressed;
  $: platesReady = keywordSolved && !finalDoorOpen;
  $: attempts = Number(puzzle?.keywordAttempts || 0);
  $: lastError = puzzle?.lastError || null;
  $: statusMessage = finalDoorOpen
    ? "The final passage is open."
    : platesReady
      ? "The pressure plates are now armed."
      : wizardRunesLit && alchemistRunesLit
        ? "Both rune groups are active. Enter the word."
        : "The door is still waiting for both rune groups.";

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
    <button class="close-btn" on:click={close} aria-label="Close final door console">x</button>

    <div class="eyebrow">Final Corridor</div>
    <h3>Rune Console</h3>
    <p class="status-copy">{statusMessage}</p>

    <div class="status-grid">
      <div class:ready={wizardRunesLit}>Wizard runes</div>
      <div class:ready={wizardRunesLit}>{wizardRunesLit ? "lit" : "missing"}</div>
      <div class:ready={alchemistRunesLit}>Alchemist runes</div>
      <div class:ready={alchemistRunesLit}>{alchemistRunesLit ? "lit" : "missing"}</div>
      <div class:ready={keywordSolved}>Keyword</div>
      <div class:ready={keywordSolved}>{keywordSolved ? "solved" : "pending"}</div>
      <div class:ready={platesReady || finalDoorOpen}>Plates</div>
      <div class:ready={platesReady || finalDoorOpen}>
        {finalDoorOpen ? "completed" : platesReady ? "armed" : "locked"}
      </div>
      <div class:ready={leftPlatePressed || finalDoorOpen}>Left plate</div>
      <div class:ready={leftPlatePressed || finalDoorOpen}>
        {finalDoorOpen ? "pressed" : leftPlatePressed ? "held" : "idle"}
      </div>
      <div class:ready={rightPlatePressed || finalDoorOpen}>Right plate</div>
      <div class:ready={rightPlatePressed || finalDoorOpen}>
        {finalDoorOpen ? "pressed" : rightPlatePressed ? "held" : "idle"}
      </div>
      <div>Attempts</div>
      <div>{attempts}</div>
    </div>

    <div class="input-row">
      <input
        type="text"
        value={keyword}
        on:input={(e) => (keyword = e.currentTarget.value)}
        on:keydown={onInputKeyDown}
        placeholder="Enter the final word"
        disabled={finalDoorOpen}
      />
      <button class="primary" on:click={submitKeyword} disabled={finalDoorOpen}>Submit</button>
    </div>

    <div class="hint-card">
      <div class="hint-header">
        <span>Rune legend</span>
      </div>
      <p class="hint-empty">
        Use the rune note your team already uncovered in the room or inventory to decode the symbols on the door.
      </p>
    </div>

    {#if lastError}
      <p class="error">Last response: {lastError}</p>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(circle at top, rgba(250, 204, 21, 0.14), transparent 32%),
      rgba(3, 7, 18, 0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 60;
    padding: 20px;
  }

  .panel {
    width: min(760px, 94vw);
    background:
      linear-gradient(180deg, rgba(21, 35, 48, 0.98), rgba(8, 15, 27, 0.98));
    color: #eef6ff;
    border: 1px solid rgba(125, 211, 252, 0.28);
    box-shadow:
      0 28px 80px rgba(0, 0, 0, 0.55),
      inset 0 0 0 1px rgba(250, 204, 21, 0.08);
    border-radius: 18px;
    padding: 22px;
    position: relative;
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    background: rgba(248, 250, 252, 0.12);
    color: #f8fafc;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 11px;
    color: #fcd34d;
    margin-bottom: 6px;
  }

  h3 {
    margin: 0;
    font-size: clamp(24px, 3.5vw, 32px);
  }

  .status-copy {
    margin: 10px 0 18px;
    color: rgba(226, 232, 240, 0.88);
  }

  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 14px;
    margin-bottom: 18px;
    font-size: 14px;
    padding: 14px;
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.52);
    border: 1px solid rgba(148, 163, 184, 0.14);
  }

  .ready {
    color: #bbf7d0;
  }

  .input-row {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
  }

  input {
    flex: 1;
    min-width: 0;
    border: 1px solid rgba(125, 211, 252, 0.28);
    border-radius: 12px;
    background: rgba(2, 6, 23, 0.9);
    color: #fff;
    padding: 12px 14px;
    outline: none;
  }

  input:focus {
    border-color: rgba(250, 204, 21, 0.45);
    box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.12);
  }

  button {
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 12px;
    color: #fff;
    cursor: pointer;
    padding: 10px 14px;
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  button:hover:enabled {
    transform: translateY(-1px);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .primary {
    background: linear-gradient(180deg, rgba(37, 99, 235, 0.9), rgba(29, 78, 216, 0.92));
    border-color: rgba(147, 197, 253, 0.32);
  }

  .hint-card {
    padding: 14px;
    border-radius: 14px;
    background: rgba(9, 14, 26, 0.76);
    border: 1px solid rgba(250, 204, 21, 0.14);
  }

  .hint-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .hint-empty {
    margin: 0;
    font-size: 13px;
    color: rgba(191, 219, 254, 0.74);
  }

  .error {
    margin: 14px 0 0;
    color: #fecaca;
    font-size: 12px;
  }

  @media (max-width: 640px) {
    .panel {
      padding: 18px;
      border-radius: 16px;
    }

    .status-grid {
      font-size: 13px;
    }

    .input-row {
      flex-direction: column;
    }

  }
</style>
