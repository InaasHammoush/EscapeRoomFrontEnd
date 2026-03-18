import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { getInteractionLayer } from "./interactionRegistry";

export default function InteractionLayer({ viewIndex, roomId, socket, roomType, gameState }) {
  const pixiContainerRef = useRef(null);
  const appRef = useRef(null);
  // Track dimensions to trigger re-renders of the hotspots on resize
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({
        backgroundAlpha: 0,
        resizeTo: window,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      app.canvas.style.pointerEvents = 'auto';
      appRef.current = app;
      if (pixiContainerRef.current) pixiContainerRef.current.appendChild(app.canvas);

      // Handle Resize
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      
      updateLayer();
      
      return () => window.removeEventListener('resize', handleResize);
    };

    initPixi();
    return () => appRef.current?.destroy(true, { children: true });
  }, []);

  // Re-run whenever the view changes OR the screen is resized
  useEffect(() => {
    updateLayer();
  }, [viewIndex, roomType, dimensions, gameState]);

  const updateLayer = () => {
    const app = appRef.current;
    if (!app) return;
    // Remove and destroy previous hotspots to avoid accumulating Graphics/listeners.
    const oldChildren = app.stage.removeChildren();
    oldChildren.forEach((child) => {
      if (child && typeof child.destroy === "function") {
        child.destroy({ children: true });
      }
    });

    // 1. Calculate the Image's actual displayed area
    // Assuming a target aspect ratio for your room images (e.g., 16:9 or 4:3)
    const targetAspect = 1920 / 1080; 
    const windowAspect = window.innerWidth / window.innerHeight;

    let displayW, displayH, offsetX, offsetY;

    if (windowAspect > targetAspect) {
      // Window is wider than image (Black bars on sides)
      displayH = window.innerHeight;
      displayW = displayH * targetAspect;
      offsetX = (window.innerWidth - displayW) / 2;
      offsetY = 0;
    } else {
      // Window is taller than image (Black bars on top/bottom)
      displayW = window.innerWidth;
      displayH = displayW / targetAspect;
      offsetX = 0;
      offsetY = (window.innerHeight - displayH) / 2;
    }

    const layerRenderer = getInteractionLayer(roomType, viewIndex);
    if (layerRenderer) {
      layerRenderer(app, { 
        roomId, 
        socket, 
        gameState,
        // 2. Letterbox-Aware Helpers
        normX: (val) => offsetX + (val / 1000) * displayW,
        normY: (val) => offsetY + (val / 1000) * displayH,
        // Helper to scale sizes (widths/heights) without the offset
        scaleX: (val) => (val / 1000) * displayW,
        scaleY: (val) => (val / 1000) * displayH
      });
    }
  };

  // Debugging helper: Log normalized coordinates on click
  useEffect(() => {
    const handleDebugClick = (e) => {
      if (!e.altKey) return;

      // Use the same math as above to find the active area
      const targetAspect = 1920 / 1080;
      const windowAspect = window.innerWidth / window.innerHeight;
      let displayW, displayH, offsetX, offsetY;

      if (windowAspect > targetAspect) {
        displayH = window.innerHeight;
        displayW = displayH * targetAspect;
        offsetX = (window.innerWidth - displayW) / 2;
        offsetY = 0;
      } else {
        displayW = window.innerWidth;
        displayH = displayW / targetAspect;
        offsetX = 0;
        offsetY = (window.innerHeight - displayH) / 2;
      }

      // Convert screen click to 0-1000 image coordinate
      const imgX = Math.round(((e.clientX - offsetX) / displayW) * 1000);
      const imgY = Math.round(((e.clientY - offsetY) / displayH) * 1000);

      console.log(`%c Normalized Coords: %c x: ${imgX}, y: ${imgY}`, 
                  "color: #888", "color: rgb(21, 152, 63); font-weight: bold;");
    };

    window.addEventListener("click", handleDebugClick);
    return () => window.removeEventListener("click", handleDebugClick);
  }, []);

  return <div ref={pixiContainerRef} className="absolute inset-0 z-10" />;
}
