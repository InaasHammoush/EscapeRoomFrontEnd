import * as PIXI from "pixi.js";

export const renderAlchemistLabNorthWall = (
  app,
  { normX, normY, scaleX, scaleY }
) => {
  const stage = app.stage;

  console.log(" Rendering alchemist_lab north wall.");

  // North wall hotspot 
  const northWall = new PIXI.Graphics()
    .rect(
      normX(269),
      normY(90),
      scaleX(200),
      scaleY(780)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  northWall.eventMode = "static";
  northWall.cursor = "pointer";

  northWall.on("pointertap", () => {
    console.log("North wall hotspot clicked!");
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "trigger_statue",
          verb: "INTERACT",
          data: {},
        },
        bubbles: true,
        composed: true,
      })
    );
    console.log("Intent dispatched for trigger_statue");
  });

  stage.addChild(northWall);
  console.log("North wall hotspot added to stage");

  const drawerHotspot = new PIXI.Graphics()
    .rect(
      normX(665),
      normY(529),
      scaleX(300),
      scaleY(320)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  drawerHotspot.eventMode = "static";
  drawerHotspot.cursor = "pointer";

  drawerHotspot.on("pointertap", () => {
    console.log("North drawer hotspot clicked!");
    document.dispatchEvent(
      new CustomEvent("intent", {
        detail: {
          objectId: "alch:south-drawer",
          verb: "take",
          data: { item: "HIRACHY" },
        },
        bubbles: true,
        composed: true,
      })
    );
    console.log("HIRACHY granted from north drawer");
  });

  stage.addChild(drawerHotspot);
  console.log("North drawer hotspot added to stage");

};
