import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { getInteractionLayer } from "./interactionRegistry";

export default function InteractionLayer({ viewIndex, roomId, socket, roomType }) {
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
  }, [viewIndex, roomType, dimensions]);

  const updateLayer = () => {
    const app = appRef.current;
    if (!app) return;
    app.stage.removeChildren();

    const layerRenderer = getInteractionLayer(roomType, viewIndex);
    if (layerRenderer) {
      // Pass the normalization helpers to the specific layer
      layerRenderer(app, { 
        roomId, 
        socket, 
        // Helper: Convert Virtual 1000 -> Current Pixels
        normX: (val) => (val / 1000) * window.innerWidth,
        normY: (val) => (val / 1000) * window.innerHeight
      });
    }
  };

  // Debugging helper: Log normalized coordinates on click
  useEffect(() => {
  const handleDebugClick = (e) => {
    // Only log if 'Alt' key is held down to prevent spamming during normal play
    if (!e.altKey) return;

    const normalizedX = Math.round((e.clientX / window.innerWidth) * 1000);
    const normalizedY = Math.round((e.clientY / window.innerHeight) * 1000);

    console.log(`%c Hotspot Found! %c normX(${normalizedX}), normY(${normalizedY})`, 
                "background: #222; color: #bada55; padding: 2px 5px; border-radius: 3px;",
                "color: white;");
    
    console.log(`Copy-paste: .rect(normX(${normalizedX}), normY(${normalizedY}), normX(WIDTH), normY(HEIGHT))`);
  };

  window.addEventListener("click", handleDebugClick);
  return () => window.removeEventListener("click", handleDebugClick);
}, []);

  return <div ref={pixiContainerRef} className="absolute inset-0 z-10" />;
}