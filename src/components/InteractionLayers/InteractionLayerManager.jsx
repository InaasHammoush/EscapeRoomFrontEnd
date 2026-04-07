import { useCallback, useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { getInteractionLayer } from "./interactionRegistry";

const DEFAULT_WALL_ASPECT_RATIO = 1920 / 1080;

function getImageBounds({
  viewportWidth,
  viewportHeight,
  aspectRatio = DEFAULT_WALL_ASPECT_RATIO,
  fit = "contain",
}) {
  const safeAspectRatio =
    Number.isFinite(aspectRatio) && aspectRatio > 0
      ? aspectRatio
      : DEFAULT_WALL_ASPECT_RATIO;
  const viewportAspectRatio = viewportWidth / Math.max(1, viewportHeight);

  let displayW;
  let displayH;
  let offsetX;
  let offsetY;

  if (fit === "cover") {
    if (viewportAspectRatio > safeAspectRatio) {
      displayW = viewportWidth;
      displayH = displayW / safeAspectRatio;
      offsetX = 0;
      offsetY = (viewportHeight - displayH) / 2;
    } else {
      displayH = viewportHeight;
      displayW = displayH * safeAspectRatio;
      offsetX = (viewportWidth - displayW) / 2;
      offsetY = 0;
    }
  } else if (viewportAspectRatio > safeAspectRatio) {
    displayH = viewportHeight;
    displayW = displayH * safeAspectRatio;
    offsetX = (viewportWidth - displayW) / 2;
    offsetY = 0;
  } else {
    displayW = viewportWidth;
    displayH = displayW / safeAspectRatio;
    offsetX = 0;
    offsetY = (viewportHeight - displayH) / 2;
  }

  return { displayW, displayH, offsetX, offsetY };
}

export default function InteractionLayer({
  viewIndex,
  roomId,
  socket,
  roomType,
  gameState,
  wallImageFit = "contain",
  wallImageAspectRatio = DEFAULT_WALL_ASPECT_RATIO,
}) {
  const pixiContainerRef = useRef(null);
  const appRef = useRef(null);
  // Track dimensions to trigger re-renders of the hotspots on resize
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const updateLayer = useCallback(() => {
    const app = appRef.current;
    if (!app) return;
    // Remove and destroy previous hotspots to avoid accumulating Graphics/listeners.
    const oldChildren = app.stage.removeChildren();
    oldChildren.forEach((child) => {
      if (child && typeof child.destroy === "function") {
        child.destroy({ children: true });
      }
    });

    const { displayW, displayH, offsetX, offsetY } = getImageBounds({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      aspectRatio: wallImageAspectRatio,
      fit: wallImageFit,
    });

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
        scaleY: (val) => (val / 1000) * displayH,
      });
    }
  }, [gameState, roomId, roomType, socket, viewIndex, wallImageAspectRatio, wallImageFit]);

  useEffect(() => {
    let isDisposed = false;
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({
        backgroundAlpha: 0,
        resizeTo: window,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (isDisposed) {
        app.destroy(true, { children: true });
        return;
      }

      app.canvas.style.pointerEvents = "auto";
      appRef.current = app;
      if (pixiContainerRef.current) pixiContainerRef.current.appendChild(app.canvas);

      window.addEventListener("resize", handleResize);
      updateLayer();
    };

    initPixi();
    return () => {
      isDisposed = true;
      window.removeEventListener("resize", handleResize);
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
    };
  }, [updateLayer]);

  // Re-run whenever the view changes OR the screen is resized
  useEffect(() => {
    updateLayer();
  }, [dimensions, updateLayer]);

  // Debugging helper: Log normalized coordinates on click
  useEffect(() => {
    const handleDebugClick = (e) => {
      if (!e.altKey) return;

      const { displayW, displayH, offsetX, offsetY } = getImageBounds({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        aspectRatio: wallImageAspectRatio,
        fit: wallImageFit,
      });

      // Convert screen click to 0-1000 image coordinate
      const imgX = Math.round(((e.clientX - offsetX) / displayW) * 1000);
      const imgY = Math.round(((e.clientY - offsetY) / displayH) * 1000);

      console.log(`%c Normalized Coords: %c x: ${imgX}, y: ${imgY}`, 
                  "color: #888", "color: rgb(21, 152, 63); font-weight: bold;");
    };

    window.addEventListener("click", handleDebugClick);
    return () => window.removeEventListener("click", handleDebugClick);
  }, [wallImageAspectRatio, wallImageFit]);

  return <div ref={pixiContainerRef} className="absolute inset-0 z-10" />;
}
