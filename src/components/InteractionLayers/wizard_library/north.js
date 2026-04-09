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
    .fill({ color: 0xffffff, alpha: 0.001 });

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
  .fill({ color: 0xffffff, alpha: 0.001 });

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

  const keyVase = new PIXI.Graphics()
  .rect(
    normX(233), 
    normY(706), 
    scaleX(50), 
    scaleY(120)
  ) 
  .fill({ color: 0xffffff, alpha: 0.001 });

  keyVase.eventMode = "static";
  keyVase.cursor = "pointer";

  keyVase.on("pointertap", () => {
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_key_vase",
      verb: "INTERACT",
    });
  });

  stage.addChild(bookShelf);
  stage.addChild(candles);
  stage.addChild(keyVase);
};