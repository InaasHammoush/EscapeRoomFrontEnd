import * as PIXI from "pixi.js";

export const renderWizardLibraryWestWall = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
    const stage = app.stage;

  const tablePuzzle = new PIXI.Graphics()
    .rect(
      normX(327), 
      normY(367), 
      scaleX(350), 
      scaleY(300)
    ) 
    .fill({ color: 0x00ff00, alpha: 0.3 });

    tablePuzzle.eventMode = "static";
    tablePuzzle.cursor = "pointer";

    tablePuzzle.on("pointertap", () => {
      socket.emit("interact", {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "trigger_transformation_table",
        verb: "INTERACT",
      });
    });

  stage.addChild(tablePuzzle);
};