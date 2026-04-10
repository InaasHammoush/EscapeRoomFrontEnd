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
import "../components/svelte/FinalDoorInput.svelte";
import "../components/svelte/WestJigsaw.svelte";
import "../components/svelte/EastCodebox.svelte";
import "../components/svelte/LightBeamGrid.svelte";
import "../components/svelte/FlaskTransfer.svelte";
import "../components/svelte/StatuePose.svelte";
import "../components/svelte/MerlinScale.svelte";
import "../components/svelte/DoorSeal.svelte";
import "../components/svelte/AlchEastDoor.svelte";
import "../components/svelte/Mortar.svelte"; 
import "../components/svelte/Portrait.svelte";
import "../components/svelte/Drawer.svelte";

import HUD from "../components/HUD.jsx";
import InventoryBar from "../components/inventory/InventoryBar.jsx";
import { normalizeInventory, applyInventoryIntent } from "../state/inventoryAdapter.js";
import { resolveWallImage } from "../config/wallImageOverrides.js";
import { readMusicSettings, writeMusicSettings } from "../state/musicSettings.js";

const initialSoloChoice = sessionStorage.getItem("soloChoice");
const DEFAULT_STATUE_FEATHER_PLACED = false;
const DEFAULT_STATUE_FEATHER_SIDE = "left";
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
  transformation_table_puzzle: ["wizard_transformation_table", "transformation_table_puzzle"],
  final_word_input: ["finalCorridor", "final_word_input"],
  final_sync_plates: ["finalCorridor", "final_sync_plates"],
  final_door_panel: ["finalCorridor", "final_door_panel"],
  final_rune_hint: ["finalCorridor", "final_rune_hint"],
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
    alcheastdoor: "alch_east_door",
    "alch:flask-transfer": "flask_transfer_puzzle",
    alchflasktransfer: "flask_transfer_puzzle",
    "alch:mirror-grid": "alchLightBeamGrid",
  };
  return aliases[lowered] || raw;
}

function mergePublicState(prev, diff) {
  if (!diff || typeof diff !== "object") return prev;

  const next = { ...prev, ...diff };

  if (diff.game && typeof diff.game === "object") {
    next.game = { ...(prev?.game || {}), ...diff.game };
  }

  if (diff.finalCorridor && typeof diff.finalCorridor === "object") {
    next.finalCorridor = { ...(prev?.finalCorridor || {}), ...diff.finalCorridor };
    if (diff.finalCorridor.plates && typeof diff.finalCorridor.plates === "object") {
      next.finalCorridor.plates = {
        ...(prev?.finalCorridor?.plates || {}),
        ...diff.finalCorridor.plates,
      };
    }
  }

  if (diff.chambers && typeof diff.chambers === "object") {
    next.chambers = { ...(prev?.chambers || {}), ...diff.chambers };
  }

  return next;
}

