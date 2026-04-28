"use client";

import { useEffect, useRef, useState } from "react";
import { pickNext, appendHistory } from "@/lib/audio/play-queue";
import { useAudio } from "@/lib/audio/audio-context";
import { getAudioContext } from "@/lib/audio/sfx";
import { attachAnalyser } from "@/lib/audio/music-analyser";

export function MusicPlayer({ tracks }: { tracks: string[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<string[]>([]);
  const wasPlayingBeforeHideRef = useRef(false);
  const startedRef = useRef(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const { settings } = useAudio();

  // Apply volume changes immediately.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = settings.musicVolume;
  }, [settings.musicVolume]);

  // Pause/resume on tab visibility change.
  useEffect(() => {
    function onVisChange() {
      const a = audioRef.current;
      if (!a) return;
      if (document.hidden) {
        wasPlayingBeforeHideRef.current = !a.paused;
        a.pause();
      } else if (wasPlayingBeforeHideRef.current) {
        a.play().catch(() => {});
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

  // Auto-play when track changes.
  useEffect(() => {
    if (!currentTrack) return;
    const a = audioRef.current;
    if (!a) return;
    a.src = currentTrack;
    a.volume = settings.musicVolume;
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

  function advance() {
    const next = pickNext(tracks, historyRef.current);
    if (!next) return;
    historyRef.current = appendHistory(historyRef.current, next);
    setCurrentTrack(next);
  }

  if (tracks.length === 0) return null;

  return (
    <audio
      ref={audioRef}
      onEnded={advance}
      preload="auto"
      // The element is invisible — it's just an audio source.
    />
  );
}
