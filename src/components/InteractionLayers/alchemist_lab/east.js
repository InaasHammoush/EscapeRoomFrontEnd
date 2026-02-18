import * as PIXI from "pixi.js";

export const renderAlchemistLabEastWall = (app, { roomId, socket, normX, normY, scaleX, scaleY, eastDoorSolved = false }) => {
  const stage = app.stage;

  console.log(" Rendering alchemist_lab east wall. Socket available?", !!socket);
  if (eastDoorSolved) {
    console.log("East codebox solved; hotspot hidden.");
    return;
  }

  // East codebox hotspot
  const eastCodebox = new PIXI.Graphics()
    .rect(
      normX(408),
      normY(342),
      scaleX(190),
      scaleY(290)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  eastCodebox.eventMode = "static";
  eastCodebox.cursor = "pointer";

  eastCodebox.on("pointertap", () => {
    document.dispatchEvent(new CustomEvent("intent", {
      detail: {
        objectId: "alch:east-codebox",
        verb: "INTERACT",
      },
      bubbles: true,
      composed: true,
    }));
  });

  stage.addChild(eastCodebox);
};
