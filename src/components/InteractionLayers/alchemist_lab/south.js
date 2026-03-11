import * as PIXI from "pixi.js";

export const renderAlchemistLabSouthWall = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
  const stage = app.stage;

  const portraitHotspot = new PIXI.Graphics()
    .rect(
      normX(350),
      normY(60),
      scaleX(220),
      scaleY(520)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  portraitHotspot.eventMode = "static";
  portraitHotspot.cursor = "pointer";

  portraitHotspot.on("pointertap", () => {
    if (!socket) return;

      socket.emit("interact", {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "trigger_portrait_books",
        verb: "INTERACT",
      });
    });

  stage.addChild(portraitHotspot);

  const flasks = new PIXI.Graphics()
    .rect(
      normX(717),
      normY(412),
      scaleX(270),
      scaleY(550)
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
