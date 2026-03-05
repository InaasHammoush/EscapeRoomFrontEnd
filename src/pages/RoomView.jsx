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
import "../components/svelte/EastCodebox.svelte";
import "../components/svelte/LightBeamGrid.svelte";
import "../components/svelte/NorthStatue.svelte";
import "../components/svelte/FlaskTransfer.svelte";
import finalDoorOpenImg from "../assets/alchemist/finaldoor_open.png";
import featherStatueImg from "../assets/alchemist/feather_statue.png";

import HUD from "../components/HUD.jsx";
import InventoryBar from "../components/inventory/InventoryBar.jsx";
import { normalizeInventory, applyInventoryIntent } from "../state/inventoryAdapter.js";
import {
  getNorthWallFeatherOverlay,
  readStatueFeatherFromPayload,
} from "./roomView/statueFeather.js";

const initialSoloChoice = sessionStorage.getItem("soloChoice");

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

function getFlaskTransferState(payload) {
  if (!payload || typeof payload !== "object") return null;
  return (
    payload.alchFlaskTransfer ||
    payload.flask_transfer_puzzle ||
    payload.puzzle_flask_transfer ||
    payload["alch:flask-transfer"] ||
    null
  );
}

function stripLeakedFlaskRewardsAtStart(items, payload) {
  if (!Array.isArray(items)) return [];
  const flask = getFlaskTransferState(payload);
  if (!flask) return items;

  const solved = !!flask.solved;
  const moves = Number(flask.moves || 0);
  const output = flask.output || {};
  const rewardsOpen =
    !!output.coalBlockReady ||
    !!output.moonwortReady ||
    !!output.matchesReady ||
    !!output.greenLiquidReady;

  // Only scrub at true initial state. Once progressed/solved, trust backend inventory.
  if (solved || moves > 0 || rewardsOpen) return items;

  const leaked = new Set(["MOONWORT", "GREEN_LIQUID", "MATCHES", "COAL_BLOCK", "CHARCOAL_PEN"]);
  return items.filter((entry) => !leaked.has(String(entry?.item || "").trim().toUpperCase()));
}

