class Emitter {
  constructor(){ this.m = new Map(); }
  on(e, fn){ (this.m.get(e) || this.m.set(e,[]).get(e)).push(fn); }
  off(e, fn){ this.m.set(e, (this.m.get(e)||[]).filter(f=>f!==fn)); }
  emit(e, p){ (this.m.get(e)||[]).forEach(fn=>fn(p)); }
}

const CH = new BroadcastChannel("MOCK_SIO");

function key(ns, sessionId){ return `MOCK_SIO__${ns}__${sessionId}`; }
function readSess(ns, sessionId){
  try { return JSON.parse(localStorage.getItem(key(ns, sessionId))) || { players:{}, ready:false, clues:[], roomId:null }; }
  catch { return { players:{}, ready:false, clues:[], roomId:null }; }
}
function writeSess(ns, sessionId, sess){
  localStorage.setItem(key(ns, sessionId), JSON.stringify(sess));
  CH.postMessage({ type:"status", ns, sessionId });
}

let socket = null;
let current = { ns:null, sessionId:null, role:null };

export function connectSocket({ mode, sessionId, role }) {
  const ns = mode === "solo" ? "solo" : "coop";
  if (socket && current.ns===ns && current.sessionId===sessionId && current.role===role) return socket;

  socket = new Emitter();
  socket.id = Math.random().toString(36).slice(2,10);
  current = { ns, sessionId, role };

  // save original emit for server->client
  const realEmit = socket.emit.bind(socket);

  // client -> server
  socket.emit = (evt, payload) => {
    handleClient(ns, sessionId, socket, evt, payload);
    return true;
  };

  // server -> client
  socket._serverEmit = (evt, payload) => realEmit(evt, payload);

  // welcome + initial status
  setTimeout(() => {
    socket._serverEmit("welcome", { ns, sessionId, role, mock:true, id: socket.id });
    pushStatus(ns, sessionId, socket);
  }, 0);

  // listen for cross-tab updates and push tailored status to this client
  const onMsg = (msg) => {
    if (msg?.type === "status" && msg.ns === ns && msg.sessionId === sessionId) {
      pushStatus(ns, sessionId, socket);
    }
  };
  CH.addEventListener("message", onMsg);

  socket.disconnect = () => {
    CH.removeEventListener("message", onMsg);
    // optional: clear role on disconnect
    const sess = readSess(ns, sessionId);
    if (sess.players[socket.id]) {
      delete sess.players[socket.id];
      sess.ready = haveAB(sess.players);
      writeSess(ns, sessionId, sess);
    }
  };

  console.log(`[MOCK] connect ns=${ns} session=${sessionId} role=${role||"-"} id=${socket.id}`);
  return socket;
}

export function getSocket(){ return socket; }
export function disconnectSocket(){ if (socket) socket.disconnect(); socket = null; current = {ns:null, sessionId:null, role:null}; }


function handleClient(ns, sessionId, sock, evt, payload){
  const sess = readSess(ns, sessionId);
  switch (evt) {
    case "lobby:subscribe":
    case "lobby:status:get":
      pushStatus(ns, sessionId, sock);
      break;

    case "lobby:setRole":
      sess.players[sock.id] = { id: sock.id, role: payload.role };
      sess.ready = haveAB(sess.players);
      if (sess.ready && !sess.roomId) {
        sess.roomId = (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));
      }
      writeSess(ns, sessionId, sess); // notifies all tabs
      break;

    case "lobby:unsubscribe":
      // no-op for mock
      break;

    default:
      sess.clues.push({ from: sock.id, evt, payload });
      writeSess(ns, sessionId, sess);
  }
}

function haveAB(players){
  const roles = Object.values(players).map(p => p.role);
  return roles.includes("A") && roles.includes("B");
}

function snapshotFor(ns, sessionId, perspectiveId){
  const sess = readSess(ns, sessionId);
  return {
    players: Object.values(sess.players),
    ready: sess.ready,
    myRole: (sess.players[perspectiveId]?.role) || null,
    roomId: sess.roomId || null
  };
}

function pushStatus(ns, sessionId, sock){
  const payload = snapshotFor(ns, sessionId, sock.id);
  sock._serverEmit("lobby:status", payload);
}
