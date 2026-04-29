const KEY = "naruto-quiz:audio";

export type AudioSettings = {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicVolume: 0.4,
  sfxVolume: 0.4,
};

/**
 * The slider's displayed value is the user's perceptual setting; we play
 * music at half that to compensate for our tracks being mastered loud.
 * SFX (synthesized) doesn't need this adjustment.
 */
export const MUSIC_VOLUME_SCALE = 0.5;

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function loadAudioSettings(): AudioSettings {
  if (typeof window === "undefined") return DEFAULT_AUDIO_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      musicVolume:
        typeof parsed?.musicVolume === "number"
          ? clamp01(parsed.musicVolume)
          : DEFAULT_AUDIO_SETTINGS.musicVolume,
      sfxVolume:
        typeof parsed?.sfxVolume === "number"
          ? clamp01(parsed.sfxVolume)
          : DEFAULT_AUDIO_SETTINGS.sfxVolume,
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(s: AudioSettings): void {
  if (typeof window === "undefined") return;
  const safe: AudioSettings = {
    musicVolume: clamp01(s.musicVolume),
    sfxVolume: clamp01(s.sfxVolume),
  };
  window.localStorage.setItem(KEY, JSON.stringify(safe));
}
