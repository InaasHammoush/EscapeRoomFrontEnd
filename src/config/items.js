// src/config/items.js

// Import Alchemist Items
import moonwortImg from "../assets/alchemist/moonwort.png";
import blueLiquidImg from "../assets/alchemist/blue_liquid.png";
import greenLiquidImg from "../assets/alchemist/green_liquid.png";
import emptyBottleImg from "../assets/alchemist/empty_bottle.png";
import burningRoseWholeImg from "../assets/alchemist/burningrose_whole.png";
import hierarchyImg from "../assets/alchemist/hirachy.png";
import goldenKeyImg from "../assets/alchemist/goldkey.png";
import charcoalPenImg from "../assets/alchemist/charcoal_pen.png";
import goldNuggetImg from "../assets/alchemist/goldnugget.png";
import matchesImg from "../assets/alchemist/matchbox.png";
import featherStatueImg from "../assets/alchemist/feather.png";
import flammaNoteImg from "../assets/alchemist/flamma.png";

// Import Wizard Items
import bluePowderImg from "../assets/wizard_library/bluePowder.png";
import noteCodeImg from "../assets/wizard_library/ScrollWithCode.png";
import runeNoteImg from "../assets/wizard_library/rune_translation.png";
import ashKeyImg from "../assets/wizard_library/ashes_key.png";
import whiteRoseImg from "../assets/wizard_library/white_rose.png";
import blueRoseImg from "../assets/wizard_library/blue_rose.png";
import alchemistSketchImg from "../assets/wizard_library/alchemist_sketch.png";
import chestKeyImg from "../assets/wizard_library/chest_key.png";
import recipeImg from "../assets/wizard_library/recipe.png";

function toInventoryKey(itemName) {
  if (!itemName) return "";
  return String(itemName).trim().toUpperCase().replace(/\s+/g, "_");
}

function toTitleCaseWord(word) {
  if (!word) return "";
  return word.charAt(0) + word.slice(1).toLowerCase();
}

function formatInventoryDisplayName(key) {
  return String(key || "")
    .split("_")
    .filter(Boolean)
    .map(toTitleCaseWord)
    .join(" ");
}

// Export the Map
export const ITEM_IMAGES = {
  // Alchemist
  MOONWORT: moonwortImg,
  BLUE_LIQUID: blueLiquidImg,
  GREEN_LIQUID: greenLiquidImg,
  EMPTY_BOTTLE: emptyBottleImg,
  BURNINGROSE_WHOLE: burningRoseWholeImg,
  BURNING_ROSE_WHOLE: burningRoseWholeImg,
  HIERARCHY: hierarchyImg,
  HIRACHY: hierarchyImg,
  GOLDEN_KEY: goldenKeyImg,
  GOLD_KEY: goldenKeyImg,
  COAL_BLOCK: charcoalPenImg,
  GOLD_NUGGET: goldNuggetImg,
  MATCHES: matchesImg,
  FEATHER: featherStatueImg,
  NOTE_FLAMMA: flammaNoteImg,

  // Wizard
  BLUE_POWDER: bluePowderImg,
  NOTE_CODE: noteCodeImg,
  NOTE_RUNES: runeNoteImg,
  ASH_KEY: ashKeyImg,
  WHITE_ROSE: whiteRoseImg,
  BLUE_ROSE: blueRoseImg,
  SKETCH_ALCHEMIST: alchemistSketchImg,
  CHEST_KEY: chestKeyImg,
  RECIPE: recipeImg,
};

export const ITEM_DISPLAY_NAMES = {
  BURNINGROSE_WHOLE: "Burning Rose",
  BURNING_ROSE_WHOLE: "Burning Rose",
  HIERARCHY: "Hierarchy Scroll",
  HIRACHY: "Hierarchy Scroll",
  GOLDEN_KEY: "Golden Key",
  GOLD_KEY: "Golden Key",
  COAL_BLOCK: "Charcoal Pen",
  NOTE_FLAMMA: "Flamma Note",
  NOTE_CODE: "Coded Scroll",
  NOTE_RUNES: "Rune Translation",
  SKETCH_ALCHEMIST: "Alchemist Sketch",
};

export const ITEM_UI_CONFIG = {
  BURNINGROSE_WHOLE: {
    sizeClass: "h-16 w-16",
    offsetClass: "-mt-4",
  },
  BURNING_ROSE_WHOLE: {
    sizeClass: "h-16 w-16",
    offsetClass: "-mt-4",
  },
  FEATHER: {
    sizeClass: "h-12 w-12",
    offsetClass: "",
  },
  NOTE_FLAMMA: {
    sizeClass: "h-12 w-12",
    offsetClass: "",
  },
  HIERARCHY: {
    sizeClass: "h-10 w-10",
    offsetClass: "",
  },
  HIRACHY: {
    sizeClass: "h-10 w-10",
    offsetClass: "",
  },
};

export function getInventoryUi(itemName) {
  const key = toInventoryKey(itemName);
  const baseUi = ITEM_UI_CONFIG[key] || { sizeClass: "h-12 w-12", offsetClass: "" };

  return {
    ...baseUi,
    displayName: ITEM_DISPLAY_NAMES[key] || formatInventoryDisplayName(key),
  };
}

export function getInventoryDisplayName(itemName) {
  return getInventoryUi(itemName).displayName;
}

export function getInventoryImage(itemName) {
  const key = toInventoryKey(itemName);
  return ITEM_IMAGES[key] || null;
}
