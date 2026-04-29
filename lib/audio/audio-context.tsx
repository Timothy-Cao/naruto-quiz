"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  loadAudioSettings,
  saveAudioSettings,
  DEFAULT_AUDIO_SETTINGS,
  type AudioSettings,
} from "@/lib/audio/audio-storage";
import { playSfx as rawPlaySfx, unlockAudio, type SfxName } from "@/lib/audio/sfx";
import { pickNext } from "@/lib/audio/play-queue";

type AudioContextValue = {
  settings: AudioSettings;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  playSfx: (name: SfxName) => void;
  // Music playback state
  currentTrack: string | null;
  isPlaying: boolean;
  currentTime: number; // seconds within the current track
  duration: number; // seconds; 0 until loadedmetadata fires
  skipTrack: () => void;
  prevTrack: () => void;
  hasPrev: boolean;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  // Internal refs for MusicPlayer to bind the <audio> element
  audioRef: React.RefObject<HTMLAudioElement | null>;
  // Called by MusicPlayer audio element events to sync state
  onAudioPlay: () => void;
  onAudioPause: () => void;
  onAudioTimeUpdate: (time: number) => void;
  onAudioLoadedMetadata: (duration: number) => void;
};

const Ctx = createContext<AudioContextValue | null>(null);

const HISTORY_AVOID = 5; // avoid replaying any of the last 5 tracks when picking fresh

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // History of plays + a cursor pointing at currentTrack within it.
  // historyRef.tracks is ordered oldest -> newest; cursor === tracks.length-1
  // means we're at the latest track. Cursor < length-1 means we navigated back.
  const historyRef = useRef<{ tracks: string[]; cursor: number }>({
    tracks: [],
    cursor: -1,
  });
  const [hasPrev, setHasPrev] = useState(false);

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

  function playAtCursor(cursor: number) {
    const t = historyRef.current.tracks[cursor];
    if (!t) return;
    historyRef.current.cursor = cursor;
    setHasPrev(cursor > 0);
    setCurrentTrack(t);
  }

  // Start on first user gesture (browser autoplay policy).
  useEffect(() => {
    function onFirstGesture() {
      if (startedRef.current) return;
      if (tracks.length === 0) return;
      startedRef.current = true;
      const first = pickNext(tracks, []);
      if (first) {
        historyRef.current = { tracks: [first], cursor: 0 };
        setHasPrev(false);
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

  const skipTrack = useCallback(() => {
    const h = historyRef.current;
    // If we navigated back earlier, "next" first walks forward through history
    if (h.cursor < h.tracks.length - 1) {
      playAtCursor(h.cursor + 1);
      return;
    }
    // At the head of history — pick a fresh track avoiding the last N.
    const recent = h.tracks.slice(-HISTORY_AVOID);
    const next = pickNext(tracks, recent);
    if (!next) return;
    h.tracks.push(next);
    playAtCursor(h.tracks.length - 1);
  }, [tracks]);

  const prevTrack = useCallback(() => {
    const h = historyRef.current;
    if (h.cursor <= 0) return;
    playAtCursor(h.cursor - 1);
  }, []);

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

  const seekTo = useCallback((time: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(time)) return;
    const safe = Math.max(0, Math.min(a.duration || 0, time));
    a.currentTime = safe;
    setCurrentTime(safe);
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
  const onAudioTimeUpdate = useCallback((t: number) => setCurrentTime(t), []);
  const onAudioLoadedMetadata = useCallback((d: number) => setDuration(d), []);

  const value: AudioContextValue = {
    settings,
    setMusicVolume,
    setSfxVolume,
    playSfx,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    skipTrack,
    prevTrack,
    hasPrev,
    togglePlay,
    seekTo,
    audioRef,
    onAudioPlay,
    onAudioPause,
    onAudioTimeUpdate,
    onAudioLoadedMetadata,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

// Internal hook — exposes the audio element ref and event-sync callbacks.
// Only the MusicPlayer needs this; everything else uses useAudio().
export function useAudioAdvance() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudioAdvance must be used inside <AudioSettingsProvider>");
  return v;
}

export function useAudio(): Omit<
  AudioContextValue,
  "audioRef" | "onAudioPlay" | "onAudioPause" | "onAudioTimeUpdate" | "onAudioLoadedMetadata"
> {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudio must be used inside <AudioSettingsProvider>");
  return v;
}
