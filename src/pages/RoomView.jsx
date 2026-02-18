import { useEffect, useState, useCallback, useRef, createElement } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSocket, connectSocket } from "../state/socket";
import InteractionLayer from "../components/InteractionLayers/InteractionLayerManager.jsx";

// Import Widget Registry
import { WIDGET_REGISTRY } from "../config/widgets.js";

// Import Svelte Wrappers (Ensure these files exist)
import "../components/svelte/Keypad.svelte";
import "../components/svelte/ScrollGrid.svelte";
import "../components/svelte/Bookshelf.svelte";
import "../components/svelte/CandlePuzzle.svelte";
import "../components/svelte/Mortar.svelte";
import "../components/svelte/Transmuter.svelte";
import "../components/svelte/WestJigsaw.svelte";

import HUD from "../components/HUD.jsx";
import InventoryBar from "../components/inventory/InventoryBar.jsx";
import { normalizeInventory, applyInventoryIntent } from "../state/inventoryAdapter.js";

const initialSoloChoice = sessionStorage.getItem("soloChoice");

// TEMP TEST ONLY (Transmuter): remove this helper once these items are earned via puzzle flow.
function withTransmuterTestItems(
  items,
  includeCoalBlock = false,
  includeMatches = false,
  includeGoldNugget = false
) {
  const next = Array.isArray(items) ? [...items] : [];
  const hasItem = (name) =>
    next.some((entry) => String(entry?.item || "").toUpperCase() === name.toUpperCase());

  if (includeCoalBlock && !hasItem("COAL_BLOCK")) next.push({ item: "COAL_BLOCK", count: 1 });
  if (includeMatches && !hasItem("MATCHES")) next.push({ item: "MATCHES", count: 1 });
  if (includeGoldNugget && !hasItem("GOLD_NUGGET")) next.push({ item: "GOLD_NUGGET", count: 1 });
  return next;
}

function withWestRoseReward(items, includeRose = false) {
  const next = Array.isArray(items) ? [...items] : [];
  if (!includeRose) return next;
  const hasItem = next.some((entry) => String(entry?.item || "").toUpperCase() === "BURNINGROSE_WHOLE");
  if (!hasItem) next.push({ item: "BURNINGROSE_WHOLE", count: 1 });
  return next;
}

function hasWestRoseReady(payload) {
  if (!payload || typeof payload !== "object") return false;
  const keys = ["alchWestCodeboxJigsaw", "alch_west_codebox_jigsaw", "west_codebox_jigsaw"];
  for (const key of keys) {
    const p = payload[key];
    if (p?.output?.blueRoseImageReady || p?.solved || p?.jigsaw?.solved) return true;
  }
  for (const value of Object.values(payload)) {
    if (!value || typeof value !== "object") continue;
    const looksLikeWestPuzzle = !!value.code && !!value.jigsaw;
    if (!looksLikeWestPuzzle) continue;
    if (value?.output?.blueRoseImageReady || value?.solved || value?.jigsaw?.solved) return true;
  }
  return false;
}

