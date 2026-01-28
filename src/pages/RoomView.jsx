/** 
 * RoomView.jsx
 * The main room view component for solo escape room gameplay
 * Handles socket connection , room joining, state synchronization, and rendering
 * of room images and controls. 
*/ 

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getSocket, connectSocket } from "../state/socket";
import InteractionLayer from "../components/InteractionLayer.jsx";
import "../components/svelte/Keypad.svelte"; // Import the Svelte Web Component

// Get soloChoice from session storage if it exists (e.g., "wizard_library")
const initialSoloChoice = sessionStorage.getItem("soloChoice");

export default function RoomView({ mode = "solo" }) {
 const { sessionId, roomId } = useParams();

 const [socketReady, setSocketReady] = useState(false);

 // Room state
 const [viewIndex, setViewIndex] = useState(0);
 const [images, setImages] = useState([]);
 // Use the value from sessionStorage as the initial roomType
 const [roomType, setRoomType] = useState(initialSoloChoice);
 const [loading, setLoading] = useState(true);

 // ------------------------------------------------------------
 // STEP 4 — Load images (The authoritative function to set images and end loading)
 // ------------------------------------------------------------
 const loadImages = useCallback((files) => {
  if (!Array.isArray(files) || files.length === 0) {
    console.warn("Received empty or invalid views array.");
    return;
  }
  console.log("Loaded images:", files);
  setImages(files);
  setLoading(false);
 }, []);


 // ------------------------------------------------------------
 // SNAPSHOT Processor (Handles state changes from listeners or callbacks)
 // ------------------------------------------------------------
 const onSnapshot = useCallback((msg) => {
  console.log("SNAPSHOT RECEIVED:", msg);

  // Snapshot can come from socket.on("state:snapshot") { roomState: { ... } }
  // OR from the socket.emit("join_room") callback { snapshot: { state: { ... } } }
  const st = msg?.roomState || msg?.snapshot?.state; 
  if (!st) return;

  if (st.viewIndex !== undefined) setViewIndex(st.viewIndex);
  if (st.roomType && st.roomType !== roomType) setRoomType(st.roomType);

  if (Array.isArray(st.views)) {
   // The server must now provide the full image path array here
   loadImages(st.views);
  }
 }, [loadImages, roomType]);


 // ------------------------------------------------------------
 // STEP 1 — Ensure socket is connected
 // ------------------------------------------------------------
 useEffect(() => {
  let s = getSocket();

  if (!s) {
   // Pass the soloChoice as roomType for connection context
   s = connectSocket({ 
     mode, 
     sessionId, 
     role: "player", 
     roomType: initialSoloChoice 
   });
  }

  const onConnect = () => setSocketReady(true);

  if (s.connected) {
   setSocketReady(true);
  } else {
   s.on("connect", onConnect);
  }

  return () => {
   s?.off("connect", onConnect);
  };
 }, [mode, sessionId]);


 // ------------------------------------------------------------
 // STEP 2 — JOIN THE ROOM once socket is ready
 // ------------------------------------------------------------
 useEffect(() => {
  // Crucial check: must have a ready socket AND a room ID from the URL
  if (!socketReady || !roomId) return;
  const s = getSocket();
  if (!s) return;

  console.log("Sending join_room", roomId);
  
  // Use the callback to ensure we process the initial snapshot immediately
  s.emit("join_room", { roomId, name: "Solo Player" }, (res) => {
    console.log("CLIENT: Join Room Response Received:", res);
    if (res?.ok && res.snapshot) {
      onSnapshot(res); // Process the snapshot from the join callback
    } else if (!res?.ok) {
      console.error("Failed to join room:", res?.error);
      setLoading(false); // Stop loading if join fails
    }
  });

 }, [socketReady, roomId, onSnapshot]);

  // ------------------------------------------------------------
  // STEP 2.5 — Send READY signal (Required for Solo Play to start the room)
  // ------------------------------------------------------------
  useEffect(() => {
      // Only proceed if the socket is ready and we are in solo mode
      if (!socketReady || mode !== "solo" || !roomId) return;
      
      const s = getSocket();
      if (!s) return;

      console.log("Emitting 'ready' event to start room", roomId);
      // Send the ready signal to trigger the room start logic on the server
      s.emit("ready", { roomId }, (res) => {
          if (res?.ok) {
              console.log("Room ready signal acknowledged by server.");
          } else {
              console.error("Failed to set ready state:", res?.error);
          }
      });
      
      // NOTE: This effect is designed to run once when the component is ready
      // to start the solo game.

  }, [socketReady, mode, roomId]);

 // ------------------------------------------------------------
 // STEP 3 — Handle SNAPSHOT LISTENERS (for state changes)
 // ------------------------------------------------------------
 const [activeWidget, setActiveWidget] = useState(null); // e.g., 'keypad', 'letter_safe', null
 
 useEffect(() => {
  if (!socketReady) return;
  const s = getSocket();
  if (!s) return;

  const onViewChanged = (msg) => {
   console.log("VIEW CHANGED:", msg);
   if (msg.viewIndex !== undefined) setViewIndex(msg.viewIndex);
  };

  const onPuzzleUpdate = (msg) => {
    console.log("Delta received:", msg);
    
    // 1. Check if the server explicitly closed the widget
    if (msg.diff && msg.diff.activeWidget === null) {
      console.log("Server commanded: Close Widget");
      setActiveWidget(null);
    }

    // 2. Check if the server opened a widget
    if (msg.diff?.test_box_01?.showWidget) {
      setActiveWidget(msg.diff.test_box_01.showWidget);
    }
  };

  

  s.on("state:snapshot", onSnapshot); // Listener for subsequent full snapshots
  s.on("state:viewChanged", onViewChanged);
  s.on("puzzle_update", onPuzzleUpdate);

  return () => {
   s.off("state:snapshot", onSnapshot);
   s.off("state:viewChanged", onViewChanged);
   s.off("puzzle_update", onPuzzleUpdate);
  };
 }, [socketReady, onSnapshot]);

 useEffect(() => {
  const handleSvelteIntent = (e) => {
    const { objectId, verb, data } = e.detail;
    const s = getSocket();
    
    if (s) {
      s.emit("interact", {
        roomId,
        actionId: crypto.randomUUID(), 
        objectId,
        verb,
        data
      });
    }
  };

  // Listen for the custom event from the Web Component 
  window.addEventListener('intent', handleSvelteIntent);
  return () => window.removeEventListener('intent', handleSvelteIntent);
}, [roomId]);


 // ------------------------------------------------------------
 // Turning controls
 // ------------------------------------------------------------
 const turn = (direction) => {
  const s = getSocket();
  if (!s) return;
  console.log("Turn:", direction);
  // The server expects the format { roomId, direction }
  s.emit("intent:turn", { roomId, direction }); 
 };


 // ------------------------------------------------------------
 // Render
 // ------------------------------------------------------------
 if (loading || !socketReady) {
  return (
   <div className="w-full h-full flex items-center justify-center text-white">
    Loading room…
   </div>
  );
 }

 return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      
      {/* 1. THE FULLSCREEN WALL IMAGE */}
      {images[viewIndex] ? (
        <img
          src={images[viewIndex]}
          alt={`Wall ${viewIndex}`}
          className="absolute inset-0 w-full h-full object-contain select-none"
        />
      ) : (
        <div className="text-gray-500">No image available for this view.</div>
      )}

      {/* 2. OVERLAY INTERACTION LAYER (Placeholder for your next step) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* We will build the point-and-click hotspots here later */}
        <InteractionLayer 
          viewIndex={viewIndex} 
          roomId={roomId} 
          socket={getSocket()} 
        />
      </div>

      {/* 3. NAVIGATION BUTTONS (Laid on top) */}
      <div className="absolute inset-x-0 bottom-10 flex justify-between px-10 z-20 pointer-events-none">
        <button 
          className="btn btn-circle btn-lg btn-outline bg-black/40 text-white border-white/50 hover:bg-white/20 pointer-events-auto" 
          onClick={() => turn("LEFT")}
        >
          <span className="text-2xl">⟲</span>
        </button>

        <button 
          className="btn btn-circle btn-lg btn-outline bg-black/40 text-white border-white/50 hover:bg-white/20 pointer-events-auto" 
          onClick={() => turn("RIGHT")}
        >
          <span className="text-2xl">⟳</span>
        </button>
      </div>

      {/* 4. DEBUG INFO (Small and tucked away) */}
      <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-mono opacity-50 z-20">
        INDEX: {viewIndex} | TYPE: {roomType}
      </div>

      {/* 4. ACTIVE WIDGET POPUP */}
      {activeWidget === 'keypad' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral p-8 rounded-2xl shadow-2xl border border-white/20">
            <keypad-widget roomid={roomId}></keypad-widget>
            
            {/* Optional: Add a manual close button in case the server doesn't close it */}
            <button 
              className="btn btn-sm btn-circle absolute top-2 right-2" 
              onClick={() => setActiveWidget(null)}
            >✕</button>
          </div>
        </div>
      )}
      
    </div>
  );
}