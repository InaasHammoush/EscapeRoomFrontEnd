/** 
 * RoomView.jsx
 * The main room view component for solo escape room gameplay
 * Handles socket connection , room joining, state synchronization, and rendering
 * of room images and controls. 
*/ 

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSocket, connectSocket } from "../state/socket";
import InteractionLayer from "../components/InteractionLayers/InteractionLayerManager.jsx";
import "../components/svelte/ScrollGrid.svelte";
import "../components/svelte/Bookshelf.svelte";
import "../components/svelte/CandlePuzzle.svelte";

const initialSoloChoice = sessionStorage.getItem("soloChoice");

export default function RoomView({ mode = "solo" }) {
  const { sessionId, roomId } = useParams();
  const navigate = useNavigate();

  const [socketReady, setSocketReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Room visual state
  const [viewIndex, setViewIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [roomType, setRoomType] = useState(initialSoloChoice);

  // Generic Game State
  const [gameState, setGameState] = useState({});
  const [activeWidget, setActiveWidget] = useState(null);

  // Refs for Web Components to push props dynamically
  const widgetRefs = useRef({});

  const exitToHome = () => {
    if (!confirm("Leave the room and return to home?")) return;
    navigate("/");
  };

  const loadImages = useCallback((files) => {
    if (!Array.isArray(files) || files.length === 0) return;
    setImages(files);
    setLoading(false);
  }, []);

  // ------------------------------------------------------------
  // SNAPSHOT Processor (Full state payload on join)
  // ------------------------------------------------------------
  const onSnapshot = useCallback((msg) => {
    console.log("SNAPSHOT RECEIVED:", msg);
    const st = msg?.roomState || msg?.snapshot?.state;
    if (!st) return;

    if (st.viewIndex !== undefined) setViewIndex(st.viewIndex);
    if (st.roomType && st.roomType !== roomType) setRoomType(st.roomType);
    if (Array.isArray(st.views)) loadImages(st.views);

    // Store the entire public puzzle state
    if (st.public) {
      setGameState(st.public);
    }
  }, [loadImages, roomType]);

  // ------------------------------------------------------------
  // DELTA Processor (Partial state updates)
  // ------------------------------------------------------------
  const onPuzzleUpdate = useCallback((msg) => {
    console.log("Delta received:", msg);
    if (!msg.diff) return;

    // 1. Handle UI Widget Toggling
    if (msg.diff.activeWidget !== undefined) {
      setActiveWidget(msg.diff.activeWidget);
    }

    // 2. Merge puzzle data into the generic gameState
    setGameState((prevState) => {
      const nextState = { ...prevState };
      
      // Loop through all keys in the diff (except UI specific ones like activeWidget)
      Object.keys(msg.diff).forEach((key) => {
        if (key !== "activeWidget") {
          nextState[key] = msg.diff[key];
        }
      });
      
      return nextState;
    });
  }, []);

  // ------------------------------------------------------------
  // Socket Connection & Joining
  // ------------------------------------------------------------
  useEffect(() => {
    let s = getSocket();
    if (!s) s = connectSocket({ mode, sessionId, role: "player", roomType: initialSoloChoice });
    const onConnect = () => setSocketReady(true);
    if (s.connected) setSocketReady(true);
    else s.on("connect", onConnect);
    return () => s?.off("connect", onConnect);
  }, [mode, sessionId]);

  useEffect(() => {
    if (!socketReady || !roomId) return;
    const s = getSocket();
    s.emit("join_room", { roomId, name: "Solo Player" }, (res) => {
      if (res?.ok && res.snapshot) onSnapshot(res);
      else if (!res?.ok) setLoading(false);
    });
  }, [socketReady, roomId, onSnapshot]);

  useEffect(() => {
    if (!socketReady || mode !== "solo" || !roomId) return;
    getSocket().emit("ready", { roomId });
  }, [socketReady, mode, roomId]);

  // ------------------------------------------------------------
  // Attach Socket Listeners
  // ------------------------------------------------------------
  useEffect(() => {
    if (!socketReady) return;
    const s = getSocket();
    
    const onViewChanged = (msg) => {
      if (msg.viewIndex !== undefined) setViewIndex(msg.viewIndex);
    };

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
  }, [socketReady, onSnapshot, onPuzzleUpdate]);

  // ------------------------------------------------------------
  // ✅ CRITICAL: Push updated state into active Web Component
  // ------------------------------------------------------------
  useEffect(() => {
    if (!activeWidget || !widgetRefs.current[activeWidget]) return;
    
    // Pass the specific slice of the game state to the web component
    // Example: If activeWidget is "bookshelf_puzzle", pass gameState.bookshelf_puzzle
    const el = widgetRefs.current[activeWidget];
    const puzzleData = gameState[activeWidget]; 
    
    if (el && puzzleData) {
       // Check if the component expects 'grid' or 'puzzle' prop
       if ('grid' in el) el.grid = puzzleData;
       if ('puzzle' in el) el.puzzle = puzzleData;
    }
  }, [gameState, activeWidget]);

  // ------------------------------------------------------------
  // Intent Listener (From Svelte/Pixi to Server)
  // ------------------------------------------------------------
  useEffect(() => {
    const handleIntent = (e) => {
      const { objectId, verb, data } = e.detail;
      const s = getSocket();

      // Standardize closing widgets from the frontend
      if (verb === "CLOSE") {
        setActiveWidget(null);
        return; // Don't bother the server if it's just a UI close
      }

      if (s) {
        s.emit("interact", { roomId, actionId: crypto.randomUUID(), objectId, verb, data });
      }
    };

    document.addEventListener("intent", handleIntent);
    return () => document.removeEventListener("intent", handleIntent);
  }, [roomId]);

  const turn = (direction) => getSocket()?.emit("intent:turn", { roomId, direction });

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  if (loading || !socketReady) {
    return <div className="w-full h-full flex items-center justify-center text-white">Loading room…</div>;
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <button onClick={exitToHome} className="absolute top-4 left-4 z-30 btn btn-circle btn-sm bg-black/60 text-white border-white/30 pointer-events-auto">⌂</button>

      {images[viewIndex] ? (
        <img src={images[viewIndex]} alt={`Wall ${viewIndex}`} className="absolute inset-0 w-full h-full object-contain select-none" />
      ) : (
        <div className="text-gray-500">No image available</div>
      )}

      <div className="absolute inset-0 z-10 pointer-events-none">
        <InteractionLayer viewIndex={viewIndex} roomId={roomId} socket={getSocket()} roomType={roomType} />
      </div>

      <div className="absolute inset-x-0 bottom-10 flex justify-between px-10 z-20 pointer-events-none">
        <button className="btn btn-circle btn-lg btn-outline bg-black/40 text-white pointer-events-auto" onClick={() => turn("LEFT")}>⟲</button>
        <button className="btn btn-circle btn-lg btn-outline bg-black/40 text-white pointer-events-auto" onClick={() => turn("RIGHT")}>⟳</button>
      </div>

      {/* Dynamic Widget Rendering */}
      {activeWidget === "tictactoe_scroll" && (
        <div className="absolute inset-0 z-50">
          <tictactoe-scroll-widget ref={el => widgetRefs.current["tictactoe_scroll"] = el} />
        </div>
      )}

      {activeWidget === "bookshelf_puzzle" && (
        <div className="absolute inset-0 z-50">
          <bookshelf-widget ref={el => widgetRefs.current["bookshelf_puzzle"] = el} />
        </div>
      )}

      {activeWidget === "candle_puzzle" && (
        <div className="absolute inset-0 z-50">
          <candle-puzzle-widget ref={el => widgetRefs.current["candle_puzzle"] = el} />
        </div>
      )}
      
      {/* Future widgets can be added here cleanly */}
    </div>
  );
}