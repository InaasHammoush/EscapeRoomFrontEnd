// src/config/widgets.js

// This file maps the server's "activeWidget" string to the Web Component tag name
export const WIDGET_REGISTRY = {
  // Wizard Puzzles
  "tictactoe_scroll": "tictactoe-scroll-widget",
  "bookshelf_puzzle": "bookshelf-widget",
  "candle_puzzle":    "candle-puzzle-widget",
  "merlin_scale":     "merlin-scale-widget",
  "mortar_puzzle_widget": "mortar-widget",
  "candle_hint":       "candle-hint-widget",
  "frame_hint":        "frame-hint-widget",
  "recipe_hint":       "recipe-hint-widget",
  "transformation_table_puzzle": "transformation-table-widget",
  "vase_puzzle":       "vase-widget",
  "door_seal":         "door-seal-widget",
  

  // Alchemist Puzzles
  "alch:mortar": "mortar-widget",
  "mortar_puzzle": "mortar-widget",
  "transmuter_puzzle":  "transmuter-widget",
  "portrait_books_puzzle": "portrait-widget",
  "alch:portrait": "portrait-widget",
  "alch_drawer_puzzle": "drawer-widget",
  "alch:drawer": "drawer-widget",
  // Backend activeWidget keys (current index.js)
  "west_codebox_puzzle": "west-jigsaw-widget",
  "east_sliding_lock_puzzle": "east-codebox-widget",
  "light_beam_grid_puzzle": "lightbeam-grid-widget",
  // New backend IDs
  "puzzle_west_codebox": "west-jigsaw-widget",
  "puzzle_east_sliding_lock": "east-codebox-widget",
  "puzzle_light_beam_grid": "lightbeam-grid-widget",
  "puzzle_flask_transfer": "flask-transfer-widget",
  // Legacy aliases kept for compatibility
  "alchWestCodeboxJigsaw": "west-jigsaw-widget",
  "alch_west_codebox_jigsaw": "west-jigsaw-widget",
  "west_codebox_jigsaw": "west-jigsaw-widget",
  "alchEastCodebox": "east-codebox-widget",
  "alchEastSlidingLock": "east-codebox-widget",
  "alch_east_sliding_lock": "east-codebox-widget",
  "east_sliding_lock": "east-codebox-widget",
  "alchEastCodeboxJigsaw": "east-codebox-widget",
  "alch_east_codebox_jigsaw": "east-codebox-widget",
  "east_codebox_jigsaw": "east-codebox-widget",
  "alchLightBeamGrid": "lightbeam-grid-widget",
  "alch_light_beam_grid": "lightbeam-grid-widget",
  "light_beam_grid": "lightbeam-grid-widget",
  "alch:mirror-grid": "lightbeam-grid-widget",

  // von dem fix branch
  "alch:transmuter": "transmuter-widget",
  "flask_transfer_puzzle": "flask-transfer-widget",
  "alch:flask-transfer": "flask-transfer-widget",
  "statue_pose_puzzle": "statue-widget",
  "alch:statue": "statue-widget",
};
