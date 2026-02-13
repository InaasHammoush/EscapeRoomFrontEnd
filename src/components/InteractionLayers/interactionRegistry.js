import { renderWizardLibraryNorthWall } from "./wizard_library/north";
import { renderWizardLibraryEastWall } from "./wizard_library/east";
// Import other walls they are implemented

const registry = {
  wizard_library: {
    0: renderWizardLibraryNorthWall,
    1: renderWizardLibraryEastWall,
    2: null, // TODO: Implement and add
    3: null,
  },
  // alchemist_lab: { ... }, corridor: { ... }
};

export function getInteractionLayer(roomType, viewIndex) {
  return registry[roomType]?.[viewIndex] || null;
}