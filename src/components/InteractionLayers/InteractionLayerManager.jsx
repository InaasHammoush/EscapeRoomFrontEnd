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
  const safeViewportWidth = Math.max(1, Number(viewportWidth) || 0);
  const safeViewportHeight = Math.max(1, Number(viewportHeight) || 0);
  const safeAspectRatio =
    Number.isFinite(aspectRatio) && aspectRatio > 0
      ? aspectRatio
      : DEFAULT_WALL_ASPECT_RATIO;
  const viewportAspectRatio = safeViewportWidth / safeViewportHeight;

  let displayW;
  let displayH;
  let offsetX;
  let offsetY;

  if (fit === "cover") {
    if (viewportAspectRatio > safeAspectRatio) {
      displayW = safeViewportWidth;
      displayH = displayW / safeAspectRatio;
      offsetX = 0;
      offsetY = (safeViewportHeight - displayH) / 2;
    } else {
      displayH = safeViewportHeight;
      displayW = displayH * safeAspectRatio;
      offsetX = (safeViewportWidth - displayW) / 2;
      offsetY = 0;
    }
  } else if (viewportAspectRatio > safeAspectRatio) {
    displayH = safeViewportHeight;
    displayW = displayH * safeAspectRatio;
    offsetX = (safeViewportWidth - displayW) / 2;
    offsetY = 0;
  } else {
    displayW = safeViewportWidth;
    displayH = displayW / safeAspectRatio;
    offsetX = 0;
    offsetY = (safeViewportHeight - displayH) / 2;
  }

  return { displayW, displayH, offsetX, offsetY };
}

function readContainerBounds(node) {
  const rect = node?.getBoundingClientRect?.();
  if (!rect) {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      left: 0,
      top: 0,
    };
  }

  return {
    width: Math.max(1, rect.width || 0),
    height: Math.max(1, rect.height || 0),
    left: rect.left || 0,
    top: rect.top || 0,
  };
}

function boundsAreEqual(a, b) {
  return (
    Math.abs((a?.width || 0) - (b?.width || 0)) < 0.5 &&
    Math.abs((a?.height || 0) - (b?.height || 0)) < 0.5 &&
    Math.abs((a?.left || 0) - (b?.left || 0)) < 0.5 &&
    Math.abs((a?.top || 0) - (b?.top || 0)) < 0.5
  );
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
  const [containerBounds, setContainerBounds] = useState(() => readContainerBounds(null));

  const measureContainer = useCallback(() => {
    const nextBounds = readContainerBounds(pixiContainerRef.current);
    setContainerBounds((prev) => (boundsAreEqual(prev, nextBounds) ? prev : nextBounds));
  }, []);

  const updateLayer = useCallback(() => {
    const app = appRef.current;
    if (!app) return;

    const oldChildren = app.stage.removeChildren();
    oldChildren.forEach((child) => {
      if (child && typeof child.destroy === "function") {
        child.destroy({ children: true });
      }
    });

    const { displayW, displayH, offsetX, offsetY } = getImageBounds({
      viewportWidth: containerBounds.width,
      viewportHeight: containerBounds.height,
      aspectRatio: wallImageAspectRatio,
      fit: wallImageFit,
    });

    const layerRenderer = getInteractionLayer(roomType, viewIndex);
    if (!layerRenderer) return;

    layerRenderer(app, {
      roomId,
      socket,
      gameState,
      normX: (val) => offsetX + (val / 1000) * displayW,
      normY: (val) => offsetY + (val / 1000) * displayH,
      scaleX: (val) => (val / 1000) * displayW,
      scaleY: (val) => (val / 1000) * displayH,
    });
  }, [
    containerBounds.height,
    containerBounds.width,
    gameState,
    roomId,
    roomType,
    socket,
    viewIndex,
    wallImageAspectRatio,
    wallImageFit,
  ]);

  useEffect(() => {
    let isDisposed = false;

    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({
        backgroundAlpha: 0,
        resizeTo: pixiContainerRef.current || window,
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
      measureContainer();
    };

    initPixi();
    return () => {
      isDisposed = true;
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
    };
  }, [measureContainer]);

  useEffect(() => {
    const node = pixiContainerRef.current;
    if (!node) return;

    measureContainer();

    let resizeObserver;
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(() => {
        measureContainer();
      });
      resizeObserver.observe(node);
    }

    window.addEventListener("resize", measureContainer);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureContainer);
    };
  }, [measureContainer]);

  useEffect(() => {
    updateLayer();
  }, [updateLayer]);

  useEffect(() => {
    const handleDebugClick = (event) => {
      if (!event.altKey) return;

      const { displayW, displayH, offsetX, offsetY } = getImageBounds({
        viewportWidth: containerBounds.width,
        viewportHeight: containerBounds.height,
        aspectRatio: wallImageAspectRatio,
        fit: wallImageFit,
      });

      const localX = event.clientX - containerBounds.left;
      const localY = event.clientY - containerBounds.top;
      const imgX = Math.round(((localX - offsetX) / displayW) * 1000);
      const imgY = Math.round(((localY - offsetY) / displayH) * 1000);

      console.log(
        `%c Normalized Coords: %c x: ${imgX}, y: ${imgY}`,
        "color: #888",
        "color: rgb(21, 152, 63); font-weight: bold;"
      );
    };

    window.addEventListener("click", handleDebugClick);
    return () => window.removeEventListener("click", handleDebugClick);
  }, [
    containerBounds.height,
    containerBounds.left,
    containerBounds.top,
    containerBounds.width,
    wallImageAspectRatio,
    wallImageFit,
  ]);

  return <div ref={pixiContainerRef} className="absolute inset-0 z-10" />;
}