export default function RoomView({ mode = "solo" }) {
  const { sessionId, roomId } = useParams();
  const navigate = useNavigate();

  const [socketReady, setSocketReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // State
  const [viewIndex, setViewIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [roomType, setRoomType] = useState(initialSoloChoice);
  const [gameState, setGameState] = useState({});
  const [activeWidget, setActiveWidget] = useState(null);
  
  // Inventory State
  const [inventory, setInventory] = useState([]);
  const pendingFlags = useRef({}); // Generic pending flags
  // TEMP TEST ONLY (Transmuter): keeps COAL_BLOCK, MATCHES and GOLD_NUGGET in test inventory until first use.
  const transmuterCoalTestPending = useRef(true);
  const transmuterMatchesTestPending = useRef(true);
  const transmuterGoldTestPending = useRef(true);
  const westRoseRewardGranted = useRef(false);

  // Refs for Web Components
  const widgetRefs = useRef({});

  const exitToHome = () => {
    if (!confirm("Leave the room and return to home?")) return;
    navigate("/");
  };

  const loadImages = useCallback((files) => {
    if (!Array.isArray(files) || files.length === 0) return setLoading(false);
    setImages(files);
    setLoading(false);
  }, []);

  // --- SNAPSHOT ---
  const onSnapshot = useCallback((msg) => {
    const st = msg?.roomState || msg?.snapshot?.state;
    if (!st) return;
    const publicState = st.public || st;

    if (st.viewIndex !== undefined) setViewIndex(st.viewIndex);
    if (st.roomType) setRoomType(st.roomType);
    if (Array.isArray(st.views)) loadImages(st.views);
    if (publicState) {
      if (hasWestRoseReady(publicState)) westRoseRewardGranted.current = true;
      setGameState(publicState);
      if (publicState.inventory?.items) {
        // TEMP TEST ONLY (Transmuter): remove this wrapper once backend rewards these items.
        setInventory(
          withWestRoseReward(
            withTransmuterTestItems(
              normalizeInventory(publicState.inventory.items, pendingFlags.current),
              transmuterCoalTestPending.current,
              transmuterMatchesTestPending.current,
              transmuterGoldTestPending.current
            ),
            westRoseRewardGranted.current
          )
        );
      }
    }
  }, [loadImages]);

  // --- DELTA UPDATE ---
  const onPuzzleUpdate = useCallback((msg) => {
    if (!msg?.diff) return;
    if (hasWestRoseReady(msg.diff)) westRoseRewardGranted.current = true;

    if (msg.diff.activeWidget !== undefined) {
      setActiveWidget(msg.diff.activeWidget);
    } else {
      const derivedWidget = Object.keys(msg.diff).find(
        (key) => key !== "activeWidget" && msg.diff?.[key]?.activeWidget && WIDGET_REGISTRY[key]
      );
      if (derivedWidget) setActiveWidget(derivedWidget);
    }

    setGameState((prev) => {
      const next = { ...prev };
      Object.keys(msg.diff).forEach((key) => {
        if (key !== "activeWidget") next[key] = msg.diff[key];
      });
      return next;
    });

    // Clear specific pending flags if server confirms action
    if (
      msg.diff?.["alch:mortar"]?.output?.blueLiquidTaken ||
      msg.diff?.alchMortarEssence?.output?.blueLiquidTaken
    ) {
      pendingFlags.current.mortarBottleSwap = false;
    }

    if (msg.diff?.inventory?.items) {
      // TEMP TEST ONLY (Transmuter): remove this wrapper once backend rewards these items.
      setInventory(
        withWestRoseReward(
          withTransmuterTestItems(
            normalizeInventory(msg.diff.inventory.items, pendingFlags.current),
            transmuterCoalTestPending.current,
            transmuterMatchesTestPending.current,
            transmuterGoldTestPending.current
          ),
          westRoseRewardGranted.current
        )
      );
    } else if (hasWestRoseReady(msg.diff)) {
      setInventory((prev) => withWestRoseReward(prev, true));
    }
  }, []);

  // --- VIEW CHANGE ---
  const onViewChanged = useCallback((delta) => {
    if (delta?.viewIndex !== undefined) setViewIndex(delta.viewIndex);
  }, []);

  // --- SOCKET SETUP ---
  useEffect(() => {
    let s = getSocket();
    if (!s) s = connectSocket({ mode, sessionId, role: "player", roomType: initialSoloChoice });
    
    const onConnect = () => setSocketReady(true);
    if (s.connected) setSocketReady(true);
    else s.on("connect", onConnect);

    s.on("state:snapshot", onSnapshot);
    s.on("puzzle_update", onPuzzleUpdate);
    s.on("state:viewChanged", onViewChanged);

    return () => {
      s.off("state:snapshot", onSnapshot);
      s.off("puzzle_update", onPuzzleUpdate);
      s.off("state:viewChanged", onViewChanged);
    };
  }, [mode, sessionId, roomId, onSnapshot, onPuzzleUpdate, onViewChanged]);

  // --- JOIN & READY ---
  useEffect(() => {
    if (!socketReady || !roomId) return;
    const s = getSocket();
    // TEMP TEST ONLY (Transmuter): re-seed COAL_BLOCK, MATCHES and GOLD_NUGGET whenever the room is initialized.
    transmuterCoalTestPending.current = true;
    transmuterMatchesTestPending.current = true;
    transmuterGoldTestPending.current = true;
    s.emit("join_room", { roomId, name: "Solo Player" }, (res) => {
      if (res?.ok && res.snapshot) onSnapshot(res);
      else setLoading(false);
    });
    // Auto-ready for solo mode
    if (mode === "solo") s.emit("ready", { roomId });
  }, [socketReady, roomId, mode, onSnapshot]);


  // --- PUSH STATE TO WIDGETS ---
  useEffect(() => {
    if (!activeWidget) return;
    const tagName = WIDGET_REGISTRY[activeWidget];
    if (!tagName) return;

    const el = widgetRefs.current[activeWidget];
    const puzzleData = gameState[activeWidget];

    if (el && puzzleData) {
      // Generic prop passing
      if ("grid" in el) el.grid = puzzleData;
      if ("puzzle" in el) el.puzzle = puzzleData;
      
      // Inject inventory only if the widget needs it (optional optimization)
      if ("inventory" in el) el.inventory = inventory;
    }
  }, [gameState, activeWidget, inventory]);

  // --- INTENT LISTENER ---
  useEffect(() => {
    const handleIntent = (e) => {
      const { objectId, verb, data } = e.detail || {};
      const objectLower = String(objectId || "").toLowerCase();
      const verbLower = String(verb || "").toLowerCase();
      const isWestJigsawObject =
        objectLower === "alch:west-codebox" || objectLower === "alch:west-jigsaw";

      if (isWestJigsawObject && (verbLower === "interact" || verbLower === "inspect" || verbLower === "open")) {
        setActiveWidget("alchWestCodeboxJigsaw");
      }

      const usedCoalInTransmuter =
        objectLower === "alch:transmuter" &&
        verbLower === "insert" &&
        String(data?.item || "").trim().toUpperCase() === "COAL_BLOCK";
      const usedMatchesInTransmuter =
        objectLower === "alch:transmuter" &&
        verbLower === "insert" &&
        String(data?.item || "").trim().toUpperCase() === "MATCHES";
      const usedGoldInTransmuter =
        objectLower === "alch:transmuter" &&
        verbLower === "insert" &&
        String(data?.item || "").trim().toUpperCase() === "GOLD_NUGGET";
      
      if (verb === "CLOSE") {
        setActiveWidget(null);
        return;
      }

      // TEMP TEST ONLY (Transmuter): stop auto-injecting COAL_BLOCK after first use.
      if (usedCoalInTransmuter && transmuterCoalTestPending.current) {
        transmuterCoalTestPending.current = false;
      }
      if (usedMatchesInTransmuter && transmuterMatchesTestPending.current) {
        transmuterMatchesTestPending.current = false;
      }
      if (usedGoldInTransmuter && transmuterGoldTestPending.current) {
        transmuterGoldTestPending.current = false;
      }

      // Optimistic Update
      const result = applyInventoryIntent(inventory, pendingFlags.current, { objectId, verb, data });
      pendingFlags.current = result.nextPending;
      // TEMP TEST ONLY (Transmuter): remove this wrapper once backend rewards these items.
      setInventory(
        withTransmuterTestItems(
          normalizeInventory(result.nextInventory, pendingFlags.current),
          transmuterCoalTestPending.current,
          transmuterMatchesTestPending.current,
          transmuterGoldTestPending.current
        )
      );

      getSocket()?.emit("interact", { roomId, actionId: crypto.randomUUID(), objectId, verb, data });
    };

    document.addEventListener("intent", handleIntent);
    return () => document.removeEventListener("intent", handleIntent);
  }, [roomId, inventory]);

  const turn = (dir) => getSocket()?.emit("intent:turn", { roomId, direction: dir });

  if (loading || !socketReady) return <div className="text-white">Loading...</div>;

  // --- RENDER ---
  const WidgetTag = activeWidget ? WIDGET_REGISTRY[activeWidget] : null;

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <HUD 
        onHome={exitToHome} 
        onTurnLeft={() => turn("LEFT")} 
        onTurnRight={() => turn("RIGHT")} 
      />
      
      {/* Background & Click Layer */}
      {images[viewIndex] && <img src={images[viewIndex]} className="absolute inset-0 w-full h-full object-contain select-none z-0" />}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <InteractionLayer viewIndex={viewIndex} roomId={roomId} socket={getSocket()} roomType={roomType} />
      </div>

      {/* Generic Inventory Bar */}
      <InventoryBar inventory={inventory} />

      {/* Dynamic Widget Rendering */}
      {WidgetTag && (
        <div className="absolute inset-0 z-50">
           {/* React can render Web Components directly using the string tag */}
           {createElement(WidgetTag, {
              ref: (el) => (widgetRefs.current[activeWidget] = el)
           })}
        </div>
      )}
    </div>
  );
}
