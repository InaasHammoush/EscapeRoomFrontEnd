import * as PIXI from "pixi.js";

export const renderWizardLibraryEastWall = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
    const stage = app.stage;

  const scroll_trigger = new PIXI.Graphics()
    .rect(
      normX(435),   // Position relative to image start
      normY(555), 
      scaleX(130),  // Size relative to image width
      scaleY(105)   // Size relative to image height
    ) 
    .fill({ color: 0x00ff00, alpha: 0.3 });

  scroll_trigger.eventMode = "static";
  scroll_trigger.cursor = "pointer";

  scroll_trigger.on("pointertap", () => {
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_tictactoe_scroll",
      verb: "INTERACT",
    });
  });

  stage.addChild(scroll_trigger);
};