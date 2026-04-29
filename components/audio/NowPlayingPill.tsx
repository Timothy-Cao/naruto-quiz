"use client";

import { SkipForward, Play, Pause } from "lucide-react";
import { useAudio } from "@/lib/audio/audio-context";

function decodeTrackName(track: string): string {
  // e.g. "/music/Akatsuki%20Theme%20Song.mp3" → "Akatsuki Theme Song"
  const decoded = decodeURIComponent(track);
  // Strip path prefix and extension
  const filename = decoded.split("/").pop() ?? decoded;
  return filename.replace(/\.[^.]+$/, "");
}

export function NowPlayingPill() {
  const { currentTrack, isPlaying, skipTrack, togglePlay } = useAudio();

  if (!currentTrack) return null;

  const trackName = decodeTrackName(currentTrack);

  return (
    <div
      data-no-sfx
      className="hidden md:flex fixed top-4 right-[8.5rem] z-40 items-center gap-1 h-10 px-3 rounded-full bg-[var(--color-surface)]/80 backdrop-blur border border-[var(--color-border)] shadow-lg"
    >
      <span
        className="text-xs text-[var(--color-text-dim)] max-w-[14ch] truncate select-none"
        title={trackName}
      >
        {trackName}
      </span>
      <button
        type="button"
        aria-label={isPlaying ? "Pause music" : "Play music"}
        onClick={togglePlay}
        className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:border hover:border-[var(--color-accent)] transition-colors"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        aria-label="Skip track"
        onClick={skipTrack}
        className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:border hover:border-[var(--color-accent)] transition-colors"
      >
        <SkipForward className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
