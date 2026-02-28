<svelte:options customElement="north-statue-widget" />

<script>
  import northStatueEmptySrc from "../../assets/alchemist/north_statue_empty.png";
  import statueBodyNothingSrc from "../../assets/alchemist/statue_body_nothing.png";
  import armLeftDownSrc from "../../assets/alchemist/arm_left.png";
  import armLeftMidSrc from "../../assets/alchemist/arm_midway_left.png";
  import armLeftUpSrc from "../../assets/alchemist/arm_left_up.png";
  import armRightDownSrc from "../../assets/alchemist/arm_right.png";
  import armRightMidSrc from "../../assets/alchemist/arm_midway_right.png";
  import armRightUpSrc from "../../assets/alchemist/arm_right_up.png";
  import headDownSrc from "../../assets/alchemist/head_down.png";
  import headForwardSrc from "../../assets/alchemist/head_forward.png";
  import headUpSrc from "../../assets/alchemist/head_up.png";
  import headMouthOpenSrc from "../../assets/alchemist/head_mouth_open.png";
  import featherStatueSrc from "../../assets/alchemist/feather_statue.png";
  import flammaSrc from "../../assets/alchemist/flamma.png";

  export let puzzle = null;
  export let grid = null;
  export let featherSideHint = null;
  export let featherPlacedHint = false;
  let pendingHeadPose = null;
  let pendingLeftArmPose = null;
  let pendingRightArmPose = null;
  let pendingFeatherSide = null;
  let pendingFeatherVisible = false;
  let pendingFlammaTaken = false;

  $: puzzleState = puzzle ?? grid ?? null;
  $: incomingHeadRaw = String(puzzleState?.pose?.head ?? "").toUpperCase();
  $: incomingLeftArmRaw = String(puzzleState?.pose?.leftArm ?? "").toUpperCase();
  $: incomingRightArmRaw = String(puzzleState?.pose?.rightArm ?? "").toUpperCase();
  $: serverHeadPose =
    incomingHeadRaw === "UP"
      ? "UP"
      : incomingHeadRaw === "FORWARD"
        ? "FORWARD"
        : "DOWN";
  $: serverLeftArmPose =
    incomingLeftArmRaw === "UP"
      ? "UP"
      : incomingLeftArmRaw === "HALF_UP"
        ? "HALF_UP"
        : "DOWN";
  $: serverRightArmPose =
    incomingRightArmRaw === "UP"
      ? "UP"
      : incomingRightArmRaw === "ON_CHEST"
        ? "HALF_UP"
        : "DOWN";
  $: mouthOpened = Boolean(
    puzzleState?.mouthOpened ??
    puzzleState?.output?.mouthOpened ??
    false
  );
  $: flammaReady = Boolean(
    puzzleState?.output?.flammaReady ??
    puzzleState?.flammaReady ??
    false
  );
  $: noteTaken = Boolean(
    puzzleState?.output?.noteTaken ??
    puzzleState?.noteTaken ??
    false
  );
  $: serverFeatherVisible =
    Boolean(
      puzzleState?.featherInserted ??
      puzzleState?.output?.featherInserted ??
      puzzleState?.output?.featherPlaced ??
      puzzleState?.feather?.inserted
    );
  $: serverFeatherSideRaw = String(
    puzzleState?.featherSide ??
    puzzleState?.feather?.side ??
    puzzleState?.output?.featherSide ??
    ""
  ).toUpperCase();
  $: serverFeatherSide =
    serverFeatherSideRaw === "LEFT" || serverFeatherSideRaw === "LEFT_EAR"
      ? "left"
      : serverFeatherSideRaw === "RIGHT" || serverFeatherSideRaw === "RIGHT_EAR"
        ? "right"
        : null;
  $: hintFeatherSide =
    String(featherSideHint || "").toLowerCase() === "right" ? "right" : "left";
  $: if (pendingHeadPose && pendingHeadPose === serverHeadPose) {
    pendingHeadPose = null;
  }
  $: if (pendingLeftArmPose && pendingLeftArmPose === serverLeftArmPose) {
    pendingLeftArmPose = null;
  }
  $: if (pendingRightArmPose && pendingRightArmPose === serverRightArmPose) {
    pendingRightArmPose = null;
  }
  $: if (serverFeatherVisible && pendingFeatherVisible) {
    pendingFeatherVisible = false;
  }
  $: if (serverFeatherSide && pendingFeatherSide && serverFeatherSide === pendingFeatherSide) {
    pendingFeatherSide = null;
  }
  $: if (noteTaken && pendingFlammaTaken) {
    pendingFlammaTaken = false;
  }

  $: headPose = pendingHeadPose ?? serverHeadPose;
  $: leftArmPose = pendingLeftArmPose ?? serverLeftArmPose;
  $: rightArmPose = pendingRightArmPose ?? serverRightArmPose;
  $: renderHeadPose = noteTaken ? "FORWARD" : headPose;
  $: renderLeftArmPose = noteTaken ? "DOWN" : leftArmPose;
  $: renderRightArmPose = noteTaken ? "DOWN" : rightArmPose;
  $: featherVisible = pendingFeatherVisible || serverFeatherVisible || Boolean(featherPlacedHint);
  $: featherSide = pendingFeatherSide || serverFeatherSide || hintFeatherSide || "left";
  $: featherSideClass = featherSide === "right" ? "right" : "left";
  $: showFlamma = mouthOpened && flammaReady && !noteTaken && !pendingFlammaTaken;

  $: currentLeftArmSrc =
    renderLeftArmPose === "UP"
      ? armLeftUpSrc
      : renderLeftArmPose === "HALF_UP"
        ? armLeftMidSrc
        : armLeftDownSrc;
  $: currentLeftArmClass =
    renderLeftArmPose === "UP"
      ? "up"
      : renderLeftArmPose === "HALF_UP"
        ? "mid"
        : "down";

  $: currentRightArmSrc =
    renderRightArmPose === "UP"
      ? armRightUpSrc
      : renderRightArmPose === "HALF_UP"
        ? armRightMidSrc
        : armRightDownSrc;
  $: currentRightArmClass =
    renderRightArmPose === "UP"
      ? "up"
      : renderRightArmPose === "HALF_UP"
        ? "mid"
        : "down";

  $: currentHeadSrc =
    noteTaken
      ? headForwardSrc
      : mouthOpened
        ? headMouthOpenSrc
        : renderHeadPose === "UP"
        ? headUpSrc
        : renderHeadPose === "FORWARD"
          ? headForwardSrc
          : headDownSrc;
  $: currentHeadClass =
    noteTaken
      ? "forward"
      : mouthOpened
        ? "mouth-open"
        : renderHeadPose === "UP"
        ? "up"
        : renderHeadPose === "FORWARD"
          ? "forward"
          : "down";

  function close() {
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: { objectId: "alch:statue", verb: "CLOSE", data: {} },
        bubbles: true,
        composed: true,
      })
    );
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) close();
  }

  function handleOverlayKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  function activateOnKeydown(e, handler) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler(e);
    }
  }

  function toggleHead(e) {
    e.stopPropagation();
    if (noteTaken) return;
    if (mouthOpened) return;
    const targetPose =
      headPose === "DOWN"
        ? "FORWARD"
        : headPose === "FORWARD"
          ? "UP"
          : "DOWN";
    pendingHeadPose = targetPose;

    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "puzzle_statue_pose",
          canonicalObjectId: "alch:statue-pose",
          verb: "set_part",
          data: { part: "head", to: targetPose },
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  function toggleLeftArm(e) {
    e.stopPropagation();
    if (noteTaken) return;
    const targetPose =
      leftArmPose === "DOWN"
        ? "HALF_UP"
        : leftArmPose === "HALF_UP"
          ? "UP"
          : "DOWN";
    pendingLeftArmPose = targetPose;

    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "puzzle_statue_pose",
          canonicalObjectId: "alch:statue-pose",
          verb: "set_part",
          data: { part: "leftArm", to: targetPose },
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  function toggleRightArm(e) {
    e.stopPropagation();
    if (noteTaken) return;
    const targetPose =
      rightArmPose === "DOWN"
        ? "HALF_UP"
        : rightArmPose === "HALF_UP"
          ? "UP"
          : "DOWN";
    pendingRightArmPose = targetPose;

    const backendRightPose = targetPose === "HALF_UP" ? "ON_CHEST" : targetPose;
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "puzzle_statue_pose",
          canonicalObjectId: "alch:statue-pose",
          verb: "set_part",
          data: { part: "rightArm", to: backendRightPose },
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  function normalizeItemKey(raw) {
    return String(raw || "").trim().toUpperCase().replace(/\s+/g, "_");
  }

  function handleEarDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }

  function handleEarDrop(e, side) {
    e.preventDefault();
    e.stopPropagation();
    const dragged =
      e.dataTransfer.getData("application/x-inventory-item") ||
      e.dataTransfer.getData("text/plain");
    const itemKey = normalizeItemKey(dragged);
    if (itemKey !== "FEATHER_STATUE" && itemKey !== "FEATHER") return;

    const sideLower = side === "right" ? "right" : "left";
    pendingFeatherVisible = true;
    pendingFeatherSide = sideLower;

    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "puzzle_statue_pose",
          canonicalObjectId: "alch:statue-pose",
          verb: "insert",
          data: {
            item: "FEATHER",
            sourceItem: itemKey,
            side: sideLower.toUpperCase(),
            ear: sideLower === "right" ? "RIGHT_EAR" : "LEFT_EAR",
          },
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  function toggleFeather(e) {
    e.stopPropagation();
    if (noteTaken) return;
    if (!featherVisible) return;

    const nextSide = featherSide === "right" ? "left" : "right";
    pendingFeatherVisible = true;
    pendingFeatherSide = nextSide;

    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "puzzle_statue_pose",
          canonicalObjectId: "alch:statue-pose",
          verb: "insert",
          data: {
            item: "FEATHER",
            sourceItem: "FEATHER_STATUE",
            side: nextSide.toUpperCase(),
            ear: nextSide === "right" ? "RIGHT_EAR" : "LEFT_EAR",
          },
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  function takeFlamma(e) {
    e.stopPropagation();
    if (!showFlamma) return;
    pendingFlammaTaken = true;
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "puzzle_statue_pose",
          canonicalObjectId: "alch:statue-pose",
          verb: "take",
          data: { item: "NOTE_FLAMMA" },
        },
        bubbles: true,
        composed: true,
      })
    );
  }

