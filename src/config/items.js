// src/config/items.js

// Import Alchemist Items
import moonwortImg from "../assets/alchemist/moonwort.png";
import blueLiquidImg from "../assets/alchemist/blue_liquid.png";
import greenLiquidImg from "../assets/alchemist/green_liquid.png";
import emptyBottleImg from "../assets/alchemist/empty_bottle.png";

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

// Export the Map
export const ITEM_IMAGES = {
  // Alchemist
  MOONWORT: moonwortImg,
  BLUE_LIQUID: blueLiquidImg,
  GREEN_LIQUID: greenLiquidImg,
  EMPTY_BOTTLE: emptyBottleImg,
  
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

export function getInventoryImage(itemName) {
  if (!itemName) return null;
  const key = String(itemName).trim().toUpperCase().replace(/\s+/g, "_");
  return ITEM_IMAGES[key] || null;
}