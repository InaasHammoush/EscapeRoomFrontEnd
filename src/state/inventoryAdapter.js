// src/state/inventoryAdapter.js

/**
 * Applies local optimistic updates based on player intent.
 * This keeps the UI snappy before the server responds.
 */
export function applyInventoryIntent(prevInventory, pendingFlags, intent) {
  const { objectId, verb, data } = intent || {};
  const itemUpper = String(data?.item || "").toUpperCase();
  const isMortar = objectId === "alch:mortar" || objectId === "puzzle_mortar";
  const isTransmuter =
    objectId === "alch:transmuter" ||
    objectId === "alch:ritual-paper" ||
    objectId === "puzzle_transmuter";
  const isWestJigsaw =
    objectId === "puzzle_west_codebox" ||
    objectId === "alch:west-jigsaw" ||
    objectId === "alch:west-codebox" ||
    objectId === "puzzle_west_jigsaw";
  const isStatue =
    objectId === "alch:statue" ||
    objectId === "alch:statue-pose" ||
    objectId === "puzzle_statue_pose";
  const objectLower = String(objectId || "").toLowerCase();
  const isSouthDrawer = objectId === "alch:south-drawer";
  const isNorthDrawer = objectId === "alch:north-drawer";
  const isDrawerTrigger = objectLower.includes("drawer");
  
  // Clone inventory to avoid mutation
  let nextInv = Array.isArray(prevInventory) ? [...prevInventory] : [];
  let nextPending = { ...pendingFlags }; // Generic flags object

  // Helper to find items
  const findIdx = (name) => nextInv.findIndex((e) => String(e.item).toUpperCase() === name);

  // Helper to remove/decrement
  const consume = (name) => {
    const idx = findIdx(name);
    if (idx === -1) return;
    if (nextInv[idx].count > 1) nextInv[idx] = { ...nextInv[idx], count: nextInv[idx].count - 1 };
    else nextInv.splice(idx, 1);
  };

  const add = (name) => {
    const idx = findIdx(name);
    if (idx === -1) {
      nextInv.push({ item: name, count: 1 });
      return;
    }
    nextInv[idx] = { ...nextInv[idx], count: (nextInv[idx].count || 0) + 1 };
  };

  // --- RULE 1: Generic Consumption (Any puzzle asking to INSERT/PLACE consumes the item) ---
  // This covers the Wizard Table (Rose) and Mortar (Moonwort) automatically.
  if (verb === "insert" || verb === "PLACE" || verb === "SPRINKLE") {
    // Exception: Green Liquid is special (swaps bottle), so we skip generic consumption for it
    if (itemUpper !== "GREEN_LIQUID") {
        consume(itemUpper);
    }
  }

  // --- RULE 2: Alchemist's Specific Bottle Logic ---
  // (We keep this specific because it's a complex swap, not just a consume)
  if (isMortar && verb === "insert" && itemUpper === "GREEN_LIQUID") {
    nextPending.mortarBottleSwap = true;
    const idx = findIdx("GREEN_LIQUID");
    if (idx !== -1) nextInv[idx] = { ...nextInv[idx], item: "EMPTY_BOTTLE" };
  }

  // --- RULE 3: Bottle Refill ---
  if (isMortar && verb === "take" && itemUpper === "BLUE_LIQUID") {
    nextPending.mortarBottleSwap = false;
    const emptyIdx = findIdx("EMPTY_BOTTLE");
    if (emptyIdx >= 0) {
      nextInv[emptyIdx] = { ...nextInv[emptyIdx], item: "BLUE_LIQUID" };
    } else {
      nextInv.push({ item: "BLUE_LIQUID", count: 1 });
    }
  }

  // --- RULE 4: Transmuter Key Pickup ---
  if (isTransmuter && verb === "take" && itemUpper === "GOLDEN_KEY") {
    add("GOLDEN_KEY");
  }

  // --- RULE 5: West Jigsaw Rose Pickup ---
  if (isWestJigsaw && String(verb || "").toLowerCase() === "take" && itemUpper === "BURNINGROSE_WHOLE") {
    add("BURNINGROSE_WHOLE");
  }

  // --- RULE 6: Statue Feather Pickup (south portrait reward path) ---
  if (isStatue && String(verb || "").toLowerCase() === "take" && itemUpper === "FEATHER") {
    if (!nextPending.statueFeatherTaken) {
      add("FEATHER");
      nextPending.statueFeatherTaken = true;
    }
    if (!nextPending.statueGoldNuggetTaken) {
      add("GOLD_NUGGET");
      nextPending.statueGoldNuggetTaken = true;
    }
  }

  // --- RULE 6b: Statue FLAMMA Note Pickup ---
  if (isStatue && String(verb || "").toLowerCase() === "take" && itemUpper === "NOTE_FLAMMA") {
    if (!nextPending.statueFlammaTaken) {
      add("NOTE_FLAMMA");
      nextPending.statueFlammaTaken = true;
    }
  }

  // --- RULE 7: Statue Feather Placement ---
  if (isStatue && String(verb || "").toLowerCase() === "insert") {
    if (itemUpper === "FEATHER_STATUE") {
      consume("FEATHER_STATUE");
    } else if (itemUpper === "FEATHER") {
      // Compatibility: backend often expects FEATHER while inventory may carry FEATHER_STATUE.
      if (findIdx("FEATHER") >= 0) consume("FEATHER");
      else consume("FEATHER_STATUE");
    }
    // Once inserted on statue, do not keep forcing feather back into inventory.
    nextPending.statueFeatherTaken = false;
  }

  // --- RULE 8: South Drawer Hirachy Pickup ---
  if (
    (isSouthDrawer || isNorthDrawer || isDrawerTrigger) &&
    String(verb || "").toLowerCase() === "take" &&
    itemUpper === "HIRACHY"
  ) {
    if (!nextPending.southDrawerHirachyTaken) {
      add("HIRACHY");
      nextPending.southDrawerHirachyTaken = true;
    }
  }

  return { nextInventory: nextInv, nextPending };
}

