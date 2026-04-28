"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  loadAudioSettings,
  saveAudioSettings,
  DEFAULT_AUDIO_SETTINGS,
  type AudioSettings,
} from "@/lib/audio/audio-storage";
import { playSfx as rawPlaySfx, unlockAudio, type SfxName } from "@/lib/audio/sfx";

type AudioContextValue = {
  settings: AudioSettings;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  playSfx: (name: SfxName) => void;
};

const Ctx = createContext<AudioContextValue | null>(null);

export function AudioSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    setSettings(loadAudioSettings());
  }, []);

  const setMusicVolume = useCallback((v: number) => {
    setSettings((prev) => {
      const next = { ...prev, musicVolume: v };
      saveAudioSettings(next);
      return next;
    });
  }, []);

  const setSfxVolume = useCallback((v: number) => {
    setSettings((prev) => {
      const next = { ...prev, sfxVolume: v };
      saveAudioSettings(next);
      return next;
    });
  }, []);

  const playSfx = useCallback(
    (name: SfxName) => {
      unlockAudio();
      rawPlaySfx(name, settings.sfxVolume);
    },
    [settings.sfxVolume],
  );

  return (
    <Ctx.Provider value={{ settings, setMusicVolume, setSfxVolume, playSfx }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudio must be used inside <AudioSettingsProvider>");
  return v;
}
