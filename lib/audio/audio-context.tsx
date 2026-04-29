"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  loadAudioSettings,
  saveAudioSettings,
  DEFAULT_AUDIO_SETTINGS,
  type AudioSettings,
} from "@/lib/audio/audio-storage";
import { playSfx as rawPlaySfx, unlockAudio, type SfxName } from "@/lib/audio/sfx";
import { pickNext, appendHistory } from "@/lib/audio/play-queue";

type AudioContextValue = {
  settings: AudioSettings;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  playSfx: (name: SfxName) => void;
  // Music playback state
  currentTrack: string | null;
  isPlaying: boolean;
  skipTrack: () => void;
  togglePlay: () => void;
  // Internal refs for MusicPlayer to bind the <audio> element
  audioRef: React.RefObject<HTMLAudioElement | null>;
  // Called by MusicPlayer audio element events to sync isPlaying
  onAudioPlay: () => void;
  onAudioPause: () => void;
};

const Ctx = createContext<AudioContextValue | null>(null);

export function AudioSettingsProvider({
  tracks,
  children,
}: {
  tracks: string[];
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const historyRef = useRef<string[]>([]);
  const wasPlayingBeforeHideRef = useRef(false);
  const startedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    setSettings(loadAudioSettings());
  }, []);

  // Pause/resume on tab visibility change.
  useEffect(() => {
    function onVisChange() {
      const a = audioRef.current;
      if (!a) return;
      if (document.hidden) {
        wasPlayingBeforeHideRef.current = !a.paused;
        a.pause();
        setIsPlaying(false);
      } else if (wasPlayingBeforeHideRef.current) {
        a.play().catch(() => {});
        setIsPlaying(true);
      }
    }
    document.addEventListener("visibilitychange", onVisChange);
    return () => document.removeEventListener("visibilitychange", onVisChange);
  }, []);

  // Start on first user gesture (browser autoplay policy).
  useEffect(() => {
    function onFirstGesture() {
      if (startedRef.current) return;
      if (tracks.length === 0) return;
      startedRef.current = true;
      const first = pickNext(tracks, []);
      if (first) {
        historyRef.current = appendHistory(historyRef.current, first);
        setCurrentTrack(first);
      }
    }
    window.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [tracks]);

  const advance = useCallback(() => {
    const next = pickNext(tracks, historyRef.current);
    if (!next) return;
    historyRef.current = appendHistory(historyRef.current, next);
    setCurrentTrack(next);
  }, [tracks]);

  const skipTrack = useCallback(() => {
    advance();
  }, [advance]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => {});
      setIsPlaying(true);
    } else {
      a.pause();
      setIsPlaying(false);
    }
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

  const onAudioPlay = useCallback(() => setIsPlaying(true), []);
  const onAudioPause = useCallback(() => setIsPlaying(false), []);

  const value: AudioContextValue = {
    settings,
    setMusicVolume,
    setSfxVolume,
    playSfx,
    currentTrack,
    isPlaying,
    skipTrack,
    togglePlay,
    audioRef,
    onAudioPlay,
    onAudioPause,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

// Expose advance callback for MusicPlayer to call on track end
export function useAudioAdvance() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudioAdvance must be used inside <AudioSettingsProvider>");
  return v;
}

export function useAudio(): Omit<AudioContextValue, "audioRef" | "onAudioPlay" | "onAudioPause"> {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudio must be used inside <AudioSettingsProvider>");
  return v;
}
