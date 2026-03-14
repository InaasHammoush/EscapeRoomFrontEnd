import { useEffect, useState, useCallback, useRef, createElement } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSocket, connectSocket } from "../state/socket";
import InteractionLayer from "../components/InteractionLayers/InteractionLayerManager.jsx";

// Import Widget Registry
import { WIDGET_REGISTRY } from "../config/widgets.js";

// Import Svelte Wrappers
import "../components/svelte/ScrollGrid.svelte";
import "../components/svelte/Bookshelf.svelte";
import "../components/svelte/CandlePuzzle.svelte";
import "../components/svelte/TransformationTable.svelte";
import "../components/svelte/CandleHint.svelte";
import "../components/svelte/FrameHint.svelte";
import "../components/svelte/KeyVase.svelte";
import "../components/svelte/RecipeHint.svelte";
import "../components/svelte/Transmuter.svelte";
import "../components/svelte/WestJigsaw.svelte";
import "../components/svelte/EastCodebox.svelte";
import "../components/svelte/LightBeamGrid.svelte";
import "../components/svelte/FlaskTransfer.svelte";
import "../components/svelte/StatuePose.svelte";
import "../components/svelte/MerlinScale.svelte";
import "../components/svelte/DoorSeal.svelte";
import "../components/svelte/Mortar.svelte"; 
import "../components/svelte/Portrait.svelte";
import "../components/svelte/Drawer.svelte";

import HUD from "../components/HUD.jsx";
import InventoryBar from "../components/inventory/InventoryBar.jsx";
import { normalizeInventory, applyInventoryIntent } from "../state/inventoryAdapter.js";
import { resolveWallImage } from "../config/wallImageOverrides.js";
import { readMusicSettings, writeMusicSettings } from "../state/musicSettings.js";

const initialSoloChoice = sessionStorage.getItem("soloChoice");
const WIDGET_STATE_ALIASES = Object.freeze({
  transmuter_puzzle: ["transmuter_puzzle", "alch:transmuter", "alchKeyTransmutation"],
  "alch:transmuter": ["alch:transmuter", "alchKeyTransmutation", "transmuter_puzzle"],
  "alch:mortar": ["alch:mortar", "alchMortarEssence", "mortar_puzzle"],
  mortar_puzzle: ["mortar_puzzle", "alch:mortar", "alchMortarEssence"],
  portrait_books_puzzle: ["alchPortrait", "alch_portrait", "alchPortraitBooks", "portrait_books_puzzle"],
  "alch:portrait": ["alchPortrait", "alch_portrait", "alchPortraitBooks", "portrait_books_puzzle"],
  alch_portrait: ["alchPortrait", "alch_portrait", "alchPortraitBooks", "portrait_books_puzzle"],
  alch_drawer_puzzle: ["alch_drawer_puzzle", "alch:drawer"],
  "alch:drawer": ["alch_drawer_puzzle", "alch:drawer"],
  flask_transfer_puzzle: ["flask_transfer_puzzle", "alch:flask-transfer", "alchFlaskTransfer"],
  "alch:flask-transfer": ["alch:flask-transfer", "alchFlaskTransfer", "flask_transfer_puzzle"],
  statue_pose_puzzle: ["statue_pose_puzzle", "alch:statue", "alchStatuePose"],
  "alch:statue": ["alch:statue", "alchStatuePose", "statue_pose_puzzle"],
});


function withWestRoseReward(items, includeRose = false) {
  const next = Array.isArray(items) ? [...items] : [];
  if (!includeRose) return next;
  const hasItem = next.some((entry) => String(entry?.item || "").toUpperCase() === "BURNINGROSE_WHOLE");
  if (!hasItem) next.push({ item: "BURNINGROSE_WHOLE", count: 1 });
  return next;
}

