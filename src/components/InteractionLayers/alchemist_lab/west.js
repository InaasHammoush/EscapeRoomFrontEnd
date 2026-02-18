import * as PIXI from "pixi.js";

export const renderAlchemistLabWestWall = (app, { roomId, socket, normX, normY, scaleX, scaleY }) => {
  const stage = app.stage;

  console.log(" Rendering alchemist_lab west wall. Socket available?", !!socket);

  // Mortar Puzzle Hotspot
  const mortar = new PIXI.Graphics()
    .rect(
      normX(545),   
      normY(400),  
      scaleX(70),  // width
      scaleY(80)   // height
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  mortar.eventMode = "static";
  mortar.cursor = "pointer";

  mortar.on("pointertap", () => {
    console.log("Mortar hotspot clicked!");
    console.log("Socket available at click time?", !!socket);
    
    if (!socket) {
      console.error("Socket is null/undefined");
      return;
    }

    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_mortar",
      verb: "INTERACT",
    });
    
    console.log("Interact event emitted for trigger_mortar");
  });

  stage.addChild(mortar);
  console.log("Mortar hotspot added to stage");

  // Transmuter Puzzle Hotspot
  const transmuter = new PIXI.Graphics()
    .rect(
      normX(460),
      normY(480),
      scaleX(80), // width
      scaleY(85)  // height
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  transmuter.eventMode = "static";
  transmuter.cursor = "pointer";

  transmuter.on("pointertap", () => {
    console.log("Transmuter hotspot clicked!");
    console.log("Socket available at click time?", !!socket);

    if (!socket) {
      console.error("Socket is null/undefined");
      return;
    }

    socket.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "trigger_transmuter",
      verb: "INTERACT",
    });

    console.log("Interact event emitted for trigger_transmuter");
  });

  stage.addChild(transmuter);
  console.log("Transmuter hotspot added to stage");

  // West Codebox + Jigsaw hotspot
  const westJigsaw = new PIXI.Graphics()
    .rect(
      normX(372),
      normY(655),
      scaleX(250), // width
      scaleY(220)  // height
    )
    .fill({ color: 0x00ff00, alpha: 0.3 });

  westJigsaw.eventMode = "static";
  westJigsaw.cursor = "pointer";

  westJigsaw.on("pointertap", () => {
    console.log("West jigsaw hotspot clicked!");
    console.log("Dispatching intent for alch:west-codebox");

    document.dispatchEvent(new CustomEvent("intent", {
      detail: {
        objectId: "alch:west-codebox",
        verb: "INTERACT",
      },
      bubbles: true,
      composed: true,
    }));
  });

  stage.addChild(westJigsaw);
  console.log("West jigsaw hotspot added to stage");
};
