import * as PIXI from "pixi.js";

export const renderWizardLibraryWall0 = (app, { roomId, socket, normX, normY }) => {
  const stage = app.stage;

  // Instead of .rect(500, 400, 200, 200)
  const x = normX(600);
  const y = normY(500);
  const width = normX(100);
  const height = normY(50);

  const scrollBox = new PIXI.Graphics()
    .rect(x, y, width, height) 
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
    .rect(normX(414), normY(409), 185, 123) 
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