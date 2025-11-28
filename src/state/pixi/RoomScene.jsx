import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export default function RoomScene({ views, viewIndex }) {
  const canvasRef = useRef(null);
  const pixiRef = useRef(null);
  const spriteRef = useRef(null);

  useEffect(() => {
    // Initialize Pixi only once
    if (!pixiRef.current) {
      pixiRef.current = new PIXI.Application({
        resizeTo: window,
        backgroundColor: 0x000000,
      });
      canvasRef.current.appendChild(pixiRef.current.view);

      spriteRef.current = new PIXI.Sprite();
      spriteRef.current.width = window.innerWidth;
      spriteRef.current.height = window.innerHeight;
      pixiRef.current.stage.addChild(spriteRef.current);
    }

    // Set texture whenever view changes
    spriteRef.current.texture = PIXI.Texture.from(views[viewIndex]);
  }, [views, viewIndex]);

  return <div ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}
