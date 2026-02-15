// src/state/inventoryAdapter.js

/**
 * Applies local optimistic updates based on player intent.
 * This keeps the UI snappy before the server responds.
 */
export function applyInventoryIntent(prevInventory, pendingFlags, intent) {
  const { objectId, verb, data } = intent || {};
  const itemUpper = String(data?.item || "").toUpperCase();
  
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
  if (objectId === "alch:mortar" && verb === "insert" && itemUpper === "GREEN_LIQUID") {
    nextPending.mortarBottleSwap = true;
    const idx = findIdx("GREEN_LIQUID");
    if (idx !== -1) nextInv[idx] = { ...nextInv[idx], item: "EMPTY_BOTTLE" };
  }

  // --- RULE 3: Bottle Refill ---
  if (objectId === "alch:mortar" && verb === "take" && itemUpper === "BLUE_LIQUID") {
    nextPending.mortarBottleSwap = false;
    const emptyIdx = findIdx("EMPTY_BOTTLE");
    if (emptyIdx >= 0) {
      nextInv[emptyIdx] = { ...nextInv[emptyIdx], item: "BLUE_LIQUID" };
    } else {
      nextInv.push({ item: "BLUE_LIQUID", count: 1 });
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
  if (!pendingFlags.mortarBottleSwap) return items;

  // If we are waiting for a bottle swap, force the empty bottle to exist
  const hasEmpty = items.some(e => String(e.item).toUpperCase() === "EMPTY_BOTTLE");
  if (hasEmpty) return items;

  // If we have Blue Liquid but are pending a swap, turn it into Empty Bottle
  const blueIdx = items.findIndex(e => String(e.item).toUpperCase() === "BLUE_LIQUID");
  if (blueIdx >= 0) {
    const next = [...items];
    next[blueIdx] = { ...next[blueIdx], item: "EMPTY_BOTTLE" };
    return next;
  }

  return [...items, { item: "EMPTY_BOTTLE", count: 1 }];
}