export const MUSIC_TRACKS = {
  mainWebsite: {
    src: "/audio/main-site.wav",
    volume: 0.2,
  },
  inRoom: {
    src: "/audio/main-site.wav",
    volume: 0.35,
  },
  credits: {
    src: "/audio/credits.wav",
    volume: 0.35,
  },
};

export const ROOM_TRACKS = {
  wizard_library: {
    src: "/audio/room-wizard_library.wav",
    volume: 0.35,
  },
  alchemist_lab: {
    src: "/audio/room-alchemist_lab.wav",
    volume: 0.35,
  },
  corridor: {
    src: "/audio/room-corridor.wav",
    volume: 0.35,
  },
  default: {
    src: "/audio/room-default.wav",
    volume: 0.35,
  },
};

export function isRoomRoute(pathname = "") {
  return pathname.includes("/room/");
}

export function isCreditsRoute(pathname = "") {
  return pathname.startsWith("/credits");
}

export function getRoomTrack(roomKey) {
  if (!roomKey) return ROOM_TRACKS.default || MUSIC_TRACKS.inRoom;
  return ROOM_TRACKS[roomKey] || ROOM_TRACKS.default || MUSIC_TRACKS.inRoom;
}