function getPuzzleStateByWidget(gameState, activeWidget) {
  if (!gameState || !activeWidget) return undefined;
  if (activeWidget === "alch_east_door" || activeWidget === "east_door_sync_puzzle") {
    return {
      ...(gameState?.alchEastDoorSync || {}),
      ...(gameState?.alchDoorState || {}),
      opened: !!(gameState?.alchEastDoorSync?.opened || gameState?.alchDoorState?.open),
      open: !!(gameState?.alchDoorState?.open || gameState?.alchEastDoorSync?.opened),
    };
  }
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

  const INTRO_AUTO_HIDE_MS = 2500;
  const INTRO_FADE_MS = 600;

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
  const [showIntro, setShowIntro] = useState(true);
  const [introFading, setIntroFading] = useState(false);
  const statueFeatherPlaced = DEFAULT_STATUE_FEATHER_PLACED;
  const statueFeatherSide = DEFAULT_STATUE_FEATHER_SIDE;
  
  // Inventory State
  const [inventory, setInventory] = useState([]);
  const pendingFlags = useRef({}); // Generic pending flags
  const completedNavRef = useRef(false);
  const [musicEnabled, setMusicEnabled] = useState(() => readMusicSettings().enabled);
  const westRoseRewardGranted = useRef(false);

  // Refs for Web Components
  const widgetRefs = useRef({});
  const wallImageRef = useRef(null);
  const [measuredWallAspectRatio, setMeasuredWallAspectRatio] = useState(null);

  const exitToHome = () => {
    if (!confirm("Leave the room and return to home?")) return;
    navigate("/");
  };

  const dismissIntro = useCallback(() => {
    if (!showIntro || introFading) return;
    setIntroFading(true);
    // Notify backend that intro is dismissed – timer should now start
    if (roomId) {
      getSocket()?.emit('intro:dismissed', { roomId });
    }
    setTimeout(() => setShowIntro(false), INTRO_FADE_MS);
  }, [showIntro, introFading, roomId]);

  const handleVideoEnded = useCallback(() => {
    setTimeout(dismissIntro, 1500);
  }, [dismissIntro]);

  useEffect(() => {
    if (!showIntro) return;
    const onKey = (event) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
        dismissIntro();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showIntro, dismissIntro]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("music:intro", { detail: { blocked: showIntro } })
    );
  }, [showIntro]);

  const loadImages = useCallback((files) => {
    if (!Array.isArray(files) || files.length === 0) return setLoading(false);
    setImages(files);
    setLoading(false);
  }, []);

  const baseWallImage = images[viewIndex];
  const wallImage = resolveWallImage(baseWallImage, { roomType, viewIndex, gameState });

  const updateMeasuredWallAspectRatio = useCallback((imgEl) => {
    const naturalWidth = Number(imgEl?.naturalWidth || 0);
    const naturalHeight = Number(imgEl?.naturalHeight || 0);
    if (!naturalWidth || !naturalHeight) return;
    const nextAspectRatio = naturalWidth / naturalHeight;
    setMeasuredWallAspectRatio((prev) =>
      prev !== null && Math.abs(prev - nextAspectRatio) < 0.0001 ? prev : nextAspectRatio
    );
  }, []);

  useEffect(() => {
    setMeasuredWallAspectRatio(null);
  }, [wallImage?.src]);

  useEffect(() => {
    const imgEl = wallImageRef.current;
    if (!imgEl?.complete) return;
    updateMeasuredWallAspectRatio(imgEl);
  }, [wallImage?.src, updateMeasuredWallAspectRatio]);

  // --- SNAPSHOT ---
  const onSnapshot = useCallback((msg) => {
    const st = msg?.roomState || msg?.snapshot?.state;
    if (!st) return;
    const publicState = st.public || st;
    const hasSnapshotWidget =
      st && Object.prototype.hasOwnProperty.call(st, "activeWidget");
    const snapshotWidget = hasSnapshotWidget ? st.activeWidget : publicState?.activeWidget;

    if (st.viewIndex !== undefined) setViewIndex(st.viewIndex);
    if (st.roomType) setRoomType(st.roomType);
    if (Array.isArray(st.views)) loadImages(st.views);
    if (hasSnapshotWidget) {
      setActiveWidget(normalizeActiveWidgetKey(snapshotWidget));
    } else if (snapshotWidget !== undefined) {
      setActiveWidget(normalizeActiveWidgetKey(snapshotWidget));
    }
    if (publicState) {
      if (hasWestRoseReady(publicState)) westRoseRewardGranted.current = true;
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
      const nextDiff = { ...msg.diff };
      delete nextDiff.activeWidget;
      return mergePublicState(prev, nextDiff);
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
    setGameState((prev) => mergePublicState(prev, diff));
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
    const onCompleted = (payload) => {
      if (completedNavRef.current) return;
      if (payload?.roomId && payload.roomId !== roomId) return;
      completedNavRef.current = true;
      navigate("/credits", { state: payload || {} });
    };
    s.on("room_completed", onCompleted);

    return () => {
      s.off("state:snapshot", onSnapshot);
      s.off("room_state", onRoomState);
      s.off("puzzle_update", onPuzzleUpdate);
      s.off("state:viewChanged", onViewChanged);
      s.off("state:roomChanged", onRoomChanged);
      s.off("room_completed", onCompleted);
    };
  }, [mode, sessionId, roomId, navigate, onSnapshot, onRoomState, onPuzzleUpdate, onViewChanged, onRoomChanged]);

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
    }

    if (puzzleData === undefined) {
      const candidateKeys = WIDGET_STATE_ALIASES[activeWidget] || [activeWidget];
      puzzleData = candidateKeys
        .map((key) => gameState?.[key])
        .find((value) => value !== undefined);
    }

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
      el.gameMode = gameState?.mode || mode;
      el.featherSideHint = statueFeatherSide;
      el.featherPlacedHint = statueFeatherPlaced;
    }
  }, [gameState, activeWidget, inventory, statueFeatherSide, statueFeatherPlaced, mode]);

  useEffect(() => {
    const slidingSolved = !!(
      gameState?.alchEastSlidingLock?.solved ||
      gameState?.puzzle_east_sliding_lock?.solved
    );
    if (!slidingSolved) return;
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
        const payload = { roomId, actionId: crypto.randomUUID(), objectId, verb, data };
        if (canonicalObjectId) payload.canonicalObjectId = canonicalObjectId;
        getSocket()?.emit("interact", payload);
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
  const corridorUnlocked = !!gameState?.corridorUnlocked;
  const isSoloMode = (gameState?.mode === "solo" || mode === "solo");
  const canSwitchRoom =
    isSoloMode &&
    roomType !== "corridor" &&
    !corridorUnlocked;
  const canGoCorridor =
    isSoloMode &&
    roomType !== "corridor" &&
    corridorUnlocked;
  const switchRoomLabel = (gameState?.activeChamber || roomType) === "wizard_library"
    ? "Go to Lab"
    : "Go to Library";
  const startedAtMs = Number(gameState?.game?.startedAt || 0);
  const endedAtMs = Number(gameState?.game?.endedAt || 0);
  const elapsedMs = startedAtMs ? (endedAtMs || timerNow) - startedAtMs : null;
  const timerLabel = startedAtMs ? `Time ${formatElapsed(elapsedMs)}` : null;
  const wallImageFitClass = wallImage?.fit === "cover" ? "object-cover" : "object-contain";
  const wallImageAspectRatio = measuredWallAspectRatio || wallImage?.aspectRatio || 1920 / 1080;
  const wallImageFit = wallImage?.fit || "contain";
  const canTurn = roomType !== "corridor";

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      {showIntro && (
        <div
          className={`absolute inset-0 z-[70] flex items-center justify-center bg-black transition-opacity duration-700 ${
            introFading ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          onClick={dismissIntro}
        >
          <video
                autoPlay
                playsInline
                onEnded={handleVideoEnded}
                className="fixed inset-0 w-full h-full object-cover -z-10"
              >
                <source src="/intro.mp4" type="video/mp4" />
        </video>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-xs uppercase tracking-[0.35em] bg-black/60 px-4 py-2 rounded-full border border-white/20">
            Click to skip
          </div>
        </div>
      )}
      <HUD 
        onHome={exitToHome} 
        onTurnLeft={canTurn ? () => turn("LEFT") : null} 
        onTurnRight={canTurn ? () => turn("RIGHT") : null} 
        onToggleMusic={toggleMusic}
        musicEnabled={musicEnabled}
        onSwitchRoom={canSwitchRoom ? switchRoom : null}
        switchRoomLabel={switchRoomLabel}
        onGoCorridor={canGoCorridor ? goCorridor : null}
        timerLabel={timerLabel}
      />

      {/* Background & Click Layer */}
      {wallImage?.src && wallImageFit === "contain" && (
        <img
          src={wallImage.src}
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-xl opacity-55 brightness-110 saturate-90 select-none z-0 pointer-events-none"
          alt=""
          draggable={false}
          aria-hidden="true"
        />
      )}
      {wallImage?.src && (
        <img
          ref={wallImageRef}
          src={wallImage.src}
          className={`absolute inset-0 w-full h-full ${wallImageFitClass} select-none z-0`}
          alt=""
          draggable={false}
          onLoad={(event) => updateMeasuredWallAspectRatio(event.currentTarget)}
        />
      )}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <InteractionLayer
          viewIndex={viewIndex}
          roomId={roomId}
          socket={getSocket()}
          roomType={roomType}
          gameState={gameState}
          wallImageAspectRatio={wallImageAspectRatio}
          wallImageFit={wallImageFit}
        />
      </div>

      {/* Generic Inventory Bar */}
      <InventoryBar
        inventory={inventory}
        mode={mode}
        role={role}
        roomType={roomType}
        activeChamber={gameState?.activeChamber}
      />

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
