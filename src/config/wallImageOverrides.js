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
];

export function resolveWallImage(baseImage, { roomType, viewIndex, gameState } = {}) {
  const rule = WALL_IMAGE_OVERRIDE_RULES.find(
    (entry) =>
      entry.roomType === roomType &&
      entry.viewIndex === viewIndex &&
      entry.when(gameState)
  );

  return rule?.image || baseImage;
}
