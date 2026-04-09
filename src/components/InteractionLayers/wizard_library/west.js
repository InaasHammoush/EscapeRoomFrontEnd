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
    .fill({ color: 0xffffff, alpha: 0.001 });

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

    const recipeHint = new PIXI.Graphics()
    .rect(
      normX(759), 
      normY(560), 
      scaleX(190), 
      scaleY(290)
    ) 
    .fill({ color: 0xffffff, alpha: 0.001 });

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

  stage.addChild(tablePuzzle);
  stage.addChild(recipeHint);
};