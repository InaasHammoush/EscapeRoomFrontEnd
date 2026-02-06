/** 
 * RoomView.jsx
 * The main room view component for solo escape room gameplay
 * Handles socket connection , room joining, state synchronization, and rendering
 * of room images and controls. 
*/ 

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSocket, connectSocket } from "../state/socket";
import InteractionLayer from "../components/InteractionLayer.jsx";
import "../components/svelte/Keypad.svelte";
import "../components/svelte/ScrollGrid.svelte";

// Get soloChoice from session storage if it exists (e.g., "wizard_library")
const initialSoloChoice = sessionStorage.getItem("soloChoice");

export default function RoomView({ mode = "solo" }) {
  const { sessionId, roomId } = useParams();
  const navigate = useNavigate();

  const [socketReady, setSocketReady] = useState(false);

  // Room state
  const [viewIndex, setViewIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [roomType, setRoomType] = useState(initialSoloChoice);
  const [loading, setLoading] = useState(true);

  // Widgets / puzzle state
  const [activeWidget, setActiveWidget] = useState(null);
  const [scrollGrid, setScrollGrid] = useState(null);

  // ✅ Persistent ref to the Web Component instance
  const scrollGridElRef = useRef(null);

  const exitToHome = () => {
    if (!confirm("Leave the room and return to home?")) return;
    navigate("/");
  };

  // ------------------------------------------------------------
  // STEP 4 — Load images
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
  // SNAPSHOT Processor
  // ------------------------------------------------------------
  const onSnapshot = useCallback(
    (msg) => {
      console.log("SNAPSHOT RECEIVED:", msg);

      const st = msg?.roomState || msg?.snapshot?.state;
      if (!st) return;

      if (st.viewIndex !== undefined) setViewIndex(st.viewIndex);
      if (st.roomType && st.roomType !== roomType) setRoomType(st.roomType);
      if (st.public?.scroll_grid) setScrollGrid(st.public.scroll_grid);

      if (Array.isArray(st.views)) loadImages(st.views);
    },
    [loadImages, roomType]
  );

  // ------------------------------------------------------------
  // STEP 1 — Ensure socket is connected
  // ------------------------------------------------------------
  useEffect(() => {
    let s = getSocket();

    if (!s) {
      s = connectSocket({
        mode,
        sessionId,
        role: "player",
        roomType: initialSoloChoice,
      });
    }

    const onConnect = () => setSocketReady(true);

    if (s.connected) setSocketReady(true);
    else s.on("connect", onConnect);

    return () => {
      s?.off("connect", onConnect);
    };
  }, [mode, sessionId]);

  // ------------------------------------------------------------
  // STEP 2 — JOIN THE ROOM
  // ------------------------------------------------------------
  useEffect(() => {
    if (!socketReady || !roomId) return;
    const s = getSocket();
    if (!s) return;

    console.log("Sending join_room", roomId);

    s.emit("join_room", { roomId, name: "Solo Player" }, (res) => {
      console.log("CLIENT: Join Room Response Received:", res);
      if (res?.ok && res.snapshot) onSnapshot(res);
      else if (!res?.ok) {
        console.error("Failed to join room:", res?.error);
        setLoading(false);
      }
    });
  }, [socketReady, roomId, onSnapshot]);

  // ------------------------------------------------------------
  // STEP 2.5 — READY
  // ------------------------------------------------------------
  useEffect(() => {
    if (!socketReady || mode !== "solo" || !roomId) return;

    const s = getSocket();
    if (!s) return;

    console.log("Emitting 'ready' event to start room", roomId);
    s.emit("ready", { roomId }, (res) => {
      if (res?.ok) console.log("Room ready signal acknowledged by server.");
      else console.error("Failed to set ready state:", res?.error);
    });
  }, [socketReady, mode, roomId]);

  // ------------------------------------------------------------
  // Stable socket handlers
  // ------------------------------------------------------------
  const onViewChanged = useCallback((msg) => {
    console.log("VIEW CHANGED:", msg);
    if (msg.viewIndex !== undefined) setViewIndex(msg.viewIndex);
  }, []);

  const onPuzzleUpdate = useCallback((msg) => {
    console.log("Delta received:", msg);

    if (msg.diff && msg.diff.activeWidget === null) {
      console.log("Server commanded: Close Widget");
      setActiveWidget(null);
    }

    if (msg.diff?.test_box_01?.showWidget) {
      console.log("OPENING WIDGET:", msg.diff.test_box_01.showWidget);
      setActiveWidget(msg.diff.test_box_01.showWidget);
    }

    if (msg.diff?.scroll_grid) {
      setScrollGrid(msg.diff.scroll_grid);
    }
  }, []);

  // ------------------------------------------------------------
  // STEP 3 — Attach socket listeners
  // ------------------------------------------------------------
  useEffect(() => {
    if (!socketReady) return;
    const s = getSocket();
    if (!s) return;

    s.off("state:snapshot", onSnapshot);
    s.off("state:viewChanged", onViewChanged);
    s.off("puzzle_update", onPuzzleUpdate);

    s.on("state:snapshot", onSnapshot);
    s.on("state:viewChanged", onViewChanged);
    s.on("puzzle_update", onPuzzleUpdate);

    return () => {
      s.off("state:snapshot", onSnapshot);
      s.off("state:viewChanged", onViewChanged);
      s.off("puzzle_update", onPuzzleUpdate);
    };
  }, [socketReady, roomId, onSnapshot, onViewChanged, onPuzzleUpdate]);

  // ------------------------------------------------------------
  // ✅ CRITICAL: push updated grid into the Web Component whenever it changes
  // ------------------------------------------------------------
  useEffect(() => {
    const el = scrollGridElRef.current;
    if (!el) return;

    // Always push the latest grid object into the custom element
    el.grid = scrollGrid;
  }, [scrollGrid]);

  // ------------------------------------------------------------
  // Listen for the custom event from the Web Component
  // ------------------------------------------------------------
  useEffect(() => {
    const handleSvelteIntent = (e) => {
        console.log("INTENT EVENT CAUGHT:", e.detail);

      const { objectId, verb, data } = e.detail;
      const s = getSocket();

      if (objectId === "scroll_grid" && verb === "CLOSE") {
        setActiveWidget(null);
        return;
      }

   if (!s) return;

    s.emit(
      "interact",
      {
        roomId,
        actionId: crypto.randomUUID(),
        objectId,
        verb,
        data,
      },
      (res) => {
        if (!res?.ok) console.error("INTERACT ERROR:", res);
      }
    );
  };


    document.addEventListener("intent", handleSvelteIntent);
    return () => document.removeEventListener("intent", handleSvelteIntent);
  }, [roomId]);

  // ------------------------------------------------------------
  // Turning controls
  // ------------------------------------------------------------
  const turn = (direction) => {
    const s = getSocket();
    if (!s) return;
    console.log("Turn:", direction);
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
      <button
        onClick={exitToHome}
        className="absolute top-4 left-4 z-30 btn btn-circle btn-sm bg-black/60 text-white border-white/30 hover:bg-white hover:text-black pointer-events-auto"
        title="Back to Home"
      >
        <span className="text-3xl leading-none -translate-y-1 inline-block">⌂</span>
      </button>

      {images[viewIndex] ? (
        <img
          src={images[viewIndex]}
          alt={`Wall ${viewIndex}`}
          className="absolute inset-0 w-full h-full object-contain select-none"
        />
      ) : (
        <div className="text-gray-500">No image available for this view.</div>
      )}

      <div className="absolute inset-0 z-10 pointer-events-none">
        <InteractionLayer viewIndex={viewIndex} roomId={roomId} socket={getSocket()} />
      </div>

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

      <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-mono opacity-50 z-20">
        INDEX: {viewIndex} | TYPE: {roomType}
      </div>

      {activeWidget === "scroll_grid" && (
        <div className="absolute inset-0 z-50">
          <scroll-grid-widget 
            ref={scrollGridElRef} 
          />
        </div>
      )}
    </div>
  );
}