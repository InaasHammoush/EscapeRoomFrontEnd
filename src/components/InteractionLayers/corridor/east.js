import * as PIXI from "pixi.js";

function emitInteract(socket, payload) {
  if (!socket) return;
  socket.emit("interact", payload);
}

function makeHitTarget({ x, y, w, h, radius = 18, cursor = "pointer", onTap }) {
  const target = new PIXI.Container();
  target.hitArea = new PIXI.RoundedRectangle(x, y, w, h, radius);
  target.eventMode = "static";
  target.cursor = cursor;
  target.on("pointertap", onTap);
  return target;
}

export const renderCorridorEastWall = (
  app,
  { roomId, socket, normX, normY, scaleX, scaleY, gameState }
) => {
  const stage = app.stage;
  const finalCorridor = gameState?.finalCorridor || {};
  const keywordSolved = !!finalCorridor.keywordSolved;
  const finalDoorOpen = !!finalCorridor.finalDoorOpen;
  const platesReady = keywordSolved && !finalDoorOpen;

  const radius = Math.max(10, Math.round(Math.min(scaleX(18), scaleY(18))));

  const keypadHitTarget = makeHitTarget({
    x: normX(417),
    y: normY(452),
    w: scaleX(169),
    h: scaleY(114),
    radius,
    onTap: () => {
      emitInteract(socket, {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "trigger_final_keypad",
        verb: "INTERACT",
      });
    },
  });
  stage.addChild(keypadHitTarget);

  if (platesReady) {
    const leftPlateHitTarget = makeHitTarget({
      x: normX(270),
      y: normY(418),
      w: scaleX(126),
      h: scaleY(204),
      radius,
      onTap: () => {
        emitInteract(socket, {
          roomId,
          actionId: crypto.randomUUID(),
          objectId: "final:plate-left",
          verb: "press",
          data: {},
        });
      },
    });
    stage.addChild(leftPlateHitTarget);

    const rightPlateHitTarget = makeHitTarget({
      x: normX(604),
      y: normY(418),
      w: scaleX(126),
      h: scaleY(204),
      radius,
      onTap: () => {
        emitInteract(socket, {
          roomId,
          actionId: crypto.randomUUID(),
          objectId: "final:plate-right",
          verb: "press",
          data: {},
        });
      },
    });
    stage.addChild(rightPlateHitTarget);
  }
};
