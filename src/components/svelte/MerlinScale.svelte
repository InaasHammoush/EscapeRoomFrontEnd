<svelte:options customElement="merlin-scale-widget" />

<script>
  import { onMount } from "svelte";
  import merlinBg from "../../assets/wizard_library/merlin_bg.png";
  import redStoneImg from "../../assets/wizard_library/red_stone.png";
  import wandImg from "../../assets/wizard_library/wand.png";
  import unicornHornImg from "../../assets/wizard_library/unicorn_horn.png";
  import draconScaleImg from "../../assets/wizard_library/dragon_scale.png";

  export let puzzle = null;

  const ITEM_META = {
    WAND: { label: "Wand", src: wandImg, className: "wand", left: "50%", top: "-173%", rot: "45deg", delay: "0s", scale: 0.12 },
    STONE: { label: "Red Stone", src: redStoneImg, className: "stone", left: "50%", top: "50%", rot: "8deg", delay: "0.25s", scale: 0.5 },
    HORN: { label: "Unicorn Horn", src: unicornHornImg, className: "horn", left: "50%", top: "-12%", rot: "-4deg", delay: "0.5s", scale: 0.5 },
    DRAGON_SCALE: { label: "Dragon Scale", src: draconScaleImg, className: "dragon-scale", left: "50%", top: "53%", rot: "12deg", delay: "0.75s", scale: 0.4 }
  };

  const LEFT_FLOAT_ITEMS = ["WAND", "STONE"];
  const RIGHT_FLOAT_ITEMS = ["HORN", "DRAGON_SCALE"];

  $: floating = puzzle?.floating || [];
  $: floatingLeft = floating.filter((item) => LEFT_FLOAT_ITEMS.includes(item));
  $: floatingRight = floating.filter((item) => RIGHT_FLOAT_ITEMS.includes(item));
  $: left = puzzle?.left || [];
  $: right = puzzle?.right || [];
  $: solved = Boolean(puzzle?.solved);
  let shellEl;
  let sceneStyle = "inset:0;";
  let imageRatio = 16 / 10;

  function emitMove(item, to) {
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: { objectId: "puzzle_merlin_scale", verb: "MOVE", data: { item, to } },
        bubbles: true,
        composed: true
      })
    );
  }

  function closeWidget() {
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: { objectId: "puzzle_merlin_scale", verb: "CLOSE" },
        bubbles: true,
        composed: true
      })
    );
  }

  function handleDragStart(event, item) {
    if (solved) return;
    const meta = ITEM_META[item];
    if (!meta) return;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-merlin-item", item);
    event.dataTransfer.setData("text/plain", item);

    // Use a clean drag preview to avoid transformed/squished browser snapshots.
    const dragPreview = document.createElement("img");
    dragPreview.src = meta.src;
    dragPreview.style.width = "96px";
    dragPreview.style.height = "96px";
    dragPreview.style.objectFit = "contain";
    dragPreview.style.position = "fixed";
    dragPreview.style.left = "-1000px";
    dragPreview.style.top = "-1000px";
    dragPreview.style.pointerEvents = "none";
    document.body.appendChild(dragPreview);

    event.dataTransfer.setDragImage(dragPreview, 48, 48);
    setTimeout(() => dragPreview.remove(), 0);
  }

  function handleDragOver(event) {
    if (solved) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event, destination) {
    event.preventDefault();
    if (solved) return;
    const item = event.dataTransfer.getData("application/x-merlin-item") || event.dataTransfer.getData("text/plain");
    if (!ITEM_META[item]) return;
    emitMove(item, destination);
  }

  function floatingStyle(item) {
    const meta = ITEM_META[item];
    if (!meta) return "";
    return `left:${meta.left};top:${meta.top};--rot:${meta.rot};--hover-delay:${meta.delay};--item-scale:${meta.scale};`;
  }

  function trayStyle(index) {
    const offset = (index - 0.5) * 34;
    const lift = index % 2 ? -5 : 2;
    const rot = index % 2 ? "8deg" : "-7deg";
    return `--tray-transform:translate(-50%, -50%) translateX(${offset}px) translateY(${lift}px) rotate(${rot});`;
  }

  function handleOverlayKeydown(event) {
    if (event.key === "Enter" || event.key === "Escape") {
      closeWidget();
    }
  }

  function updateSceneBounds() {
    if (!shellEl) return;
    const shellW = shellEl.clientWidth;
    const shellH = shellEl.clientHeight;
    if (!shellW || !shellH) return;

    const shellRatio = shellW / shellH;
    let sceneW;
    let sceneH;
    let sceneLeft;
    let sceneTop;

    if (shellRatio > imageRatio) {
      sceneH = shellH;
      sceneW = shellH * imageRatio;
      sceneLeft = (shellW - sceneW) / 2;
      sceneTop = 0;
    } else {
      sceneW = shellW;
      sceneH = shellW / imageRatio;
      sceneLeft = 0;
      sceneTop = (shellH - sceneH) / 2;
    }

    sceneStyle = `left:${sceneLeft}px;top:${sceneTop}px;width:${sceneW}px;height:${sceneH}px;`;
  }

  onMount(() => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        imageRatio = img.naturalWidth / img.naturalHeight;
      }
      updateSceneBounds();
    };
    img.src = merlinBg;

    const ro = new ResizeObserver(() => updateSceneBounds());
    if (shellEl) ro.observe(shellEl);
    window.addEventListener("resize", updateSceneBounds);
    setTimeout(updateSceneBounds, 0);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSceneBounds);
    };
  });
