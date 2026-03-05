import * as PIXI from "pixi.js";

export const renderAlchemistLabSouthWall = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
  const stage = app.stage;

  const flasks = new PIXI.Graphics()
    .rect(
      normX(410),
      normY(380),
      scaleX(190),
      scaleY(120)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  flasks.eventMode = "static";
  flasks.cursor = "pointer";

  flasks.on("pointertap", () => {
    if (!socket) return;

    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_flask_transfer",
      verb: "INTERACT",
    });
  });

  stage.addChild(flasks);
};
