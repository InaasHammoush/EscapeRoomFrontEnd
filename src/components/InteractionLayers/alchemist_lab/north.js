import * as PIXI from "pixi.js";

export const renderAlchemistLabNorthWall = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
  const stage = app.stage;

  const statue = new PIXI.Graphics()
    .rect(
      normX(430),
      normY(300),
      scaleX(150),
      scaleY(360)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  statue.eventMode = "static";
  statue.cursor = "pointer";

  statue.on("pointertap", () => {
    if (!socket) return;
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_statue_pose",
      verb: "INTERACT",
    });
  });

  stage.addChild(statue);
};