/**
 * Normalizes inventory based on pending client states.
 * (e.g., ensuring the Empty Bottle persists until the server catches up)
 */
export function normalizeInventory(items, pendingFlags) {
  if (!Array.isArray(items)) return [];
  let next = [...items];

  if (pendingFlags.mortarBottleSwap) {
    // If we are waiting for a bottle swap, force the empty bottle to exist
    const hasEmpty = next.some(e => String(e.item).toUpperCase() === "EMPTY_BOTTLE");
    if (!hasEmpty) {
      // If we have Blue Liquid but are pending a swap, turn it into Empty Bottle
      const blueIdx = next.findIndex(e => String(e.item).toUpperCase() === "BLUE_LIQUID");
      if (blueIdx >= 0) {
        next[blueIdx] = { ...next[blueIdx], item: "EMPTY_BOTTLE" };
      } else {
        next = [...next, { item: "EMPTY_BOTTLE", count: 1 }];
      }
    }
  }

  if (pendingFlags.statueFeatherTaken) {
    const hasFeather = next.some(e => String(e.item).toUpperCase() === "FEATHER");
    if (!hasFeather) next.push({ item: "FEATHER", count: 1 });
  }

  if (pendingFlags.statueFlammaTaken) {
    const hasFlamma = next.some(e => String(e.item).toUpperCase() === "NOTE_FLAMMA");
    if (!hasFlamma) next.push({ item: "NOTE_FLAMMA", count: 1 });
  }

  if (pendingFlags.statueGoldNuggetTaken) {
    const hasGoldNugget = next.some(e => String(e.item).toUpperCase() === "GOLD_NUGGET");
    if (!hasGoldNugget) next.push({ item: "GOLD_NUGGET", count: 1 });
  }

  if (pendingFlags.southDrawerHirachyTaken) {
    const hasHirachy = next.some(e => String(e.item).toUpperCase() === "HIRACHY");
    if (!hasHirachy) next.push({ item: "HIRACHY", count: 1 });
  }

  return next;
}
