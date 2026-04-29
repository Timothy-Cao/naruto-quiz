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
import { PACKS, DEFAULT_PACK_ID, getPack, type Pack } from "@/lib/audio/packs";

type AudioContextValue = {
  settings: AudioSettings;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  playSfx: (name: SfxName) => void;
  // Pack selection
  packs: Pack[];
  activePack: Pack;
  setActivePack: (id: string) => void;
  // Music playback state
  currentTrack: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  skipTrack: () => void;
  prevTrack: () => void;
  hasPrev: boolean;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  // Internal refs / event sync (consumed by <MusicPlayer>)
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onAudioPlay: () => void;
  onAudioPause: () => void;
  onAudioTimeUpdate: (time: number) => void;
  onAudioLoadedMetadata: (duration: number) => void;
};

const Ctx = createContext<AudioContextValue | null>(null);

const HISTORY_AVOID = 5;
const PACK_KEY = "naruto-quiz:active-pack";

function loadActivePackId(): string {
  if (typeof window === "undefined") return DEFAULT_PACK_ID;
  const saved = window.localStorage.getItem(PACK_KEY);
  if (saved && PACKS.some((p) => p.id === saved)) return saved;
  return DEFAULT_PACK_ID;
}

function buildOpenerUrl(pack: Pack, tracks: string[]): string | null {
  // The opening track filename in pack.openingTrack must match a real file
  // in tracks[]; we compare against the URL-encoded suffix.
  const target = `/${pack.id}/${encodeURIComponent(pack.openingTrack)}`;
  const exact = tracks.find((t) => t.endsWith(target));
  if (exact) return exact;
  // Fall back to a random track if the named opener is missing.
  return pickNext(tracks, []);
}

export function AudioSettingsProvider({
  tracksByPack,
  children,
}: {
  /** All packs' tracks, indexed by pack id. Built at server startup. */
  tracksByPack: Record<string, string[]>;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [activePackId, setActivePackId] = useState<string>(DEFAULT_PACK_ID);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const historyRef = useRef<{ tracks: string[]; cursor: number }>({
    tracks: [],
    cursor: -1,
  });
  const [hasPrev, setHasPrev] = useState(false);

  const wasPlayingBeforeHideRef = useRef(false);
  const startedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePack = getPack(activePackId);
  const tracks = tracksByPack[activePackId] ?? [];

  useEffect(() => {
    setSettings(loadAudioSettings());
    setActivePackId(loadActivePackId());
  }, []);

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

  function playOpenerForPack(pack: Pack, packTracks: string[]) {
    const opener = buildOpenerUrl(pack, packTracks);
    if (!opener) {
      setCurrentTrack(null);
      historyRef.current = { tracks: [], cursor: -1 };
      setHasPrev(false);
      return;
    }
    historyRef.current = { tracks: [opener], cursor: 0 };
    setHasPrev(false);
    setCurrentTrack(opener);
  }

  // First user gesture unlocks autoplay; we open with the pack's opener.
  useEffect(() => {
    function onFirstGesture() {
      if (startedRef.current) return;
      if (tracks.length === 0) return;
      startedRef.current = true;
      playOpenerForPack(activePack, tracks);
    }
    window.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePackId]);

  const skipTrack = useCallback(() => {
    const h = historyRef.current;
    if (h.cursor < h.tracks.length - 1) {
      playAtCursor(h.cursor + 1);
      return;
    }
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

  const setActivePack = useCallback(
    (id: string) => {
      const pack = PACKS.find((p) => p.id === id);
      if (!pack) return;
      setActivePackId(id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PACK_KEY, id);
      }
      // Switch playback immediately to the new pack's opener so the user
      // gets audible feedback that the pack changed.
      const newTracks = tracksByPack[id] ?? [];
      if (newTracks.length > 0 && startedRef.current) {
        playOpenerForPack(pack, newTracks);
      }
    },
    [tracksByPack],
  );

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
    packs: PACKS,
    activePack,
    setActivePack,
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

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// MusicPlayer needs access to the audio element ref + event-sync callbacks;
// nothing else does.
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
