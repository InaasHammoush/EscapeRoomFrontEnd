// RoomView.jsx

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getSocket, connectSocket } from "../state/socket";

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
  console.log("📷 Loaded images:", files);
  setImages(files);
  setLoading(false);
 }, []);


 // ------------------------------------------------------------
 // SNAPSHOT Processor (Handles state changes from listeners or callbacks)
 // ------------------------------------------------------------
 const onSnapshot = useCallback((msg) => {
  console.log("🔥 SNAPSHOT RECEIVED:", msg);

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

  console.log("🔵 Sending join_room", roomId);
  
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

      console.log("🟢 Emitting 'ready' event to start room", roomId);
      // Send the ready signal to trigger the room start logic on the server
      s.emit("ready", { roomId }, (res) => {
          if (res?.ok) {
              console.log("✅ Room ready signal acknowledged by server.");
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
 useEffect(() => {
  if (!socketReady) return;
  const s = getSocket();
  if (!s) return;

  const onViewChanged = (msg) => {
   console.log("🔥 VIEW CHANGED:", msg);
   if (msg.viewIndex !== undefined) setViewIndex(msg.viewIndex);
  };

  s.on("state:snapshot", onSnapshot); // Listener for subsequent full snapshots
  s.on("state:viewChanged", onViewChanged);

  return () => {
   s.off("state:snapshot", onSnapshot);
   s.off("state:viewChanged", onViewChanged);
  };
 }, [socketReady, onSnapshot]);


 // ------------------------------------------------------------
 // Turning controls
 // ------------------------------------------------------------
 const turn = (direction) => {
  const s = getSocket();
  if (!s) return;
  console.log("🌀 Turn:", direction);
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
  <div className="relative w-full h-full flex flex-col items-center justify-center text-white">

   {/* ROOM IMAGE */}
   <div className="relative max-w-2xl w-full flex items-center justify-center">
    {images[viewIndex] ? (
     <img
      src={images[viewIndex]}
      alt="Room"
      className="rounded-lg shadow-lg max-h-[70vh] object-contain"
     />
    ) : (
     <p>No image available for this view.</p>
    )}
   </div>

   {/* TURN BUTTONS */}
   <div className="mt-6 flex gap-6">
    <button className="btn btn-outline" onClick={() => turn("LEFT")}>
     ⟲ Turn Left
    </button>

    <button className="btn btn-outline" onClick={() => turn("RIGHT")}>
     Turn Right ⟳
    </button>
   </div>

   {/* DEBUG */}
   <div className="mt-4 opacity-60 text-sm">
    viewIndex: {viewIndex} | roomType: {roomType}
   </div>
  </div>
 );
}