</script>

<div
  class="statue-overlay"
  role="dialog"
  aria-modal="true"
  aria-label="Statue puzzle"
  tabindex="0"
  on:click={handleOverlayClick}
  on:keydown={handleOverlayKeydown}
>
  <div class="statue-container">
    <button type="button" class="close-btn" on:click={close}>X</button>
    <div class="statue-stage">
      <img
        src={northStatueEmptySrc}
        alt="North statue"
        class="statue-image"
      />
      <img
        src={statueBodyNothingSrc}
        alt="Statue body"
        class="statue-body-overlay"
      />
      <button
        type="button"
        class={`statue-left-arm-overlay ${currentLeftArmClass} part-button`}
        aria-label="Rotate left arm"
        on:click={toggleLeftArm}
        on:keydown={(e) => activateOnKeydown(e, toggleLeftArm)}
      >
        <img src={currentLeftArmSrc} alt="" class="part-image" />
      </button>
      <button
        type="button"
        class={`statue-right-arm-overlay ${currentRightArmClass} part-button`}
        aria-label="Rotate right arm"
        on:click={toggleRightArm}
        on:keydown={(e) => activateOnKeydown(e, toggleRightArm)}
      >
        <img src={currentRightArmSrc} alt="" class="part-image" />
      </button>
      <button
        type="button"
        class={`statue-head-overlay ${currentHeadClass} part-button`}
        aria-label="Rotate head"
        on:click={toggleHead}
        on:keydown={(e) => activateOnKeydown(e, toggleHead)}
      >
        <img src={currentHeadSrc} alt="" class="part-image" />
      </button>
      {#if featherVisible}
        <button
          type="button"
          class={`statue-feather-overlay ${featherSideClass} ${currentHeadClass} part-button`}
          aria-label="Move feather to other ear"
          on:click={toggleFeather}
          on:keydown={(e) => activateOnKeydown(e, toggleFeather)}
        >
          <img src={featherStatueSrc} alt="" class="part-image" />
        </button>
      {/if}
      {#if showFlamma}
        <button
          type="button"
          class="statue-flamma-overlay part-button"
          aria-label="Take Flamma note"
          on:click={takeFlamma}
          on:keydown={(e) => activateOnKeydown(e, takeFlamma)}
        >
          <img src={flammaSrc} alt="" class="part-image" />
        </button>
      {/if}
      <div
        class={`ear-drop-zone left ${currentHeadClass}`}
        on:dragover={handleEarDragOver}
        on:drop={(e) => handleEarDrop(e, "left")}
        role="button"
        tabindex="0"
        aria-label="Drop feather on left ear"
      ></div>
      <div
        class={`ear-drop-zone right ${currentHeadClass}`}
        on:dragover={handleEarDragOver}
        on:drop={(e) => handleEarDrop(e, "right")}
        role="button"
        tabindex="0"
        aria-label="Drop feather on right ear"
      ></div>
    </div>
  </div>
</div>

<style>
  .statue-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.72);
  }

  .statue-container {
    position: relative;
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
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .statue-image {
    width: min(720px, 78vw);
    max-height: 78vh;
    object-fit: contain;
    user-select: none;
    display: block;
  }

  .statue-stage {
    position: relative;
    width: fit-content;
  }

  .statue-body-overlay {
    position: absolute;
    left: var(--body-left, 50%);
    top: var(--body-top, 55%);
    width: var(--body-width, 110%);
    transform: translate(-50%, -50%);
    z-index: 3;
    pointer-events: none;
    user-select: none;
  }

  .part-button {
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    line-height: 0;
  }

  .part-button:focus-visible {
    outline: 2px solid #f4e4bc;
    outline-offset: 2px;
  }

  .part-image {
    display: block;
    width: 100%;
    height: auto;
    pointer-events: none;
    user-select: none;
  }

  .statue-left-arm-overlay {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 4;
    pointer-events: auto;
    cursor: pointer;
    user-select: none;
  }

  .statue-left-arm-overlay.down {
    left: var(--left-arm-down-left, 38.5%);
    top: var(--left-arm-down-top, 36.2%);
    width: var(--left-arm-down-width, 10%);
  }

  .statue-left-arm-overlay.mid {
    left: var(--left-arm-mid-left, 38%);
    top: var(--left-arm-mid-top, 33%);
    width: var(--left-arm-mid-width, 10%);
  }

  .statue-left-arm-overlay.up {
    left: var(--left-arm-up-left, 41%);
    top: var(--left-arm-up-top, 30%);
    width: var(--left-arm-up-width, 10%);
  }

  .statue-right-arm-overlay {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 4;
    pointer-events: auto;
    cursor: pointer;
    user-select: none;
  }

  .statue-right-arm-overlay.down {
    left: var(--right-arm-down-left, 59.5%);
    top: var(--right-arm-down-top, 36%);
    width: var(--right-arm-down-width, 10%);
  }

  .statue-right-arm-overlay.mid {
    left: var(--right-arm-mid-left, 59.5%);
    top: var(--right-arm-mid-top, 33%);
    width: var(--right-arm-mid-width, 10%);
  }

  .statue-right-arm-overlay.up {
    left: var(--right-arm-up-left, 55%);
    top: var(--right-arm-up-top, 30%);
    width: var(--right-arm-up-width, 10%);
  }

  .statue-head-overlay {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 5;
    pointer-events: auto;
    cursor: pointer;
    user-select: none;
  }

  .statue-head-overlay.down {
    left: var(--head-down-left, 48.7%);
    top: var(--head-down-top, 10.5%);
    width: var(--head-down-width, 12%);
  }

  .statue-head-overlay.up {
    left: var(--head-up-left, 48.7%);
    top: var(--head-up-top, 10%);
    width: var(--head-up-width, 13%);
  }

  .statue-head-overlay.forward {
    left: var(--head-forward-left, 48.7%);
    top: var(--head-forward-top, 10%);
    width: var(--head-forward-width, 13%);
  }

  .statue-head-overlay.mouth-open {
    left: var(--head-mouth-open-left, 48.7%);
    top: var(--head-mouth-open-top, 10%);
    width: var(--head-mouth-open-width, 13%);
  }

  .statue-feather-overlay {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 8;
    pointer-events: auto;
    cursor: pointer;
    user-select: none;
  }

  .statue-feather-overlay.left.down {
    left: var(--feather-left-down-left, 43.5%);
    top: var(--feather-left-down-top, 8%);
    width: var(--feather-left-down-width, 6%);
  }

  .statue-feather-overlay.left.forward {
    left: var(--feather-left-forward-left, 43.5%);
    top: var(--feather-left-forward-top, 7%);
    width: var(--feather-left-forward-width, 6%);
  }

  .statue-feather-overlay.left.up {
    left: var(--feather-left-up-left, 43.5%);
    top: var(--feather-left-up-top, 6%);
    width: var(--feather-left-up-width, 6%);
  }

  .statue-feather-overlay.left.mouth-open {
    left: var(--feather-left-mouth-open-left, 43.5%);
    top: var(--feather-left-mouth-open-top, 7%);
    width: var(--feather-left-mouth-open-width, 6%);
  }

  .statue-feather-overlay.right.down {
    left: var(--feather-right-down-left, 54.5%);
    top: var(--feather-right-down-top, 8%);
    width: var(--feather-right-down-width, 6%);
    transform: translate(-50%, -50%) scaleX(-1);
  }

  .statue-feather-overlay.right.forward {
    left: var(--feather-right-forward-left, 54.5%);
    top: var(--feather-right-forward-top, 7%);
    width: var(--feather-right-forward-width, 6%);
    transform: translate(-50%, -50%) scaleX(-1);
  }

  .statue-feather-overlay.right.up {
    left: var(--feather-right-up-left, 54.5%);
    top: var(--feather-right-up-top, 6%);
    width: var(--feather-right-up-width, 6%);
    transform: translate(-50%, -50%) scaleX(-1);
  }

  .statue-feather-overlay.right.mouth-open {
    left: var(--feather-right-mouth-open-left, 54.5%);
    top: var(--feather-right-mouth-open-top, 7%);
    width: var(--feather-right-mouth-open-width, 6%);
    transform: translate(-50%, -50%) scaleX(-1);
  }

  .ear-drop-zone {
    position: absolute;
    transform: translate(-50%, -50%);
    width: var(--ear-drop-width, 10%);
    height: var(--ear-drop-height, 12%);
    z-index: 6;
    cursor: copy;
    background: transparent;
  }

  .ear-drop-zone.left.down {
    left: var(--ear-left-down-left, 43.5%);
    top: var(--ear-left-down-top, 12.5%);
  }

  .ear-drop-zone.left.forward {
    left: var(--ear-left-forward-left, 43.5%);
    top: var(--ear-left-forward-top, 12.5%);
  }

  .ear-drop-zone.left.up {
    left: var(--ear-left-up-left, 43.5%);
    top: var(--ear-left-up-top, 12.5%);
  }

  .ear-drop-zone.right.down {
    left: var(--ear-right-down-left, 56.5%);
    top: var(--ear-right-down-top, 12.5%);
  }

  .ear-drop-zone.right.forward {
    left: var(--ear-right-forward-left, 56.5%);
    top: var(--ear-right-forward-top, 12.5%);
  }

  .ear-drop-zone.right.up {
    left: var(--ear-right-up-left, 56.5%);
    top: var(--ear-right-up-top, 12.5%);
  }

  .statue-flamma-overlay {
    position: absolute;
    left: var(--flamma-left, 48.8%);
    top: var(--flamma-top, 13.5%);
    width: var(--flamma-width, 2%);
    transform: translate(-50%, -50%);
    z-index: 9;
    pointer-events: auto;
    cursor: pointer;
    user-select: none;
  }
</style>
