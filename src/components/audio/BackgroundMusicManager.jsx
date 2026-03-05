import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MUSIC_TRACKS, isRoomRoute } from "../../config/audioTracks";
import { readMusicSettings } from "../../state/musicSettings";

function trackForPath(pathname) {
  return isRoomRoute(pathname) ? MUSIC_TRACKS.inRoom : MUSIC_TRACKS.mainWebsite;
}

export default function BackgroundMusicManager() {
  const { pathname } = useLocation();
  const audioRef = useRef(null);
  const sourceRef = useRef("");
  const [needsGesture, setNeedsGesture] = useState(false);
  const [settings, setSettings] = useState(() => readMusicSettings());
  const track = useMemo(() => trackForPath(pathname), [pathname]);

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setNeedsGesture(false);
    } catch {
      setNeedsGesture(true);
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    const onError = () => {
      if (sourceRef.current === MUSIC_TRACKS.mainWebsite.src) return;
      audio.src = MUSIC_TRACKS.mainWebsite.src;
      sourceRef.current = MUSIC_TRACKS.mainWebsite.src;
      audio.load();
      void tryPlay();
    };

    if (sourceRef.current !== track.src) {
      audio.src = track.src;
      audio.load();
      sourceRef.current = track.src;
    }
    audio.volume = track.volume * settings.volume;

    if (!settings.enabled) {
      audio.pause();
      return;
    }

    void tryPlay();
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("touchstart", tryPlay);
    window.addEventListener("keydown", tryPlay);
    audio.addEventListener("error", onError);

    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      audio.removeEventListener("error", onError);
    };
  }, [settings.enabled, settings.volume, track, tryPlay]);

  useEffect(() => {
    const onSettings = (event) => {
      if (event?.detail) setSettings(event.detail);
    };
    const onStorage = (event) => {
      if (event.key === "musicSettings") setSettings(readMusicSettings());
    };

    window.addEventListener("music:settings", onSettings);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("music:settings", onSettings);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!settings.enabled || !needsGesture) return null;

  return (
    <button
      type="button"
      onClick={() => void tryPlay()}
      className="btn btn-sm btn-outline fixed bottom-4 right-4 z-[60]"
    >
      Enable Music
    </button>
  );
}