function hasWestRoseReady(payload) {
  if (!payload || typeof payload !== "object") return false;
  const keys = [
    "puzzle_west_codebox",
    "alchWestCodeboxJigsaw",
    "alch_west_codebox_jigsaw",
    "west_codebox_jigsaw",
  ];
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

function hasEastDoorSolved(payload) {
  if (!payload || typeof payload !== "object") return false;
  const looksLikeEastSlidingPayload =
    Array.isArray(payload?.board) ||
    typeof payload?.moves === "number" ||
    typeof payload?.lockVisible === "boolean" ||
    typeof payload?.keyImageRevealed === "boolean";
  if (looksLikeEastSlidingPayload && !!payload?.solved) return true;

  const keys = [
    "puzzle_east_sliding_lock",
    "alchEastSlidingLock",
    "alch_east_sliding_lock",
    "east_sliding_lock",
    "alchEastCodebox",
    "alchEastCodeboxJigsaw",
    "alch_east_codebox_jigsaw",
    "east_codebox_jigsaw",
  ];
  for (const key of keys) {
    const p = payload[key];
    if (p?.solved || p?.jigsaw?.solved || p?.output?.finalDoorOpen) return true;
  }
  for (const [key, value] of Object.entries(payload)) {
    if (!/east/i.test(String(key))) continue;
    if (!value || typeof value !== "object") continue;
    if (value?.solved || value?.jigsaw?.solved || value?.output?.finalDoorOpen) return true;
  }
  return false;
}

function normalizeActiveWidgetKey(value) {
  if (value === null || value === undefined) return value;
  const raw = String(value);
  if (WIDGET_REGISTRY[raw]) return raw;

  const lowered = raw.toLowerCase();
  const byCaseFold = Object.keys(WIDGET_REGISTRY).find((k) => k.toLowerCase() === lowered);
  if (byCaseFold) return byCaseFold;

  const aliases = {
    alchwestcodeboxjigsaw: "alchWestCodeboxJigsaw",
    alcheastslidinglock: "alchEastSlidingLock",
    alchlightbeamgrid: "alchLightBeamGrid",
    alchstatuepose: "alch:statue",
    "alch:flask-transfer": "flask_transfer_puzzle",
    alchflasktransfer: "flask_transfer_puzzle",
    "alch:mirror-grid": "alchLightBeamGrid",
  };
  return aliases[lowered] || raw;
}

function getPuzzleStateByWidget(gameState, activeWidget) {
  if (!gameState || !activeWidget) return undefined;
  const widgetStateCandidates = {
    west_codebox_puzzle: ["alchWestCodeboxJigsaw", "west_codebox_puzzle", "puzzle_west_codebox"],
    puzzle_west_codebox: ["alchWestCodeboxJigsaw", "puzzle_west_codebox", "west_codebox_puzzle"],
    alchWestCodeboxJigsaw: ["alchWestCodeboxJigsaw", "west_codebox_puzzle", "puzzle_west_codebox"],

    east_sliding_lock_puzzle: ["alchEastSlidingLock", "east_sliding_lock_puzzle", "puzzle_east_sliding_lock"],
    puzzle_east_sliding_lock: ["alchEastSlidingLock", "puzzle_east_sliding_lock", "east_sliding_lock_puzzle"],
    alchEastSlidingLock: ["alchEastSlidingLock", "east_sliding_lock_puzzle", "puzzle_east_sliding_lock"],

    light_beam_grid_puzzle: [
      "alchLightBeamGrid",
      "alch:mirror-grid",
      "light_beam_grid_puzzle",
      "puzzle_light_beam_grid",
      "light_beam_grid",
    ],
    puzzle_light_beam_grid: [
      "alchLightBeamGrid",
      "alch:mirror-grid",
      "puzzle_light_beam_grid",
      "light_beam_grid_puzzle",
      "light_beam_grid",
    ],
    alchLightBeamGrid: [
      "alchLightBeamGrid",
      "alch:mirror-grid",
      "light_beam_grid_puzzle",
      "puzzle_light_beam_grid",
      "light_beam_grid",
    ],
    "alch:mirror-grid": [
      "alchLightBeamGrid",
      "alch:mirror-grid",
      "light_beam_grid_puzzle",
      "puzzle_light_beam_grid",
      "light_beam_grid",
    ],
    portrait_books_puzzle: [
      "alchPortrait",
      "alch_portrait",
      "alchPortraitBooks",
      "portrait_books_puzzle",
    ],
    "alch:portrait": [
      "alchPortrait",
      "alch_portrait",
      "alchPortraitBooks",
      "portrait_books_puzzle",
    ],
    alch_portrait: [
      "alchPortrait",
      "alch_portrait",
      "alchPortraitBooks",
      "portrait_books_puzzle",
    ],
    alch_drawer_puzzle: [
      "alch_drawer_puzzle",
      "alch:drawer",
    ],
    "alch:drawer": [
      "alch_drawer_puzzle",
      "alch:drawer",
    ],
    transmuter_puzzle: [
      "alchKeyTransmutation",
      "alch:transmuter",
      "transmuter_puzzle",
    ],
    "alch:transmuter": [
      "alchKeyTransmutation",
      "alch:transmuter",
      "transmuter_puzzle",
    ],
    alchKeyTransmutation: [
      "alchKeyTransmutation",
      "alch:transmuter",
      "transmuter_puzzle",
    ],
    "alch:statue": [
      "alchStatuePose",
      "alch:statue-pose",
      "alch:statue",
    ],
    "alch:statue-pose": [
      "alchStatuePose",
      "alch:statue-pose",
      "alch:statue",
    ],
    statue_pose_puzzle: [
      "alchStatuePose",
      "statue_pose_puzzle",
      "alch:statue",
      "alch:statue-pose",
    ],
    alchStatuePose: [
      "alchStatuePose",
      "alch:statue",
      "alch:statue-pose",
    ],
    flask_transfer_puzzle: [
      "alchFlaskTransfer",
      "flask_transfer_puzzle",
      "puzzle_flask_transfer",
    ],
    puzzle_flask_transfer: [
      "alchFlaskTransfer",
      "puzzle_flask_transfer",
      "flask_transfer_puzzle",
    ],
    alchFlaskTransfer: [
      "alchFlaskTransfer",
      "flask_transfer_puzzle",
      "puzzle_flask_transfer",
    ],
    "alch:flask-transfer": [
      "alchFlaskTransfer",
      "alch:flask-transfer",
      "flask_transfer_puzzle",
      "puzzle_flask_transfer",
    ],
  };

  const candidates = widgetStateCandidates[activeWidget] || [activeWidget];
  for (const key of candidates) {
    if (gameState[key] !== undefined) return gameState[key];
  }

  // Last-resort shape-based fallback for light beam payloads with unexpected keys.
  const isLightBeamWidget =
    activeWidget === "light_beam_grid_puzzle" ||
    activeWidget === "puzzle_light_beam_grid" ||
    activeWidget === "alchLightBeamGrid" ||
    activeWidget === "alch:mirror-grid";
  if (isLightBeamWidget) {
    for (const value of Object.values(gameState)) {
      if (!value || typeof value !== "object") continue;
      const looksLikeLightBeam =
        value?.grid &&
        Number.isInteger(value?.grid?.width) &&
        Number.isInteger(value?.grid?.height) &&
        Array.isArray(value?.runes) &&
        value?.beam &&
        Array.isArray(value?.beam?.segments);
      if (looksLikeLightBeam) return value;
    }
  }

  if (gameState[activeWidget] !== undefined) return gameState[activeWidget];
  return undefined;
}

export default function RoomView({ mode = "solo" }) {
  const { sessionId, roomId, role } = useParams();
  const navigate = useNavigate();

  const [socketReady, setSocketReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // State
  const [viewIndex, setViewIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [roomType, setRoomType] = useState(initialSoloChoice);
  const [gameState, setGameState] = useState({});
  const [timerNow, setTimerNow] = useState(Date.now());
  const [activeWidget, setActiveWidget] = useState(null);
  const [eastDoorSolved, setEastDoorSolved] = useState(false);
  const [statueFeatherPlaced, setStatueFeatherPlaced] = useState(false);
  const [statueFeatherSide, setStatueFeatherSide] = useState("left");
  
  // Inventory State
  const [inventory, setInventory] = useState([]);
  const pendingFlags = useRef({}); // Generic pending flags
  const [musicEnabled, setMusicEnabled] = useState(() => readMusicSettings().enabled);
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
    const snapshotWidget = st?.activeWidget ?? publicState?.activeWidget;

    if (st.viewIndex !== undefined) setViewIndex(st.viewIndex);
    if (st.roomType) setRoomType(st.roomType);
    if (Array.isArray(st.views)) loadImages(st.views);
    if (snapshotWidget !== undefined) {
      setActiveWidget(normalizeActiveWidgetKey(snapshotWidget));
    }
    if (publicState) {
      if (hasWestRoseReady(publicState)) westRoseRewardGranted.current = true;
      setEastDoorSolved(hasEastDoorSolved(publicState));
      setGameState(publicState);
      if (publicState.inventory?.items) {
        setInventory(
          withWestRoseReward(
            normalizeInventory(publicState.inventory.items, pendingFlags.current),
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
    if (hasEastDoorSolved(msg.diff)) setEastDoorSolved(true);

    if (msg.diff.activeWidget !== undefined) {
      setActiveWidget(normalizeActiveWidgetKey(msg.diff.activeWidget));
    } else {
      // Keep fallback narrow to avoid auto-opening unrelated widgets from baseline puzzle state.
      if (
        msg.diff["alch:statue"] !== undefined ||
        msg.diff["alch:statue-pose"] !== undefined ||
        msg.diff.alchStatuePose !== undefined
      ) {
        setActiveWidget("alch:statue");
      } else {
        const derivedWidget = Object.keys(msg.diff).find(
          (key) => key !== "activeWidget" && msg.diff?.[key]?.activeWidget && WIDGET_REGISTRY[key]
        );
        if (derivedWidget) setActiveWidget(derivedWidget);
      }
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
      setInventory(
        withWestRoseReward(
          normalizeInventory(msg.diff.inventory.items, pendingFlags.current),
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

  const onRoomChanged = useCallback((msg) => {
    const diff = msg?.diff || msg;
    if (!diff) return;
    if (diff.viewIndex !== undefined) setViewIndex(diff.viewIndex);
    if (diff.roomType) setRoomType(diff.roomType);
    if (Array.isArray(diff.views)) loadImages(diff.views);
    setGameState((prev) => ({ ...prev, ...diff }));
  }, [loadImages]);

  const onRoomState = useCallback((snapshot) => {
    if (!snapshot) return;
    onSnapshot({ snapshot });
  }, [onSnapshot]);

  // --- SOCKET SETUP ---
  useEffect(() => {
    let s = getSocket();
    if (!s) s = connectSocket({ mode, sessionId, role, roomType: initialSoloChoice });
    
    const onConnect = () => setSocketReady(true);
    if (s.connected) setSocketReady(true);
    else s.on("connect", onConnect);

    s.on("state:snapshot", onSnapshot);
    s.on("room_state", onRoomState);
    s.on("puzzle_update", onPuzzleUpdate);
    s.on("state:viewChanged", onViewChanged);
    s.on("state:roomChanged", onRoomChanged);

    return () => {
      s.off("state:snapshot", onSnapshot);
      s.off("room_state", onRoomState);
      s.off("puzzle_update", onPuzzleUpdate);
      s.off("state:viewChanged", onViewChanged);
      s.off("state:roomChanged", onRoomChanged);
    };
  }, [mode, sessionId, roomId, onSnapshot, onRoomState, onPuzzleUpdate, onViewChanged, onRoomChanged]);

  // --- JOIN & READY ---
  useEffect(() => {
    if (!socketReady || !roomId) return;
    const s = getSocket();
    pendingFlags.current = {};
    const name = mode === "solo" ? "Solo Player" : "Player";
    const normalizedRole =
      role ? String(role).trim().toUpperCase() : null;
    const payload = normalizedRole
      ? { roomId, name, role: normalizedRole }
      : { roomId, name };
    s.emit("join_room", payload, (res) => {
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
    let puzzleData = getPuzzleStateByWidget(gameState, activeWidget);
    const isLightBeamTag = tagName === "lightbeam-grid-widget";
    if (puzzleData === undefined && isLightBeamTag) {
      puzzleData =
        gameState?.alchLightBeamGrid ??
        gameState?.["alch:mirror-grid"] ??
        gameState?.light_beam_grid_puzzle ??
        gameState?.puzzle_light_beam_grid;
    const candidateKeys = WIDGET_STATE_ALIASES[activeWidget] || [activeWidget];
    const puzzleData = candidateKeys.map((k) => gameState[k]).find(Boolean);}

    if (el && puzzleData) {
      // Generic prop passing
      if ("grid" in el) el.grid = puzzleData;
      if ("puzzle" in el) el.puzzle = puzzleData;
      
      // Inject inventory only if the widget needs it (optional optimization)
      if ("inventory" in el) el.inventory = inventory;
    }

    if (el && puzzleData !== undefined) {
      // Always assign component props directly; custom element prototypes can be inconsistent for `in` checks.
      el.grid = puzzleData;
      el.puzzle = puzzleData;
      el.inventory = inventory;
      el.featherSideHint = statueFeatherSide;
      el.featherPlacedHint = statueFeatherPlaced;
    }
  }, [gameState, activeWidget, inventory, statueFeatherSide, statueFeatherPlaced]);

  useEffect(() => {
    if (eastDoorSolved) return;
    if (hasEastDoorSolved(gameState)) setEastDoorSolved(true);
  }, [gameState, eastDoorSolved]);

  useEffect(() => {
    if (!eastDoorSolved) return;
    if (
      activeWidget === "east_sliding_lock_puzzle" ||
      activeWidget === "puzzle_east_sliding_lock" ||
      activeWidget === "alchEastCodebox" ||
      activeWidget === "alchEastSlidingLock"
    ) {
      setActiveWidget(null);
    }
  }, [eastDoorSolved, activeWidget]);



  useEffect(() => {
    const startedAt = Number(gameState?.game?.startedAt || 0);
    const endedAt = Number(gameState?.game?.endedAt || 0);
    if (!startedAt) return;
    if (endedAt) {
      setTimerNow(endedAt);
      return;
    }
    const id = setInterval(() => setTimerNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [gameState?.game?.startedAt, gameState?.game?.endedAt]);

  const formatElapsed = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    if (hours > 0) return `${hours}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  };

  useEffect(() => {
    const onEastSolved = () => setEastDoorSolved(true);
    document.addEventListener("east-sliding-solved", onEastSolved);
    return () => document.removeEventListener("east-sliding-solved", onEastSolved);
  }, []);

  useEffect(() => {
    if (!roomType) return;
    window.dispatchEvent(
      new CustomEvent("music:room", { detail: { roomKey: roomType } })
    );
  }, [roomType]);

  // --- INTENT LISTENER ---
  useEffect(() => {
    const handleIntent = (e) => {
      const { objectId, verb, data, canonicalObjectId } = e.detail || {};

      if (verb === "CLOSE") {
        setActiveWidget(null);
        return;
      }

      // Optimistic Update
      const result = applyInventoryIntent(inventory, pendingFlags.current, { objectId, verb, data });
      pendingFlags.current = result.nextPending;
      setInventory(normalizeInventory(result.nextInventory, pendingFlags.current));

      const payload = { roomId, actionId: crypto.randomUUID(), objectId, verb, data };
      if (canonicalObjectId) payload.canonicalObjectId = canonicalObjectId;
      getSocket()?.emit("interact", payload);
    };

    document.addEventListener("intent", handleIntent);
    return () => document.removeEventListener("intent", handleIntent);
  }, [roomId, inventory]);

  const turn = (dir) => getSocket()?.emit("intent:turn", { roomId, direction: dir });
  const switchRoom = () => {
    const socket = getSocket();
    if (!socket || !roomId) return;
    const current = gameState?.activeChamber || roomType;
    const target = current === "wizard_library" ? "alchemist_lab" : "wizard_library";
    socket.emit("intent:switch_room", { roomId, chamber: target }, (res) => {
      if (!res?.ok) {
        console.warn("switch_room failed", res);
        return;
      }
      if (res?.diff) onRoomChanged(res);
    });
  };
  const goCorridor = () => {
    const socket = getSocket();
    if (!socket || !roomId) return;
    socket.emit("intent:switch_room", { roomId, chamber: "corridor" }, (res) => {
      if (!res?.ok) {
        console.warn("switch_room failed", res);
        return;
      }
      if (res?.diff) onRoomChanged(res);
    });
  };
  const toggleMusic = () => {
    const current = readMusicSettings();
    const nextEnabled = !current.enabled;
    setMusicEnabled(nextEnabled);
    writeMusicSettings({ enabled: nextEnabled, volume: current.volume });
  };

  useEffect(() => {
    const onSettings = (event) => {
      if (!event?.detail) return;
      setMusicEnabled(event.detail.enabled !== false);
    };
    const onStorage = (event) => {
      if (event.key !== "musicSettings") return;
      setMusicEnabled(readMusicSettings().enabled);
    };

    window.addEventListener("music:settings", onSettings);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("music:settings", onSettings);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (loading || !socketReady) return <div className="text-white">Loading...</div>;

  // --- RENDER ---
  const WidgetTag = activeWidget ? WIDGET_REGISTRY[activeWidget] : null;
  const baseWallImage = images[viewIndex];
  const wallImage = resolveWallImage(baseWallImage, { roomType, viewIndex, gameState });
  const canSwitchRoom = gameState?.mode === "solo" || mode === "solo";
  const corridorUnlocked = !!gameState?.corridorUnlocked;
  const switchRoomLabel = (gameState?.activeChamber || roomType) === "wizard_library"
    ? "Go to Lab"
    : "Go to Library";
  const startedAtMs = Number(gameState?.game?.startedAt || 0);
  const endedAtMs = Number(gameState?.game?.endedAt || 0);
  const elapsedMs = startedAtMs ? (endedAtMs || timerNow) - startedAtMs : null;
  const timerLabel = startedAtMs ? `Time ${formatElapsed(elapsedMs)}` : null;

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <HUD 
        onHome={exitToHome} 
        onTurnLeft={() => turn("LEFT")} 
        onTurnRight={() => turn("RIGHT")} 
        onToggleMusic={toggleMusic}
        musicEnabled={musicEnabled}
        onSwitchRoom={canSwitchRoom ? switchRoom : null}
        switchRoomLabel={switchRoomLabel}
        onGoCorridor={canSwitchRoom && corridorUnlocked ? goCorridor : null}
        timerLabel={timerLabel}
      />
      
      {/* Background & Click Layer */}
      {wallImage && <img src={wallImage} className="absolute inset-0 w-full h-full object-contain select-none z-0" />}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <InteractionLayer viewIndex={viewIndex} roomId={roomId} socket={getSocket()} roomType={roomType} gameState={gameState} />
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
