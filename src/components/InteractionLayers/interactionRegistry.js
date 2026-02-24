import { renderWizardLibraryNorthWall } from "./wizard_library/north";
import { renderWizardLibraryEastWall } from "./wizard_library/east";
import { renderWizardLibrarySouthWall } from "./wizard_library/south";
import { renderWizardLibraryWestWall } from "./wizard_library/west";
import { renderAlchemistLabWestWall } from "./alchemist_lab/west";

// Import other walls they are implemented

const registry = {
  wizard_library: {
    0: renderWizardLibraryNorthWall,
    1: renderWizardLibraryEastWall,
    2: renderWizardLibrarySouthWall,
    3: renderWizardLibraryWestWall,
  },
  alchemist_lab: {
    0: null, // TODO: Implement and add
    1: null,
    2: null,
    3: renderAlchemistLabWestWall,
  },
};

export function getInteractionLayer(roomType, viewIndex) {
  return registry[roomType]?.[viewIndex] || null;
}