export const MUSIC_TRACKS = {
  mainWebsite: {
    src: "/audio/main-site-test.wav",
    volume: 0.2,
  },
  inRoom: {
    src: "/audio/in-room-test.mp3",
    volume: 0.35,
  },
};

export function isRoomRoute(pathname = "") {
  return pathname.includes("/room/");
}
