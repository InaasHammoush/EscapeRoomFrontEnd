const MUSIC_SETTINGS_KEY = "musicSettings";

const DEFAULT_SETTINGS = {
  enabled: true,
  volume: 0.8,
};

function clampVolume(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return DEFAULT_SETTINGS.volume;
  return Math.max(0, Math.min(1, n));
}

export function readMusicSettings() {
  try {
    const raw = localStorage.getItem(MUSIC_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed?.enabled !== false,
      volume: clampVolume(parsed?.volume),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeMusicSettings(nextSettings) {
  const safe = {
    enabled: nextSettings?.enabled !== false,
    volume: clampVolume(nextSettings?.volume),
  };

  try {
    localStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify(safe));
  } catch {
    // Continue: runtime state should still update even if persistence fails.
  }

  window.dispatchEvent(new CustomEvent("music:settings", { detail: safe }));
}
