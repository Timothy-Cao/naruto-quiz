"use client";

import { useEffect, useRef } from "react";
import { useAudioAdvance, MEDIA_CLIP_DUCK } from "@/lib/audio/audio-context";
import { getAudioContext } from "@/lib/audio/sfx";
import { attachAnalyser } from "@/lib/audio/music-analyser";
import { MUSIC_VOLUME_SCALE } from "@/lib/audio/audio-storage";

// On the very first track of a session, drop in at a random point (between
// 0% and ~70% of the track length) so the music feels like a radio mid-cycle
// rather than always starting from the same intro. Subsequent tracks (skip /
// next / pack-switch) play from the start as normal.
const RANDOM_DROPIN_MAX = 0.7;

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

  // True until the first track has been started; used to gate the random
  // mid-track drop-in to the opener only.
  const isOpenerRef = useRef(true);

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

    if (isOpenerRef.current) {
      // Wait for metadata so we know the duration, then seek to a random
      // position before playing. The flag prevents this from firing on every
      // track change.
      isOpenerRef.current = false;
      const onMeta = () => {
        if (Number.isFinite(a.duration) && a.duration > 0) {
          a.currentTime = Math.random() * a.duration * RANDOM_DROPIN_MAX;
        }
        a.play().catch(() => {});
        a.removeEventListener("loadedmetadata", onMeta);
      };
      a.addEventListener("loadedmetadata", onMeta);
    } else {
      a.play().catch(() => {});
    }
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
