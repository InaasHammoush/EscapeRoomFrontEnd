<svelte:options customElement="statue-widget" />

<script>
  // --- ASSETS ---
  import bgImg from "../../assets/alchemist/north_statue_empty.png";
  import bodyImg from "../../assets/alchemist/statue_body_nothing.png";
  import flammaNoteImg from "../../assets/alchemist/flamma.png";
  import featherStatueImg from "../../assets/alchemist/feather_statue.png";
  
  // Head States
  import headDown from "../../assets/alchemist/head_down.png";
  import headForward from "../../assets/alchemist/head_forward.png"; 
  import headUp from "../../assets/alchemist/head_up.png";
  import headMouthOpen from "../../assets/alchemist/head_mouth_open.png"; 

  // Left Arm States
  import armLeftDown from "../../assets/alchemist/arm_left.png";
  import armLeftHalf from "../../assets/alchemist/arm_midway_left.png";
  import armLeftUp from "../../assets/alchemist/arm_left_up.png";

  // Right Arm States 
  import armRightDown from "../../assets/alchemist/arm_right.png";
  import armRightChest from "../../assets/alchemist/arm_midway_right.png";
  import armRightUp from "../../assets/alchemist/arm_right_up.png";

  export let puzzle = null;

  // --- STATE EXTRACTION ---
  $: pose = puzzle?.pose || { leftArm: 'DOWN', rightArm: 'DOWN', head: 'FORWARD' };
  $: featherInserted = puzzle?.featherInserted || false;
  $: featherEar = puzzle?.featherPosition || null;
  $: mouthOpened = puzzle?.mouthOpened || false;
  $: noteTaken = puzzle?.output?.noteTaken || false;
  $: solved = puzzle?.solved || false;

  // --- DYNAMIC IMAGE MAPPING ---
  $: currentHead = 
    mouthOpened ? headMouthOpen :
    pose.head === 'DOWN' ? headDown :
    pose.head === 'UP' ? headUp :
    headForward;

  $: currentLeftArm = 
    pose.leftArm === 'HALF_UP' ? armLeftHalf :
    pose.leftArm === 'UP' ? armLeftUp :
    armLeftDown;

  $: currentRightArm = 
    pose.rightArm === 'ON_CHEST' ? armRightChest :
    pose.rightArm === 'UP' ? armRightUp :
    armRightDown;

  // --- INTERACTION LOGIC ---
  const headStates = ['DOWN', 'FORWARD', 'UP'];
  const leftArmStates = ['DOWN', 'HALF_UP', 'UP'];
  const rightArmStates = ['DOWN', 'ON_CHEST', 'UP'];

  function togglePart(part, currentVal, stateArray) {
    if (solved) return; // Lock interactions once solved
    const currentIndex = stateArray.indexOf(currentVal);
    const nextVal = stateArray[(currentIndex + 1) % stateArray.length];
    
    emitAction('set_part', { part, to: nextVal });
  }

  function takeNote() {
    if (mouthOpened && !noteTaken) {
      emitAction('take', { item: 'NOTE_FLAMMA' });
      // Auto-close widget shortly after taking the note
      setTimeout(closeWidget, 1500);
    }
  }

  // --- DRAG & DROP (FEATHER) ---
  function handleEarDragOver(e) {
    if (solved || featherInserted) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleEarDrop(e, ear) {
    e.preventDefault();
    if (solved || featherInserted) return;

    const item = e.dataTransfer.getData("text/plain").toUpperCase();
    if (item === "FEATHER") {
      emitAction("insert", { item: "FEATHER", ear: ear });
    }
  }

  function toggleFeatherEar() {
    if (solved) return;
    if (!featherInserted) return;
    emitAction("toggle_feather");
  }

  // --- SOCKET INTENTS ---
  function emitAction(verb, data = {}) {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'alch:statue', verb, data },
      bubbles: true, composed: true
    }));
  }

  function closeWidget() {
    document.dispatchEvent(new CustomEvent('intent', {
      detail: { objectId: 'alch:statue', verb: 'CLOSE' },
      bubbles: true, composed: true
    }));
  }
</script>

