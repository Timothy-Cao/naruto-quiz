"use client";

import { useEffect } from "react";
import { useAudioAdvance } from "@/lib/audio/audio-context";
import { getAudioContext } from "@/lib/audio/sfx";
import { attachAnalyser } from "@/lib/audio/music-analyser";
import { MUSIC_VOLUME_SCALE } from "@/lib/audio/audio-storage";

export function MusicPlayer() {
  const {
    audioRef,
    currentTrack,
    settings,
    skipTrack,
    onAudioPlay,
    onAudioPause,
    onAudioTimeUpdate,
    onAudioLoadedMetadata,
  } = useAudioAdvance();

  // Apply volume changes immediately.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = settings.musicVolume * MUSIC_VOLUME_SCALE;
  }, [settings.musicVolume, audioRef]);

  // Auto-play when track changes.
  useEffect(() => {
    if (!currentTrack) return;
    const a = audioRef.current;
    if (!a) return;
    a.src = currentTrack;
    a.volume = settings.musicVolume * MUSIC_VOLUME_SCALE;
    // Wire up the analyser the first time we have a real audio element + ctx.
    const ctx = getAudioContext();
    if (ctx) {
      try {
        attachAnalyser(a, ctx);
      } catch {
        // ignore — already attached or unsupported
      }
    }
    a.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  return (
    <audio
      ref={audioRef}
      onEnded={skipTrack}
      onPlay={onAudioPlay}
      onPause={onAudioPause}
      onTimeUpdate={(e) => onAudioTimeUpdate(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => onAudioLoadedMetadata(e.currentTarget.duration)}
      preload="auto"
    />
  );
}
