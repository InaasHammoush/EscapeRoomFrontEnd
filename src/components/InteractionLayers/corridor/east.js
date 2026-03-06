import * as PIXI from "pixi.js";

function emitInteract(socket, payload) {
  if (!socket) return;
  socket.emit("interact", payload);
}

function makeHotspot(app, { x, y, w, h, color = 0x00ff00, alpha = 0.25 }) {
  return new PIXI.Graphics()
    .rect(x, y, w, h)
    .fill({ color, alpha });
}

export const renderCorridorEastWall = (
  app,
  { roomId, socket, normX, normY, scaleX, scaleY, gameState }
) => {
  const stage = app.stage;
  const finalDoorOpen = !!gameState?.finalCorridor?.finalDoorOpen;

  // Center hotspot: opens the keyword input widget
  const doorConsole = makeHotspot(app, {
    x: normX(468),
    y: normY(430),
    w: scaleX(72),
    h: scaleY(110),
    color: finalDoorOpen ? 0x3ddc97 : 0x00ff00,
  });
  doorConsole.eventMode = "static";
  doorConsole.cursor = "pointer";
  doorConsole.on("pointertap", () => {
    emitInteract(socket, {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_final_keypad",
      verb: "INTERACT",
    });
  });

  // Left plate
  const leftPlate = makeHotspot(app, {
    x: normX(270),
    y: normY(640),
    w: scaleX(140),
    h: scaleY(110),
    color: finalDoorOpen ? 0x3ddc97 : 0x00ff00,
  });
  leftPlate.eventMode = "static";
  leftPlate.cursor = "pointer";
  leftPlate.on("pointertap", () => {
    emitInteract(socket, {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "final:plate-left",
      verb: "press",
      data: {},
    });
  });

  // Right plate
  const rightPlate = makeHotspot(app, {
    x: normX(600),
    y: normY(640),
    w: scaleX(140),
    h: scaleY(110),
    color: finalDoorOpen ? 0x3ddc97 : 0x00ff00,
  });
  rightPlate.eventMode = "static";
  rightPlate.cursor = "pointer";
  rightPlate.on("pointertap", () => {
    emitInteract(socket, {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "final:plate-right",
      verb: "press",
      data: {},
    });
  });

  // Optional hint hotspot (placeholder)
  const hintNote = makeHotspot(app, {
    x: normX(155),
    y: normY(365),
    w: scaleX(65),
    h: scaleY(55),
    color: 0x4fc3f7,
    alpha: 0.3,
  });
  hintNote.eventMode = "static";
  hintNote.cursor = "pointer";
  hintNote.on("pointertap", () => {
    emitInteract(socket, {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "final:hint-note",
      verb: "read",
      data: {},
    });
  });

  stage.addChild(doorConsole);
  stage.addChild(leftPlate);
  stage.addChild(rightPlate);
  stage.addChild(hintNote);
};
