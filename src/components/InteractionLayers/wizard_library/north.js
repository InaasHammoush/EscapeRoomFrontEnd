import * as PIXI from "pixi.js";

export const renderWizardLibraryNorthWall = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
    const stage = app.stage;

  const bookShelf = new PIXI.Graphics()
    .rect(
      normX(393), 
      normY(405), 
      scaleX(150), 
      scaleY(180)
    ) 
    .fill({ color: 0x00ff00, alpha: 0.3 });

    bookShelf.eventMode = "static";
    bookShelf.cursor = "pointer";

    bookShelf.on("pointertap", () => {
      socket.emit("interact", {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "trigger_bookshelf",
        verb: "INTERACT",
      });
    });

  const candles = new PIXI.Graphics()
  .rect(
    normX(770), 
    normY(470), 
    scaleX(160), 
    scaleY(180)
  ) 
  .fill({ color: 0x00ff00, alpha: 0.3 });

  candles.eventMode = "static";
  candles.cursor = "pointer";

  candles.on("pointertap", () => {
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_candle_puzzle",
      verb: "INTERACT",
    });
  });

  const candlesHint = new PIXI.Graphics()
  .rect(
    normX(110), 
    normY(252), 
    scaleX(60), 
    scaleY(40)
  ) 
  .fill({ color: 0x00ff00, alpha: 0.3 });

  candlesHint.eventMode = "static";
  candlesHint.cursor = "pointer";

  candlesHint.on("pointertap", () => {
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_wiz_hint_candles",
      verb: "INTERACT",
    });
  });

  stage.addChild(bookShelf);
  stage.addChild(candles);
  stage.addChild(candlesHint);
};