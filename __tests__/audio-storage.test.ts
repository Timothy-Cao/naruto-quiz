import { beforeEach, describe, it, expect } from "vitest";
import {
  loadAudioSettings,
  saveAudioSettings,
  DEFAULT_AUDIO_SETTINGS,
} from "@/lib/audio/audio-storage";

beforeEach(() => {
  localStorage.clear();
});

describe("audio settings storage", () => {
  it("returns defaults when nothing saved", () => {
    expect(loadAudioSettings()).toEqual(DEFAULT_AUDIO_SETTINGS);
  });

  it("round-trips a save/load", () => {
    saveAudioSettings({ musicVolume: 0.4, sfxVolume: 0.7 });
    expect(loadAudioSettings()).toEqual({ musicVolume: 0.4, sfxVolume: 0.7 });
  });

  it("clamps values to [0, 1] on save", () => {
    saveAudioSettings({ musicVolume: 1.5, sfxVolume: -0.3 });
    expect(loadAudioSettings()).toEqual({ musicVolume: 1, sfxVolume: 0 });
  });

  it("falls back to defaults for malformed JSON", () => {
    localStorage.setItem("naruto-quiz:audio", "{not valid");
    expect(loadAudioSettings()).toEqual(DEFAULT_AUDIO_SETTINGS);
  });

  it("falls back per-field if a field is non-numeric", () => {
    localStorage.setItem(
      "naruto-quiz:audio",
      JSON.stringify({ musicVolume: "loud", sfxVolume: 0.6 }),
    );
    expect(loadAudioSettings()).toEqual({
      musicVolume: DEFAULT_AUDIO_SETTINGS.musicVolume,
      sfxVolume: 0.6,
    });
  });
});
