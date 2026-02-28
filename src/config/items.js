// src/config/items.js

// Import Alchemist Items
import moonwortImg from "../assets/alchemist/moonwort.png";
import blueLiquidImg from "../assets/alchemist/blue_liquid.png";
import greenLiquidImg from "../assets/alchemist/green_liquid.png";
import emptyBottleImg from "../assets/alchemist/empty_bottle.png";
import charcoalPenImg from "../assets/alchemist/charcoal_pen.png";
import goldNuggetImg from "../assets/alchemist/goldnugget.png";
import matchboxImg from "../assets/alchemist/matchbox.png";
import goldKeyImg from "../assets/alchemist/goldkey.png";
import burningRoseWholeImg from "../assets/alchemist/burningrose_whole.png";
import featherStatueImg from "../assets/alchemist/feather_statue.png";
import flammaImg from "../assets/alchemist/flamma.png";
import hirachyImg from "../assets/alchemist/hirachy.png";

// Import Wizard Items 
import bluePowderImg from "../assets/wizard_library/bluePowder.png";
import noteCodeImg from "../assets/wizard_library/ScrollWithCode.png";
import runeNoteImg from "../assets/wizard_library/runeScroll.png";
import ashKeyImg from "../assets/wizard_library/AshKey.png";

// Export the Map
export const ITEM_IMAGES = {
  // Alchemist
  MOONWORT: moonwortImg,
  BLUE_LIQUID: blueLiquidImg,
  GREEN_LIQUID: greenLiquidImg,
  EMPTY_BOTTLE: emptyBottleImg,
  COAL_BLOCK: charcoalPenImg,
  CHARCOAL_PEN: charcoalPenImg,
  GOLDNUGGET: goldNuggetImg,
  GOLD_NUGGET: goldNuggetImg,
  MATCHES: matchboxImg,
  GOLDKEY: goldKeyImg,
  GOLD_KEY: goldKeyImg,
  GOLDEN_KEY: goldKeyImg,
  BURNINGROSE_WHOLE: burningRoseWholeImg,
  BURNING_ROSE_WHOLE: burningRoseWholeImg,
  FEATHER: featherStatueImg,
  FEATHER_STATUE: featherStatueImg,
  NOTE_FLAMMA: flammaImg,
  HIRACHY: hirachyImg,
  
  // Wizard
  BLUE_POWDER: bluePowderImg,
  NOTE_CODE: noteCodeImg,
  NOTE_RUNES: runeNoteImg,
  ASH_KEY: ashKeyImg,
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
  FEATHER_STATUE: {
    sizeClass: "h-12 w-12",
    offsetClass: "",
  },
  NOTE_FLAMMA: {
    sizeClass: "h-12 w-12",
    offsetClass: "",
  },
  HIRACHY: {
    sizeClass: "h-10 w-10",
    offsetClass: "",
  },
};

export function getInventoryUi(itemName) {
  if (!itemName) return { sizeClass: "h-25 w-25", offsetClass: "" };
  const key = String(itemName).trim().toUpperCase().replace(/\s+/g, "_");
  return ITEM_UI_CONFIG[key] || { sizeClass: "h-25 w-25", offsetClass: "" };
}

export function getInventoryImage(itemName) {
  if (!itemName) return null;
  const key = String(itemName).trim().toUpperCase().replace(/\s+/g, "_");
  return ITEM_IMAGES[key] || null;
}
