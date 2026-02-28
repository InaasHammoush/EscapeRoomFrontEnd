import * as PIXI from "pixi.js";

export const renderWizardLibraryEastWall = (app, { roomId, socket, gameState, normX, normY, scaleX, scaleY }) => {
  const stage = app.stage;
  const scrollSolved = !!gameState?.tictactoe_scroll?.solved;

  if (!scrollSolved) {
    const scrollTrigger = new PIXI.Graphics()
      .rect(
        normX(435),
        normY(555),
        scaleX(130),
        scaleY(105)
      )
      .fill({ color: 0x00ff00, alpha: 0.3 });

    scrollTrigger.eventMode = "static";
    scrollTrigger.cursor = "pointer";

    scrollTrigger.on("pointertap", () => {
      socket.emit("interact", {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "trigger_tictactoe_scroll",
        verb: "INTERACT",
      });
    });

    stage.addChild(scrollTrigger);
    return;
  }

  const doorTrigger = new PIXI.Graphics()
    .rect(
      normX(350),
      normY(250),
      scaleX(310),
      scaleY(620)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  doorTrigger.eventMode = "static";
  doorTrigger.cursor = "pointer";

  doorTrigger.on("pointertap", () => {
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_door_seal",
      verb: "INTERACT",
    });
  });

  stage.addChild(doorTrigger);
};
