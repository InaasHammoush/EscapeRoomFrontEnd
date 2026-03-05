// src/state/inventoryAdapter.js

/**
 * Applies local optimistic updates based on player intent.
 * This keeps the UI snappy before the server responds.
 */
export function applyInventoryIntent(prevInventory, pendingFlags, intent) {
  const toCanonicalItem = (value) => {
    const raw = String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
    const aliases = {
      COALBLOCK: "COAL_BLOCK",
      BLUELIQUID: "BLUE_LIQUID",
      GREENLIQUID: "GREEN_LIQUID",
      GOLDNUGGET: "GOLD_NUGGET",
      GOLDKEY: "GOLD_KEY",
    };
    return aliases[raw] || raw;
  };

  const { objectId, verb, data } = intent || {};
  const verbLower = String(verb || "").toLowerCase();
  const itemUpper = toCanonicalItem(data?.item);
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
  const isFlaskTransfer =
    objectId === "alch:flask-transfer" ||
    objectId === "puzzle_flask_transfer" ||
    objectId === "flask_transfer_puzzle";
  const objectLower = String(objectId || "").toLowerCase();
  const isSouthDrawer = objectId === "alch:south-drawer";
  const isNorthDrawer = objectId === "alch:north-drawer";
  const isDrawerTrigger = objectLower.includes("drawer");
  
  // Clone inventory to avoid mutation
  let nextInv = Array.isArray(prevInventory) ? [...prevInventory] : [];
  let nextPending = { ...pendingFlags }; // Generic flags object

  // Helper to find items
  const findIdx = (name) => {
    const wanted = toCanonicalItem(name);
    return nextInv.findIndex((e) => toCanonicalItem(e?.item) === wanted);
  };

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
  if (verbLower === "insert" || verbLower === "place" || verbLower === "sprinkle") {
    // Exception: Green Liquid is special (swaps bottle), so we skip generic consumption for it
    if (itemUpper !== "GREEN_LIQUID") {
        consume(itemUpper);
    }
  }

  // If these items are used, do not force them back via pending flags.
  if (verbLower === "insert" || verbLower === "place" || verbLower === "sprinkle") {
    if (itemUpper === "MOONWORT") nextPending.flaskMoonwortTaken = false;
    if (itemUpper === "GREEN_LIQUID") nextPending.flaskGreenLiquidTaken = false;
    if (itemUpper === "MATCHES") nextPending.flaskMatchesTaken = false;
    if (itemUpper === "COAL_BLOCK" || itemUpper === "CHARCOAL_PEN") nextPending.flaskCharcoalTaken = false;
    if (itemUpper === "GOLD_NUGGET") nextPending.statueGoldNuggetTaken = false;
    if (itemUpper === "BLUE_LIQUID") nextPending.mortarBottleSwap = false;
  }

  // --- RULE 2: Alchemist's Specific Bottle Logic ---
  // (We keep this specific because it's a complex swap, not just a consume)
  if (isMortar && verbLower === "insert" && itemUpper === "GREEN_LIQUID") {
    nextPending.mortarBottleSwap = true;
    const idx = findIdx("GREEN_LIQUID");
    if (idx !== -1) nextInv[idx] = { ...nextInv[idx], item: "EMPTY_BOTTLE" };
  }

  // --- RULE 3: Bottle Refill ---
  if (isMortar && verbLower === "take" && itemUpper === "BLUE_LIQUID") {
    nextPending.mortarBottleSwap = false;
    const emptyIdx = findIdx("EMPTY_BOTTLE");
    if (emptyIdx >= 0) {
      nextInv[emptyIdx] = { ...nextInv[emptyIdx], item: "BLUE_LIQUID" };
    } else {
      nextInv.push({ item: "BLUE_LIQUID", count: 1 });
    }
  }

  // --- RULE 4: Transmuter Key Pickup ---
  if (isTransmuter && verbLower === "take" && itemUpper === "GOLDEN_KEY") {
    add("GOLDEN_KEY");
  }

  // --- RULE 5: West Jigsaw Rose Pickup ---
  if (isWestJigsaw && verbLower === "take" && itemUpper === "BURNINGROSE_WHOLE") {
    add("BURNINGROSE_WHOLE");
  }

  // --- RULE 6: Statue Feather Pickup (south portrait reward path) ---
  if (isStatue && verbLower === "take" && itemUpper === "FEATHER") {
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
  if (isStatue && verbLower === "take" && itemUpper === "NOTE_FLAMMA") {
    if (!nextPending.statueFlammaTaken) {
      add("NOTE_FLAMMA");
      nextPending.statueFlammaTaken = true;
    }
  }

  // --- RULE 7: Statue Feather Placement ---
  if (isStatue && verbLower === "insert") {
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
    verbLower === "take" &&
    itemUpper === "HIRACHY"
  ) {
    if (!nextPending.southDrawerHirachyTaken) {
      add("HIRACHY");
      nextPending.southDrawerHirachyTaken = true;
    }
  }

  // --- RULE 9: Flask Transfer reward pickups ---
  if (isFlaskTransfer && verbLower === "take") {
    if (itemUpper === "MOONWORT") {
      add("MOONWORT");
      nextPending.flaskMoonwortTaken = true;
    }
    if (itemUpper === "GREEN_LIQUID") {
      add("GREEN_LIQUID");
      nextPending.flaskGreenLiquidTaken = true;
    }
    if (itemUpper === "MATCHES") {
      add("MATCHES");
      nextPending.flaskMatchesTaken = true;
    }
    if (itemUpper === "COAL_BLOCK" || itemUpper === "CHARCOAL_PEN") {
      add("CHARCOAL_PEN");
      nextPending.flaskCharcoalTaken = true;
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

  if (pendingFlags.flaskMoonwortTaken) {
    const hasMoonwort = next.some(e => String(e.item).toUpperCase() === "MOONWORT");
    if (!hasMoonwort) next.push({ item: "MOONWORT", count: 1 });
  }
  if (pendingFlags.flaskGreenLiquidTaken) {
    const hasGreen = next.some(e => String(e.item).toUpperCase() === "GREEN_LIQUID");
    if (!hasGreen) next.push({ item: "GREEN_LIQUID", count: 1 });
  }
  if (pendingFlags.flaskMatchesTaken) {
    const hasMatches = next.some(e => String(e.item).toUpperCase() === "MATCHES");
    if (!hasMatches) next.push({ item: "MATCHES", count: 1 });
  }
  if (pendingFlags.flaskCharcoalTaken) {
    const hasCharcoal = next.some(e => String(e.item).toUpperCase() === "CHARCOAL_PEN");
    if (!hasCharcoal) next.push({ item: "CHARCOAL_PEN", count: 1 });
  }

  return next;
}
