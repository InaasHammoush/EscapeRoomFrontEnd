import { useState, useEffect } from "react";

import scrollSrc from "../assets/scroll-grid.png";
import xSrc from "../assets/x.png";
import oSrc from "../assets/o.png";

export default function ScrollGridPopup({
  roomId,
  socket,
  onClose,
  defaultMark = "X",
  boardFromServer = null,
}) {
  const [board, setBoard] = useState(() => boardFromServer ?? Array(9).fill(null));

  useEffect(() => {
    if (Array.isArray(boardFromServer) && boardFromServer.length === 9) {
      setBoard(boardFromServer);
    }
  }, [boardFromServer]);

  // ✅ Disable cells 7 and 8
  const CLICKABLE = new Set([0, 1, 2, 3, 4, 5, 6,7 ,8]);

  const handleCellClick = (idx) => {
    if (!CLICKABLE.has(idx)) return;
    if (board[idx]) return;

    // optimistic UI
    setBoard((prev) => {
      const next = [...prev];
      next[idx] = defaultMark; // "X" by default, can be changed
      return next;
    });

    // send to backend
    socket?.emit("interact", {
      roomId,
      actionId: crypto.randomUUID(),
      objectId: "scroll_grid",
      verb: "PLACE_MARK",
      data: { index: idx, mark: defaultMark },
    });
  };

 return (
   <div className="fixed inset-0 z-[9999] grid place-items-center">
     {/* Cutout overlay: dark everywhere except the center cell */}
     <div className="absolute inset-0 grid grid-cols-[1fr_auto_1fr] grid-rows-[1fr_auto_1fr]">
       <div className="bg-black/80 backdrop-blur-sm" />
       <div className="bg-black/80 backdrop-blur-sm" />
       <div className="bg-black/80 backdrop-blur-sm" />

       <div className="bg-black/80 backdrop-blur-sm" />
       <div /> {/* <-- center cutout stays transparent */}
       <div className="bg-black/80 backdrop-blur-sm" />

       <div className="bg-black/80 backdrop-blur-sm" />
       <div className="bg-black/80 backdrop-blur-sm" />
       <div className="bg-black/80 backdrop-blur-sm" />
     </div>

     {/* SCROLL lives in transparent center cell */}
     <div className="relative w-[720px] max-w-[95vw] aspect-[4/3] z-10">
       <img
         src={scrollSrc}
         alt="Scroll grid"
         draggable={false}
         className="absolute inset-0 w-full h-full object-contain select-none"
       />

       {/* 3x3 clickable overlay */}
       <div
         className="
           absolute
           left-[29%] right-[35%]
           top-[29%] bottom-[32%]
           grid grid-cols-3 grid-rows-3
           z-10
         "
       >
         {board.map((cell, idx) => {
           const enabled = CLICKABLE.has(idx) && !cell;

           return (
             <button
               key={idx}
               type="button"
               disabled={!enabled}
               onClick={() => handleCellClick(idx)}
               className={[
                 "relative flex items-center justify-center transition",
                 enabled
                   ? "cursor-pointer hover:bg-white/10 active:bg-white/20"
                   : "cursor-default",
               ].join(" ")}
               aria-label={`Cell ${idx + 1}`}
             >
               {cell && (
                 <img
                   src={cell === "O" ? oSrc : xSrc}
                   alt={cell}
                   draggable={false}
                   className="w-[70%] h-[70%] object-contain select-none pointer-events-none"
                 />
               )}
             </button>
           );
         })}
       </div>

       {/* Close button */}
       <button
         className="btn btn-sm btn-circle absolute top-3 right-3 z-20"
         onClick={onClose}
         title="Close"
       >
         ✕
       </button>
     </div>
   </div>
 );

}
