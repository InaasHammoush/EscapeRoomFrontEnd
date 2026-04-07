import { renderWizardLibraryNorthWall } from "./wizard_library/north";
import { renderWizardLibraryEastWall } from "./wizard_library/east";
import { renderAlchemistLabEastWall } from "./alchemist_lab/east";
import { renderWizardLibrarySouthWall } from "./wizard_library/south";
import { renderWizardLibraryWestWall } from "./wizard_library/west";
import { renderAlchemistLabWestWall } from "./alchemist_lab/west";
import { renderCorridorEastWall } from "./corridor/east";
import { renderAlchemistLabNorthWall } from "./alchemist_lab/north";
import { renderAlchemistLabSouthWall } from "./alchemist_lab/south";

// Import other walls they are implemented

const registry = {
  wizard_library: {
    0: renderWizardLibraryNorthWall,
    1: renderWizardLibraryEastWall,
    2: renderWizardLibrarySouthWall,
    3: renderWizardLibraryWestWall,
  },
  alchemist_lab: {
    0: renderAlchemistLabNorthWall,
    1: renderAlchemistLabEastWall,
    2: renderAlchemistLabSouthWall,
    3: renderAlchemistLabWestWall,
  },
  corridor: {
    0: null,
    1: renderCorridorEastWall,
    2: null,
    3: null,
  },
  final_corridor: {
    0: null,
    1: renderCorridorEastWall,
    2: null,
    3: null,
  },
  // Fallback when backend still uses default room type while serving corridor images
  default: {
    0: null,
    1: renderCorridorEastWall,
    2: null,
    3: null,
  },
};

export function getInteractionLayer(roomType, viewIndex) {
  return registry[roomType]?.[viewIndex] || null;
}
