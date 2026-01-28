import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

export default function InteractionLayer({ viewIndex, roomId, socket }) {
  const pixiContainerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    const initPixi = async () => {
      const app = new PIXI.Application();

      await app.init({
        backgroundAlpha: 0, // Transparency to see the React background 
        resizeTo: window,
      });

      app.canvas.style.pointerEvents = 'auto';

      appRef.current = app;

      if (pixiContainerRef.current) {
        pixiContainerRef.current.appendChild(app.canvas);
      }

      renderTestHotspot(app);
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
      }
    };
  }, []);

  // Separate function to handle drawing to avoid confusion
  const renderTestHotspot = (app) => {
    const stage = app.stage;
    stage.removeChildren();

    const testBox = new PIXI.Graphics()
      .rect(200, 200, 150, 150) // x, y, width, height
      .fill({ color: 0xff0000, alpha: 0.5 });

    testBox.eventMode = "static";
    testBox.cursor = "pointer";

    // Intent-based event collection
    testBox.on("pointertap", () => {
      const payload = {
        roomId,
        actionId: crypto.randomUUID(),
        objectId: "test_box_01",
        verb: "INTERACT",
        data: {}
      };
      
      console.log("Sending Intent:", payload);
      socket.emit("interact", payload);
      alert("Hotspot Clicked! Intent sent to server.");
    });

    stage.addChild(testBox);
  };

  // Ensure this container is absolute and z-indexed correctly
  return <div ref={pixiContainerRef} className="absolute inset-0 z-10" />;
}