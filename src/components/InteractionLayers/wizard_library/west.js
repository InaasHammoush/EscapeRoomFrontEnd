import * as PIXI from "pixi.js";

export const renderWizardLibraryWestWall = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
    const stage = app.stage;

  const recipeHint = new PIXI.Graphics()
    .rect(
      normX(27), 
      normY(532), 
      scaleX(120), 
      scaleY(60)
    ) 
    .fill({ color: 0x00ff00, alpha: 0.3 });

    recipeHint.eventMode = "static";
    recipeHint.cursor = "pointer";

    recipeHint.on("pointertap", () => {
      socket.emit("interact", {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "trigger_wiz_hint_recipe",
        verb: "INTERACT",
      });
    });

  stage.addChild(recipeHint);
};