<div class="modal-overlay" on:click={closeWidget}>
  <div class="widget-wrapper" on:click|stopPropagation>
    <button class="close-btn" on:click={closeWidget}>✕</button>

    <img src={bgImg} alt="Wall Background" class="bg-image" />

    <div class="statue-container">
      <img src={bodyImg} alt="Statue Body" class="statue-part body" />
      
      <img 
        src={currentLeftArm} 
        alt="Left Arm" 
        class="statue-part left-arm" 
        class:left-arm-down={pose.leftArm === 'DOWN'}
        class:left-arm-half-up={pose.leftArm === 'HALF_UP'}
        class:left-arm-up={pose.leftArm === 'UP'}
        class:interactive={!solved}
        on:click={() => togglePart('leftArm', pose.leftArm, leftArmStates)} 
      />
      
      <img 
        src={currentRightArm} 
        alt="Right Arm" 
        class="statue-part right-arm" 
        class:right-arm-half-up={pose.rightArm === 'ON_CHEST'}
        class:right-arm-up={pose.rightArm === 'UP'}
        class:interactive={!solved}
        on:click={() => togglePart('rightArm', pose.rightArm, rightArmStates)} 
      />
      
      <img 
        src={currentHead} 
        alt="Head" 
        class="statue-part head" 
        class:interactive={!solved}
        on:click={() => togglePart('head', pose.head, headStates)} 
      />

      {#if featherInserted && featherEar}
        <img
          src={featherStatueImg}
          alt="Feather on ear"
          class="ear-feather"
          class:left={featherEar === "LEFT"}
          class:right={featherEar === "RIGHT"}
          on:click={toggleFeatherEar}
        />
      {/if}

      <div
        class="ear-zone ear-zone-left"
        on:dragover={handleEarDragOver}
        on:drop={(e) => handleEarDrop(e, "LEFT")}
      ></div>
      <div
        class="ear-zone ear-zone-right"
        on:dragover={handleEarDragOver}
        on:drop={(e) => handleEarDrop(e, "RIGHT")}
      ></div>

      {#if mouthOpened && !noteTaken}
        <img 
          src={flammaNoteImg} 
          alt="Flamma Note" 
          class="note-reward" 
          on:click={takeNote} 
        />
      {/if}
    </div>

  </div>
</div>

<style>
  .modal-overlay {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(4px); z-index: 50;
  }

  .widget-wrapper {
    position: relative; 
    width: 50vw;
    max-width: 800px;
    aspect-ratio: 1/1; /* Keeps the workspace square */
    display: flex; justify-content: center; align-items: center;
    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.9);
    background: #0a0a0a;
  }

  .bg-image { 
    position: absolute; width: 100%; height: 100%; object-fit: cover; pointer-events: none; 
  }

  .close-btn {
    position: absolute; top: 15px; right: 15px; width: 40px; height: 40px;
    border-radius: 50%; background: rgba(0, 0, 0, 0.8); color: #f4e4bc; border: 2px solid #8b7355;
    cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; z-index: 30;
    transition: transform 0.2s;
  }
  .close-btn:hover { background: black; transform: scale(1.1); }

  /* --- STATUE ASSEMBLY --- */
  .statue-container {
    position: relative;
    width: 60%;
    height: 90%;
    z-index: 10;
  }

  .statue-part {
    position: absolute;
    object-fit: contain;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  .interactive {
    cursor: pointer;
  }
  .interactive:hover {
    filter: drop-shadow(0 0 8px rgba(100, 200, 255, 0.6)) brightness(1.1);
  }

  /* POSITIONING: You will need to tweak these % values 
    to make the arms and head attach perfectly to your body image! 
  */
  .body {
    bottom: -7%;
    left: -60%;
    width: 220%;
    height: 80%;
    transform: scale(1.20);
    transform-origin: bottom center;
    pointer-events: none;
    z-index: 2;
  }

  .head {
    top: 5%;
    left: 35%;
    width: 25%;
    height: 17%;
    z-index: 3;
  }

  .left-arm {
    top: 15.5%; left: 17%; width: 20%; height: 50%; z-index: 4;
  }

  .right-arm {
    top: 15.5%; right: 21%; width: 20%; height: 50%; z-index: 4;
  }

  /* Left arm pose-specific manual offsets */
  .left-arm-down {
    top: 15.5%;
    left: 17%;
  }

  .left-arm-half-up {
    top: 12%;
    left: 16%;
  }

  .left-arm-up {
    top: 8%;
    left: 23%;
  }

  /* Right arm pose-specific manual offsets */
  .right-arm-half-up {
    top: 12%;
    right: 21%;
  }

  .right-arm-up {
    top: 8%;
    right: 27%;
  }

  .ear-feather {
    position: absolute;
    width: 12%;
    height: auto;
    z-index: 8;
    pointer-events: auto;
    cursor: pointer;
    filter: drop-shadow(0 2px 8px rgba(255, 255, 210, 0.8));
  }

  .ear-feather.left {
    top: 7.5%;
    left: 30%;
    transform: rotate(-16deg);
  }

  .ear-feather.right {
    top: 7.5%;
    right: 34%;
    transform: scaleX(-1) rotate(-16deg);
  }

  .ear-zone {
    position: absolute;
    width: 10%;
    height: 12%;
    z-index: 9;
  }

  .ear-zone-left {
    top: 8%;
    left: 35%;
  }

  .ear-zone-right {
    top: 8%;
    right: 39%;
  }

  /* --- REWARD NOTE --- */
  .note-reward {
    position: absolute;
    top: 25%; /* Positioned near the mouth */
    left: 45%;
    width: 10%;
    height: auto;
    cursor: pointer;
    z-index: 5;
    filter: drop-shadow(0 5px 15px rgba(255,215,0,0.8));
    animation: popOut 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, floatNote 2s infinite alternate ease-in-out;
  }

  /* Animations */
  @keyframes popOut {
    0% { transform: scale(0) translateY(20px); opacity: 0; }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }

  @keyframes floatNote {
    0% { transform: translateY(0); }
    100% { transform: translateY(-10px); }
  }
</style>
