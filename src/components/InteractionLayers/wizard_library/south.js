import * as PIXI from "pixi.js";

export const renderWizardLibrarySouthWall = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
    const stage = app.stage;

  const frameHint = new PIXI.Graphics()
    .rect(
      normX(324), 
      normY(633), 
      scaleX(60), 
      scaleY(40)
    ) 
    .fill({ color: 0xffffff, alpha: 0.001 });

    frameHint.eventMode = "static";
    frameHint.cursor = "pointer";

    frameHint.on("pointertap", () => {
      socket.emit("interact", {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "trigger_wiz_hint_frame",
        verb: "INTERACT",
      });
    });

    const mrelinPuzzle = new PIXI.Graphics()
    .rect(
      normX(350), 
      normY(295), 
      scaleX(315), 
      scaleY(333)
    ) 
    .fill({ color: 0xffffff, alpha: 0.001 });

    mrelinPuzzle.eventMode = "static";
    mrelinPuzzle.cursor = "pointer";

    mrelinPuzzle.on("pointertap", () => {
      socket.emit("interact", {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "trigger_merlin_scale",
        verb: "INTERACT",
      });
    });

    const candleHint = new PIXI.Graphics()
    .rect(
      normX(40), 
      normY(327), 
      scaleX(97), 
      scaleY(265)
    ) 
    .fill({ color: 0xffffff, alpha: 0.001 });

    candleHint.eventMode = "static";
    candleHint.cursor = "pointer";

    candleHint.on("pointertap", () => {
      socket.emit("interact", {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "trigger_wiz_hint_candles",
        verb: "INTERACT",
      });
    });

  stage.addChild(frameHint);
  stage.addChild(mrelinPuzzle);
  stage.addChild(candleHint);
};