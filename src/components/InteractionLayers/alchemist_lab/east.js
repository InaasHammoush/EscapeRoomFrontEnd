import * as PIXI from "pixi.js";

export const renderAlchemistLabEastWall = (app, { roomId, socket, normX, normY, scaleX, scaleY, eastDoorSolved = false }) => {
  const stage = app.stage;

  console.log(" Rendering alchemist_lab east wall. Socket available?", !!socket);

  // LightBeamGrid hotspot
  const mirrorGrid = new PIXI.Graphics()
    .rect(
      normX(710),
      normY(410),
      scaleX(180),
      scaleY(300)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

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

  if (eastDoorSolved) {
    console.log("East codebox solved; hotspot hidden.");
    return;
  }

  // East codebox hotspot
  const eastCodebox = new PIXI.Graphics()
    .rect(
      normX(408),
      normY(342),
      scaleX(190),
      scaleY(290)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  eastCodebox.eventMode = "static";
  eastCodebox.cursor = "pointer";

  eastCodebox.on("pointertap", () => {
    if (!socket) return;
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_east_sliding_lock",
      verb: "INTERACT",
    });
  });

  stage.addChild(eastCodebox);
};
