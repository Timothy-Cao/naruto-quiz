"use client";

import { useEffect } from "react";
import { useAudioAdvance, MEDIA_CLIP_DUCK } from "@/lib/audio/audio-context";
import { getAudioContext } from "@/lib/audio/sfx";
import { attachAnalyser } from "@/lib/audio/music-analyser";
import { MUSIC_VOLUME_SCALE } from "@/lib/audio/audio-storage";

export function MusicPlayer() {
  const {
    audioRef,
    currentTrack,
    settings,
    skipTrack,
    mediaClipSrc,
    onAudioPlay,
    onAudioPause,
    onAudioTimeUpdate,
    onAudioLoadedMetadata,
  } = useAudioAdvance();

  // Apply volume + ducking. While a media clip is playing (mediaClipSrc set),
  // background music is multiplied by MEDIA_CLIP_DUCK so the clip is audible.
  const duck = mediaClipSrc ? MEDIA_CLIP_DUCK : 1;
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.musicVolume * MUSIC_VOLUME_SCALE * duck;
    }
  }, [settings.musicVolume, duck, audioRef]);

  // Auto-play when track changes.
  useEffect(() => {
    if (!currentTrack) return;
    const a = audioRef.current;
    if (!a) return;
    a.src = currentTrack;
    a.volume = settings.musicVolume * MUSIC_VOLUME_SCALE * duck;
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
      preload="metadata"
    />
  );
}
