import * as PIXI from "pixi.js";

export const renderAlchemistLabEastWall = (app, { roomId, socket, gameState, normX, normY, scaleX, scaleY }) => {
  const stage = app.stage;
  const slidingSolved = !!(
    gameState?.alchEastSlidingLock?.solved ||
    gameState?.puzzle_east_sliding_lock?.solved
  );
  const keyInserted = !!gameState?.alchEastDoorSync?.keyInserted;
  const doorOpen = !!(
    gameState?.alchDoorState?.open ||
    gameState?.alchEastDoorSync?.opened
  );

  // LightBeamGrid hotspot
  const mirrorGrid = new PIXI.Graphics()
    .rect(
      normX(710),
      normY(410),
      scaleX(180),
      scaleY(300)
    )
    .fill({ color: 0xffffff, alpha: 0.001 });

  mirrorGrid.eventMode = "static";
  mirrorGrid.cursor = "pointer";

  mirrorGrid.on("pointertap", () => {
    if (!socket) return;
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_light_beam_grid",
      verb: "INTERACT",
    });
  });

  stage.addChild(mirrorGrid);

  const eastHotspot = new PIXI.Graphics()
    .rect(
      normX(408),
      normY(342),
      scaleX(190),
      scaleY(290)
    )
    .fill({ color: 0xffffff, alpha: 0.001 });

  eastHotspot.eventMode = "static";
  eastHotspot.cursor = "pointer";

  eastHotspot.on("pointertap", () => {
    if (!socket) return;
    const objectId = !slidingSolved
      ? "trigger_east_sliding_lock"
      : (keyInserted && !doorOpen ? "alch:east-door-switch" : "trigger_east_door");
    const verb = !slidingSolved || (!keyInserted || doorOpen) ? "INTERACT" : "press";
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId,
      verb,
    });
  });

  stage.addChild(eastHotspot);
};
