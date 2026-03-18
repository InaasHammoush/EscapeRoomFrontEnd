import * as PIXI from "pixi.js";

function emitInteract(socket, payload) {
  if (!socket) return;
  socket.emit("interact", payload);
}

function makeRoundedRect({
  x,
  y,
  w,
  h,
  radius = 18,
  fillColor = 0xffffff,
  fillAlpha = 0,
  strokeColor = fillColor,
  strokeAlpha = 0,
  strokeWidth = 0,
}) {
  const graphic = new PIXI.Graphics();
  graphic.roundRect(x, y, w, h, radius);
  if (fillAlpha > 0) {
    graphic.fill({ color: fillColor, alpha: fillAlpha });
  }
  if (strokeAlpha > 0 && strokeWidth > 0) {
    graphic.stroke({ color: strokeColor, alpha: strokeAlpha, width: strokeWidth });
  }
  return graphic;
}

function makeDiamond({
  centerX,
  centerY,
  width,
  height,
  fillColor,
  fillAlpha,
  strokeColor,
  strokeAlpha,
  strokeWidth = 2,
}) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const graphic = new PIXI.Graphics();
  graphic.poly([
    centerX,
    centerY - halfHeight,
    centerX + halfWidth,
    centerY,
    centerX,
    centerY + halfHeight,
    centerX - halfWidth,
    centerY,
  ]);
  graphic.fill({ color: fillColor, alpha: fillAlpha });
  graphic.stroke({ color: strokeColor, alpha: strokeAlpha, width: strokeWidth });
  return graphic;
}

function makeHitTarget({ x, y, w, h, radius = 18, cursor = "pointer", onTap }) {
  const target = makeRoundedRect({
    x,
    y,
    w,
    h,
    radius,
    fillColor: 0xffffff,
    fillAlpha: 0.001,
  });
  target.eventMode = "static";
  target.cursor = cursor;
  target.on("pointertap", onTap);
  return target;
}

function renderRuneCluster(stage, {
  normX,
  normY,
  scaleX,
  scaleY,
  x,
  yStart,
  lit,
  activeColor,
  inactiveColor,
}) {
  const gap = scaleY(112);
  const width = scaleX(28);
  const height = scaleY(38);

  for (let index = 0; index < 3; index += 1) {
    const isLit = lit;
    const centerY = normY(yStart) + gap * index;
    const diamond = makeDiamond({
      centerX: normX(x),
      centerY,
      width,
      height,
      fillColor: isLit ? activeColor : inactiveColor,
      fillAlpha: isLit ? 0.55 : 0.16,
      strokeColor: isLit ? 0xf8fafc : inactiveColor,
      strokeAlpha: isLit ? 0.65 : 0.3,
      strokeWidth: Math.max(1, Math.round(scaleX(2))),
    });
    stage.addChild(diamond);

    if (isLit) {
      const aura = makeDiamond({
        centerX: normX(x),
        centerY,
        width: width * 1.75,
        height: height * 1.75,
        fillColor: activeColor,
        fillAlpha: 0.12,
        strokeColor: activeColor,
        strokeAlpha: 0,
      });
      stage.addChild(aura);
    }
  }
}

