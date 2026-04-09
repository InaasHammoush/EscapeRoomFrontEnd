import finalCorridorDoorImage from "../assets/final_corridor/final_corridor_door.png";

const DEFAULT_WALL_ASPECT_RATIO = 1920 / 1080;
const FINAL_CORRIDOR_ASPECT_RATIO = 1394 / 768;

const WALL_IMAGE_OVERRIDE_RULES = [
  {
    roomType: "wizard_library",
    viewIndex: 1,
    when: (gameState) => !!gameState?.door_seal?.opened,
    image: "/rooms/wizard_library/eastOpen.png",
  },
  {
    roomType: "wizard_library",
    viewIndex: 1,
    when: (gameState) => !!gameState?.tictactoe_scroll?.solved,
    image: "/rooms/wizard_library/eastNoScroll.png",
  },
  {
    roomType: "wizard_library",
    viewIndex: 0,
    when: (gameState) =>
      !!gameState?.candle_puzzle?.solved && !!gameState?.bookshelf_puzzle?.solved,
    image: "/rooms/wizard_library/north_all_solved.png",
  },
  {
    roomType: "wizard_library",
    viewIndex: 0,
    when: (gameState) => !!gameState?.candle_puzzle?.solved,
    image: "/rooms/wizard_library/north_candles_solved.png",
  },
  {
    roomType: "wizard_library",
    viewIndex: 0,
    when: (gameState) => !!gameState?.bookshelf_puzzle?.solved,
    image: "/rooms/wizard_library/north_books_solved.png",
  },
  {
    roomType: "alchemist_lab",
    viewIndex: 1,
    when: (gameState) =>
      !!(
        gameState?.alchDoorState?.open ||
        gameState?.alchEastDoorSync?.opened
      ),
    image: "/rooms/alchemist_lab/final_door_open.png",
    fit: "contain",
  },
  {
    roomType: "alchemist_lab",
    viewIndex: 1,
    when: (gameState) =>
      !!(
        (gameState?.alchEastSlidingLock?.solved ||
          gameState?.puzzle_east_sliding_lock?.solved) &&
        (gameState?.alchLightBeamGrid?.solved ||
          gameState?.puzzle_light_beam_grid?.solved)
      ),
    image: "/rooms/alchemist_lab/final_door_closed_runes.png",
    fit: "contain",
  },
  {
    roomType: "alchemist_lab",
    viewIndex: 1,
    when: (gameState) =>
      !!(
        (gameState?.alchLightBeamGrid?.solved ||
          gameState?.puzzle_light_beam_grid?.solved) &&
        !(
          gameState?.alchEastSlidingLock?.solved ||
          gameState?.puzzle_east_sliding_lock?.solved
        )
      ),
    image: "/rooms/alchemist_lab/final_door_only_rune.png",
    fit: "contain",
  },
  {
    roomType: "alchemist_lab",
    viewIndex: 1,
    when: (gameState) =>
      !!(
        gameState?.alchEastSlidingLock?.solved ||
        gameState?.puzzle_east_sliding_lock?.solved
      ),
    image: "/rooms/alchemist_lab/final_door_closed.png",
    fit: "contain",
  },
  {
    roomType: "corridor",
    viewIndex: 1,
    when: () => true,
    image: finalCorridorDoorImage,
    fit: "contain",
    aspectRatio: FINAL_CORRIDOR_ASPECT_RATIO,
  },
  {
    roomType: "final_corridor",
    viewIndex: 1,
    when: () => true,
    image: finalCorridorDoorImage,
    fit: "contain",
    aspectRatio: FINAL_CORRIDOR_ASPECT_RATIO,
  },
  {
    roomType: "default",
    viewIndex: 1,
    when: (gameState) => !!gameState?.finalCorridor,
    image: finalCorridorDoorImage,
    fit: "contain",
    aspectRatio: FINAL_CORRIDOR_ASPECT_RATIO,
  },
];

export function resolveWallImage(baseImage, { roomType, viewIndex, gameState } = {}) {
  const rule = WALL_IMAGE_OVERRIDE_RULES.find(
    (entry) =>
      entry.roomType === roomType &&
      entry.viewIndex === viewIndex &&
      entry.when(gameState)
  );

  return {
    src: rule?.image || baseImage,
    fit: rule?.fit || "contain",
    aspectRatio: rule?.aspectRatio || DEFAULT_WALL_ASPECT_RATIO,
  };
}