function withSolvedFlaskRewards(items, payload) {
  const next = Array.isArray(items) ? [...items] : [];
  const flask = getFlaskTransferState(payload);
  if (!flask) return next;

  const output = flask.output || {};
  const rewardReady = {
    MOONWORT: !!output.moonwortReady,
    GREEN_LIQUID: !!output.greenLiquidReady,
    MATCHES: !!output.matchesReady,
    CHARCOAL_PEN: !!output.coalBlockReady,
  };
  if (!Object.values(rewardReady).some(Boolean)) return next;

  const ensure = (name, aliases = []) => {
    const wanted = new Set([String(name).toUpperCase(), ...aliases.map((v) => String(v).toUpperCase())]);
    const exists = next.some((entry) => wanted.has(String(entry?.item || "").trim().toUpperCase()));
    if (!exists) next.push({ item: name, count: 1 });
  };

  if (rewardReady.MOONWORT) ensure("MOONWORT");
  if (rewardReady.GREEN_LIQUID) ensure("GREEN_LIQUID");
  if (rewardReady.MATCHES) ensure("MATCHES");
  if (rewardReady.CHARCOAL_PEN) ensure("CHARCOAL_PEN", ["COAL_BLOCK"]);

  return next;
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
  const [eastDoorSolved, setEastDoorSolved] = useState(false);
  const [statueFeatherPlaced, setStatueFeatherPlaced] = useState(false);
  const [statueFeatherSide, setStatueFeatherSide] = useState("left");
  
  // Inventory State
  const [inventory, setInventory] = useState([]);
  const pendingFlags = useRef({}); // Generic pending flags
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
      const statueFeather = readStatueFeatherFromPayload(publicState);
      if (statueFeather) {
        setStatueFeatherPlaced(statueFeather.placed);
        if (statueFeather.side) setStatueFeatherSide(statueFeather.side);
      }
      if (hasWestRoseReady(publicState)) westRoseRewardGranted.current = true;
      setEastDoorSolved(hasEastDoorSolved(publicState));
      setGameState(publicState);
      if (publicState.inventory?.items) {
        const startItems = stripLeakedFlaskRewardsAtStart(publicState.inventory.items, publicState);
        const solvedRewardItems = withSolvedFlaskRewards(startItems, publicState);
        setInventory(
          withWestRoseReward(
            normalizeInventory(solvedRewardItems, pendingFlags.current),
            westRoseRewardGranted.current
          )
        );
      }
    }
  }, [loadImages]);

  // --- DELTA UPDATE ---
  const onPuzzleUpdate = useCallback((msg) => {
    if (!msg?.diff) return;
    const statueFeather = readStatueFeatherFromPayload(msg.diff);
    if (statueFeather) {
      setStatueFeatherPlaced(statueFeather.placed);
      if (statueFeather.side) setStatueFeatherSide(statueFeather.side);
    }
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
      const solvedRewardItems = withSolvedFlaskRewards(msg.diff.inventory.items, {
        ...gameState,
        ...msg.diff,
      });
      setInventory(
        withWestRoseReward(
          normalizeInventory(solvedRewardItems, pendingFlags.current),
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
    pendingFlags.current = {};
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
    let puzzleData = getPuzzleStateByWidget(gameState, activeWidget);
    const isLightBeamTag = tagName === "lightbeam-grid-widget";
    if (puzzleData === undefined && isLightBeamTag) {
      puzzleData =
        gameState?.alchLightBeamGrid ??
        gameState?.["alch:mirror-grid"] ??
        gameState?.light_beam_grid_puzzle ??
        gameState?.puzzle_light_beam_grid;
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
    const onEastSolved = () => setEastDoorSolved(true);
    document.addEventListener("east-sliding-solved", onEastSolved);
    return () => document.removeEventListener("east-sliding-solved", onEastSolved);
  }, []);

  // --- INTENT LISTENER ---
  useEffect(() => {
    const handleIntent = (e) => {
      const { objectId, verb, data, canonicalObjectId } = e.detail || {};
      const objectLower = String(objectId || "").toLowerCase();
      const verbLower = String(verb || "").toLowerCase();
      const canonicalLower = String(canonicalObjectId || "").toLowerCase();
      const isStatueIntent =
        objectLower === "puzzle_statue_pose" ||
        objectLower === "alch:statue-pose" ||
        canonicalLower === "alch:statue-pose";
      if (verb === "CLOSE") {
        setActiveWidget(null);
        return;
      }

      if (isStatueIntent && verbLower === "insert") {
        const itemNorm = String(data?.item || "").trim().toUpperCase().replace(/\s+/g, "_");
        if (itemNorm === "FEATHER" || itemNorm === "FEATHER_STATUE") {
          const sideRaw = String(data?.side || data?.ear || "").toLowerCase();
          const side = sideRaw.includes("right") ? "right" : "left";
          setStatueFeatherPlaced(true);
          setStatueFeatherSide(side);
        }
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

  if (loading || !socketReady) return <div className="text-white">Loading...</div>;

  // --- RENDER ---
  const WidgetTag = activeWidget ? WIDGET_REGISTRY[activeWidget] : null;
  const currentImage = images[viewIndex];
  const displayImage =
    roomType === "alchemist_lab" && viewIndex === 1 && eastDoorSolved
      ? finalDoorOpenImg
      : currentImage;
  const { visible: showNorthWallFeather, style: wallFeatherStyle } =
    getNorthWallFeatherOverlay({
      roomType,
      viewIndex,
      statueFeatherPlaced,
      statueFeatherSide,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <HUD 
        onHome={exitToHome} 
        onTurnLeft={() => turn("LEFT")} 
        onTurnRight={() => turn("RIGHT")} 
      />
      
      {/* Background & Click Layer */}
      {displayImage && <img src={displayImage} className="absolute inset-0 w-full h-full object-contain select-none z-0" />}
      {showNorthWallFeather && (
        <img
          src={featherStatueImg}
          alt=""
          className="absolute z-[5] pointer-events-none select-none"
          style={wallFeatherStyle}
        />
      )}
      <div className="absolute inset-0 z-10">
        <InteractionLayer
          key={`${roomType || "unknown"}-${viewIndex}-${eastDoorSolved ? "solved" : "unsolved"}`}
          viewIndex={viewIndex}
          roomId={roomId}
          socket={getSocket()}
          roomType={roomType}
          eastDoorSolved={eastDoorSolved}
          statueFeatherPlaced={statueFeatherPlaced}
          statueFeatherSide={statueFeatherSide}
        />
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
