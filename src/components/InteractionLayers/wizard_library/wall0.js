import * as PIXI from "pixi.js";

export const renderWizardLibraryWall0 = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
    const stage = app.stage;

  const scrollBox = new PIXI.Graphics()
    .rect(
      normX(777),   // Position relative to image start
      normY(475), 
      scaleX(300),  // Size relative to image width
      scaleY(200)   // Size relative to image height
    ) 
    .fill({ color: 0x00ff00, alpha: 0.3 });

  scrollBox.eventMode = "static";
  scrollBox.cursor = "pointer";

  scrollBox.on("pointertap", () => {
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "test_box_01",
      verb: "INTERACT",
    });
  });

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
        objectId: "bookshelf_01",
        verb: "INTERACT",
      });
    });

  bookShelf.on("pointertap", () => {
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "test_bookshelf_01",
      verb: "INTERACT",
    });
  });

  stage.addChild(scrollBox);
  stage.addChild(bookShelf);
};