const TARGET_ASPECT = 1920 / 1080;
const NORTH_WALL_FEATHER_LEFT = { x: 319, y: 130, w: 30 };
const NORTH_WALL_FEATHER_RIGHT = { x: 385, y: 130, w: 30 };

export function readStatueFeatherFromPayload(payload) {
  if (!payload || typeof payload !== "object") return null;

  const candidates = [
    payload?.alchStatuePose,
    payload?.["alch:statue"],
    payload?.["alch:statue-pose"],
    payload?.statue_pose_puzzle,
    payload,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    const hasPlaced =
      candidate?.featherInserted !== undefined ||
      candidate?.output?.featherPlaced !== undefined ||
      candidate?.feather?.inserted !== undefined;
    if (!hasPlaced) continue;

    const placed = Boolean(
      candidate?.featherInserted ??
      candidate?.output?.featherPlaced ??
      candidate?.feather?.inserted
    );
    const sideRaw = String(
      candidate?.featherSide ??
      candidate?.output?.featherSide ??
      candidate?.feather?.side ??
      ""
    ).toLowerCase();
    const side = sideRaw ? (sideRaw.includes("right") ? "right" : "left") : null;
    return { placed, side };
  }

  return null;
}

export function getNorthWallFeatherOverlay({
  roomType,
  viewIndex,
  statueFeatherPlaced,
  statueFeatherSide,
  windowWidth,
  windowHeight,
}) {
  const visible =
    roomType === "alchemist_lab" &&
    viewIndex === 0 &&
    Boolean(statueFeatherPlaced);
  if (!visible) return { visible: false, style: null };
  if (!Number.isFinite(windowWidth) || !Number.isFinite(windowHeight)) {
    return { visible: false, style: null };
  }

  const windowAspect = windowWidth / windowHeight;
  let displayW = 0;
  let displayH = 0;
  let offsetX = 0;
  let offsetY = 0;

  if (windowAspect > TARGET_ASPECT) {
    displayH = windowHeight;
    displayW = displayH * TARGET_ASPECT;
    offsetX = (windowWidth - displayW) / 2;
  } else {
    displayW = windowWidth;
    displayH = displayW / TARGET_ASPECT;
    offsetY = (windowHeight - displayH) / 2;
  }

  const isRight = statueFeatherSide === "right";
  const pos = isRight ? NORTH_WALL_FEATHER_RIGHT : NORTH_WALL_FEATHER_LEFT;

  return {
    visible: true,
    style: {
      left: `${offsetX + (pos.x / 1000) * displayW}px`,
      top: `${offsetY + (pos.y / 1000) * displayH}px`,
      width: `${(pos.w / 1000) * displayW}px`,
      height: `${(pos.w / 1000) * displayW}px`,
      transform: isRight
        ? "translate(-50%, -50%) scaleX(-1)"
        : "translate(-50%, -50%)",
    },
  };
}
