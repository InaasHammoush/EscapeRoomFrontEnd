

const WALL_IMAGE_OVERRIDE_RULES = [
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
    fit: "cover",
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
    fit: "cover",
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
    fit: "cover",
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
  };
}
