import { renderWizardLibraryNorthWall } from "./wizard_library/north";
import { renderWizardLibraryEastWall } from "./wizard_library/east";
import { renderAlchemistLabEastWall } from "./alchemist_lab/east";
import { renderAlchemistLabWestWall } from "./alchemist_lab/west";
// Import other walls they are implemented

const registry = {
  wizard_library: {
    0: renderWizardLibraryNorthWall,
    1: renderWizardLibraryEastWall,
    2: null, // TODO: Implement and add
    3: null,
  },
  alchemist_lab: {
    0: null, // TODO: Implement and add
    1: renderAlchemistLabEastWall,
    2: null,
    3: renderAlchemistLabWestWall,
  },
};

export function getInteractionLayer(roomType, viewIndex) {
  return registry[roomType]?.[viewIndex] || null;
}
