import * as PIXI from "pixi.js";

export const renderAlchemistLabSouthWall = (app, { normX, normY, scaleX, scaleY }) => {
  const stage = app.stage;

  console.log(" Rendering alchemist_lab south wall.");

  const portraitHotspot = new PIXI.Graphics()
    .rect(
      normX(350),
      normY(60),
      scaleX(220),
      scaleY(520)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  portraitHotspot.eventMode = "static";
  portraitHotspot.cursor = "pointer";

  portraitHotspot.on("pointertap", () => {
    console.log("South portrait hotspot clicked!");

    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "alch:statue-pose",
          verb: "take",
          data: { item: "FEATHER" },
        },
        bubbles: true,
        composed: true,
      })
    );
    console.log("FEATHER granted from south portrait");
  });

  stage.addChild(portraitHotspot);
  console.log("South portrait hotspot added to stage");

};
