<svelte:options customElement="keypad-widget" />

<script>
  export let roomid; // Received via HTML attribute 
  let display = "";

  function press(num) {
    display += num;
    if (display.length === 4) {
      submit();
    }
  }

  function submit() {
    // Communication via Custom DOM Events 
    const event = new CustomEvent('intent', {
      detail: {
        objectId: 'keypad',
        verb: 'SUBMIT',
        data: { code: display }
      },
      bubbles: true,
      composed: true // Necessary to cross the Shadow DOM boundary
    });
    
    dispatchEvent(event);
    display = ""; // Reset local UI state
  }
</script>

<div class="keypad-container">
  <div class="screen">{display || "----"}</div>
  <div class="grid">
    {#each [1,2,3,4,5,6,7,8,9,0] as num}
      <button on:click={() => press(num)}>{num}</button>
    {/each}
  </div>
</div>

<style>
  /* Local styling remains encapsulated in the Shadow DOM */
  .keypad-container { background: #222; padding: 20px; border-radius: 10px; }
  .screen { background: #000; color: #0f0; text-align: center; margin-bottom: 10px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
</style>