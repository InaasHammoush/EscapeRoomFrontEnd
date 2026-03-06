import * as PIXI from "pixi.js";

export const renderAlchemistLabNorthWall = (
  app,
  { normX, normY, scaleX, scaleY }
) => {
  const stage = app.stage;
  
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
  });

  stage.addChild(drawerHotspot);
  
  const statue = new PIXI.Graphics()
    .rect(
      normX(269),
      normY(90),
      scaleX(200),
      scaleY(780)
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  statue.eventMode = "static";
  statue.cursor = "pointer";

  statue.on("pointertap", () => {
    if (!socket) return;
    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_statue_pose",
      verb: "INTERACT",
    });
  });

  stage.addChild(statue);
};