</script>

<div
  class="overlay"
  role="button"
  tabindex="0"
  aria-label="Close Merlin scale puzzle"
  on:click={closeWidget}
  on:keydown={handleOverlayKeydown}
>
  <div
    class="puzzle-shell"
    bind:this={shellEl}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    on:click|stopPropagation
    on:keydown|stopPropagation={() => {}}
  >
    <button class="close-btn" type="button" on:click={closeWidget}>x</button>

    <div class="scene" style={sceneStyle}>
      <img class="background" src={merlinBg} alt="Merlin scale puzzle" />

      <div
        class="floating-zone floating-left"
        on:dragover={handleDragOver}
        on:drop={(event) => handleDrop(event, "FLOATING")}
        aria-label="Left floating area"
        role="region"
      >
        {#each floatingLeft as item}
          {@const meta = ITEM_META[item]}
          {#if meta}
            <img
              class={"item floating-item " + meta.className}
              src={meta.src}
              alt={meta.label}
              draggable={!solved}
              style={floatingStyle(item)}
              on:dragstart={(event) => handleDragStart(event, item)}
            />
          {/if}
        {/each}
      </div>

      <div
        class="floating-zone floating-right"
        on:dragover={handleDragOver}
        on:drop={(event) => handleDrop(event, "FLOATING")}
        aria-label="Right floating area"
        role="region"
      >
        {#each floatingRight as item}
          {@const meta = ITEM_META[item]}
          {#if meta}
            <img
              class={"item floating-item " + meta.className}
              src={meta.src}
              alt={meta.label}
              draggable={!solved}
              style={floatingStyle(item)}
              on:dragstart={(event) => handleDragStart(event, item)}
            />
          {/if}
        {/each}
      </div>

      <div
        class="tray-zone left-zone"
        class:solved
        on:dragover={handleDragOver}
        on:drop={(event) => handleDrop(event, "LEFT")}
        aria-label="Left tray"
        role="region"
      >
        {#each left as item, index}
          {@const meta = ITEM_META[item]}
          {#if meta}
            <img
              class={"item tray-item " + meta.className}
              src={meta.src}
              alt={meta.label}
              draggable={!solved}
              style={trayStyle(index)}
              on:dragstart={(event) => handleDragStart(event, item)}
            />
          {/if}
        {/each}
      </div>

      <div
        class="tray-zone right-zone"
        class:solved
        on:dragover={handleDragOver}
        on:drop={(event) => handleDrop(event, "RIGHT")}
        aria-label="Right tray"
        role="region"
      >
        {#each right as item, index}
          {@const meta = ITEM_META[item]}
          {#if meta}
            <img
              class={"item tray-item " + meta.className}
              src={meta.src}
              alt={meta.label}
              draggable={!solved}
              style={trayStyle(index)}
              on:dragstart={(event) => handleDragStart(event, item)}
            />
          {/if}
        {/each}
      </div>

      {#if solved}
        <div class="solved-banner">The scales are balanced.</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(7, 6, 12, 0.78);
    backdrop-filter: blur(4px);
    z-index: 50;
  }

  .puzzle-shell {
    position: relative;
    width: min(78vw, 980px);
    max-height: 82vh;
    aspect-ratio: 16 / 10;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 20px 55px rgba(0, 0, 0, 0.6);
  }

  .scene {
    position: absolute;
  }

  .background {
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
  }

  .close-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid #8b7355;
    background: rgba(0, 0, 0, 0.7);
    color: #f4e4bc;
    font-size: 18px;
    cursor: pointer;
    z-index: 30;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.9);
  }

  .floating-zone {
    position: absolute;
    top: 16%;
    width: 20%;
    height: 68%;
    border-radius: 22px;
  }

  .floating-left {
    left: 13%;
  }

  .floating-right {
    right: 13%;
  }

  .tray-zone {
    position: absolute;
    top: 62%;
    width: 9%;
    height: 12%;
    border-radius: 999px;
    transition: box-shadow 150ms ease;
  }

  .left-zone {
    left: 35%;
  }

  .right-zone {
    right: 33%;
  }

  .tray-zone:hover {
    box-shadow: inset 0 0 20px rgba(255, 216, 145, 0.18);
  }

  .tray-zone.solved:hover {
    box-shadow: none;
  }

  .item {
    position: absolute;
    user-select: none;
    filter: drop-shadow(0 8px 10px rgba(0, 0, 0, 0.45));
  }

  .floating-item {
    width: clamp(110px, 13vw, 176px);
    animation: hover-float 2.8s ease-in-out infinite;
    animation-delay: var(--hover-delay);
    transform: translateX(-50%) rotate(var(--rot)) scale(var(--item-scale, 1));
    cursor: grab;
  }

  .tray-item {
    left: 50%;
    top: 44%;
    width: clamp(42px, 4.2vw, 64px);
    height: clamp(42px, 4.2vw, 64px);
    object-fit: contain;
    transform: var(--tray-transform);
    animation: tray-hover 2.2s ease-in-out infinite;
    cursor: grab;
  }

  .solved-banner {
    position: absolute;
    left: 50%;
    bottom: 8%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 999px;
    border: 1px solid rgba(245, 205, 112, 0.6);
    background: rgba(9, 10, 16, 0.72);
    color: #f4e4bc;
    font-size: clamp(14px, 1.6vw, 20px);
    letter-spacing: 0.04em;
    text-shadow: 0 0 10px rgba(255, 212, 117, 0.35);
  }

  @keyframes hover-float {
    0%, 100% {
      transform: translateX(-50%) translateY(0) rotate(var(--rot)) scale(var(--item-scale, 1));
    }
    50% {
      transform: translateX(-50%) translateY(-10px) rotate(var(--rot)) scale(var(--item-scale, 1));
    }
  }

  @keyframes tray-hover {
    0%, 100% {
      margin-top: 0;
    }
    50% {
      margin-top: -7px;
    }
  }

  @media (max-width: 900px) {
    .puzzle-shell {
      width: 88vw;
      max-height: 78vh;
      aspect-ratio: 4 / 3;
    }

    .tray-zone {
      top: 53%;
      width: 28%;
      height: 36%;
    }

    .left-zone {
      left: 8%;
    }

    .right-zone {
      right: 8%;
    }

    .floating-zone {
      top: 6%;
      width: 26%;
      height: 45%;
    }

    .floating-left {
      left: 2%;
    }

    .floating-right {
      right: 2%;
    }
  }
</style>