export const renderCorridorEastWall = (
  app,
  { roomId, socket, normX, normY, scaleX, scaleY, gameState }
) => {
  const stage = app.stage;
  const finalCorridor = gameState?.finalCorridor || {};
  const keywordSolved = !!finalCorridor.keywordSolved;
  const finalDoorOpen = !!finalCorridor.finalDoorOpen;
  const wizardRunesLit = !!finalCorridor.wizardRunesLit;
  const alchemistRunesLit = !!finalCorridor.alchemistRunesLit;
  const leftPlatePressed = !!finalCorridor?.plates?.left?.pressed;
  const rightPlatePressed = !!finalCorridor?.plates?.right?.pressed;
  const platesReady = keywordSolved && !finalDoorOpen;

  const radius = Math.max(10, Math.round(Math.min(scaleX(18), scaleY(18))));
  const strokeWidth = Math.max(2, Math.round(scaleX(2)));

  const doorFrame = makeRoundedRect({
    x: normX(360),
    y: normY(118),
    w: scaleX(280),
    h: scaleY(676),
    radius,
    fillColor: finalDoorOpen ? 0xe6ffb1 : 0x152330,
    fillAlpha: finalDoorOpen ? 0.08 : 0.04,
    strokeColor: finalDoorOpen
      ? 0xf8ffcf
      : wizardRunesLit || alchemistRunesLit
        ? 0x7dd3fc
        : 0x334155,
    strokeAlpha: finalDoorOpen ? 0.6 : 0.28,
    strokeWidth,
  });
  stage.addChild(doorFrame);

  const doorPanel = makeRoundedRect({
    x: normX(426),
    y: normY(222),
    w: scaleX(148),
    h: scaleY(468),
    radius,
    fillColor: finalDoorOpen ? 0xe0f2fe : 0x020617,
    fillAlpha: finalDoorOpen ? 0.13 : 0.06,
    strokeColor: finalDoorOpen ? 0xfef3c7 : 0x1e293b,
    strokeAlpha: finalDoorOpen ? 0.32 : 0.18,
    strokeWidth,
  });
  stage.addChild(doorPanel);

  if (finalDoorOpen) {
    const seamGlow = makeRoundedRect({
      x: normX(468),
      y: normY(220),
      w: scaleX(64),
      h: scaleY(470),
      radius,
      fillColor: 0xfef9c3,
      fillAlpha: 0.18,
      strokeColor: 0xffffff,
      strokeAlpha: 0.18,
      strokeWidth,
    });
    stage.addChild(seamGlow);
  }

  renderRuneCluster(stage, {
    normX,
    normY,
    scaleX,
    scaleY,
    x: 386,
    yStart: 228,
    lit: wizardRunesLit,
    activeColor: 0x5eead4,
    inactiveColor: 0x1f2937,
  });

  renderRuneCluster(stage, {
    normX,
    normY,
    scaleX,
    scaleY,
    x: 614,
    yStart: 228,
    lit: alchemistRunesLit,
    activeColor: 0xfbbf24,
    inactiveColor: 0x2b2114,
  });

  const consoleHighlight = makeRoundedRect({
    x: normX(431),
    y: normY(468),
    w: scaleX(141),
    h: scaleY(84),
    radius,
    fillColor: finalDoorOpen ? 0xfef3c7 : 0x38bdf8,
    fillAlpha: finalDoorOpen ? 0.16 : wizardRunesLit && alchemistRunesLit ? 0.12 : 0.06,
    strokeColor: finalDoorOpen ? 0xfef9c3 : 0xe0f2fe,
    strokeAlpha: finalDoorOpen ? 0.5 : wizardRunesLit && alchemistRunesLit ? 0.48 : 0.2,
    strokeWidth,
  });
  stage.addChild(consoleHighlight);

  const leftPlate = makeRoundedRect({
    x: normX(284),
    y: normY(432),
    w: scaleX(98),
    h: scaleY(176),
    radius,
    fillColor: finalDoorOpen
      ? 0xbbf7d0
      : leftPlatePressed
        ? 0x5eead4
        : platesReady
          ? 0x38bdf8
          : 0x0f172a,
    fillAlpha: finalDoorOpen ? 0.22 : leftPlatePressed ? 0.18 : platesReady ? 0.12 : 0.04,
    strokeColor: finalDoorOpen ? 0xfef9c3 : 0xe2e8f0,
    strokeAlpha: finalDoorOpen ? 0.38 : platesReady ? 0.42 : 0.18,
    strokeWidth,
  });
  stage.addChild(leftPlate);

  const rightPlate = makeRoundedRect({
    x: normX(618),
    y: normY(432),
    w: scaleX(98),
    h: scaleY(176),
    radius,
    fillColor: finalDoorOpen
      ? 0xbbf7d0
      : rightPlatePressed
        ? 0x5eead4
        : platesReady
          ? 0x38bdf8
          : 0x0f172a,
    fillAlpha: finalDoorOpen ? 0.22 : rightPlatePressed ? 0.18 : platesReady ? 0.12 : 0.04,
    strokeColor: finalDoorOpen ? 0xfef9c3 : 0xe2e8f0,
    strokeAlpha: finalDoorOpen ? 0.38 : platesReady ? 0.42 : 0.18,
    strokeWidth,
  });
  stage.addChild(rightPlate);

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
