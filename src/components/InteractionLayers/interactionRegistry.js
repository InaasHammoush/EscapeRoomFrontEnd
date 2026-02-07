import { renderWizardLibraryWall0 } from "./wizard_library/wall0";
// Import other walls they are implemented

const registry = {
  wizard_library: {
    0: renderWizardLibraryWall0,
    1: null, // TODO: Implement and add
    2: null,
    3: null,
  },
  // alchemist_lab: { ... }, corridor: { ... }
};

export function getInteractionLayer(roomType, viewIndex) {
  return registry[roomType]?.[viewIndex] || null;
}