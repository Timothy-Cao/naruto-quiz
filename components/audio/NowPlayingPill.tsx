"use client";

import { useEffect, useRef, useState } from "react";
import { SkipBack, SkipForward, Play, Pause } from "lucide-react";
import { useAudio } from "@/lib/audio/audio-context";
import { cn } from "@/lib/utils";

// Reveal the pill when the cursor is within this many pixels of the bottom
// of the viewport, OR when the cursor is over the pill itself.
const REVEAL_ZONE_PX = 140;
// Keep visible for this long after the cursor leaves the reveal zone.
const HIDE_DELAY_MS = 600;

function decodeTrackName(track: string): string {
  // e.g. "/music/Akatsuki%20Theme%20Song.mp3" → "Akatsuki Theme Song"
  const decoded = decodeURIComponent(track);
  const filename = decoded.split("/").pop() ?? decoded;
  return filename.replace(/\.[^.]+$/, "");
}

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function NowPlayingPill() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    skipTrack,
    prevTrack,
    hasPrev,
    togglePlay,
    seekTo,
  } = useAudio();

  const [revealed, setRevealed] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function show() {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setRevealed(true);
    }
    function scheduleHide() {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setRevealed(false), HIDE_DELAY_MS);
    }
    function onMove(e: MouseEvent) {
      const fromBottom = window.innerHeight - e.clientY;
      if (fromBottom <= REVEAL_ZONE_PX) {
        show();
      } else {
        scheduleHide();
      }
    }
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!currentTrack) return null;

  const trackName = decodeTrackName(currentTrack);
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const progressPct = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;

  return (
    <>
      {/* Compact chip — always visible. The "music lives here" indicator.
          Click toggles play/pause; hovering it triggers reveal of the full pill. */}
      <div
        data-no-sfx
        onMouseEnter={() => setRevealed(true)}
        className={cn(
          "hidden md:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-40 items-center gap-2 h-9 px-3 rounded-full bg-[var(--color-surface)]/70 backdrop-blur border border-[var(--color-border)] shadow-lg",
          "transition-all duration-300 ease-out",
          revealed
            ? "opacity-0 translate-y-2 pointer-events-none"
            : "opacity-100 translate-y-0",
        )}
      >
        <button
          type="button"
          aria-label={isPlaying ? "Pause music" : "Play music"}
          onClick={togglePlay}
          className="w-5 h-5 flex items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>
        <span
          className="text-xs text-[var(--color-text-dim)] truncate max-w-[180px] select-none"
          title={trackName}
        >
          {trackName}
        </span>
        {/* Tiny progress dot suggesting more controls live below */}
        <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] opacity-60 shrink-0" />
        <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] opacity-60 shrink-0" />
        <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] opacity-60 shrink-0" />
      </div>

      {/* Full pill — appears on hover/proximity, replacing the chip. */}
      <div
        data-no-sfx
        onMouseEnter={() => setRevealed(true)}
        className={cn(
          "hidden md:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-40 items-center gap-3 px-4 py-2.5 rounded-full bg-[var(--color-surface)]/85 backdrop-blur border border-[var(--color-border)] shadow-2xl w-[min(640px,calc(100vw-3rem))]",
          "transition-all duration-300 ease-out",
          revealed
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none",
        )}
      >
      <button
        type="button"
        aria-label="Previous track"
        onClick={prevTrack}
        disabled={!hasPrev}
        className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        <SkipBack className="w-4 h-4" />
      </button>

      <button
        type="button"
        aria-label={isPlaying ? "Pause music" : "Play music"}
        onClick={togglePlay}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-white shrink-0"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <button
        type="button"
        aria-label="Skip to next track"
        onClick={skipTrack}
        className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] shrink-0"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span
          className="text-xs text-[var(--color-text)] truncate select-none"
          title={trackName}
        >
          {trackName}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[var(--color-text-dim)] tabular-nums w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={safeDuration || 1}
            step={0.01}
            value={Math.min(currentTime, safeDuration || 0)}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            disabled={safeDuration === 0}
            aria-label="Scrub track"
            className="scrubber flex-1 disabled:opacity-30"
            style={{ "--progress": `${progressPct}%` } as React.CSSProperties}
          />
          <span className="font-mono text-[10px] text-[var(--color-text-dim)] tabular-nums w-8">
            {formatTime(safeDuration)}
          </span>
        </div>
      </div>

      <style jsx>{`
        .scrubber {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: linear-gradient(
            to right,
            var(--color-accent) 0%,
            var(--color-accent) var(--progress, 0%),
            var(--color-border-2) var(--progress, 0%),
            var(--color-border-2) 100%
          );
          border-radius: 999px;
          outline: none;
          cursor: pointer;
        }
        .scrubber::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--color-text);
          box-shadow: 0 0 0 2px var(--color-accent);
          cursor: grab;
        }
        .scrubber::-webkit-slider-thumb:active {
          cursor: grabbing;
        }
        .scrubber::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--color-text);
          border: 2px solid var(--color-accent);
          cursor: grab;
        }
      `}</style>
      </div>
    </>
  );
}
